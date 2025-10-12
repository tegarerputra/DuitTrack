<script lang="ts">
	import { goto } from '$app/navigation';

	export let icon: string;
	export let title: string;
	export let description: string;
	export let href: string;
	export let badge: string = '';
	export let disabled: boolean = false;

	function handleClick() {
		if (!disabled) {
			goto(href);
		}
	}
</script>

<button class="setting-card" class:disabled on:click={handleClick} {disabled}>
	<div class="card-icon">{icon}</div>
	<div class="card-content">
		<h3 class="card-title">{title}</h3>
		<p class="card-description">{description}</p>
	</div>
	<div class="card-action">
		{#if badge}
			<span class="badge">{badge}</span>
		{/if}
		<span class="arrow">→</span>
	</div>
</button>

<style>
	.setting-card {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		width: 100%;
		padding: 1.5rem;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.5) 0%,
			rgba(240, 248, 255, 0.4) 100%
		);
		backdrop-filter: blur(25px);
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
	}

	.setting-card:hover:not(.disabled) {
		border-color: rgba(0, 191, 255, 0.4);
		transform: translateY(-2px);
		box-shadow: 0 12px 40px rgba(0, 191, 255, 0.15);
	}

	.setting-card.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.card-icon {
		font-size: 2.5rem;
		flex-shrink: 0;
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 12px;
	}

	.card-content {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.375rem 0;
	}

	.card-description {
		font-size: 0.9rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.4;
	}

	.card-action {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.badge {
		padding: 0.375rem 0.75rem;
		background: linear-gradient(135deg, #fbbf24, #f59e0b);
		color: white;
		border-radius: 8px;
		font-size: 0.75rem;
		font-weight: 600;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.arrow {
		font-size: 1.5rem;
		color: #6b7280;
		transition: transform 0.3s ease;
	}

	.setting-card:hover:not(.disabled) .arrow {
		transform: translateX(4px);
		color: rgba(0, 191, 255, 0.8);
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.setting-card {
			padding: 1.25rem;
			gap: 1rem;
		}

		.card-icon {
			font-size: 2rem;
			width: 56px;
			height: 56px;
		}

		.card-title {
			font-size: 1.125rem;
		}

		.card-description {
			font-size: 0.85rem;
		}

		.badge {
			font-size: 0.7rem;
			padding: 0.25rem 0.5rem;
		}
	}
</style>
