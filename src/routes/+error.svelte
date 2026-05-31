<script>
  import { page } from '$app/stores';
  import ErrorScreen from '../lib/components/ErrorScreen.svelte';
  import '../lib/styles/error.css';
</script>

<svelte:head>
  <title>{$page.status === 404 ? '404 — Страница не найдена' : `${$page.status} — Ошибка`}</title>
</svelte:head>

<ErrorScreen status={$page.status} error={$page.error} />