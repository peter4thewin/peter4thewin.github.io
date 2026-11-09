/* Loaded in <head> on every page. Keeps the slow background drift continuous
   across page loads: the animation phase comes from a clock stored for this tab,
   so each new page picks up exactly where the last one was. */
(function () {
  var CYCLE = 64; // seconds: 32 out + 32 back, must match bg-breathe in site.css
  var now = Date.now(), start = now;
  try {
    var saved = sessionStorage.getItem('bgStart');
    if (saved) start = +saved; else sessionStorage.setItem('bgStart', String(now));
  } catch (e) {}
  var t = ((now - start) / 1000) % CYCLE;
  document.documentElement.style.setProperty('--bg-delay', (-t).toFixed(3) + 's');
})();
