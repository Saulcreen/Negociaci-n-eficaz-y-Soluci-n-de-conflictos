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

  /* -------------------- Bloquear/gestionar la barra espaciadora según la pantalla activa --------------------
     Un solo listener en fase de captura (se ejecuta antes que el de script.js) decide qué
     hace SPACE según el estado actual:
       - durante la intro: la bloquea por completo (no se puede tirar el dado)
       - con la carta en pantalla: no tira el dado, avanza a la pantalla de color de esa carta
       - con la pantalla de color: no tira el dado, vuelve al juego y pasa a la siguiente carta
       - en juego normal: no hace nada aquí, deja pasar el evento para que
         script.js tire el dado como siempre */
  let introActive = true;
  window.addEventListener('keydown', function(e){
    if(!(e.code === 'Space' || e.key === ' ')) return;

    if(introActive){
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }

    if(flowState === 'card'){
      e.stopImmediatePropagation();
      e.preventDefault();
      showColorScreen();
      return;
    }

    if(flowState === 'screen'){
      e.stopImmediatePropagation();
      e.preventDefault();
      backToGame();
      return;
    }
    // flowState === 'game': no se intercepta, script.js maneja el SPACE normalmente
  }, true);

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
    if(window.MonopolyScene){
      window.MonopolyScene.resetView();
      // "Permite" mostrar el HUD, pero script.js decide la última palabra: si en
      // este momento hay pantalla completa activa, el panel se mantiene oculto.
      window.MonopolyScene.allowHud();
    } else if(hud){
      // Respaldo por si script.js no expuso su API (versión vieja en caché, etc.)
      hud.classList.remove('ui-hidden');
    }
    introScreen.classList.add('intro-fade');
    if(topBar) topBar.classList.remove('ui-hidden');
    setTimeout(()=> introScreen.remove(), 650);
  });

  /* ============================================================
     FLUJO POST-TIRADA: carta → pantalla de color → juego
     Todo vive aquí, sin tocar script.js. Como ese archivo no avisa
     cuándo una ficha "termina de caminar" a su casilla final, expo.js
     lo deduce solo: observa el texto de resultado del dado
     (#dice-result) y calcula cuánto tarda movePawn() en terminar,
     usando la misma temporización aproximada (~950ms antes de
     empezar a caminar + 400ms de espera de cámara + ~390ms por casilla).

     Estados (flowState):
       'game'   -> juego normal, SPACE tira el dado (lo maneja script.js)
       'card'   -> carta en medio de la pantalla, SPACE avanza
       'screen' -> pantalla completa del color de esa carta (boceto), SPACE vuelve al juego

     Mientras flowState !== 'game', los overlays cubren toda la pantalla
     con pointer-events:auto, así que también bloquean clics sobre el
     botón "Tirar dado" sin tener que tocar script.js.

     SISTEMA DE 6 CARTAS EN ORDEN — CARD_SEQUENCE
     Cada carta está ligada 1 a 1 con una pantalla de color (mismo índice
     en el arreglo = misma pareja). Van en orden fijo (no al azar): tras
     cada tirada sale la carta 1, luego la 2, ... hasta la 6, y vuelve a
     empezar en la 1. Cada carta tiene un nombre en el código (campo
     `name`) para identificarla fácilmente mientras se le agrega contenido
     real más adelante — por ahora todas están en blanco, solo cambia el
     color de acento de la carta y el color de la pantalla completa.
     ============================================================ */

  const CARD_SEQUENCE = [
    { name: 'carta_1_morado',    color: '#5b2a86' },
    { name: 'carta_2_verde',     color: '#2f7d3a' },
    { name: 'carta_3_rojo',      color: '#c62828' },
    { name: 'carta_4_amarillo',  color: '#d4a017' },
    { name: 'carta_5_naranja',   color: '#d9720f' },
    { name: 'carta_6_azul',      color: '#1266b5' },
  ];
  let cardSeqIndex = 0; // índice de la próxima carta a mostrar (avanza tras cada ciclo completo)

  let flowState = 'game';

  /* -------------------- Estilos: carta + pantalla de color -------------------- */
  const cardStyle = document.createElement('style');
  cardStyle.textContent = `
    #card-overlay{
      position:fixed; inset:0; z-index:70;
      display:flex; align-items:center; justify-content:center;
      background:rgba(20,14,10,0.55);
      opacity:0; pointer-events:none;
      transition:opacity 0.4s ease;
      perspective:1200px; /* profundidad real para el giro 3D de la carta */
    }
    #card-overlay.card-show{
      opacity:1; pointer-events:auto;
    }
    /* rectángulo vertical tipo naipe (proporción ~2:3), con "canto" simulado
       apilando varias sombras desplazadas para que se vea con grosor/3D
       y no como una tarjeta plana. El color de acento (--card-accent) lo
       fija showLandingCard() según la carta que le toque en el ciclo. */
    .landing-card{
      width:min(58vw, 240px);
      height:min(78vh, 360px);
      border-radius:14px;
      background:var(--accent-cream, #f2ecd8);
      border:3px solid var(--card-accent, var(--panel-border, #caa15a));
      box-shadow:
        1px 1px 0 var(--card-accent, var(--panel-border, #caa15a)),
        2px 2px 0 var(--card-accent, var(--panel-border, #caa15a)),
        3px 3px 0 var(--card-accent, var(--panel-border, #caa15a)),
        4px 4px 0 var(--card-accent, var(--panel-border, #caa15a)),
        6px 10px 26px rgba(0,0,0,0.55);
      transform-style:preserve-3d;
      transform:scale(0.8) rotateY(140deg);
      transition:transform 0.55s ease;
      display:flex; flex-direction:column; align-items:center; justify-content:flex-end;
      padding-bottom:18px;
    }
    #card-overlay.card-show .landing-card{
      transform:scale(1) rotateY(0deg);
    }
    .landing-card-label{
      font-family:'Fredoka', sans-serif;
      font-size:11px;
      letter-spacing:1px;
      text-transform:uppercase;
      color:var(--card-accent, var(--ink, #241a12));
      opacity:0.7;
      margin-bottom:auto;
      margin-top:16px;
      transition:opacity 0.2s ease;
    }
    .landing-card-hint{
      font-family:'Fredoka', sans-serif;
      font-size:12px;
      letter-spacing:1px;
      color:var(--ink, #241a12);
      opacity:0.45;
      transition:opacity 0.2s ease;
    }
    .landing-card-label.hint-fs-hidden,
    .landing-card-hint.hint-fs-hidden{
      opacity:0;
    }

    #color-screen{
      position:fixed; inset:0; z-index:75;
      background:var(--screen-color, #5b2a86);
      display:flex; flex-direction:column; align-items:center; justify-content:flex-end;
      padding-bottom:36px;
      opacity:0; pointer-events:none;
      transition:opacity 0.3s ease, background 0.2s ease;
    }
    #color-screen.color-show{
      opacity:1; pointer-events:auto;
    }
    #color-screen-label{
      font-family:'Fredoka', sans-serif;
      font-size:13px;
      letter-spacing:1px;
      text-transform:uppercase;
      color:rgba(255,255,255,0.7);
      margin-bottom:auto;
      margin-top:36px;
      transition:opacity 0.2s ease;
    }
    #color-screen-hint{
      font-family:'Fredoka', sans-serif;
      font-size:13px;
      letter-spacing:1px;
      color:rgba(255,255,255,0.55);
      transition:opacity 0.2s ease;
    }
    #color-screen-label.hint-fs-hidden,
    #color-screen-hint.hint-fs-hidden{
      opacity:0;
    }
  `;
  document.head.appendChild(cardStyle);

  /* -------------------- Marcado: carta -------------------- */
  const cardOverlay = document.createElement('div');
  cardOverlay.id = 'card-overlay';
  cardOverlay.innerHTML = `
    <div class="landing-card">
      <div class="landing-card-label"></div>
      <div class="landing-card-hint">Presiona SPACE</div>
    </div>
  `;
  document.body.appendChild(cardOverlay);

  /* -------------------- Marcado: pantalla completa de color (boceto) -------------------- */
  const colorScreen = document.createElement('div');
  colorScreen.id = 'color-screen';
  colorScreen.innerHTML = `
    <div id="color-screen-label"></div>
    <div id="color-screen-hint">Presiona SPACE para continuar</div>
  `;
  document.body.appendChild(colorScreen);

  const cardLabelEl = cardOverlay.querySelector('.landing-card-label');
  const colorScreenLabelEl = document.getElementById('color-screen-label');

  function showLandingCard(){
    const card = CARD_SEQUENCE[cardSeqIndex];
    flowState = 'card';
    cardOverlay.style.setProperty('--card-accent', card.color);
    if(cardLabelEl) cardLabelEl.textContent = card.name;
    cardOverlay.classList.add('card-show');
  }
  function showColorScreen(){
    const card = CARD_SEQUENCE[cardSeqIndex];
    flowState = 'screen';
    cardOverlay.classList.remove('card-show');
    colorScreen.style.setProperty('--screen-color', card.color);
    if(colorScreenLabelEl) colorScreenLabelEl.textContent = card.name;
    colorScreen.classList.add('color-show');
  }
  function backToGame(){
    flowState = 'game';
    colorScreen.classList.remove('color-show');
    // avanza a la siguiente carta del ciclo para la próxima tirada (orden fijo, no al azar)
    cardSeqIndex = (cardSeqIndex + 1) % CARD_SEQUENCE.length;
  }

  /* -------------------- Ocultar los textos de ayuda en pantalla completa --------------------
     En pantalla completa el juego ya oculta hint/HUD (script.js), así que estos textos de
     la carta y la pantalla de color siguen la misma regla: visibles en ventana normal,
     ocultos en fullscreen. */
  const landingHintEl = cardOverlay.querySelector('.landing-card-hint');
  const colorHintEl = document.getElementById('color-screen-hint');
  function syncCardHintsVisibility(){
    const hide = !!document.fullscreenElement;
    if(landingHintEl) landingHintEl.classList.toggle('hint-fs-hidden', hide);
    if(cardLabelEl) cardLabelEl.classList.toggle('hint-fs-hidden', hide);
    if(colorHintEl) colorHintEl.classList.toggle('hint-fs-hidden', hide);
    if(colorScreenLabelEl) colorScreenLabelEl.classList.toggle('hint-fs-hidden', hide);
  }
  syncCardHintsVisibility();
  document.addEventListener('fullscreenchange', syncCardHintsVisibility);

  /* -------------------- Detectar cuándo la ficha termina de caminar -------------------- */
  const CARD_DELAY_AFTER_LANDING = 1000; // pausa extra tras llegar, antes de mostrar la carta
  const diceResultEl = document.getElementById('dice-result');
  if(diceResultEl){
    const rollObserver = new MutationObserver(function(){
      const text = diceResultEl.textContent;
      const match = text.match(/^(.+) sacó (\d+)$/);
      if(!match) return;
      const steps = parseInt(match[2], 10);
      // misma temporización aproximada que rollDice()/movePawn() en script.js: ~950ms
      // antes de que la cámara empiece a seguir a la ficha + 400ms de espera para que
      // la cámara la alcance antes del primer salto + ~390ms por casilla, para saber
      // cuándo la ficha realmente termina de llegar. Luego se suma una pausa extra
      // (CARD_DELAY_AFTER_LANDING) antes de mostrar la carta.
      // Nota: NO se compara el texto contra la tirada anterior (antes se hacía y era
      // el bug: si salía el mismo jugador con el mismo número dos veces seguidas, el
      // texto quedaba idéntico y la carta no aparecía en la segunda tirada). Cada vez
      // que script.js asigna diceResult.textContent, el navegador reemplaza el nodo de
      // texto por completo, así que este observer siempre dispara una vez por tirada,
      // sin importar si el resultado se repite.
      const travelDelay = 950 + 400 + steps*390 + 200;
      setTimeout(showLandingCard, travelDelay + CARD_DELAY_AFTER_LANDING);
    });
    rollObserver.observe(diceResultEl, {childList:true, characterData:true, subtree:true});
  }

})();
