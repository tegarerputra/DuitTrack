<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authService } from '$lib/services/authService';
	import { userProfileStore } from '$stores/auth';
	import { toastStore } from '$lib/stores/toast';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	// State
	let isLoading = true;
	let isSaving = false;
	let displayName = '';
	let email = '';
	let memberSince = '';
	let originalDisplayName = '';
	let showSaveConfirmation = false;
	let photoURL = '';
	let originalPhotoURL = '';
	let isUploadingPhoto = false;
	let photoFile: File | null = null;
	let photoPreview: string | null = null;

	// Derived state
	$: hasChanges = (displayName !== originalDisplayName && displayName.trim() !== '') || photoFile !== null;
	$: isValidDisplayName = displayName.trim().length >= 2;

	onMount(async () => {
		await loadUserData();
		isLoading = false;
	});

	async function loadUserData() {
		const user = await authService.getCurrentUser();
		if (user) {
			email = user.email || '';
			displayName = user.displayName || '';
			originalDisplayName = displayName;
			photoURL = user.photoURL || '';
			originalPhotoURL = photoURL;

			// Get member since from user profile
			const profile = await authService.getUserProfile(user.uid);
			if (profile?.createdAt) {
				const createdDate = profile.createdAt instanceof Date
					? profile.createdAt
					: new Date(profile.createdAt);
				memberSince = formatMemberSince(createdDate);
			} else {
				// Fallback to Firebase user metadata
				const metadata = user.metadata;
				if (metadata.creationTime) {
					memberSince = formatMemberSince(new Date(metadata.creationTime));
				}
			}
		}
	}

	function formatMemberSince(date: Date): string {
		const months = [
			'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
			'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
		];
		const month = months[date.getMonth()];
		const year = date.getFullYear();
		return `${month} ${year}`;
	}

	function handleSaveClick() {
		if (!hasChanges || !isValidDisplayName) return;
		showSaveConfirmation = true;
	}

	async function confirmSave() {
		isSaving = true;

		try {
			// Update Firebase Auth displayName
			const user = await authService.getCurrentUser();
			if (!user) {
				throw new Error('User not authenticated');
			}

			let newPhotoURL = photoURL;

			// Upload photo if there's a new one
			if (photoFile) {
				isUploadingPhoto = true;
				const uploadResult = await authService.uploadProfilePhoto(photoFile);

				if (!uploadResult.success || !uploadResult.photoURL) {
					throw new Error(uploadResult.error || 'Failed to upload photo');
				}

				newPhotoURL = uploadResult.photoURL;
				isUploadingPhoto = false;
			}

			const { updateProfile } = await import('firebase/auth');
			await updateProfile(user, {
				displayName: displayName.trim(),
				photoURL: newPhotoURL
			});

			// Update Firestore profile
			const result = await authService.updateUserProfile({
				displayName: displayName.trim(),
				photoURL: newPhotoURL
			});

			if (!result.success) {
				throw new Error(result.error || 'Failed to update profile');
			}

			// Update local state
			originalDisplayName = displayName.trim();
			displayName = displayName.trim();
			photoURL = newPhotoURL;
			originalPhotoURL = newPhotoURL;
			photoFile = null;
			photoPreview = null;

			// Show success toast
			toastStore.success('Profil berhasil diperbarui!', 3000);

			showSaveConfirmation = false;
		} catch (error: any) {
			console.error('Error updating profile:', error);

			let errorMessage = 'Gagal memperbarui profil.';
			if (error.message?.includes('network') || error.message?.includes('offline')) {
				errorMessage = 'Koneksi internet bermasalah. Silakan coba lagi.';
			} else if (error.message?.includes('photo') || error.message?.includes('upload')) {
				errorMessage = 'Gagal mengupload foto. Silakan coba lagi.';
			}

			toastStore.error(errorMessage, 4000);
		} finally {
			isSaving = false;
			isUploadingPhoto = false;
		}
	}

	function cancelSave() {
		showSaveConfirmation = false;
	}

	function resetChanges() {
		displayName = originalDisplayName;
	}

	function handleCancel() {
		goto('/settings');
	}

	function handlePhotoSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toastStore.error('Please select an image file', 3000);
			return;
		}

		// Validate file size (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			toastStore.error('Image size must be less than 2MB', 3000);
			return;
		}

		photoFile = file;

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			photoPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function removePhoto() {
		photoFile = null;
		photoPreview = null;
		const input = document.getElementById('photoInput') as HTMLInputElement;
		if (input) input.value = '';
	}
