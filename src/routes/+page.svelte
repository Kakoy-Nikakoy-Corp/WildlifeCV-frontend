<script>
// Состояние приложения: upload | preview | processing | success_video | success_image | success_archive | not_found | backend_error
let step = $state('upload');
let selectedFile = $state(null);
let previewUrl = $state(null);
let fileType = $state('video'); // video | image | archive
let isDragging = $state(false);
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
let fileInput = $state(null);

// Загрузка файла и определение типа
function handleFile(file) {
  if (!file) return;

  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('Файл слишком большой. Максимальный размер 500MB');
    return;
  }

  // Проверка типа файла
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  
  // Для архивов проверяем расширение, так как MIME-тип может быть не определен
  const fileName = file.name.toLowerCase();
  const isArchive = fileName.endsWith('.zip') || 
                    fileName.endsWith('.rar') || 
                    fileName.endsWith('.7z') || 
                    fileName.endsWith('.tar') || 
                    fileName.endsWith('.gz') ||
                    fileName.endsWith('.bz2');

  if (!isVideo && !isImage && !isArchive) {
    alert('Пожалуйста, загрузите файл видео, изображения или архива.');
    return;
  }

  selectedFile = file;
  
  if (isVideo) {
    fileType = 'video';
    previewUrl = URL.createObjectURL(file);
  } else if (isImage) {
    fileType = 'image';
    previewUrl = URL.createObjectURL(file);
  } else {
    fileType = 'archive';
    previewUrl = null;
  }
  
  step = 'preview';
}

function triggerFileInput() {
  fileInput?.click();
}

// Drag and Drop
function onDrop(e) {
  e.preventDefault();
  isDragging = false;
  handleFile(e.dataTransfer.files[0]);
}
function onDragOver(e) {
  e.preventDefault();
  isDragging = true;
}
function onDragLeave() {
  isDragging = false;
}

