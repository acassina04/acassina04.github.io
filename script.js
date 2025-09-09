// Elementos base
const sections = [...document.querySelectorAll('section.panel')];
const player   = document.getElementById('player');
const playBtn  = document.getElementById('playBtn');
const muteBtn  = document.getElementById('muteBtn');

// Estado
let audioReady = false;
let currentSrc = null;

// ---- Audio helpers ----
async function fadeVolume(target = 1, ms = 400) {
  const steps = 16, dt = ms/steps, start = player.volume ?? 1;
  const delta = target - start;
  for (let i = 1; i <= steps; i++) {
    player.volume = Math.min(1, Math.max(0, start + (delta * i) / steps));
    await new Promise(r => setTimeout(r, dt));
  }
}

async function switchTrack(src, instant = false) {
  if (!audioReady || !src || src === currentSrc) return;
  currentSrc = src;
  try {
    if (!instant) await fadeVolume(0, 250);
    player.src = src;
    await player.play();
    playBtn.textContent = '⏸︎';
    if (!instant) await fadeVolume(1, 350);
  } catch (_) {
    // navegadores pueden bloquear play hasta interacción; ignoramos
  }
}

// ---- Activar audio en primera interacción ----
function enableAudioOnce() {
  if (audioReady) return;
  audioReady = true;
  const first = getMostVisibleSection();
  if (first) switchTrack(first.dataset.audio, true);
}
['click','keydown','touchstart'].forEach(ev =>
  window.addEventListener(ev, enableAudioOnce, { once:true })
);

// ---- Botones ----
playBtn.addEventListener('click', async () => {
  if (!audioReady) enableAudioOnce();
  if (player.paused) {
    await player.play().catch(()=>{});
    playBtn.textContent = '⏸︎';
  } else {
    player.pause();
    playBtn.textContent = '▶︎';
  }
});
muteBtn.addEventListener('click', () => {
  player.muted = !player.muted;
  muteBtn.textContent = player.muted ? '🔈' : '🔊';
});

// ---- IntersectionObserver: decidir sección activa + música ----
let visibleMap = new Map(); // section -> ratio

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => visibleMap.set(e.target, e.intersectionRatio));

  const top = getMostVisibleSection();
  if (!top) return;

  // 1) Marcar activa/inactivas
  setActiveSection(top);

  // 2) Cambiar pista a la de la sección top
  switchTrack(top.dataset.audio);
}, { threshold: buildThresholds() });

sections.forEach(s => io.observe(s));

// Estado inicial tras el primer tick (por si abren a mitad de página)
setTimeout(() => {
  const top0 = getMostVisibleSection() || sections[0];
  setActiveSection(top0);
  if (audioReady) switchTrack(top0.dataset.audio, true);
}, 0);

// Helpers IO
function buildThresholds() {
  const t = [];
  for (let i = 0; i <= 1; i += 0.05) t.push(i);
  return t;
}

function getMostVisibleSection() {
  let best = null, bestRatio = 0;
  for (const s of sections) {
    const r = visibleMap.get(s) ?? 0;
    if (r > bestRatio) { best = s; bestRatio = r; }
  }
  // fallback
  if (!best) best = sections.find(s => isInView(s)) || sections[0];
  return best;
}

function isInView(el) {
  const r = el.getBoundingClientRect();
  const h = window.innerHeight || document.documentElement.clientHeight;
  const visible = Math.max(0, Math.min(r.bottom, h) - Math.max(r.top, 0));
  return visible > h * 0.4;
}

function setActiveSection(active) {
  sections.forEach(s => {
    if (s === active) {
      s.classList.add('active');
      s.classList.remove('inactive');
    } else {
      s.classList.add('inactive');
      s.classList.remove('active');
    }
  });
}

// ---- Enlaces “Siguiente”: asegurar scroll + pista de destino ----
document.querySelectorAll('a.next').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Cambio de pista optimista (por si el observer tarda)
    const src = target.dataset.audio;
    if (src) switchTrack(src);
  });
});
