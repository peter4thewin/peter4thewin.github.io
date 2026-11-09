/* Hover preview for video thumbnails (Selected Works, Unreal Engine).
   Drop a short, muted clip at assets/previews/<youtube id>.mp4 and it plays
   while the pointer is over that card. Cards without a clip are left alone. */
(function () {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var missing = {};
  document.querySelectorAll('.card[data-video]').forEach(function (card) {
    var id = card.dataset.video, thumb = card.querySelector('.thumb');
    var video = null, timer = 0;
    function start() {
      if (video || missing[id]) return;
      var v = video = document.createElement('video');
      v.className = 'preview';
      v.src = 'assets/previews/' + id + '.mp4';
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('aria-hidden', 'true');
      v.addEventListener('playing', function () { v.classList.add('is-on'); });
      v.addEventListener('error', function () { missing[id] = true; drop(v); });
      thumb.appendChild(v);
      v.play().catch(function () {});
    }
    function drop(v) { if (video === v) video = null; v.remove(); }
    card.addEventListener('pointerenter', function () { timer = setTimeout(start, 220); });
    card.addEventListener('pointerleave', function () {
      clearTimeout(timer);
      var v = video; if (!v) return;
      video = null; v.classList.remove('is-on');
      setTimeout(function () { v.pause(); v.remove(); }, 320);
    });
  });
})();
