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

  /* -------------------- Recorrido de cámara mientras se ve la intro --------------------
     En vez de solo dejar el tablero girando a la distancia por defecto, la cámara va
     "visitando" distintos puntos de interés (fichas, ciudades, la fuente, los dados,
     cartas de sorpresa/arca) acercándose y alejándose suavemente. El giro automático
     del tablero (autoRotate, controlado por script.js) sigue activo todo el tiempo,
     así que el recorrido se siente como un dolly/zoom encima de la rotación normal. */
  let cinematicTimer = null;
  let cinematicStep = 0;

  function buildCinematicStops(){
    const scene = window.MonopolyScene;
    if(!scene) return [];
    const t = idx => scene.tilePos(idx);
    const die = scene.diePos();
    const fountain = scene.fountainPos();
    return [
      {dist: 9.5, phi: 0.82, x: 0,             z: 0,             hold: 3400}, // vista general elevada
      {dist: 3.3, phi: 1.05, x: t(0).x,        z: t(0).z,        hold: 2600}, // fichas en la Salida
      {dist: 4.4, phi: 1.08, x: t(4).x,        z: t(4).z,        hold: 2600}, // ciudades (avenidas)
      {dist: 3.6, phi: 1.05, x: t(7).x,        z: t(7).z,        hold: 2400}, // carta SORPRESA
      {dist: 3.0, phi: 0.95, x: fountain.x,    z: fountain.z,    hold: 2600}, // la fuente central
      {dist: 2.5, phi: 0.80, x: die.x,         z: die.z,         hold: 2400}, // los dados
      {dist: 4.4, phi: 1.08, x: t(24).x,       z: t(24).z,       hold: 2600}, // ciudades (otro lado)
      {dist: 3.6, phi: 1.05, x: t(22).x,       z: t(22).z,       hold: 2400}, // carta ARCA COMUNAL
      {dist: 4.4, phi: 1.08, x: t(34).x,       z: t(34).z,       hold: 2600}, // ciudades (cierre)
    ];
  }

  function runCinematic(){
    if(!introActive) return;
    const scene = window.MonopolyScene;
    if(!scene){
      // script.js todavía no expuso su API: reintentar en breve sin romper nada
      cinematicTimer = setTimeout(runCinematic, 150);
      return;
    }
    const stops = buildCinematicStops();
    if(!stops.length){
      cinematicTimer = setTimeout(runCinematic, 150);
      return;
    }
    const stop = stops[cinematicStep % stops.length];
    scene.setView(stop.dist, stop.phi, stop.x, stop.z);
    cinematicStep++;
    cinematicTimer = setTimeout(runCinematic, stop.hold);
  }
  runCinematic();

  /* -------------------- Botón "Jugar" -------------------- */
  playBtn.addEventListener('click', function(){
    introActive = false;
    if(cinematicTimer) clearTimeout(cinematicTimer);
    if(window.MonopolyScene) window.MonopolyScene.resetView();
    introScreen.classList.add('intro-fade');
    if(topBar) topBar.classList.remove('ui-hidden');
    if(hud) hud.classList.remove('ui-hidden');
    // Blindaje: si por cualquier motivo (versión en caché de script.js, orden de
    // eventos, etc.) alguno de los elementos DENTRO del HUD se quedó con la clase
    // 'ui-hidden' pegada desde el toggle de pantalla completa, lo limpiamos acá
    // para que el panel nunca se vea como un cuadro vacío.
    ['turn-info', 'dice-result', 'roll-btn'].forEach(function(id){
      const el = document.getElementById(id);
      if(el) el.classList.remove('ui-hidden');
    });
    setTimeout(()=> introScreen.remove(), 650);
  });

})();
