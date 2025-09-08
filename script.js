// --- Música / interacción inicial ---
const audioEl = document.getElementById('player');
const startBtn = document.getElementById('startBtn');
const muteBtn = document.getElementById('muteBtn');

let audioEnabled = false;

function enableAudio() {
  if (audioEnabled) return;
  audioEnabled = true;
  audioEl.volume = 0;
  audioEl.play().then(() => fadeVolume(1, 600)).catch(()=>{ /* si falla, ignorar */ });
}
startBtn.addEventListener('click', enableAudio);

muteBtn.addEventListener('click', () => {
  const isMuted = audioEl.muted = !audioEl.muted;
  muteBtn.setAttribute('aria-pressed', String(isMuted));
  muteBtn.textContent = isMuted ? '🔈' : '🔊';
});

async function fadeVolume(target = 1, ms = 400) {
  const steps = 16, dt = ms/steps, start = audioEl.volume, delta = target-start;
  for (let i=1;i<=steps;i++){ audioEl.volume = start + (delta*i)/steps; await wait(dt);}
}
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

// --- Aparición suave on-scroll ---
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
},{threshold:.2});
document.querySelectorAll('.observe').forEach(el=>obs.observe(el));

// --- Lightbox de galería ---
const imgs = [...document.querySelectorAll('.grid img')];
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('.lightbox-img');
const btnClose = lb.querySelector('.lightbox-close');
const btnPrev = lb.querySelector('.lightbox-prev');
const btnNext = lb.querySelector('.lightbox-next');

let idx = 0;
function openLB(i){
  idx = i;
  lb.classList.add('show');
  loadCurrent();
}
function closeLB(){ lb.classList.remove('show'); }
function loadCurrent(){
  lbImg.classList.remove('ready');
  const src = imgs[idx].dataset.large || imgs[idx].src;
  const temp = new Image();
  temp.onload = () => { lbImg.src = src; lbImg.classList.add('ready'); };
  temp.src = src;
}
function prev(){ idx = (idx - 1 + imgs.length) % imgs.length; loadCurrent(); }
function next(){ idx = (idx + 1) % imgs.length; loadCurrent(); }

imgs.forEach((im,i)=>im.addEventListener('click',()=>openLB(i)));
btnClose.addEventListener('click',closeLB);
btnPrev.addEventListener('click',prev);
btnNext.addEventListener('click',next);
document.addEventListener('keydown',e=>{
  if(lb.classList.contains('show')){
    if(e.key==='Escape') closeLB();
    if(e.key==='ArrowLeft') prev();
    if(e.key==='ArrowRight') next();
  }
});

// --- UX: si el usuario navega directo a galería/mensajes, permitir click anywhere para activar música ---
['click','keydown','touchstart'].forEach(ev=>{
  window.addEventListener(ev,()=>{ if(!audioEnabled) enableAudio(); }, { once:true });
});
