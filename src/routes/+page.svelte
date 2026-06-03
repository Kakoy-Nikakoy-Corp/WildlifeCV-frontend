<script>
  import UploadCard from '../lib/components/UploadCard.svelte';
  import PreviewCard from '../lib/components/PreviewCard.svelte';
  import ProcessingCard from '../lib/components/ProcessingCard.svelte';
  import ResultCard from '../lib/components/ResultCard.svelte';

  import '../lib/styles/global.css';
  import '../lib/styles/cards.css';
  import '../lib/styles/buttons.css';
  import '../lib/styles/upload-card.css';
  import '../lib/styles/preview-card.css';
  import '../lib/styles/processing-card.css';
  import '../lib/styles/result-card.css';

  import { validateFile } from '../lib/utils/fileUtils.js';
  import { recognizeFile } from '../lib/api/recognition.js';

  // Состояние приложения: upload | preview | processing | success_video | success_image | success_archive | not_found | backend_error
  let step = $state('upload');
  let selectedFile = $state(null);
  let previewUrl = $state(null);
  let fileType = $state('video'); // video | image | archive
  let lensX = $state(10);
  let lensY = $state(10);
  let timestamps = $state([]);
  let processedVideoUrl = $state(null);
  let processedImageUrl = $state(null);
  let processedArchiveUrl = $state(null);
  let processedImages = $state([]);
  let errorMessage = $state('');
  let moveTimer = null;
  let logoFailed = $state(false);

  function handleFile(file) {
    if (!file) return;

    try {
      fileType = validateFile(file);
    } catch (error) {
      alert(error.message);
      return;
    }

    selectedFile = file;
    previewUrl = fileType === 'archive' ? null : URL.createObjectURL(file);
    step = 'preview';
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    step = 'processing';

    moveTimer = setInterval(() => {
      lensX = Math.floor(Math.random() * 80) + 10;
      lensY = Math.floor(Math.random() * 70) + 15;
    }, 600);

    try {
      const data = await recognizeFile(fileType, selectedFile);

      if (data.status === 'IRBIS_FOUND') {
        if (fileType === 'video') {
          timestamps = data.timestrings || [];
          processedVideoUrl = data.link;
          step = 'success_video';
        } else if (fileType === 'image') {
          processedImageUrl = data.link;
          step = 'success_image';
        } else {
          processedArchiveUrl = data.link;
          processedImages = data.collage_images || [];
          step = 'success_archive';
        }
      } else if (data.status === 'NO_IRBIS_FOUND') {
        step = 'not_found';
      } else {
        errorMessage = data.detail || 'Произошла неизвестная ошибка обработки';
        step = 'backend_error';
      }
    } catch (err) {
      console.error('Recognition API error:', err);
      errorMessage = err.message || 'Ошибка сети или недоступность сервера';
      step = 'backend_error';
    } finally {
      if (moveTimer) {
        clearInterval(moveTimer);
        moveTimer = null;
      }
    }
  }

  function downloadTimestamps() {
    const content = timestamps.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerDownload(URL.createObjectURL(blob), `timestamps_${Date.now()}.txt`);
  }

  function downloadProcessedFile(url, filename) {
    if (!url) return;
    triggerDownload(url, filename);
  }

  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }, 100);
  }

  function resetFlow() {
    if (moveTimer) clearInterval(moveTimer);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    selectedFile = null;
    previewUrl = null;
    timestamps = [];
    processedVideoUrl = null;
    processedImageUrl = null;
    processedArchiveUrl = null;
    processedImages = [];
    errorMessage = '';
    lensX = 10;
    lensY = 10;
    step = 'upload';
  }

  $effect(() => {
    return () => {
      if (moveTimer) clearInterval(moveTimer);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  });
</script>

<div class="app">
  <header class="logo">
    {#if !logoFailed}
      <img src="logo.png" alt="Сбер" class="logo-img" onerror={() => logoFailed = true} />
    {:else}
      <span class="logo-text">Сбер</span>
    {/if}
  </header>

  <main class="container">
    {#if step === 'upload'}
      <UploadCard on:fileSelected={(event) => handleFile(event.detail)} />
      <div class="actions">
        <button class="btn" disabled>Отправить</button>
      </div>
    {/if}

    {#if step === 'preview'}
      <PreviewCard {fileType} {previewUrl} {selectedFile} on:submit={handleSubmit} />
    {/if}

    {#if step === 'processing'}
      <ProcessingCard {lensX} {lensY} />
    {/if}

    {#if step !== 'upload' && step !== 'preview' && step !== 'processing'}
      <ResultCard
        {step}
        {fileType}
        {timestamps}
        {processedVideoUrl}
        {processedImageUrl}
        {processedArchiveUrl}
        {processedImages}
        {errorMessage}
        on:download={({ detail }) => downloadProcessedFile(detail.url, detail.filename)}
        on:downloadtimestamps={downloadTimestamps}
        on:reset={resetFlow}
      />
    {/if}
  </main>
</div>
