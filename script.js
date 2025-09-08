// Configura tus slides aquí
const slides = [
  { img: "assets/img1.jpg", audio: "assets/song1.mp3", caption: "¡Feliz cumple! 🎂" },
  { img: "assets/img2.jpg", audio: "assets/song2.mp3", caption: "Que tu día esté lleno de sonrisas 😄" },
  { img: "assets/img3.jpg", audio: "assets/song3.mp3", caption: "¡Y muchas sorpresas! 🎉" },
];

const layerA = document.getElementById("layerA");
const layerB = document.getElementById("layerB");
const caption = document.getElementById("caption");
const dotsEl = document.getElementById("dots");
const audioEl = document.getElementById("player");
const playHint = document.getElementById("playHint");

let current = 0;
let topIsA = true;          // cuál capa está visible (para el crossfade)
let audioEnabled = false;   // hasta que el usuario interactúe
let touchStartX = null;

// Crear dots
slides.forEach((_, i) => {
  const b = document.createElement("button");
  b.setAttribute("aria-label", `Ir al slide ${i+1}`);
  b.addEventListener("click", () => goTo(i));
  dotsEl.appendChild(b);
});

function setDots(idx) {
  [...dotsEl.children].forEach((b, i) => b.classList.toggle("active", i === idx));
}

function preloadImages() {
  slides.forEach(s => { const im = new Image(); im.src = s.img; });
}
preloadImages();

function setInitial() {
  layerA.src = slides[0].img;
  layerA.classList.add("visible");
  caption.textContent = slides[0].caption;
  setDots(0);
}
setInitial();

// Crossfade entre capas
function swapTo(nextIdx) {
  const nextImg = slides[nextIdx].img;
  const nextCaption = slides[nextIdx].caption;

  const top = topIsA ? layerA : layerB;
  const bottom = topIsA ? layerB : layerA;

  bottom.src = nextImg;
  // Forzamos reflow para que transition funcione si cambiamos muy rápido
  void bottom.offsetWidth;

  bottom.classList.add("visible");
  top.classList.remove("visible");

  caption.textContent = nextCaption;
  topIsA = !topIsA;
}

async function fadeAudioTo(targetVolume = 1, durationMs = 500) {
  const steps = 20;
  const stepTime = durationMs / steps;
  const start = audioEl.volume;
  const delta = targetVolume - start;

  for (let i = 1; i <= steps; i++) {
    audioEl.volume = Math.min(1, Math.max(0, start + (delta * i) / steps));
    await new Promise(r => setTimeout(r, stepTime));
  }
}

async function playSlideAudio(idx) {
  if (!audioEnabled) return;
  const src = slides[idx].audio;
  try {
    // fade out, cambiar src, play, fade in
    await fadeAudioTo(0, 250);
    audioEl.src = src;
    await audioEl.play();
    await fadeAudioTo(1, 400);
  } catch (e) {
    // Si falla (por políticas), mostramos el botón
    playHint.classList.remove("hidden");
  }
}

function goTo(idx) {
  if (idx === current) return;
  current = (idx + slides.length) % slides.length;
  setDots(current);
  swapTo(current);
  playSlideAudio(current);
}

function next() { goTo(current + 1); }
function prev() { goTo(current - 1); }

// Botones
document.getElementById("nextBtn").addEventListener("click", next);
document.getElementById("prevBtn").addEventListener("click", prev);

// Teclado
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});

// Primer clic habilita audio (autoplay policy)
function enableAudioOnce() {
  audioEnabled = true;
  playHint.classList.add("hidden");
  // arrancar audio del slide actual
  audioEl.src = slides[current].audio;
  audioEl.volume = 0;
  audioEl.play().then(() => fadeAudioTo(1, 500)).catch(() => {
    playHint.classList.remove("hidden");
  });
  // remover para que no se dispare de nuevo
  window.removeEventListener("click", enableAudioOnce);
  window.removeEventListener("keydown", enableAudioOnce);
  window.removeEventListener("touchstart", enableAudioOnce);
}
window.addEventListener("click", enableAudioOnce, { once: true });
window.addEventListener("keydown", enableAudioOnce, { once: true });
window.addEventListener("touchstart", enableAudioOnce, { once: true });

// Swipe táctil
const stage = document.getElementById("stage");
stage.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

stage.addEventListener("touchend", (e) => {
  if (touchStartX == null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
  touchStartX = null;
}, { passive: true });
