<script>
  export let status = 500;
  export let error;
</script>

<div class="error-screen">
  <div class="error-card">
    <div class="error-code">{status}</div>
    <h1>{status === 404 ? 'Страница не найдена' : 'Что-то пошло не так'}</h1>
    <p>{status === 404
      ? 'К сожалению, страница, которую вы ищете, не существует.'
      : error?.message || 'Произошла непредвиденная ошибка. Попробуйте обновить страницу.'}</p>
    <div class="error-actions">
      <a class="error-link" href="/">Вернуться на главную</a>
    </div>
  </div>
</div>