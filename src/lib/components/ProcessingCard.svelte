<script>
  export let lensX = 10;
  export let lensY = 10;
</script>

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
