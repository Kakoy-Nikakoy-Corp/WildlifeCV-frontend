<script>
  import { createEventDispatcher } from 'svelte';

  export let step;
  export let fileType;
  export let processedVideoUrl;
  export let processedImageUrl;
  export let processedArchiveUrl;
  export let processedImages = [];
  export let errorMessage = '';

  const dispatch = createEventDispatcher();

  function download({ url, filename }) {
    dispatch('download', { url, filename });
  }

  function downloadTimestamps() {
    dispatch('downloadtimestamps');
  }

  function reset() {
    dispatch('reset');
  }
</script>

{#if step === 'success_video'}
  <div class="card result-card">
    <h2 class="result-title">Барс найден</h2>
    <!-- svelte-ignore a11y_media_has_caption -->
    <video src={processedVideoUrl} controls class="media-preview video-preview"></video>
  </div>
  <div class="actions row">
    <button class="btn primary" on:click={downloadTimestamps}>Скачать таймкоды</button>
    <button class="btn primary" on:click={() => download({ url: processedVideoUrl, filename: 'processed_video.mp4' })}>Скачать видео</button>
    <button class="btn" on:click={reset}>Отправить новый файл</button>
  </div>
{:else if step === 'success_image'}
  <div class="card result-card">
    <h2 class="result-title">Барс найден</h2>
    <img src={processedImageUrl} alt="Обработанное изображение" class="media-preview image-preview" />
  </div>
  <div class="actions row">
    <button class="btn primary" on:click={() => download({ url: processedImageUrl, filename: 'processed_image.jpg' })}>Скачать изображение</button>
    <button class="btn" on:click={reset}>Отправить новый файл</button>
  </div>
{:else if step === 'success_archive'}
  <div class="card result-card">
    <h2 class="result-title">Барс найден в архиве</h2>
    <div class="collage-grid">
      {#each processedImages as src, i}
        <img src={src} alt="Кадр {i + 1}" class="collage-item" />
      {/each}
    </div>
  </div>
  <div class="actions row">
    <button class="btn primary" on:click={() => download({ url: processedArchiveUrl, filename: 'processed_archive.zip' })}>Скачать архив</button>
    <button class="btn" on:click={reset}>Отправить новый файл</button>
  </div>
{:else if step === 'not_found'}
  <div class="card result-card error">
    <p class="error-text">
      {#if fileType === 'video'}
        Барс на видео не обнаружен
      {:else if fileType === 'image'}
        Барс на изображении не обнаружен
      {:else}
        Барс в файлах архива не обнаружен
      {/if}
    </p>
  </div>
  <div class="actions">
    <button class="btn" on:click={reset}>Отправить новый файл</button>
  </div>
{:else if step === 'backend_error'}
  <div class="card result-card error">
    <p class="error-text">Ошибка обработки</p>
    <p class="error-detail">{errorMessage}</p>
  </div>
  <div class="actions">
    <button class="btn" on:click={reset}>Отправить файл заново</button>
  </div>
{/if}
