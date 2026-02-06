/**
 * Adds zoom (+/-), reset, and pan controls to every Mermaid diagram.
 * Registered as a Docusaurus clientModule.
 */

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.3;

function enhanceDiagram(container) {
  if (container.dataset.zoomEnabled) return;
  container.dataset.zoomEnabled = 'true';

  // State
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // Wrapper setup
  const wrapper = document.createElement('div');
  wrapper.style.cssText =
    'position:relative;overflow:hidden;border-radius:12px;';

  // Viewport that clips the SVG
  const viewport = document.createElement('div');
  viewport.style.cssText =
    'overflow:hidden;cursor:grab;touch-action:none;min-height:200px;';

  // Move existing children into viewport
  while (container.firstChild) {
    viewport.appendChild(container.firstChild);
  }

  // Controls bar
  const controls = document.createElement('div');
  controls.style.cssText =
    'position:absolute;top:8px;right:8px;display:flex;gap:4px;z-index:10;';

  function createBtn(label, title) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.title = title;
    btn.style.cssText =
      'width:32px;height:32px;border:1px solid rgba(56,189,248,0.3);' +
      'background:rgba(11,17,33,0.85);color:#e2e8f0;border-radius:6px;' +
      'cursor:pointer;font-size:16px;display:flex;align-items:center;' +
      'justify-content:center;backdrop-filter:blur(8px);transition:background 0.15s;' +
      'padding:0;line-height:1;';
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(56,189,248,0.2)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(11,17,33,0.85)';
    });
    return btn;
  }

  const zoomIn = createBtn('+', 'Zoom in');
  const zoomOut = createBtn('\u2212', 'Zoom out');
  const reset = createBtn('\u21BA', 'Reset view');

  controls.appendChild(zoomIn);
  controls.appendChild(zoomOut);
  controls.appendChild(reset);

  function applyTransform() {
    const svg = viewport.querySelector('svg');
    if (!svg) return;
    svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    svg.style.transformOrigin = '0 0';
    svg.style.transition = isPanning ? 'none' : 'transform 0.2s ease';
  }

  zoomIn.addEventListener('click', (e) => {
    e.stopPropagation();
    scale = Math.min(MAX_SCALE, scale + ZOOM_STEP);
    applyTransform();
  });

  zoomOut.addEventListener('click', (e) => {
    e.stopPropagation();
    scale = Math.max(MIN_SCALE, scale - ZOOM_STEP);
    applyTransform();
  });

  reset.addEventListener('click', (e) => {
    e.stopPropagation();
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  });

  // Mouse wheel zoom
  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
      applyTransform();
    },
    {passive: false},
  );

  // Pan with mouse drag
  viewport.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isPanning = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    viewport.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyTransform();
  });

  document.addEventListener('mouseup', () => {
    if (!isPanning) return;
    isPanning = false;
    viewport.style.cursor = 'grab';
  });

  // Touch pan
  viewport.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        isPanning = true;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
      }
    },
    {passive: true},
  );

  viewport.addEventListener(
    'touchmove',
    (e) => {
      if (!isPanning || e.touches.length !== 1) return;
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      applyTransform();
    },
    {passive: true},
  );

  viewport.addEventListener('touchend', () => {
    isPanning = false;
  });

  wrapper.appendChild(viewport);
  wrapper.appendChild(controls);
  container.appendChild(wrapper);
}

function init() {
  // Enhance existing diagrams
  document.querySelectorAll('.docusaurus-mermaid-container').forEach(enhanceDiagram);

  // Watch for new diagrams (client-side navigation)
  const observer = new MutationObserver(() => {
    document
      .querySelectorAll('.docusaurus-mermaid-container')
      .forEach(enhanceDiagram);
  });
  observer.observe(document.body, {childList: true, subtree: true});
}

// Run on page load and route changes
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export function onRouteDidUpdate() {
  setTimeout(() => {
    document
      .querySelectorAll('.docusaurus-mermaid-container')
      .forEach(enhanceDiagram);
  }, 500);
}
