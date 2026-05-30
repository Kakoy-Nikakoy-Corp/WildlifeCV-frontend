<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let isDragging = false;
  let fileInput;

  function triggerFileInput() {
    fileInput?.click();
  }

  function onDrop(event) {
    event.preventDefault();
    isDragging = false;
    dispatch('fileSelected', event.dataTransfer.files[0]);
  }

  function onDragOver(event) {
    event.preventDefault();
    isDragging = true;
  }

  function onDragLeave() {
    isDragging = false;
  }

  function onFileChange(event) {
    dispatch('fileSelected', event.target.files[0]);
  }
</script>

<div class="card upload-card" class:active={isDragging} role="region"
     on:dragover={onDragOver} on:dragleave={onDragLeave} on:drop={onDrop}>
  <div class="upload-area">
    <input
      type="file"
      accept="video/mp4,video/webm,video/avi,video/x-matroska,video/quicktime,.mp4,.webm,.avi,.mkv,.mov,.ogv,image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z,.tar,.gz,.bz2,.xz,.tgz"
      hidden
      bind:this={fileInput}
      on:change={onFileChange}
    />
    <span class="upload-text">Перетащите файл видео, изображения или архива сюда</span>
    <span class="upload-or">или</span>
    <button class="btn primary" type="button" on:click={triggerFileInput}>Загрузить файл</button>
  </div>
</div>
