/**
 * Adds zoom (+/-), reset, and pan controls to every Mermaid diagram.
 * Registered as a Docusaurus clientModule.
 */

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.25;

function enhanceDiagram(container) {
  if (container.dataset.zoomReady) return;
  container.dataset.zoomReady = 'true';

  const svg = container.querySelector('svg');
  if (!svg) return;

  // Make container the clipping boundary
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.cursor = 'grab';

  // State stored on the container element itself
  const state = {scale: 1, tx: 0, ty: 0, panning: false, sx: 0, sy: 0};

  function apply(animate) {
    svg.style.transformOrigin = '0 0';
    svg.style.transition = animate ? 'transform 0.2s ease' : 'none';
    svg.style.transform =
      'translate(' + state.tx + 'px,' + state.ty + 'px) scale(' + state.scale + ')';
  }

  // Build control buttons
  const bar = document.createElement('div');
  bar.style.cssText =
    'position:absolute;top:8px;right:8px;display:flex;gap:4px;z-index:10;';

  function makeBtn(text, tip) {
    const b = document.createElement('button');
    b.innerHTML = text;
    b.title = tip;
    b.style.cssText =
      'width:32px;height:32px;border:1px solid rgba(56,189,248,0.3);' +
      'background:rgba(11,17,33,0.9);color:#e2e8f0;border-radius:6px;' +
      'cursor:pointer;font-size:16px;display:flex;align-items:center;' +
      'justify-content:center;backdrop-filter:blur(8px);padding:0;' +
      'line-height:1;user-select:none;';
    b.onmouseenter = function () {
      b.style.background = 'rgba(56,189,248,0.25)';
    };
    b.onmouseleave = function () {
      b.style.background = 'rgba(11,17,33,0.9)';
    };
    return b;
  }

  const btnIn = makeBtn('+', 'Zoom in');
  const btnOut = makeBtn('&minus;', 'Zoom out');
  const btnReset = makeBtn('&#x21BA;', 'Reset view');

  btnIn.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    state.scale = Math.min(MAX_SCALE, state.scale + ZOOM_STEP);
    apply(true);
  };

  btnOut.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    state.scale = Math.max(MIN_SCALE, state.scale - ZOOM_STEP);
    apply(true);
  };

  btnReset.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    state.scale = 1;
    state.tx = 0;
    state.ty = 0;
    apply(true);
  };

  bar.appendChild(btnIn);
  bar.appendChild(btnOut);
  bar.appendChild(btnReset);
  container.appendChild(bar);

  // Wheel zoom
  container.addEventListener(
    'wheel',
    function (e) {
      e.preventDefault();
      var d = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      state.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, state.scale + d));
      apply(false);
    },
    {passive: false},
  );

  // Pan — mousedown on container (but not on buttons)
  container.addEventListener('mousedown', function (e) {
    if (e.target.tagName === 'BUTTON') return;
    state.panning = true;
    state.sx = e.clientX - state.tx;
    state.sy = e.clientY - state.ty;
    container.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', function (e) {
    if (!state.panning) return;
    state.tx = e.clientX - state.sx;
    state.ty = e.clientY - state.sy;
    apply(false);
  });

  window.addEventListener('mouseup', function () {
    if (!state.panning) return;
    state.panning = false;
    container.style.cursor = 'grab';
  });

  // Touch pan
  container.addEventListener(
    'touchstart',
    function (e) {
      if (e.touches.length !== 1) return;
      state.panning = true;
      state.sx = e.touches[0].clientX - state.tx;
      state.sy = e.touches[0].clientY - state.ty;
    },
    {passive: true},
  );

  container.addEventListener(
    'touchmove',
    function (e) {
      if (!state.panning || e.touches.length !== 1) return;
      state.tx = e.touches[0].clientX - state.sx;
      state.ty = e.touches[0].clientY - state.sy;
      apply(false);
    },
    {passive: true},
  );

  container.addEventListener('touchend', function () {
    state.panning = false;
  });
}

function run() {
  document
    .querySelectorAll('.docusaurus-mermaid-container')
    .forEach(enhanceDiagram);
}

if (typeof window !== 'undefined') {
  // Initial run after page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(run, 300);
    });
  } else {
    setTimeout(run, 300);
  }

  // Watch for dynamically added diagrams
  var obs = new MutationObserver(function () {
    run();
  });
  obs.observe(document.body, {childList: true, subtree: true});
}

export function onRouteDidUpdate() {
  setTimeout(run, 500);
}
