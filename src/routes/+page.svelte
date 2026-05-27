<script>
  let step = $state('upload'); // upload | preview | processing | success | error
  let videoFile = $state(null);
  let videoUrl = $state(null);
  let isDragging = $state(false);

  let lensX = $state(10);
  let lensY = $state(10);

  let timestamps = $state([]);
  let processingTimer = null;
  let moveTimer = null;

  let logoFailed = $state(false);
  let fileInput = $state(null);

  // Загрузка файла
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('Пожалуйста, загрузите видеофайл (MP4, WebM, AVI и т.д.)');
      return;
    }
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Файл слишком большой. Максимальный размер 500MB');
      return;
    }
    videoFile = file;
    videoUrl = URL.createObjectURL(file);
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

  // Отправка видео на сервер и обработка ответа
  async function handleSubmit() {
    if (!videoFile) return;

    step = 'processing';

    // Анимация перемещения лупы во время запроса
    moveTimer = setInterval(() => {
        lensX = Math.floor(Math.random() * 80) + 10;
        lensY = Math.floor(Math.random() * 70) + 15;
    }, 600);

    try {
        const formData = new FormData();
        formData.append('file', videoFile);

        const response = await fetch('https://api.irbis.wild1.net/recognise', {
            method: 'POST',
            headers: {
                'accept': 'application/json'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success' && Array.isArray(data.timestrings)) {
            timestamps = data.timestrings;
            step = 'success';
        } else {
            step = 'error';
        }
    } catch (err) {
        console.error('Recognition API error:', err);
        step = 'error';
    } finally {
        // Остановка анимации при завершении запроса
        if (moveTimer) {
            clearInterval(moveTimer);
            moveTimer = null;
        }
    }
  }

  // Экспорт таймкодов
  function downloadTimestamps() {
    const content = timestamps.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timestamps_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Сброс состояния приложения
  function resetFlow() {
    if (processingTimer) clearTimeout(processingTimer);
    if (moveTimer) clearInterval(moveTimer);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoFile = null;
    videoUrl = null;
    timestamps = [];
    lensX = 10;
    lensY = 10;
    step = 'upload';
  }

  // Очистка ресурсов при размонтировании компонента
  $effect(() => {
    return () => {
      if (processingTimer) clearTimeout(processingTimer);
      if (moveTimer) clearInterval(moveTimer);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
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
      <div 
        class="card upload-card"
        class:active={isDragging}
        role="region"
        ondragover={onDragOver}
        ondragleave={onDragLeave}
        ondrop={onDrop}
      >
        <div class="upload-area">
          <input 
            type="file" 
            accept="video/*" 
            hidden
            bind:this={fileInput}
            onchange={(e) => handleFile(e.target.files[0])}
          />
          <span class="upload-text">Перетащите файл видео сюда</span>
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
        <video src={videoUrl} controls class="video-preview">
          <track kind="captions" label="Нет субтитров" src="" srclang="ru" default hidden />
        </video>
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
            <img src="magnifier.png" alt="🔍" />
          </div>
        </div>
      </div>
      <div class="actions">
        <button class="btn" disabled>Ищем барса!</button>
      </div>
    {/if}

    {#if step === 'success'}
      <div class="card result-card">
        <h2 class="result-title">Барс найден</h2>
        <ul class="timestamps-list">
          {#each timestamps as tc}
            <li>{tc}</li>
          {/each}
        </ul>
      </div>
      <div class="actions row">
        <button class="btn primary" onclick={downloadTimestamps}>Скачать файл с таймкодами</button>
        <button class="btn" onclick={resetFlow}>Отправить новое видео</button>
      </div>
    {/if}

    {#if step === 'error'}
      <div class="card result-card error">
        <p class="error-text">К сожалению на видео не обнаружено барса</p>
      </div>
      <div class="actions">
        <button class="btn" onclick={resetFlow}>Отправить новое видео</button>
      </div>
    {/if}
  </main>
</div>


<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #F5F7FA;
    color: #1A1A1A;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
  }

  .logo {
    width: 100%;
    max-width: 800px;
    margin-bottom: 24px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .logo-img {
    height: 32px;
    width: auto;
    display: block;
  }

  .logo-text {
    font-weight: 700;
    font-size: 22px;
    color: #21A038;
    letter-spacing: -0.5px;
  }

  .container {
    width: 100%;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .card {
    background: #fff;
    border: 1px solid #E2E8F0;
    border-radius: 24px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  }

  .upload-card {
    border: 2px dashed #CBD5E1;
    transition: border-color 0.2s, background 0.2s;
    cursor: pointer;
  }
  .upload-card.active {
    border-color: #21A038;
    background: #F0FDF4;
  }

  .upload-area { text-align: center; }
  .upload-text { display: block; font-size: 16px; margin-bottom: 8px; color: #475569; }
  .upload-or { display: block; margin: 8px 0 16px; color: #94A3B8; font-size: 14px; }

  .video-preview { width: 100%; border-radius: 16px; background: #000; max-height: 320px; }

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
    max-height: 200px;
    object-fit: contain;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
  }
  .magnifier {
    position: absolute;
    width: 56px;
    height: 56px;
    transition: left 0.6s cubic-bezier(0.25, 1, 0.5, 1), top 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 2;
  }
  .magnifier img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    font-size: 40px;
    line-height: 56px;
    text-align: center;
  }

  .result-title { margin: 0 0 16px; font-size: 18px; font-weight: 600; text-align: center; }
  .timestamps-list {
    list-style: none; padding: 0; margin: 0; width: 100%; max-height: 180px; overflow-y: auto;
    text-align: center; font-family: 'Courier New', monospace; font-size: 14px; color: #334155;
    line-height: 1.8; background: #F8FAFC; padding: 16px; border-radius: 12px;
  }
  .error-text { margin: 0; font-size: 18px; font-weight: 500; text-align: center; color: #475569; }

  .actions { display: flex; justify-content: center; gap: 12px; }
  .actions.row { flex-direction: column; }
  @media (min-width: 640px) { .actions.row { flex-direction: row; } }

  .btn {
    padding: 12px 24px; border-radius: 12px; border: none; background: #E2E8F0; color: #475569;
    font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .btn:hover:not(.btn:disabled) { background: #CBD5E1; transform: translateY(-1px); }
  .btn.primary { background: #21A038; color: #fff; }
  .btn.primary:hover:not(.btn:disabled) { background: #1E8E32; box-shadow: 0 4px 12px rgba(33, 160, 56, 0.3); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .timestamps-list::-webkit-scrollbar { width: 6px; }
  .timestamps-list::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 3px; }
  .timestamps-list::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
  .timestamps-list::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
</style>