// Отправка файла на сервер и обработка ответа
async function handleSubmit() {
  if (!selectedFile) return;
  step = 'processing';

  moveTimer = setInterval(() => {
    lensX = Math.floor(Math.random() * 80) + 10;
    lensY = Math.floor(Math.random() * 70) + 15;
  }, 600);

  // Определение эндпоинта в зависимости от типа файла
  let endpoint = '';
  if (fileType === 'video') endpoint = '/recognise/video/';
  else if (fileType === 'image') endpoint = '/recognise/image/';
  else endpoint = '/recognise/multi-image/';

  const formData = new FormData();
  formData.append('video', selectedFile);

  try {
    const response = await fetch(`https://api.irbis.wild1.net` + endpoint, {
      method: 'POST',
      headers: { 'accept': 'application/json' },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Логика маршрутизации по экранам
    if (data.status === 'OK') {
      if (fileType === 'video') {
        timestamps = data.data.timestrings || [];
        processedVideoUrl = data.data.link;
        step = 'success_video';
      } else if (fileType === 'image') {
        processedImageUrl = data.link;
        step = 'success_image';
      } else {
        processedArchiveUrl = data.archive_link;
        processedImages = [data.image_1, data.image_2, data.image_3, data.image_4];
        step = 'success_archive';
      }
    } else if (data.status === 'not_found') {
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

// Скачивание файлов
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

// Сброс состояния приложения
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

// Очистка ресурсов при размонтировании
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
      <div class="card upload-card" class:active={isDragging} role="region"
           ondragover={onDragOver} ondragleave={onDragLeave} ondrop={onDrop}>
        <div class="upload-area">
            <input 
              type="file" 
              accept="video/mp4,video/webm,video/avi,image/jpeg,image/png,image/gif,image/webp,.zip,.rar,.7z,.tar,.gz,.bz2" 
              hidden
              bind:this={fileInput} 
              onchange={(e) => handleFile(e.target.files[0])} 
            />
          <span class="upload-text">Перетащите файл видео, изображения или архива сюда</span>
          <span class="upload-or">или</span>
          <button class="btn primary" type="button" onclick={triggerFileInput}>Загрузить файл</button>
        </div>
      </div>
      <div class="actions">
        <button class="btn" disabled>Отправить</button>
      </div>
    {/if}

    {#if step === 'preview'}
      <div class="card preview-card">
        {#if fileType === 'video'}
          <video src={previewUrl} controls class="media-preview video-preview"></video>
        {:else if fileType === 'image'}
          <img src={previewUrl} alt="Предпросмотр" class="media-preview image-preview" />
        {:else}
          <div class="archive-preview">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span class="archive-name">{selectedFile?.name}</span>
          </div>
        {/if}
      </div>
      <div class="actions">
        <button class="btn primary" onclick={handleSubmit}>Отправить</button>
      </div>
    {/if}

    {#if step === 'processing'}
      <div class="card processing-card">
        <div class="scene">
          <img src="leopard.png" alt="Ищем снежного барса" class="leopard-img" />
          <div class="magnifier" style="left: {lensX}%; top: {lensY}%;">
            <img src="magnifier.png" alt="" />
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="btn" disabled>Ищем барса!</button>
      </div>
    {/if}

    {#if step === 'success_video'}
      <div class="card result-card">
        <h2 class="result-title">Барс найден</h2>
        <video src={processedVideoUrl} controls class="media-preview video-preview"></video>
        <ul class="timestamps-list">
          {#each timestamps as tc}
            <li>{tc}</li>
          {/each}
        </ul>
      </div>
      <div class="actions row">
        <button class="btn primary" onclick={downloadTimestamps}>Скачать таймкоды</button>
        <button class="btn primary" onclick={() => downloadProcessedFile(processedVideoUrl, 'processed_video.mp4')}>Скачать видео</button>
        <button class="btn" onclick={resetFlow}>Отправить новый файл</button>
      </div>
    {/if}

    {#if step === 'success_image'}
      <div class="card result-card">
        <h2 class="result-title">Барс найден</h2>
        <img src={processedImageUrl} alt="Обработанное изображение" class="media-preview image-preview" />
      </div>
      <div class="actions row">
        <button class="btn primary" onclick={() => downloadProcessedFile(processedImageUrl, 'processed_image.jpg')}>Скачать изображение</button>
        <button class="btn" onclick={resetFlow}>Отправить новый файл</button>
      </div>
    {/if}

    {#if step === 'success_archive'}
      <div class="card result-card">
        <h2 class="result-title">Барс найден в архиве</h2>
        <div class="collage-grid">
          {#each processedImages as src, i}
            <img src={src} alt="Кадр {i + 1}" class="collage-item" />
          {/each}
        </div>
      </div>
      <div class="actions row">
        <button class="btn primary" onclick={() => downloadProcessedFile(processedArchiveUrl, 'processed_archive.zip')}>Скачать архив</button>
        <button class="btn" onclick={resetFlow}>Отправить новый файл</button>
      </div>
    {/if}

    {#if step === 'not_found'}
      <div class="card result-card error">
        <p class="error-text">
          {#if fileType === 'video'}
            К сожалению на видео не обнаружено барса
          {:else if fileType === 'image'}
            К сожалению на изображении не обнаружено барса
          {:else}
            К сожалению в файлах архива не обнаружено барса
          {/if}
        </p>
      </div>
      <div class="actions">
        <button class="btn" onclick={resetFlow}>Отправить новый файл</button>
      </div>
    {/if}

    {#if step === 'backend_error'}
      <div class="card result-card error">
        <p class="error-text">Ошибка обработки</p>
        <p class="error-detail">{errorMessage}</p>
      </div>
      <div class="actions">
        <button class="btn" onclick={resetFlow}>Отправить файл заново</button>
      </div>
    {/if}
  </main>
</div>

<style>
:global(html, body) {
  height: 100%;
  margin: 0;
  overflow-x: hidden;
}
:global(body) {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #F5F7FA;
  color: #1A1A1A;
  overflow: hidden;
}
.app {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 14px 16px;
  overflow: hidden;
}
.logo {
  position: fixed;
  top: 16px;
  left: 16px;
  width: auto;
  max-width: calc(100% - 32px);
  margin: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  z-index: 20;
}
@media (max-width: 640px) {
  .logo { top: 12px; left: 12px; }
}
.logo-img { height: 88px; width: auto; display: block; }
.logo-text { font-weight: 700; font-size: 40px; color: #21A038; letter-spacing: -0.5px; }

.container {
  width: min(96%, 1040px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: auto;
  max-height: 90vh;
}
.card {
  width: 100%;
  max-width: 1040px;
  background: #fff;
  border: 1px solid #EEF3F8;
  border-radius: 28px;
  padding: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 520px;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.10);
}
.upload-card {
  border: 1px solid #DCE4EB;
  transition: border-color 0.2s, background 0.2s, transform 0.2s;
  cursor: pointer;
}
.upload-card.active {
  border-color: #21A038;
  background: #F0FDF4;
}
.upload-area { text-align: center; }
.upload-text { display: block; font-size: clamp(15px, 2.2vw, 19px); margin-bottom: 10px; color: #475569; }
.upload-or { display: block; margin: 10px 0 18px; color: #94A3B8; font-size: clamp(13px, 1.7vw, 17px); }

.media-preview {
  width: 100%;
  border-radius: 16px;
  max-height: 38vh;
  min-height: 220px;
  object-fit: contain;
  background: #000;
}
.video-preview { background: #000; }
.image-preview { background: #F8FAFC; box-shadow: inset 0 0 20px rgba(0,0,0,0.05); }
.archive-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: #64748B;
  background: #F8FAFC;
  border-radius: 16px;
  width: 100%;
}
.archive-name { font-size: clamp(14px, 2vw, 18px); font-weight: 500; text-align: center; word-break: break-all; }

.scene {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
.leopard-img {
  max-width: 100%;
  max-height: 260px;
  object-fit: contain;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}
.magnifier {
  position: absolute;
  width: 62px;
  height: 62px;
  transition: left 0.6s cubic-bezier(0.25, 1, 0.5, 1), top 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
}
.magnifier img { width: 100%; height: 100%; object-fit: contain; display: block; }

.result-title { margin: 0 0 14px; font-size: clamp(18px, 2.2vw, 24px); font-weight: 600; text-align: center; }
.timestamps-list {
  list-style: none; padding: 0; margin: 0; width: 100%; max-height: 150px; overflow-y: auto;
  text-align: center; font-family: 'Courier New', monospace; font-size: clamp(13px, 1.7vw, 17px); color: #334155;
  line-height: 1.75; background: #F8FAFC; padding: 14px; border-radius: 12px;
}
.collage-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  max-width: 600px;
}
.collage-item {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 12px;
  background: #F1F5F9;
}
.error-text { margin: 0 0 8px; font-size: clamp(18px, 2.4vw, 22px); font-weight: 500; text-align: center; color: #475569; }
.error-detail { margin: 0; font-size: clamp(14px, 1.8vw, 16px); text-align: center; color: #94A3B8; font-family: monospace; }

.actions { display: flex; justify-content: center; align-items: center; gap: 16px; width: 100%; }
.btn {
  padding: 16px 30px; border-radius: 16px; border: none; background: #E2E8F0; color: #475569;
  font-size: clamp(15px, 2vw, 19px); font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.btn:hover:not(.btn:disabled) { background: #CBD5E1; transform: translateY(-1px); }
.btn.primary { background: #21A038; color: #fff; }
.btn.primary:hover:not(.btn:disabled) { background: #1E8E32; box-shadow: 0 5px 14px rgba(33, 160, 56, 0.35); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.actions.row { flex-direction: column; }
@media (min-width: 640px) { .actions.row { flex-direction: row; } }

.timestamps-list::-webkit-scrollbar { width: 6px; }
.timestamps-list::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 3px; }
.timestamps-list::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
.timestamps-list::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
</style>