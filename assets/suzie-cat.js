/* Suzie page only: a little black cat that follows the cursor around the window.

   She walks (faster, if the cursor is far away) toward the pointer and sits down a short
   distance from it, watching it. If it stays still she gets drowsy, then lies down and
   curls up to sleep. Move the mouse and she wakes up. On touch screens she walks to
   wherever you tap. With "reduce motion" on she just sits in the corner.

   Artwork: suzie-sprites.webp, an 8 x 2 grid. Frame numbers below are row * 8 + column. */
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLS = 8;                  // columns in the sprite sheet
  const WALK = [0, 1, 2, 3, 4, 5, 6, 7];   // one full walk cycle, facing right
  const LIE_FLAT = 8;              // lying down, asleep
  const LIE_CURL = 9;              // curled up, asleep
  const SIT_DROWSY = 10;           // sitting, eyes half closed
  const SIT_ALERT = 11;            // sitting, watching the cursor
  const SIT_TALL = 12;             // sitting up tall, for a cursor that is high above her

  const STOP = 78;                 // she sits down this far from the cursor...
  const GO = 108;                  // ...and gets up again when it is farther than this
  const DROWSY_AFTER = 7000;       // ms of stillness before her eyes start to close
  const SLEEP_AFTER = 14000;       // ms of stillness before she lies down
  const STRIDE = 110;              // px she covers in one full walk cycle (sets how fast the legs go for a given speed)
  const MIN_CYCLE = .3;            // s; the fastest she cycles her legs, so a sprint is a scamper rather than a blur
  const MAX_CYCLE = .8;            // s; the slowest, so a slow stroll still reads as walking

  const here = document.currentScript && document.currentScript.src;
  const spriteUrl = here ? new URL('suzie-sprites.webp', here).href : 'assets/suzie-sprites.webp';

  // Don't show anything until the artwork has loaded, so there is no empty box or pop-in.
  const preload = new Image();
  preload.onload = start;
  preload.src = spriteUrl;

  function start() {
    const cat = document.createElement('div');
    cat.className = 'suzie-cat';
    cat.setAttribute('aria-hidden', 'true');
    cat.dataset.mode = 'sit';
    cat.innerHTML = '<div class="cat-flip"><div class="cat-tilt"><div class="cat-breathe"><div class="cat-sprite"></div></div></div></div>'
      + '<span class="z z1">z</span><span class="z z2">z</span><span class="z z3">z</span>';
    document.body.appendChild(cat);
    const flip = cat.querySelector('.cat-flip');
    const tilt = cat.querySelector('.cat-tilt');
    const sprite = cat.querySelector('.cat-sprite');

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const scale = () => parseFloat(getComputedStyle(cat).getPropertyValue('--s')) || 1;
    const cellW = () => parseFloat(getComputedStyle(cat).getPropertyValue('--fw')) || 137.5;
    const cellH = () => parseFloat(getComputedStyle(cat).getPropertyValue('--fh')) || 117;

    let vw = innerWidth, vh = innerHeight;
    const bounds = () => {
      const s = scale();
      return { minX: cellW() * s * .4, maxX: vw - cellW() * s * .4, minY: cellH() * s, maxY: vh - 8 };
    };

    let mode = 'sit';
    let drowsy = false;            // sitting with her eyes half closed
    let dir = 1;                   // which way she faces: 1 = right, -1 = left
    let x = -100, y = vh - 70;     // feet position
    let tx = 190, ty = vh - 70;    // where she is heading
    let px = tx, py = ty;          // last known pointer position
    let walkPhase = 0;             // 0..1 through the walk cycle
    let raf = 0, last = 0;
    let drowsyTimer = 0, sleepTimer = 0, sleepSteps = 0;

    function showFrame(i) {
      sprite.style.setProperty('--c', i % COLS);
      sprite.style.setProperty('--r', Math.floor(i / COLS));
    }
    function render() {
      cat.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(var(--s))`;
      flip.style.transform = `scaleX(${dir})`;
    }

    function clearTimers() { clearTimeout(drowsyTimer); clearTimeout(sleepTimer); clearTimeout(sleepSteps); }

    function setMode(next) {
      if (mode === next) return;
      mode = next;
      cat.dataset.mode = next;
      cat.dataset.settled = '0';
      clearTimers();
      if (next !== 'walk') tilt.style.transform = '';
      if (next === 'sit') { drowsy = false; watch(); armIdle(); }
      render();
    }

    // Sitting: she watches the cursor, turning to face it, and sits up tall if it is well above her.
    function watch() {
      if (mode !== 'sit' || drowsy) return;
      const gx = px - x;
      if (Math.abs(gx) > 45) dir = gx > 0 ? 1 : -1;
      showFrame(y - py > 70 ? SIT_TALL : SIT_ALERT);
      render();
    }

    function armIdle() {
      clearTimers();
      drowsyTimer = setTimeout(() => {
        if (mode !== 'sit') return;
        drowsy = true; showFrame(SIT_DROWSY); render();
      }, DROWSY_AFTER);
      sleepTimer = setTimeout(lieDown, SLEEP_AFTER);
    }

    // She settles (drowsy, then flat, then curled up) and sleeps; the CSS breathing takes over from there.
    function lieDown() {
      if (mode !== 'sit') return;
      setMode('sleep');
      cat.style.setProperty('--zx', dir === 1 ? '70%' : '24%');
      const seq = [SIT_DROWSY, LIE_FLAT, LIE_CURL];
      let n = 0;
      const step = () => {
        if (mode !== 'sleep') return;
        showFrame(seq[n]);
        if (n < seq.length - 1) { n++; sleepSteps = setTimeout(step, 700); }
        else cat.dataset.settled = '1';
        render();
      };
      step();
    }

    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      const dx = tx - x, dy = ty - y, dist = Math.hypot(dx, dy);

      if (mode === 'walk' && dist <= STOP) setMode('sit');

      if (mode === 'walk') {
        const speed = clamp((dist - STOP) * 3.2 + 95, 95, 470);
        const step = Math.min(speed * dt, dist - STOP + 2);
        x += (dx / dist) * step;
        y += (dy / dist) * step;
        if (Math.abs(dx) > 12) dir = dx > 0 ? 1 : -1;

        // Run the walk cycle faster when she moves faster, so her paws keep up with the ground.
        walkPhase = (walkPhase + dt / clamp(STRIDE / speed, MIN_CYCLE, MAX_CYCLE)) % 1;
        showFrame(WALK[Math.floor(walkPhase * WALK.length) % WALK.length]);

        // Lean a little toward vertical movement (mirrored when she faces left).
        const lean = clamp(Math.atan2(dy, Math.max(Math.abs(dx), 40)) * 22, -13, 13);
        tilt.style.transform = `rotate(${(dir === 1 ? lean : -lean).toFixed(1)}deg)`;
      }
      render();
      raf = mode === 'walk' ? requestAnimationFrame(frame) : 0;
    }
    function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    function aim(ex, ey) {
      px = ex; py = ey;
      const b = bounds();
      tx = clamp(ex, b.minX, b.maxX);
      ty = clamp(ey, b.minY, b.maxY);
      const dist = Math.hypot(tx - x, ty - y);
      if (mode === 'sleep') {
        // Any movement wakes her: she sits up, or gets going if you are far away.
        setMode(dist > GO ? 'walk' : 'sit');
      } else if (mode === 'sit') {
        if (dist > GO) setMode('walk');
        else { drowsy = false; watch(); armIdle(); }
      }
      if (mode === 'walk') wake();
    }

    if (reduceMotion) {
      // Static: she sits in the corner and does not chase anything.
      x = vw - 110; y = vh - 24;
      showFrame(SIT_ALERT);
      render();
      return;
    }

    addEventListener('pointermove', e => aim(e.clientX, e.clientY), { passive: true });
    addEventListener('pointerdown', e => { if (e.pointerType === 'touch') aim(e.clientX, e.clientY); }, { passive: true });
    addEventListener('resize', () => {
      vw = innerWidth; vh = innerHeight;
      const b = bounds();
      x = clamp(x, b.minX, b.maxX); y = clamp(y, b.minY, b.maxY);
      tx = clamp(tx, b.minX, b.maxX); ty = clamp(ty, b.minY, b.maxY);
      render();
    });

    // She trots in from the left edge and sits down near the bottom-left corner.
    mode = 'walk';
    cat.dataset.mode = 'walk';
    y = ty = clamp(vh - 70, bounds().minY, bounds().maxY);
    tx = 190;
    showFrame(WALK[0]);
    render();
    wake();
  }
})();
