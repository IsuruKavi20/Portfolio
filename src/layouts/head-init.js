(function () {
  // Runs before the first paint (see Base.astro). Kept in its own file so
  // astro.config.mjs can fingerprint it for the Content Security Policy.
  var root = document.documentElement;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('motion');
  }
  try {
    // Skip the landing only when arriving from another page of the site.
    // A manual refresh shows it again.
    var nav = performance.getEntriesByType('navigation')[0];
    var isReload = nav && nav.type === 'reload';
    if (sessionStorage.getItem('entered') && !isReload) root.classList.add('entered');
    // Quality tier measured earlier in this session (see quality.js)
    var tier = sessionStorage.getItem('qualityTierV2');
    if (tier) root.dataset.tier = tier;
  } catch (e) {
    /* storage blocked: the landing screen simply shows again */
  }
})();
