// Applies the saved theme (or the system's) before the first paint.
(function () {
  try {
    var saved = localStorage.getItem('portal-tema');
    var dark = saved ? saved === 'oscuro' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {
    /* private mode: light theme */
  }
})();
