/* ============================================================
EXPO.JS — Pantalla de inicio con tour cinematográfico
Muestra título + botón Jugar. Mientras tanto, la cámara hace un
recorrido suave mostrando fichas, casitas, fuente, dados y cartas.
============================================================ */
(function(){
const style = document.createElement('style');
style.textContent = `#intro-screen{ position:fixed; inset:0; z-index:60; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:24px; background: radial-gradient(ellipse at center, rgba(20,14,10,0.25), rgba(20,14,10,0.55) 70%); transition:opacity 0.6s ease; pointer-events:none; } #intro-screen.intro-fade{ opacity:0; } #intro-inner{ pointer-events:auto; } #intro-badge{ font-family:'Fredoka', sans-serif; font-size:13px; letter-spacing:2px; text-transform:uppercase; color:var(--accent-yellow, #f4c430); background:var(--panel-bg, rgba(20,14,10,0.72)); border:1px solid var(--panel-border, #caa15a); padding:6px 16px; border-radius:20px; margin-bottom:22px; opacity:0.95; } #intro-title{ font-family:'Baloo 2', sans-serif; font-weight:800; color:var(--accent-cream, #f2ecd8); font-size:clamp(28px, 5vw, 58px); line-height:1.15; max-width:900px; margin:0 0 34px 0; text-shadow:0 8px 24px rgba(0,0,0,0.55); -webkit-text-stroke:2px var(--accent-red, #d3232a); paint-order: stroke fill; } #play-btn{ font-family:'Fredoka', sans-serif; font-weight:600; font-size:19px; color:var(--ink, #241a12); background:var(--accent-yellow, #f4c430); border:2px solid var(--panel-border, #caa15a); border-radius:30px; padding:14px 46px; cursor:pointer; box-shadow:0 8px 18px rgba(0,0,0,0.45); transition:transform 0.12s ease, box-shadow 0.12s ease; } #play-btn:hover{ transform:translateY(-2px); box-shadow:0 10px 22px rgba(0,0,0,0.5); } #play-btn:active{ transform:translateY(1px); }
`;
document.head.appendChild(style);

const introScreen = document.createElement('div');
introScreen.id = 'intro-screen';
introScreen.innerHTML = `
  <div id="intro-inner">
    <div id="intro-badge">SENATI · Física y Química</div>
    <h1 id="intro-title">Negociación Eficaz y Solución de Conflictos</h1>
    <button id="play-btn" type="button">▶ Jugar</button>
  </div>
`;
document.body.appendChild(introScreen);
const playBtn = introScreen.querySelector('#play-btn');

const topBar = document.getElementById('top-bar');
const hud = document.getElementById('hud');
if(topBar) topBar.classList.add('ui-hidden');
if(hud) hud.classList.add('ui-hidden');

let introActive = true;
window.addEventListener('keydown', function(e){
  if(introActive && (e.code === 'Space' || e.key === ' ')){
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

/* ---------- Secuencia cinematográfica ----------
   Cada keyframe: { t (ms), theta, phi, dist, tx, ty, tz }
   theta = ángulo horizontal, phi = ángulo vertical, dist = distancia
   (tx,ty,tz) = punto al que mira la cámara
------------------------------------------------ */
function buildTour(){
  // Posiciones conocidas del tablero (script.js):
  //   dados en (0, 0.42, 0)
  //   cartas SORPRESA en (-1.4, 0, -1.0) y ARCA en (1.4, 0, 1.0)
  //   fuente en (0, 0, -3.3)
  //   fichas iniciales en tile 0 (SALIDA): aprox (HALF, 0.1, HALF)
  const HALF = 7.36; // SIDE/2 aproximado del tablero
  const kf = (t, theta, phi, dist, tx, ty, tz) => ({t, theta, phi, dist, tx, ty, tz});

  return [
    // 0) Vista general lejana (punto de partida)
    kf(0,    Math.PI*0.28, 0.95, 18.0,  0, 0, 0),
    // 1) Acercamiento suave al tablero
    kf(2500, Math.PI*0.35, 0.90, 14.0,  0, 0, 0),
    // 2) Zoom a las fichas en SALIDA (esquina +x,+z)
    kf(5500, Math.PI*0.25, 0.85, 6.5,   HALF*0.9, 0.2, HALF*0.9),
    // 3) Paneo a lo largo del borde mostrando las casitas/ciudades
    kf(8500, Math.PI*0.75, 0.95, 9.5,   0, 0.3, HALF*1.15),
    // 4) Bajada a la fuente central
    kf(11500, Math.PI*1.05, 0.75, 5.2,  0, 0.2, -3.3),
    // 5) Subida hacia los dados en el centro
    kf(14000, Math.PI*1.35, 0.70, 4.2,  0, 0.4, 0),
    // 6) Movimiento a las cartas (SORPRESA / ARCA)
    kf(16500, Math.PI*1.70, 0.80, 5.5,  -1.4, 0.2, -1.0),
    // 7) Regreso a vista general
    kf(19500, Math.PI*2.10, 0.95, 15.5,  0, 0, 0),
    // 8) Pequeña pausa final mirando el tablero completo
    kf(22500, Math.PI*2.25, 0.95, 15.5,  0, 0, 0),
  ];
}

function loopTour(){
  if(!introActive) return;
  if(!window.CamTour){
    // si script.js todavía no expuso la API, reintentar más tarde
    setTimeout(loopTour, 200);
    return;
  }
  const seq = buildTour();
  window.CamTour.play(seq, ()=>{
    // al terminar un ciclo, volver a empezar (bucle infinito hasta Jugar)
    if(introActive) loopTour();
  });
}

// Arrancar el tour cuando la escena esté lista
function startWhenReady(){
  if(document.readyState === 'complete'){
    setTimeout(loopTour, 400);
  } else {
    window.addEventListener('load', ()=> setTimeout(loopTour, 400));
  }
}
startWhenReady();

/* ---------- Botón Jugar ---------- */
playBtn.addEventListener('click', function(){
  introActive = false;
  if(window.CamTour) window.CamTour.stop();
  introScreen.classList.add('intro-fade');
  if(topBar) topBar.classList.remove('ui-hidden');
  if(hud) hud.classList.remove('ui-hidden');
  setTimeout(()=> introScreen.remove(), 650);
});
})();