</script>

<svelte:head>
	<title>Account Settings - DuitTrack</title>
</svelte:head>

<ToastContainer />

<div class="settings-page">
	<!-- Header -->
	<div class="page-header">
		<h1>👤 Account Settings</h1>
	</div>

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading account data...</p>
		</div>
	{:else}
		<div class="settings-section">
			<!-- Profile Information -->
			<div class="section-title">Profile Information</div>

			<!-- Profile Photo -->
			<div class="form-group">
				<label class="form-label">Profile Photo</label>
				<div class="photo-upload-container">
					<div class="photo-preview">
						{#if photoPreview}
							<img src={photoPreview} alt="Profile preview" class="preview-image" />
						{:else if photoURL}
							<img src={photoURL} alt="Current profile" class="preview-image" />
						{:else}
							<div class="no-photo">
								<span class="icon">👤</span>
								<span class="text">No Photo</span>
							</div>
						{/if}
					</div>

					<div class="photo-actions">
						<input
							type="file"
							id="photoInput"
							accept="image/*"
							on:change={handlePhotoSelect}
							disabled={isSaving || isUploadingPhoto}
							style="display: none;"
						/>
						<label for="photoInput" class="btn-upload" class:disabled={isSaving || isUploadingPhoto}>
							<span class="icon">📷</span>
							<span>{photoFile || photoURL ? 'Change Photo' : 'Upload Photo'}</span>
						</label>

						{#if photoFile || photoPreview}
							<button
								class="btn-remove"
								on:click={removePhoto}
								disabled={isSaving || isUploadingPhoto}
							>
								<span class="icon">🗑️</span>
								<span>Remove</span>
							</button>
						{/if}
					</div>

					<p class="input-hint">Recommended: Square image, max 2MB (JPG, PNG, GIF)</p>
				</div>
			</div>

			<!-- Display Name -->
			<div class="form-group">
				<label class="form-label" for="displayName">
					Display Name
					<span class="required">*</span>
				</label>
				<input
					type="text"
					id="displayName"
					bind:value={displayName}
					placeholder="Enter your display name"
					class="form-input"
					disabled={isSaving}
					maxlength="50"
				/>
				{#if displayName.trim().length > 0 && displayName.trim().length < 2}
					<p class="input-hint error">Display name harus minimal 2 karakter</p>
				{/if}
			</div>

			<!-- Email (Read-only) -->
			<div class="form-group">
				<label class="form-label" for="email">
					Email Address
					<span class="badge-readonly">Read-only</span>
				</label>
				<div class="input-readonly">
					<span class="icon">📧</span>
					<span class="value">{email}</span>
				</div>
				<p class="input-hint">Email tidak dapat diubah untuk alasan keamanan</p>
			</div>

			<!-- Member Since -->
			<div class="form-group">
				<label class="form-label">Member Since</label>
				<div class="input-readonly">
					<span class="icon">📅</span>
					<span class="value">{memberSince || 'Loading...'}</span>
				</div>
			</div>

			<!-- Change Preview -->
			{#if hasChanges}
				<div class="change-preview-card">
					<div class="preview-header">
						<span class="icon">ℹ️</span>
						<span>Perubahan akan disimpan</span>
					</div>
					<div class="change-summary">
						<div class="change-item">
							<span class="label">Dari:</span>
							<span class="value">{originalDisplayName}</span>
						</div>
						<div class="arrow">→</div>
						<div class="change-item">
							<span class="label">Ke:</span>
							<span class="value">{displayName}</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="actions">
				<button
					class="btn-secondary"
					on:click={handleCancel}
					disabled={isSaving}
				>
					Cancel
				</button>
				<button
					class="btn-primary"
					on:click={handleSaveClick}
					disabled={!hasChanges || !isValidDisplayName || isSaving}
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
	{/if}
</div>

<!-- Confirmation Modal -->
{#if showSaveConfirmation}
	<div class="modal-backdrop" on:click={cancelSave}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Konfirmasi Perubahan</h3>
				<button class="close-btn" on:click={cancelSave}>×</button>
			</div>

			<div class="modal-body">
				<p>Apakah kamu yakin ingin mengubah display name?</p>

				<div class="change-summary">
					<div class="change-item">
						<span class="label">Dari:</span>
						<span class="value">{originalDisplayName}</span>
					</div>
					<div class="arrow">→</div>
					<div class="change-item">
						<span class="label">Ke:</span>
						<span class="value">{displayName}</span>
					</div>
				</div>
			</div>

			<div class="modal-actions">
				<button class="btn-secondary" on:click={cancelSave} disabled={isSaving}>
					Batal
				</button>
				<button class="btn-primary" on:click={confirmSave} disabled={isSaving}>
					{#if isSaving}
						<div class="spinner-small"></div>
						Menyimpan...
					{:else}
						<span class="icon">✓</span>
						Ya, Simpan
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.settings-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
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
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: #374151;
		margin-bottom: 1.5rem;
		padding-left: 0.5rem;
		border-left: 4px solid rgba(0, 191, 255, 0.5);
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
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.required {
		color: #ef4444;
	}

	.badge-readonly {
		padding: 0.125rem 0.5rem;
		background: rgba(107, 114, 128, 0.1);
		border: 1px solid rgba(107, 114, 128, 0.2);
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
	}

	.form-input {
		width: 100%;
		padding: 0.875rem 1rem;
		background: rgba(255, 255, 255, 0.7);
		border: 2px solid rgba(0, 191, 255, 0.2);
		border-radius: 10px;
		font-size: 1rem;
		color: #1f2937;
		transition: all 0.2s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: rgba(0, 191, 255, 0.5);
		box-shadow: 0 0 0 3px rgba(0, 191, 255, 0.1);
		background: rgba(255, 255, 255, 0.9);
	}

	.form-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.input-readonly {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: rgba(249, 250, 251, 0.7);
		border: 2px solid rgba(229, 231, 235, 0.5);
		border-radius: 10px;
	}

	.input-readonly .icon {
		font-size: 1.25rem;
	}

	.input-readonly .value {
		font-size: 1rem;
		color: #374151;
		font-weight: 500;
	}

	.input-hint {
		margin-top: 0.375rem;
		font-size: 0.85rem;
		color: #6b7280;
	}

	.input-hint.error {
		color: #ef4444;
	}

	/* Profile Photo Styles */
	.photo-upload-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.photo-preview {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.7);
		border: 3px solid rgba(0, 191, 255, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.no-photo {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #9ca3af;
	}

	.no-photo .icon {
		font-size: 2.5rem;
	}

	.no-photo .text {
		font-size: 0.75rem;
		font-weight: 600;
	}

	.photo-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn-upload,
	.btn-remove {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.btn-upload {
		background: linear-gradient(
			135deg,
			rgba(0, 191, 255, 0.6) 0%,
			rgba(30, 144, 255, 0.7) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		box-shadow: 0 4px 16px rgba(0, 191, 255, 0.1);
	}

	.btn-upload:hover:not(.disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 191, 255, 0.15);
	}

	.btn-upload.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-remove {
		background: rgba(255, 255, 255, 0.4);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #dc2626;
	}

	.btn-remove:hover:not(:disabled) {
		background: rgba(254, 226, 226, 0.5);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.btn-remove:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.change-preview-card {
		background: rgba(219, 234, 254, 0.3);
		border: 2px solid rgba(59, 130, 246, 0.3);
		border-radius: 12px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: #1e40af;
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
	}

	.change-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 8px;
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
		font-size: 1rem;
		font-weight: 700;
		color: #1f2937;
	}

	.arrow {
		font-size: 1.25rem;
		color: #6b7280;
		padding: 0 0.5rem;
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

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
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
		margin-bottom: 1rem;
		line-height: 1.6;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
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

		.actions {
			flex-direction: column;
		}

		.change-summary {
			flex-direction: column;
			gap: 0.75rem;
		}

		.arrow {
			transform: rotate(90deg);
		}

		.modal-content {
			padding: 1.5rem;
		}
	}
</style>
