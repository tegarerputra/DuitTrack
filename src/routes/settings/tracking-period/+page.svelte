<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		generatePeriods,
		formatPeriodDisplay,
		getResetDatePresets,
		type PeriodGeneratorConfig
	} from '$lib/utils/periodHelpers';
	import { authService } from '$lib/services/authService';
	import { userProfileStore } from '$stores/auth';
	import { toastStore } from '$lib/stores/toast';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	// State
	let currentResetDate = 25;
	let currentResetType: 'fixed' | 'last-day-of-month' = 'fixed';
	let newResetDate = 25;
	let newResetType: 'fixed' | 'last-day-of-month' = 'fixed';
	let showChangeConfirmation = false;
	let isChanging = false;
	let isSaving = false;
	let isLoading = true;
	let errorMessage = '';
	let retryCount = 0;
	const MAX_RETRIES = 3;

	// Derived state
	$: hasChanges = newResetDate !== currentResetDate || newResetType !== currentResetType;
	$: presets = getResetDatePresets();
	$: isValidResetDate = newResetType === 'last-day-of-month' || (newResetDate >= 1 && newResetDate <= 31);

	// Preview impact calculation
	$: changeImpact = hasChanges ? calculateChangeImpact() : null;

	interface ChangeImpact {
		currentPeriod: {
			start: Date;
			end: Date;
			display: string;
		};
		transitionPeriod: {
			start: Date;
			end: Date;
			display: string;
			daysCount: number;
		};
		newPeriod: {
			start: Date;
			end: Date;
			display: string;
		};
		willCloseEarly: boolean;
	}

	onMount(async () => {
		await loadCurrentSettings();
		isLoading = false;
	});

	async function loadCurrentSettings() {
		const user = await authService.getCurrentUser();
		if (user) {
			const profile = await authService.getUserProfile(user.uid);
			currentResetDate = profile?.budgetResetDate || 25;
			currentResetType = profile?.budgetResetType || 'fixed';
			newResetDate = currentResetDate;
			newResetType = currentResetType;
		}
	}

	function calculateChangeImpact(): ChangeImpact | null {
		const today = new Date();

		// Current period with old settings
		const oldConfig: PeriodGeneratorConfig = {
			resetDate: currentResetDate,
			resetType: currentResetType
		};
		const oldPeriods = generatePeriods(oldConfig, 1);
		const currentPeriod = oldPeriods[0];

		if (!currentPeriod) {
			return null;
		}

		// New period with new settings
		const newConfig: PeriodGeneratorConfig = {
			resetDate: newResetDate,
			resetType: newResetType
		};
		const newPeriods = generatePeriods(newConfig, 1);
		const newPeriod = newPeriods[0];

		if (!newPeriod) {
			return null;
		}

		// Calculate transition end (day before new reset date)
		const transitionEnd = new Date(today);
		const targetMonth = today.getMonth();
		const targetYear = today.getFullYear();

		// If new reset date is in future this month, close on that date - 1
		// If new reset date has passed, close on next month's reset date - 1
		let transitionEndDate: Date;
		if (today.getDate() < newResetDate) {
			// Reset date belum lewat bulan ini, close sebelum reset date baru
			transitionEndDate = new Date(targetYear, targetMonth, newResetDate - 1, 23, 59, 59);
		} else {
			// Reset date sudah lewat, close di bulan depan sebelum reset date baru
			transitionEndDate = new Date(targetYear, targetMonth + 1, newResetDate - 1, 23, 59, 59);
		}

		const transitionDays = Math.ceil(
			(transitionEndDate.getTime() - currentPeriod.startDate.getTime()) /
				(1000 * 60 * 60 * 24)
		);

		return {
			currentPeriod: {
				start: currentPeriod.startDate,
				end: currentPeriod.endDate,
				display: formatPeriodDisplay(currentPeriod.startDate, currentPeriod.endDate)
			},
			transitionPeriod: {
				start: currentPeriod.startDate,
				end: transitionEndDate,
				display: formatPeriodDisplay(currentPeriod.startDate, transitionEndDate),
				daysCount: transitionDays
			},
			newPeriod: {
				start: newPeriod.startDate,
				end: newPeriod.endDate,
				display: formatPeriodDisplay(newPeriod.startDate, newPeriod.endDate)
			},
			willCloseEarly: transitionEndDate < currentPeriod.endDate
		};
	}

	function handlePresetClick(value: number) {
		newResetDate = value;
		newResetType = 'fixed';
	}

	function handleLastDayClick() {
		newResetType = 'last-day-of-month';
		newResetDate = -1;
	}

	function handleSaveChanges() {
		if (!hasChanges) return;

		// Validate reset date
		if (!isValidResetDate) {
			errorMessage = 'Reset date harus antara 1-31';
			return;
		}

		errorMessage = '';
		showChangeConfirmation = true;
	}

	async function confirmResetDateChange() {
		isChanging = true;
		isSaving = true;
		errorMessage = '';

		try {
			// Update user profile in Firebase
			const result = await authService.updateUserProfile({
				budgetResetDate: newResetDate,
				budgetResetType: newResetType
			});

			if (!result.success) {
				throw new Error(result.error || 'Failed to update profile');
			}

			// Update local state
			currentResetDate = newResetDate;
			currentResetType = newResetType;

			// Reset retry count on success
			retryCount = 0;

			// Show success toast
			toastStore.success(
				'Reset date berhasil diubah! Perubahan akan berlaku mulai periode berikutnya.',
				4000
			);

			showChangeConfirmation = false;
		} catch (error: any) {
			console.error('Error changing reset date:', error);

			// Specific error handling
			let userFriendlyError = 'Gagal mengubah reset date.';

			if (error.message?.includes('network') || error.message?.includes('offline')) {
				userFriendlyError = 'Koneksi internet bermasalah. Silakan coba lagi.';
			} else if (error.message?.includes('permission')) {
				userFriendlyError = 'Anda tidak memiliki izin untuk mengubah pengaturan ini.';
			} else if (error.message?.includes('authenticated')) {
				userFriendlyError = 'Sesi Anda telah berakhir. Silakan login kembali.';
			}

			errorMessage = userFriendlyError;

			// Show error toast with retry option if under max retries
			if (retryCount < MAX_RETRIES) {
				toastStore.error(`${userFriendlyError} (Percobaan ${retryCount + 1}/${MAX_RETRIES})`, 5000);
			} else {
				toastStore.error(`${userFriendlyError} Silakan muat ulang halaman dan coba lagi.`, 6000);
			}
		} finally {
			isChanging = false;
			isSaving = false;
		}
	}

	async function retryUpdate() {
		if (retryCount < MAX_RETRIES) {
			retryCount++;
			await confirmResetDateChange();
		}
	}

	function cancelChange() {
		showChangeConfirmation = false;
		errorMessage = '';
		retryCount = 0;
	}

	function resetToOriginal() {
		newResetDate = currentResetDate;
		newResetType = currentResetType;
		errorMessage = '';
	}

	function handleCancel() {
		goto('/settings');
	}

	function getResetDateDisplay(date: number, type: 'fixed' | 'last-day-of-month'): string {
		if (type === 'last-day-of-month') {
			return 'Akhir bulan';
		}
		return `Tanggal ${date}`;
	}
