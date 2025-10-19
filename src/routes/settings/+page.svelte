<script lang="ts">
	import SettingCard from '$lib/components/settings/SettingCard.svelte';

	const settingsItems = [
		{
			icon: '📅',
			title: 'Periode Tracking',
			description: 'Atur tanggal reset budget sesuai jadwal gajian',
			href: '/settings/tracking-period',
			badge: '',
			disabled: false
		},
		{
			icon: '👤',
			title: 'Account Settings',
			description: 'Kelola profil dan informasi akun',
			href: '/settings/account',
			badge: '',
			disabled: false
		}
	];
</script>

<svelte:head>
	<title>Settings - DuitTrack</title>
</svelte:head>

<div class="settings-container">
	<div class="settings-page">
		<!-- Header -->
		<div class="page-header">
			<h1>⚙️ Settings</h1>
		</div>

		<!-- Settings List -->
		<div class="settings-list">
			{#each settingsItems as setting}
				<SettingCard
					icon={setting.icon}
					title={setting.title}
					description={setting.description}
					href={setting.href}
					badge={setting.badge}
					disabled={setting.disabled}
				/>
			{/each}
		</div>
	</div>

	<!-- Footer -->
	<footer class="settings-footer">
		<div class="footer-content">
			<p class="footer-text">
				📧 <a href="mailto:tegarerputra@outlook.com" class="footer-email-link">tegarerputra@outlook.com</a>
				<span class="footer-separator">•</span>
				© {new Date().getFullYear()} DuitTrack
			</p>
		</div>
	</footer>
</div>

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

	.settings-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
	}

	/* Settings Footer */
	.settings-footer {
		margin-top: auto;
		padding: 24px 20px;
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-top: 1px solid rgba(6, 182, 212, 0.1);
		width: 100%;
	}

	.footer-content {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.footer-text {
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

	.footer-email-link {
		color: #0891B2;
		text-decoration: none;
		transition: all 0.2s ease;
		font-weight: 600;
	}

	.footer-email-link:hover {
		color: #06B6D4;
		text-decoration: underline;
	}

	.footer-separator {
		color: #d1d5db;
		font-weight: 400;
		padding: 0 4px;
	}

	/* Mobile responsive footer */
	@media (max-width: 430px) {
		.settings-footer {
			padding: 20px 16px;
		}

		.footer-text {
			font-size: 13px;
			gap: 6px;
		}

		.footer-email-link {
			font-size: 13px;
		}
	}
</style>
