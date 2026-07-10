/* ============================================================
   EXPO.JS — Pantalla de inicio / presentación
   Muestra un título por encima del tablero (que ya gira solo
   de fondo) y un botón "Jugar" que revela el HUD normal del
   juego. No modifica la lógica del Monopoly: solo oculta/menciona
   elementos existentes y añade una capa visual encima.
   ============================================================ */
(function(){

  /* -------------------- Estilos de la intro -------------------- */
  const style = document.createElement('style');
  style.textContent = `
    #intro-screen{
      position:fixed; inset:0; z-index:60;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      text-align:center;
      padding:24px;
      background:
        radial-gradient(ellipse at center, rgba(20,14,10,0.35), rgba(20,14,10,0.72) 70%);
      transition:opacity 0.6s ease;
    }
    #intro-screen.intro-fade{
      opacity:0;
      pointer-events:none;
    }
    #intro-badge{
      font-family:'Fredoka', sans-serif;
      font-size:13px;
      letter-spacing:2px;
      text-transform:uppercase;
      color:var(--accent-yellow, #f4c430);
      background:var(--panel-bg, rgba(20,14,10,0.72));
      border:1px solid var(--panel-border, #caa15a);
      padding:6px 16px;
      border-radius:20px;
      margin-bottom:22px;
      opacity:0.9;
    }
    #intro-title{
      font-family:'Baloo 2', sans-serif;
      font-weight:800;
      color:var(--accent-cream, #f2ecd8);
      font-size:clamp(28px, 5vw, 58px);
      line-height:1.15;
      max-width:900px;
      margin:0 0 34px 0;
      text-shadow:0 8px 24px rgba(0,0,0,0.55);
      -webkit-text-stroke:2px var(--accent-red, #d3232a);
      paint-order: stroke fill;
    }
    #play-btn{
      font-family:'Fredoka', sans-serif;
      font-weight:600;
      font-size:19px;
      color:var(--ink, #241a12);
      background:var(--accent-yellow, #f4c430);
      border:2px solid var(--panel-border, #caa15a);
      border-radius:30px;
      padding:14px 46px;
      cursor:pointer;
      box-shadow:0 8px 18px rgba(0,0,0,0.45);
      transition:transform 0.12s ease, box-shadow 0.12s ease;
    }
    #play-btn:hover{
      transform:translateY(-2px);
      box-shadow:0 10px 22px rgba(0,0,0,0.5);
    }
    #play-btn:active{
      transform:translateY(1px);
    }
  `;
  document.head.appendChild(style);

  /* -------------------- Marcado de la intro -------------------- */
  const introScreen = document.createElement('div');
  introScreen.id = 'intro-screen';
  introScreen.innerHTML = `
    <div id="intro-badge">SENATI · Física y Química</div>
    <h1 id="intro-title">Negociación Eficaz y Solución de Conflictos</h1>
    <button id="play-btn" type="button">▶ Jugar</button>
  `;
  document.body.appendChild(introScreen);

  const playBtn = introScreen.querySelector('#play-btn');

  /* -------------------- Ocultar el HUD del juego hasta jugar -------------------- */
  const topBar = document.getElementById('top-bar');
  const hud = document.getElementById('hud');
  if(topBar) topBar.classList.add('ui-hidden');
  if(hud) hud.classList.add('ui-hidden');

  /* -------------------- Bloquear el dado (barra espaciadora) mientras se ve la intro -------------------- */
  let introActive = true;
  window.addEventListener('keydown', function(e){
    if(introActive && (e.code === 'Space' || e.key === ' ')){
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true); // fase de captura: se ejecuta antes que el listener de script.js

  /* -------------------- Botón "Jugar" -------------------- */
  playBtn.addEventListener('click', function(){
    introActive = false;
    introScreen.classList.add('intro-fade');
    if(topBar) topBar.classList.remove('ui-hidden');
    if(hud) hud.classList.remove('ui-hidden');
    setTimeout(()=> introScreen.remove(), 650);
  });

})();