</script>

<svelte:head>
	<title>Periode Tracking - DuitTrack</title>
</svelte:head>

<ToastContainer />

<div class="settings-container">
	<div class="settings-page">
		<!-- Header -->
		<div class="page-header">
			<h1>📅 Periode Tracking</h1>
		</div>

		{#if isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>Loading settings...</p>
			</div>
		{:else}
			<!-- Tracking Cycle Section -->
			<div class="settings-section">
			<!-- Current Settings Display -->
			<div class="current-settings-card">
				<div class="label">Current Reset Date:</div>
				<div class="current-value">
					{getResetDateDisplay(currentResetDate, currentResetType)}
				</div>
			</div>

			<!-- Preset Options -->
			<div class="form-group">
				<label class="form-label">Pilih Reset Date:</label>
				<div class="preset-grid">
					{#each presets as preset}
						<button
							class="preset-btn"
							class:active={newResetDate === preset.value && newResetType === 'fixed'}
							on:click={() => handlePresetClick(preset.value)}
							disabled={isSaving}
						>
							<div class="preset-icon">{preset.emoji}</div>
							<div class="preset-content">
								<div class="preset-label">{preset.label}</div>
								<div class="preset-desc">{preset.shortDescription}</div>
							</div>
							{#if preset.popular}
								<span class="popular-badge">Populer</span>
							{/if}
						</button>
					{/each}

					<!-- Last Day Option -->
					<button
						class="preset-btn"
						class:active={newResetType === 'last-day-of-month'}
						on:click={handleLastDayClick}
						disabled={isSaving}
					>
						<div class="preset-icon">📅</div>
						<div class="preset-content">
							<div class="preset-label">Akhir bulan</div>
							<div class="preset-desc">Reset otomatis</div>
						</div>
					</button>
				</div>
			</div>

			<!-- Custom Input -->
			<div class="form-group">
				<label class="form-label">
					<input
						type="checkbox"
						checked={newResetType === 'fixed' &&
							![1, 5, 15, 25].includes(newResetDate) &&
							newResetDate !== -1}
						on:change={(e) => {
							if (e.currentTarget.checked) {
								newResetType = 'fixed';
								newResetDate = 10;
							}
						}}
						disabled={isSaving}
					/>
					Custom tanggal:
				</label>
				<input
					type="number"
					min="1"
					max="31"
					bind:value={newResetDate}
					on:focus={() => (newResetType = 'fixed')}
					disabled={newResetType === 'last-day-of-month' || isSaving}
					class="custom-input"
					placeholder="1-31"
				/>
			</div>

			<!-- Change Preview -->
			{#if hasChanges && changeImpact}
				<div class="change-preview-card">
					<div class="preview-header">
						<span class="icon">⚠️</span>
						<h3>Impact Perubahan</h3>
					</div>

					<div class="impact-details">
						<div class="impact-item">
							<div class="impact-label">Current Period:</div>
							<div class="impact-value">{changeImpact.currentPeriod.display}</div>
						</div>

						{#if changeImpact.willCloseEarly}
							<div class="impact-item warning">
								<div class="impact-label">
									<span class="icon">⚠️</span>
									Period akan ditutup lebih awal:
								</div>
								<div class="impact-value">{changeImpact.transitionPeriod.display}</div>
								<div class="impact-note">
									({changeImpact.transitionPeriod.daysCount} hari)
								</div>
							</div>
						{/if}

						<div class="impact-item">
							<div class="impact-label">
								<span class="icon">✨</span>
								New Period (mulai sekarang):
							</div>
							<div class="impact-value">{changeImpact.newPeriod.display}</div>
						</div>

						<div class="impact-item">
							<div class="impact-label">Future Periods:</div>
							<div class="impact-value">
								Akan menggunakan reset date: {getResetDateDisplay(newResetDate, newResetType)}
							</div>
						</div>
					</div>

					<div class="impact-notes">
						<div class="note-title">📝 Catatan Penting:</div>
						<ul>
							<li>Data historis tetap aman dan tidak berubah</li>
							<li>Budget untuk period saat ini akan direset</li>
							<li>Period baru dimulai dari tanggal reset yang dipilih</li>
						</ul>
					</div>
				</div>
			{/if}

			<!-- Error Message -->
			{#if errorMessage}
				<div class="error-message">
					<span class="error-icon">⚠️</span>
					<span>{errorMessage}</span>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="actions">
				<button class="btn-secondary" on:click={handleCancel} disabled={isSaving}>
					Cancel
				</button>
				<button
					class="btn-primary"
					on:click={handleSaveChanges}
					disabled={!hasChanges || !isValidResetDate || isSaving}
				>
					{#if isSaving}
						<div class="spinner-small"></div>
						<span>Menyimpan...</span>
					{:else}
						<span class="icon">💾</span>
						<span>Simpan Perubahan</span>
					{/if}
				</button>
			</div>
		</div>

		<!-- Future: Other settings sections -->
		<!--
		<div class="settings-section">
			<h2>🔔 Notifications</h2>
			// ... notification settings
		</div>
		-->
		{/if}
	</div>

	<!-- Footer -->
	<footer class="tracking-period-footer">
		<div class="footer-content">
			<p class="footer-text">
				📧 <a href="mailto:tegarerputra@outlook.com" class="footer-email-link">tegarerputra@outlook.com</a>
				<span class="footer-separator">•</span>
				© {new Date().getFullYear()} DuitTrack
			</p>
		</div>
	</footer>
</div>

<!-- Confirmation Modal -->
{#if showChangeConfirmation}
	<div class="modal-backdrop" on:click={cancelChange}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Konfirmasi Perubahan Reset Date</h3>
				<button class="close-btn" on:click={cancelChange}>×</button>
			</div>

			<div class="modal-body">
				<p>Apakah kamu yakin ingin mengubah reset date?</p>

				<div class="change-summary">
					<div class="change-item">
						<span class="label">Dari:</span>
						<span class="value">{getResetDateDisplay(currentResetDate, currentResetType)}</span>
					</div>
					<div class="arrow">→</div>
					<div class="change-item">
						<span class="label">Ke:</span>
						<span class="value">{getResetDateDisplay(newResetDate, newResetType)}</span>
					</div>
				</div>

				<div class="warning-box">
					<span class="icon">⚠️</span>
					<div>
						<strong>Perubahan ini akan:</strong>
						<ul>
							<li>Menutup period saat ini lebih awal</li>
							<li>Memulai period baru dengan reset date yang baru</li>
							<li>Mereset budget untuk period baru</li>
						</ul>
					</div>
				</div>

				<!-- Error message in modal -->
				{#if errorMessage}
					<div class="modal-error">
						<span class="error-icon">⚠️</span>
						<span>{errorMessage}</span>
					</div>
				{/if}
			</div>

			<div class="modal-actions">
				<button class="btn-secondary" on:click={cancelChange} disabled={isChanging}> Batal </button>

				{#if errorMessage && retryCount < MAX_RETRIES}
					<button class="btn-warning" on:click={retryUpdate} disabled={isChanging}>
						<span class="icon">🔄</span>
						Coba Lagi ({MAX_RETRIES - retryCount} tersisa)
					</button>
				{/if}

				<button class="btn-primary" on:click={confirmResetDateChange} disabled={isChanging}>
					{#if isChanging}
						<div class="spinner-small"></div>
						Mengubah...
					{:else}
						<span class="icon">✓</span>
						Ya, Ubah Reset Date
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.settings-container {
		min-height: calc(100vh - 4rem);
		display: flex;
		flex-direction: column;
	}

	.settings-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		flex: 1;
		width: 100%;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		color: #6b7280;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(0, 191, 255, 0.2);
		border-top-color: rgba(0, 191, 255, 0.8);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 1rem;
	}

	.settings-section {
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.5) 0%,
			rgba(240, 248, 255, 0.4) 100%
		);
		backdrop-filter: blur(25px);
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
	}

	.current-settings-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem;
		background: rgba(0, 191, 255, 0.05);
		border: 2px solid rgba(0, 191, 255, 0.2);
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.current-settings-card .label {
		font-weight: 600;
		color: #374151;
	}

	.current-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 8px;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.75rem;
	}

	.form-label input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.preset-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.preset-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.5) 0%,
			rgba(240, 248, 255, 0.4) 100%
		);
		backdrop-filter: blur(15px);
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
		position: relative;
	}

	.preset-btn:hover {
		border-color: rgba(0, 191, 255, 0.4);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 191, 255, 0.1);
	}

	.preset-btn.active {
		border-color: rgba(0, 191, 255, 0.7);
		background: linear-gradient(
			135deg,
			rgba(0, 191, 255, 0.1) 0%,
			rgba(30, 144, 255, 0.1) 100%
		);
		box-shadow: 0 8px 25px rgba(0, 191, 255, 0.15);
	}

	.preset-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.preset-content {
		flex: 1;
		min-width: 0;
	}

	.preset-label {
		font-weight: 600;
		color: #1f2937;
		font-size: 0.95rem;
		margin-bottom: 0.125rem;
	}

	.preset-desc {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.popular-badge {
		position: absolute;
		top: -8px;
		right: -8px;
		background: linear-gradient(135deg, #f59e0b, #f97316);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.65rem;
		font-weight: 600;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.custom-input {
		width: 100%;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.7);
		border: 2px solid rgba(0, 191, 255, 0.2);
		border-radius: 8px;
		font-size: 1rem;
		color: #1f2937;
		transition: all 0.2s ease;
	}

	.custom-input:focus {
		outline: none;
		border-color: rgba(0, 191, 255, 0.5);
		box-shadow: 0 0 0 3px rgba(0, 191, 255, 0.1);
	}

	.custom-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.change-preview-card {
		background: rgba(255, 243, 205, 0.3);
		border: 2px solid rgba(245, 158, 11, 0.3);
		border-radius: 12px;
		padding: 1.5rem;
		margin-top: 2rem;
		margin-bottom: 1.5rem;
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.preview-header h3 {
		font-size: 1.125rem;
		font-weight: 700;
		color: #92400e;
		margin: 0;
	}

	.impact-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.impact-item {
		padding: 1rem;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 8px;
		border-left: 4px solid rgba(0, 191, 255, 0.5);
	}

	.impact-item.warning {
		background: rgba(254, 243, 199, 0.5);
		border-left-color: rgba(245, 158, 11, 0.7);
	}

	.impact-label {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.impact-value {
		font-weight: 700;
		color: #1f2937;
		font-size: 1rem;
	}

	.impact-note {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.impact-notes {
		background: rgba(255, 255, 255, 0.5);
		border-radius: 8px;
		padding: 1rem;
	}

	.note-title {
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.impact-notes ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(254, 226, 226, 0.5);
		border: 2px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #991b1b;
		font-size: 0.875rem;
		font-weight: 500;
		margin-top: 1rem;
		animation: shake 0.5s ease;
	}

	.error-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-4px);
		}
		75% {
			transform: translateX(4px);
		}
	}

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.btn-secondary,
	.btn-primary {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.5);
		color: #374151;
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.5);
	}

	.btn-primary {
		background: linear-gradient(
			135deg,
			rgba(0, 191, 255, 0.7) 0%,
			rgba(30, 144, 255, 0.8) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.4);
		color: white;
		box-shadow: 0 8px 32px rgba(0, 191, 255, 0.15);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 12px 40px rgba(0, 191, 255, 0.2);
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.95) 0%,
			rgba(240, 248, 255, 0.95) 100%
		);
		backdrop-filter: blur(25px);
		border: 2px solid rgba(255, 255, 255, 0.5);
		border-radius: 16px;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.modal-header h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0;
	}

	.close-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: 8px;
		font-size: 1.5rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.8);
		color: #374151;
	}

	.modal-body {
		margin-bottom: 1.5rem;
	}

	.modal-body > p {
		color: #374151;
		font-size: 1rem;
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.change-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 12px;
		margin-bottom: 1.5rem;
	}

	.change-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.change-item .label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
	}

	.change-item .value {
		font-size: 1.125rem;
		font-weight: 700;
		color: #1f2937;
	}

	.arrow {
		font-size: 1.5rem;
		color: #6b7280;
		padding: 0 0.5rem;
	}

	.warning-box {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(254, 243, 199, 0.5);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: 8px;
	}

	.warning-box .icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.warning-box strong {
		display: block;
		color: #92400e;
		margin-bottom: 0.5rem;
	}

	.warning-box ul {
		margin: 0;
		padding-left: 1.25rem;
		color: #78350f;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.modal-error {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(254, 226, 226, 0.5);
		border: 2px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #991b1b;
		font-size: 0.875rem;
		font-weight: 500;
		margin-top: 1rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.btn-warning {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		background: linear-gradient(135deg, rgba(245, 158, 11, 0.7) 0%, rgba(251, 146, 60, 0.8) 100%);
		border: 1px solid rgba(255, 255, 255, 0.4);
		color: white;
		box-shadow: 0 4px 16px rgba(245, 158, 11, 0.15);
	}

	.btn-warning:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(245, 158, 11, 0.2);
	}

	.btn-warning:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.settings-page {
			padding: 1rem;
		}

		.page-header {
			margin-bottom: 1.5rem;
		}

		.page-header h1 {
			font-size: 1.5rem;
		}

		.settings-section {
			padding: 1.5rem;
		}

		.preset-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
		}

		.change-summary {
			flex-direction: column;
			gap: 1rem;
		}

		.arrow {
			transform: rotate(90deg);
		}

		.modal-content {
			padding: 1.5rem;
		}
	}

	/* Tracking Period Footer */
	.tracking-period-footer {
		margin-top: auto;
		padding: 24px 20px;
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-top: 1px solid rgba(6, 182, 212, 0.1);
		width: 100%;
	}

	.tracking-period-footer .footer-content {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.tracking-period-footer .footer-text {
		font-size: 14px;
		font-weight: 500;
		color: #6b7280;
		margin: 0;
		line-height: 1.6;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 8px;
	}

	.tracking-period-footer .footer-email-link {
		color: #0891B2;
		text-decoration: none;
		transition: all 0.2s ease;
		font-weight: 600;
	}

	.tracking-period-footer .footer-email-link:hover {
		color: #06B6D4;
		text-decoration: underline;
	}

	.tracking-period-footer .footer-separator {
		color: #d1d5db;
		font-weight: 400;
		padding: 0 4px;
	}

	/* Mobile responsive footer */
	@media (max-width: 430px) {
		.tracking-period-footer {
			padding: 20px 16px;
		}

		.tracking-period-footer .footer-text {
			font-size: 13px;
			gap: 6px;
		}

		.tracking-period-footer .footer-email-link {
			font-size: 13px;
		}
	}
</style>