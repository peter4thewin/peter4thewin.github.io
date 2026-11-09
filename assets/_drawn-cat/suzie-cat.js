/* Suzie page only: a little black cat that follows the cursor around the window.

   She walks (or runs, if the cursor is far away) toward the pointer and sits down
   a short distance from it. If it stays still she eventually curls up and sleeps.
   Move the mouse and she wakes up. On touch screens she walks to wherever you tap.
   With "reduce motion" turned on she just sits in the corner. */
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Artwork (three poses, all drawn here) ---------- */
  const WALK = `
  <svg class="pose pose-walk" viewBox="0 0 160 110" aria-hidden="true">
    <path class="fur-line tail" d="M34 60 C14 60 8 40 16 22" stroke-width="8"/>
    <g class="leg leg-a far"><path d="M52 66h12l-3 34h-7z"/><ellipse cx="57.500" cy="101" rx="7" ry="3.2"/></g>
    <g class="leg leg-b far"><path d="M96 66h12l-3 34h-7z"/><ellipse cx="101.500" cy="101" rx="7" ry="3.2"/></g>
    <g class="torso">
      <path d="M30 64C28 46 50 40 76 42C100 42 114 50 114 64C114 78 98 84 72 84C46 84 32 80 30 64Z"/>
      <path d="M114 36L117 14L129 30ZM128 30L141 16L143 36Z"/>
      <path class="inner-ear" d="M118 30L119 20L125 29Z"/>
      <circle cx="128" cy="46" r="17"/>
      <ellipse cx="141" cy="52" rx="7" ry="5.500"/>
      <g class="eyes">
        <g transform="translate(127 44)"><ellipse class="eye-glow" rx="3.300" ry="4.200"/><ellipse class="slit" rx=".9" ry="3.800"/></g>
        <g transform="translate(138 44)"><ellipse class="eye-glow" rx="3.300" ry="4.200"/><ellipse class="slit" rx=".9" ry="3.800"/></g>
      </g>
      <circle class="nose" cx="147" cy="50.500" r="1.700"/>
      <path class="whisker" d="M143 54L158 50M143 56L158 58"/>
    </g>
    <g class="leg leg-b"><path d="M34 66h13l-3 34h-8z"/><ellipse cx="40.500" cy="101" rx="7.500" ry="3.400"/></g>
    <g class="leg leg-a"><path d="M106 66h13l-3 34h-8z"/><ellipse cx="112.500" cy="101" rx="7.500" ry="3.400"/></g>
  </svg>`;

  const EYE = (cx) => `
    <g transform="translate(${cx} 40)"><g class="eye">
      <ellipse class="eye-glow" rx="5.600" ry="6.600"/><ellipse class="slit" rx="1.500" ry="5.800"/>
      <circle cx="-1.900" cy="-2.500" r="1.200" fill="#fff" opacity=".85"/>
    </g></g>`;

  const SIT = `
  <svg class="pose pose-sit" viewBox="0 0 160 110" aria-hidden="true">
    <path class="fur-line tail" d="M104 100C140 104 150 78 138 56" stroke-width="9"/>
    <path d="M80 40C54 42 44 72 47 98C49 107 111 107 113 98C116 72 106 42 80 40Z"/>
    <ellipse cx="55" cy="92" rx="17" ry="16"/><ellipse cx="105" cy="92" rx="17" ry="16"/>
    <rect x="65" y="64" width="12" height="40" rx="6"/><rect x="83" y="64" width="12" height="40" rx="6"/>
    <ellipse cx="71" cy="103" rx="8" ry="4"/><ellipse cx="89" cy="103" rx="8" ry="4"/>
    <path class="far" d="M80 72V100" stroke="#1b2136" stroke-width="1.400"/>
    <g class="head">
      <path d="M58 30L55 6L77 21ZM102 30L105 6L83 21Z"/>
      <path class="inner-ear" d="M60 25L59 12L71 21ZM100 25L101 12L89 21Z"/>
      <ellipse cx="80" cy="40" rx="25" ry="21"/>
      <g class="eyes">${EYE(69)}${EYE(91)}</g>
      <path class="nose" d="M77.500 49h5L80 52.500Z"/>
      <path class="whisker" d="M80 52.500q-3 3-6 1M80 52.500q3 3 6 1M63 50L44 46M63 53L44 55M97 50L116 46M97 53L116 55"/>
    </g>
  </svg>`;

  const SLEEP = `
  <svg class="pose pose-sleep" viewBox="0 0 160 110" aria-hidden="true">
    <path class="loaf" d="M26 100C20 80 44 64 78 64C108 64 128 76 128 94C128 104 36 106 26 100Z"/>
    <path class="fur-line" d="M30 101C56 110 96 110 120 103" stroke-width="8"/>
    <path d="M111 82L112 66L124 77ZM121 77L134 68L135 86Z"/>
    <circle cx="122" cy="90" r="14"/>
    <ellipse cx="134" cy="95" rx="6" ry="4.500"/>
    <path class="closed" d="M117 90q3.500 3.500 7 0M127 90q3.500 3.500 7 0"/>
    <text class="z z1" x="134" y="70">z</text>
    <text class="z z2" x="134" y="70">z</text>
    <text class="z z3" x="134" y="70">z</text>
  </svg>`;

  const cat = document.createElement('div');
  cat.className = 'suzie-cat';
  cat.setAttribute('aria-hidden', 'true');
  cat.dataset.mode = 'sit';
  cat.dataset.gait = 'walk';
  cat.innerHTML = `<div class="cat-flip"><div class="cat-tilt">${WALK}${SIT}${SLEEP}</div></div>`;
  document.body.appendChild(cat);
  const flip = cat.querySelector('.cat-flip');
  const tilt = cat.querySelector('.cat-tilt');

  /* ---------- Behaviour ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const scale = () => parseFloat(getComputedStyle(cat).getPropertyValue('--s')) || 1;
  const STOP = 78;             // she sits down this far from the cursor...
  const GO = 108;              // ...and gets up again when it is farther than this
  const SLEEP_AFTER = 9000;    // ms of stillness before she curls up
  const RUN_ABOVE = 270;       // px/s
  const WALK_BELOW = 210;

  let vw = innerWidth, vh = innerHeight;
  const bounds = () => { const s = scale(); return { minX: 40 * s, maxX: vw - 40 * s, minY: 110 * s, maxY: vh - 8 }; };

  let mode = 'sit';
  let facing = 1;
  let gait = 'walk';
  let x = -90, y = vh - 70;      // feet position
  let tx = 150, ty = vh - 70;    // where she is heading
  let raf = 0, last = 0, sleepTimer = 0;

  function setMode(next) {
    if (mode === next) return;
    mode = next;
    cat.dataset.mode = next;
    clearTimeout(sleepTimer);
    if (next === 'sit') sleepTimer = setTimeout(() => setMode('sleep'), SLEEP_AFTER);
    if (next !== 'walk') tilt.style.transform = '';
    render();
  }

  function render() {
    cat.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(var(--s))`;
    flip.style.transform = `scaleX(${mode === 'sit' ? 1 : facing})`;
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    const dx = tx - x, dy = ty - y, dist = Math.hypot(dx, dy);

    if (mode === 'walk' && dist <= STOP) setMode('sit');

    if (mode === 'walk') {
      const speed = clamp((dist - STOP) * 3.2 + 70, 70, 470);
      const step = Math.min(speed * dt, dist - STOP + 2);
      x += (dx / dist) * step;
      y += (dy / dist) * step;
      if (Math.abs(dx) > 12) facing = dx > 0 ? 1 : -1;

      const nextGait = gait === 'walk' ? (speed > RUN_ABOVE ? 'run' : 'walk') : (speed < WALK_BELOW ? 'walk' : 'run');
      if (nextGait !== gait) { gait = nextGait; cat.dataset.gait = gait; }

      // Lean a little toward vertical movement (mirrored when she faces left).
      const lean = clamp(Math.atan2(dy, Math.max(Math.abs(dx), 40)) * 22, -13, 13);
      tilt.style.transform = `rotate(${(facing === 1 ? lean : -lean).toFixed(1)}deg)`;
    }
    render();
    raf = mode === 'walk' ? requestAnimationFrame(frame) : 0;
  }
  function wake() {
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  function aim(px, py) {
    const b = bounds();
    tx = clamp(px, b.minX, b.maxX);
    ty = clamp(py, b.minY, b.maxY);
    const dist = Math.hypot(tx - x, ty - y);
    if (mode === 'sleep') {
      // Any movement wakes her: she sits up, or gets going if you are far away.
      setMode(dist > GO ? 'walk' : 'sit');
    } else if (mode === 'sit') {
      if (dist > GO) setMode('walk');
      else { clearTimeout(sleepTimer); sleepTimer = setTimeout(() => setMode('sleep'), SLEEP_AFTER); }
    }
    if (mode === 'walk') wake();
  }

  // Her pupils follow the cursor while she sits.
  function look(px, py) {
    const s = scale();
    const hx = px - x, hy = py - (y - 66 * s);
    cat.style.setProperty('--lx', (clamp(hx / 70, -1, 1) * 2.6).toFixed(2) + 'px');
    cat.style.setProperty('--ly', (clamp(hy / 70, -1, 1) * 2.2).toFixed(2) + 'px');
  }

  if (reduceMotion) {
    // Static: she sits in the corner and does not chase anything.
    x = vw - 110; y = vh - 24;
    render();
    return;
  }

  addEventListener('pointermove', e => { look(e.clientX, e.clientY); aim(e.clientX, e.clientY); }, { passive: true });
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { look(e.clientX, e.clientY); aim(e.clientX, e.clientY); } }, { passive: true });
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
  tx = 40 + 150;
  render();
  wake();
})();
