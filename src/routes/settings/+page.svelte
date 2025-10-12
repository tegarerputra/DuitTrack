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
</style>
