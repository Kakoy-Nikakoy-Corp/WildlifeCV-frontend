<script>
  import { createEventDispatcher } from 'svelte';

  export let fileType;
  export let previewUrl;
  export let selectedFile;

  const dispatch = createEventDispatcher();

  function submit() {
    dispatch('submit');
  }
</script>

<div class="card preview-card">
  {#if fileType === 'video'}
    <!-- svelte-ignore a11y_media_has_caption -->
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
  <button class="btn primary" on:click={submit}>Отправить</button>
</div>
