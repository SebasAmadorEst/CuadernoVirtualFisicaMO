/**
 * ============================================================================
 * LABORATORIO INTERACTIVO VIRTUAL DE EFECTO DOPPLER Y CONO DE MACH
 * Física III - Movimiento Ondulatorio
 * Autores: Camila Mora Pineda & Juan Sebastián Amador Martínez
 * ============================================================================
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. ESTADO GLOBAL DEL LABORATORIO
  // ==========================================================================
  const state = {
    // Parámetros físicos
    c: 343,         // Velocidad de la onda en el medio (m/s)
    vs: 35,         // Velocidad de la fuente (m/s)
    vo: 0,          // Velocidad del observador (m/s)
    fs: 600,        // Frecuencia emitida por la fuente (Hz)
    
    // Geometría y coordenadas iniciales en metros
    source0: { x: -160, y: 0 },
    observer: { x: 0, y: 25 }, // d = 25m distancia perpendicular
    
    // Cinemática de la simulación
    t: 0,
    timeMax: 10,
    playing: true,
    speed: 1.0,
    lastTimestamp: 0,
    
    // Frentes de onda circulares emitidos
    fronts: [],
    emitTimer: 0,
    emitInterval: 0.08, // segundos entre emisión de frentes para render
    
    // Modo y vista
    theme: 'dark', // 'dark', 'light', 'blueprint'
    activeTab: 'time-curve', // 'time-curve', 'polar-wave', 'spectrum'
    
    // Audio Web Audio API
    audioEnabled: false,
    audioCtx: null,
    osc1: null,
    osc2: null,
    osc3: null,
    gainNode: null,
    pannerNode: null,
    boomPlayed: false,
    
    // Transformación del plano cartesiano (GeoGebra viewport)
    view: {
      scale: 1.8, // píxeles por metro
      offsetX: 0,
      offsetY: 0,
      isPanning: false,
      isDraggingObserver: false,
      panStartX: 0,
      panStartY: 0
    }
  };

  // ==========================================================================
  // 2. CASOS DIDÁCTICOS GUIADOS (PRESETS)
  // ==========================================================================
  const DIDACTIC_CASES = [
    {
      id: 'ambulance',
      name: '1. Ambulancia en emergencia (Clásico)',
      tag: 'Subsónico Urbano',
      c: 343,
      vs: 32, // ~115 km/h
      vo: 0,
      fs: 700,
      observer: { x: 0, y: 15 },
      description: 'Una ambulancia transita a 32 m/s (~115 km/h) haciendo sonar su sirena de 700 Hz. Un peatón se encuentra en la acera a 15 metros de distancia de la calzada. Observa cómo la frecuencia recibida sufre una transición suave de tono agudo a grave debido a la variación continua del ángulo entre la velocidad y la línea visual.',
      questions: [
        '¿Cuál es la frecuencia máxima percibida cuando la ambulancia está muy lejos aproximándose?',
        '¿En qué instante exacto el peatón escucha la frecuencia propia de 700 Hz?',
        '¿Por qué el cambio de frecuencia no es un salto abrupto sino una curva suave en forma de «S»?'
      ]
    },
    {
      id: 'train',
      name: '2. Tren de alta velocidad y silbato en estación',
      tag: 'Subsónico Rápido',
      c: 343,
      vs: 60, // ~216 km/h
      vo: 0,
      fs: 440,
      observer: { x: 0, y: 20 },
      description: 'Tren interurbano pasando frente a una estación a 60 m/s con bocina de 440 Hz (Nota La4). La compresión frontal de frentes de onda incrementa la frecuencia a más de 530 Hz en el acercamiento y cae por debajo de 375 Hz al alejarse.',
      questions: [
        'Calcula el porcentaje de corrimiento Doppler relativo (Δf / fs) durante el acercamiento.',
        '¿Cómo afectaría una temperatura invernal (menor velocidad del sonido c) al tono percibido?'
      ]
    },
    {
      id: 'chase',
      name: '3. Persecución: Ambos en movimiento (Fuente y Observador)',
      tag: 'Movimiento Relativo',
      c: 343,
      vs: 25,
      vo: 35,
      fs: 520,
      observer: { x: -60, y: 5 },
      description: 'Una patrulla policial (observador) persigue a un vehículo infractor (fuente). Ambos se mueven en el mismo sentido, pero el observador viaja más rápido (vo > vs). El observador percibe un tono más agudo porque su velocidad de aproximación supera a la de la fuente.',
      questions: [
        'Si ambas velocidades fuesen idénticas (vo = vs) viajando en la misma dirección, ¿existiría efecto Doppler?',
        'Aplica la convención de signos general: fo = fs * [(c ± vo) / (c ∓ vs)].'
      ]
    },
    {
      id: 'transonic',
      name: '4. Muro del sonido: Régimen sónico (Mach 1.0)',
      tag: 'Transónico M=1.0',
      c: 343,
      vs: 343,
      vo: 0,
      fs: 500,
      observer: { x: 0, y: 40 },
      description: 'La fuente se desplaza exactamente a la velocidad del sonido (vs = c, M = 1.0). Todos los frentes de onda esféricos emitidos hacia adelante coinciden en la misma posición, formando una barrera plana infinita de sobrepresión acústica (la histórica «barrera del sonido»).',
      questions: [
        '¿Qué sucede con la longitud de onda frontal λ = (c - vs)/fs cuando vs = c?',
        '¿Qué percibe un observador situado al frente antes de que la fuente lo alcance?'
      ]
    },
    {
      id: 'supersonic',
      name: '5. Caza supersónico y Cono de Mach (Mach 1.6)',
      tag: 'Supersónico M > 1',
      c: 343,
      vs: 548.8, // Mach 1.6
      vo: 0,
      fs: 500,
      observer: { x: 0, y: 45 },
      description: 'Aeronave a Mach 1.6 (vs = 548.8 m/s). La fuente se adelanta a sus propias ondas acústicas. Los frentes esféricos se solapan formando una envolvente cónica tangente (Cono de Mach) con semiángulo sen(μ) = 1/M ≈ 38.7°. Al cruzar este cono el observador se produce el doble estampido sónico.',
      questions: [
        'Calcula el semiángulo del cono de Mach μ para Mach 1.6.',
        '¿Por qué el observador en tierra ve pasar el avión en silencio antes de escuchar el estampido?'
      ]
    },
    {
      id: 'radar',
      name: '6. Radar Doppler de tráfico y corrimiento de ida y vuelta',
      tag: 'Efecto Doble',
      c: 343,
      vs: 30,
      vo: 0,
      fs: 800,
      observer: { x: 0, y: 0 },
      description: 'Simula el principio físico del radar o velocímetro acústico: la onda viaja hacia el móvil y se refleja de regreso al sensor fijo, experimentando un doble corrimiento Doppler: fdoble ≈ fs * (1 + 2vs/c).',
      questions: [
        'Deduce por qué el eco reflejado tiene un corrimiento duplicado en primera aproximación.',
        '¿Cómo se aplica este mismo principio en el corrimiento al rojo (redshift) astrofísico?'
      ]
    }
  ];

  // Elementos del DOM
  let mainCanvas = null;
  let mainCtx = null;
  let secCanvas = null;
  let secCtx = null;
  let tooltip = null;

  // ==========================================================================
  // 3. INICIALIZACIÓN PRINCIPAL
  // ==========================================================================
  function init() {
    mainCanvas = document.getElementById('waveCanvas');
    if (!mainCanvas) return;
    mainCtx = mainCanvas.getContext('2d');

    secCanvas = document.getElementById('secondaryCanvas');
    if (secCanvas) secCtx = secCanvas.getContext('2d');

    tooltip = document.getElementById('geoTooltip');

    setupPresets();
    setupControls();
    setupToolbar();
    setupCanvasInteractions();
    setupAudio();
    setupTabs();
    setupExport();

    loadPreset('ambulance');
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    // Bucle de animación de alta tasa de cuadros
    state.lastTimestamp = performance.now();
    requestAnimationFrame(animationLoop);
  }

  // ==========================================================================
  // 4. CONFIGURACIÓN DE PRESETS
  // ==========================================================================
  function setupPresets() {
    const select = document.getElementById('presetSelector');
    if (!select) return;

    select.innerHTML = '';
    DIDACTIC_CASES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });

    select.addEventListener('change', e => {
      loadPreset(e.target.value);
    });
  }

  function loadPreset(id) {
    const p = DIDACTIC_CASES.find(c => c.id === id);
    if (!p) return;

    state.c = p.c;
    state.vs = p.vs;
    state.vo = p.vo;
    state.fs = p.fs;
    state.observer = { ...p.observer };
    state.t = 0;
    state.fronts = [];
    state.boomPlayed = false;

    // Actualizar interfaz
    updateInputValues();
    updateDidacticInfo(p);
    updateCalculations();
    renderMath();
  }

  function updateDidacticInfo(p) {
    const titleEl = document.getElementById('didacticTitle');
    const descEl = document.getElementById('didacticDescription');
    const qList = document.getElementById('didacticQuestionsList');

    if (titleEl) titleEl.textContent = p.name;
    if (descEl) descEl.textContent = p.description;
    if (qList) {
      qList.innerHTML = '';
      p.questions.forEach(q => {
        const li = document.createElement('li');
        li.textContent = q;
        qList.appendChild(li);
      });
    }
  }

  // ==========================================================================
  // 5. ENLACE DE CONTROLES NUMÉRICOS Y SLIDERS
  // ==========================================================================
  function setupControls() {
    bindInputPair('sliderVs', 'numVs', val => {
      state.vs = val;
      updateCalculations();
    });

    bindInputPair('sliderVo', 'numVo', val => {
      state.vo = val;
      updateCalculations();
    });

    bindInputPair('sliderFs', 'numFs', val => {
      state.fs = val;
      updateCalculations();
    });

    bindInputPair('sliderC', 'numC', val => {
      state.c = val;
      updateCalculations();
    });

    bindInputPair('sliderD', 'numD', val => {
      state.observer.y = val;
      updateCalculations();
    });

    // Botones rápidos para velocidad del sonido en diferentes medios
    document.querySelectorAll('[data-set-c]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cVal = parseFloat(btn.getAttribute('data-set-c'));
        state.c = cVal;
        updateInputValues();
        updateCalculations();
      });
    });

    // Botones de dirección para la fuente
    const btnVsDir = document.getElementById('btnVsDir');
    if (btnVsDir) {
      btnVsDir.addEventListener('click', () => {
        state.vs = -state.vs;
        updateInputValues();
        updateCalculations();
      });
    }

    // Botón reposo para fuente u observador
    const btnVsZero = document.getElementById('btnVsZero');
    if (btnVsZero) {
      btnVsZero.addEventListener('click', () => {
        state.vs = 0;
        updateInputValues();
        updateCalculations();
      });
    }
    const btnVoZero = document.getElementById('btnVoZero');
    if (btnVoZero) {
      btnVoZero.addEventListener('click', () => {
        state.vo = 0;
        updateInputValues();
        updateCalculations();
      });
    }

    // Controles de transporte
    const playToggle = document.getElementById('playToggle');
    if (playToggle) {
      playToggle.addEventListener('click', () => {
        state.playing = !state.playing;
        playToggle.innerHTML = state.playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        playToggle.setAttribute('title', state.playing ? 'Pausar simulación (Espacio)' : 'Reanudar simulación (Espacio)');
      });
    }

    const resetTime = document.getElementById('resetTime');
    if (resetTime) {
      resetTime.addEventListener('click', () => {
        state.t = 0;
        state.fronts = [];
        state.boomPlayed = false;
        updateTimeReadout();
      });
    }

    const stepBack = document.getElementById('stepBack');
    if (stepBack) {
      stepBack.addEventListener('click', () => {
        state.t = Math.max(0, state.t - 0.05);
        updateTimeReadout();
      });
    }

    const stepForward = document.getElementById('stepForward');
    if (stepForward) {
      stepForward.addEventListener('click', () => {
        state.t = Math.min(state.timeMax, state.t + 0.05);
        updateTimeReadout();
      });
    }

    const timeSlider = document.getElementById('timeSlider');
    if (timeSlider) {
      timeSlider.addEventListener('input', e => {
        state.t = parseFloat(e.target.value);
        updateTimeReadout();
      });
    }

    const speedSelect = document.getElementById('speedSelect');
    if (speedSelect) {
      speedSelect.addEventListener('change', e => {
        state.speed = parseFloat(e.target.value);
      });
    }

    // Atajos de teclado
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (playToggle) playToggle.click();
      } else if (e.key === 'r' || e.key === 'R') {
        if (resetTime) resetTime.click();
      } else if (e.key === 'ArrowRight') {
        if (stepForward) stepForward.click();
      } else if (e.key === 'ArrowLeft') {
        if (stepBack) stepBack.click();
      }
    });
  }

  function bindInputPair(sliderId, numId, callback) {
    const slider = document.getElementById(sliderId);
    const num = document.getElementById(numId);
    if (!slider || !num) return;

    slider.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      num.value = v;
      callback(v);
    });

    num.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v)) {
        slider.value = v;
        callback(v);
      }
    });
  }

  function updateInputValues() {
    const sVs = document.getElementById('sliderVs');
    const nVs = document.getElementById('numVs');
    const sVo = document.getElementById('sliderVo');
    const nVo = document.getElementById('numVo');
    const sFs = document.getElementById('sliderFs');
    const nFs = document.getElementById('numFs');
    const sC = document.getElementById('sliderC');
    const nC = document.getElementById('numC');
    const sD = document.getElementById('sliderD');
    const nD = document.getElementById('numD');

    if (sVs && nVs) { sVs.value = state.vs; nVs.value = state.vs; }
    if (sVo && nVo) { sVo.value = state.vo; nVo.value = state.vo; }
    if (sFs && nFs) { sFs.value = state.fs; nFs.value = state.fs; }
    if (sC && nC) { sC.value = state.c; nC.value = state.c; }
    if (sD && nD) { sD.value = Math.abs(state.observer.y); nD.value = Math.abs(state.observer.y); }
  }

  function updateTimeReadout() {
    const tOut = document.getElementById('currentTime');
    const tSlider = document.getElementById('timeSlider');
    if (tOut) tOut.textContent = state.t.toFixed(2) + ' s';
    if (tSlider && document.activeElement !== tSlider) tSlider.value = state.t;
  }

  // ==========================================================================
  // 6. CÁLCULOS FÍSICOS EN TIEMPO REAL
  // ==========================================================================
  function getSourcePos(t) {
    // La fuente inicia a la izquierda y cruza x=0 a t = timeMax / 2
    const tMid = state.timeMax / 2;
    return {
      x: state.source0.x + state.vs * (t - tMid),
      y: 0
    };
  }

  function getObserverPos(t) {
    // Si el observador tiene velocidad vo se desplaza a lo largo de x
    const tMid = state.timeMax / 2;
    return {
      x: state.observer.x + state.vo * (t - tMid),
      y: state.observer.y
    };
  }

  function calculatePhysicalQuantities(t) {
    const src = getSourcePos(t);
    const obs = getObserverPos(t);

    const dx = obs.x - src.x;
    const dy = obs.y - src.y;
    const dist = Math.hypot(dx, dy);

    // Vector de velocidad de la fuente: vs en dirección +X
    // Vector de posición relativa fuente -> observador: (dx, dy)
    // Ángulo theta entre vs y la línea visual fuente -> observador:
    // cos(theta) = dx / dist
    const cosTheta = dist > 0.001 ? (dx / dist) : 0;
    const thetaRad = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
    const thetaDeg = thetaRad * (180 / Math.PI);

    // Número de Mach
    const mach = Math.abs(state.vs) / state.c;

    // Frecuencia observada instantánea:
    // fo = fs * (c - vo * cosTheta_o) / (c - vs * cosTheta_s)
    // Suponiendo observador con vo en eje X: cosTheta_o = cosTheta
    let denom = state.c - state.vs * cosTheta;
    let numer = state.c - state.vo * cosTheta;

    let fo = state.fs;
    if (Math.abs(denom) > 0.001) {
      fo = state.fs * (numer / denom);
    }

    // Frecuencias límites asintóticas (aproximación frontal y alejamiento posterior)
    const fMax = state.c > Math.abs(state.vs) ? state.fs * ((state.c + Math.abs(state.vo)) / (state.c - Math.abs(state.vs))) : Infinity;
    const fMin = state.fs * ((state.c - Math.abs(state.vo)) / (state.c + Math.abs(state.vs)));

    // Longitudes de onda frontal y posterior
    const lambdaFront = Math.max(0, (state.c - state.vs) / state.fs);
    const lambdaBack = (state.c + state.vs) / state.fs;

    // Ángulo de Mach (si supersónico)
    let machAngleDeg = 0;
    if (mach >= 1.0) {
      const sinMu = 1.0 / mach;
      machAngleDeg = Math.asin(Math.min(1, sinMu)) * (180 / Math.PI);
    }

    return {
      src,
      obs,
      dist,
      cosTheta,
      thetaDeg,
      mach,
      fo,
      fMax,
      fMin,
      lambdaFront,
      lambdaBack,
      machAngleDeg
    };
  }

  function updateCalculations() {
    const q = calculatePhysicalQuantities(state.t);

    const mTile = document.getElementById('readMach');
    const foTile = document.getElementById('readFo');
    const dfTile = document.getElementById('readDeltaF');
    const thetaTile = document.getElementById('readTheta');
    const lfTile = document.getElementById('readLambdaFront');
    const lbTile = document.getElementById('readLambdaBack');
    const regimeBadge = document.getElementById('readRegimeBadge');

    if (mTile) mTile.textContent = `M ${q.mach.toFixed(2)}`;
    if (foTile) foTile.textContent = `${Math.abs(q.fo).toFixed(1)} Hz`;
    if (dfTile) {
      const delta = q.fo - state.fs;
      const sign = delta >= 0 ? '+' : '';
      dfTile.textContent = `${sign}${delta.toFixed(1)} Hz (${sign}${((delta / state.fs) * 100).toFixed(1)}%)`;
    }
    if (thetaTile) thetaTile.textContent = `${q.thetaDeg.toFixed(1)}°`;
    if (lfTile) lfTile.textContent = `${q.lambdaFront.toFixed(3)} m`;
    if (lbTile) lbTile.textContent = `${q.lambdaBack.toFixed(3)} m`;

    if (regimeBadge) {
      if (q.mach > 1.0) {
        regimeBadge.textContent = `SUPERSÓNICO (Mach ${q.mach.toFixed(2)} · μ=${q.machAngleDeg.toFixed(1)}°)`;
        regimeBadge.style.color = '#ea580c';
      } else if (Math.abs(q.mach - 1.0) < 0.03) {
        regimeBadge.textContent = 'TRANSÓNICO (Barrera del Sonido M = 1.0)';
        regimeBadge.style.color = '#ef4444';
      } else {
        regimeBadge.textContent = `SUBSÓNICO (Mach ${q.mach.toFixed(2)})`;
        regimeBadge.style.color = '#0284c7';
      }
    }

    // Actualizar caja KaTeX
    updateMathFormulaBox(q);
  }

  function updateMathFormulaBox(q) {
    const box = document.getElementById('calcMathBox');
    if (!box) return;

    const machFormula = q.mach >= 1.0
      ? `\\sin\\mu = \\frac{c}{v_s} = \\frac{1}{${q.mach.toFixed(2)}} \\implies \\mu = ${q.machAngleDeg.toFixed(1)}^\\circ`
      : `\\lambda_{\\text{frente}} = \\frac{c - v_s}{f_s} = \\frac{${state.c} - ${state.vs}}{${state.fs}} = ${q.lambdaFront.toFixed(3)}\\text{ m}`;

    box.innerHTML = `
      \\[
      f_o = f_s \\left( \\frac{c - v_o \\cos\\theta}{c - v_s \\cos\\theta} \\right) = 
      ${state.fs} \\left( \\frac{${state.c} - ${state.vo}(${q.cosTheta.toFixed(3)})}{${state.c} - ${state.vs}(${q.cosTheta.toFixed(3)})} \\right) = 
      \\mathbf{${Math.abs(q.fo).toFixed(1)}\\text{ Hz}}
      \\]
      \\[
      ${machFormula}
      \\]
    `;
    renderMath();
  }

  function renderMath() {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  }

  // ==========================================================================
  // 7. BUCLE DE ANIMACIÓN Y FRENTES DE ONDA
  // ==========================================================================
  function animationLoop(timestamp) {
    const dtReal = (timestamp - state.lastTimestamp) / 1000;
    state.lastTimestamp = timestamp;

    const dt = Math.min(0.1, dtReal) * state.speed;

    if (state.playing) {
      state.t += dt;
      if (state.t > state.timeMax) {
        state.t = 0;
        state.fronts = [];
        state.boomPlayed = false;
      }
      updateTimeReadout();
    }

    // Emisión de frentes de onda circulares periódicos
    state.emitTimer += dt;
    if (state.emitTimer >= state.emitInterval) {
      state.emitTimer = 0;
      const src = getSourcePos(state.t);
      state.fronts.push({
        x0: src.x,
        y0: src.y,
        t0: state.t
      });
    }

    // Filtrar frentes de onda antiguos
    state.fronts = state.fronts.filter(f => (state.t - f.t0) * state.c < 600);

    // Cálculos físicos
    const q = calculatePhysicalQuantities(state.t);
    updateCalculations();

    // Actualizar audio
    updateAudio(q);

    // Renderizar lienzo principal 2D
    drawMainCanvas(q);

    // Renderizar gráfico secundario activo
    drawSecondaryCanvas(q);

    requestAnimationFrame(animationLoop);
  }

  // ==========================================================================
  // 8. RENDERIZADO DEL LIENZO 2D GEOGEBRA (FRENTES DE ONDA)
  // ==========================================================================
  function resizeCanvases() {
    if (mainCanvas) {
      const rect = mainCanvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      mainCanvas.width = rect.width * dpr;
      mainCanvas.height = rect.height * dpr;
      mainCtx.scale(dpr, dpr);
      state.mainW = rect.width;
      state.mainH = rect.height;
    }

    if (secCanvas) {
      const rect = secCanvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      secCanvas.width = rect.width * dpr;
      secCanvas.height = rect.height * dpr;
      secCtx.scale(dpr, dpr);
      state.secW = rect.width;
      state.secH = rect.height;
    }
  }

  function worldToScreen(wx, wy) {
    const cx = state.mainW / 2 + state.view.offsetX;
    const cy = state.mainH / 2 + state.view.offsetY;
    return {
      x: cx + wx * state.view.scale,
      y: cy - wy * state.view.scale // invertir Y para convención matemática
    };
  }

  function screenToWorld(sx, sy) {
    const cx = state.mainW / 2 + state.view.offsetX;
    const cy = state.mainH / 2 + state.view.offsetY;
    return {
      x: (sx - cx) / state.view.scale,
      y: (cy - sy) / state.view.scale
    };
  }

  function drawMainCanvas(q) {
    if (!mainCtx) return;
    const ctx = mainCtx;
    const w = state.mainW;
    const h = state.mainH;

    // Fondo según tema
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = state.theme === 'light' ? '#f8fafc' : '#09111e';
    ctx.fillRect(0, 0, w, h);

    // 1. Cuadrícula cartesiana
    drawGrid(ctx, w, h);

    // 2. Frentes de onda circulares
    drawWavefronts(ctx, q);

    // 3. Cono de Mach si régimen supersónico
    if (q.mach >= 1.0) {
      drawMachCone(ctx, q);
    }

    // 4. Línea visual Fuente -> Observador y ángulo theta
    drawSightLineAndAngle(ctx, q);

    // 5. Trayectoria de la fuente
    drawSourceTrajectory(ctx);

    // 6. Observador y Fuente
    drawObserver(ctx, q);
    drawSource(ctx, q);
  }

  function drawGrid(ctx, w, h) {
    const isDark = state.theme !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const axisColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.25)';
    const textColor = isDark ? '#64748b' : '#94a3b8';

    const origin = worldToScreen(0, 0);

    // Espaciado en metros según nivel de zoom
    const stepMeters = state.view.scale > 3 ? 10 : (state.view.scale > 1.2 ? 25 : 50);
    const stepPx = stepMeters * state.view.scale;

    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;

    // Líneas verticales
    const startX = origin.x % stepPx;
    for (let x = startX; x < w; x += stepPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Líneas horizontales
    const startY = origin.y % stepPx;
    for (let y = startY; y < h; y += stepPx) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Ejes cartesianos principales
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.5;

    // Eje X
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(w, origin.y);
    ctx.stroke();

    // Eje Y
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, h);
    ctx.stroke();

    // Etiquetas de escala
    ctx.font = '10px "DM Mono", monospace';
    ctx.fillStyle = textColor;
    ctx.fillText('x [m]', w - 36, origin.y - 8);
    ctx.fillText('y [m]', origin.x + 8, 16);
  }

  function drawWavefronts(ctx, q) {
    const isDark = state.theme !== 'light';

    state.fronts.forEach(f => {
      const radiusMeters = (state.t - f.t0) * state.c;
      if (radiusMeters <= 0) return;

      const center = worldToScreen(f.x0, f.y0);
      const radiusPx = radiusMeters * state.view.scale;

      // Color dinámico según compresión / Doppler óptico
      let strokeStyle;
      if (q.mach >= 1.0) {
        strokeStyle = isDark ? 'rgba(234, 88, 12, 0.35)' : 'rgba(234, 88, 12, 0.45)';
      } else {
        // En frente se comprime (azul/cyan), atrás se dilata (coral/rojo)
        const age = (state.t - f.t0);
        const alpha = Math.max(0.12, 0.6 - age * 0.08);
        strokeStyle = isDark ? `rgba(6, 182, 212, ${alpha})` : `rgba(2, 132, 199, ${alpha})`;
      }

      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function drawMachCone(ctx, q) {
    const srcScreen = worldToScreen(q.src.x, q.src.y);
    const mach = q.mach;
    const sinMu = 1.0 / mach;
    const mu = Math.asin(sinMu);

    const coneLengthMeters = 300;
    const coneLengthPx = coneLengthMeters * state.view.scale;

    // Si la velocidad vs es positiva, el cono apunta hacia -X
    const dir = state.vs >= 0 ? -1 : 1;
    const dx = dir * coneLengthPx * Math.cos(mu);
    const dy = coneLengthPx * Math.sin(mu);

    // Sombra del cono de Mach
    ctx.fillStyle = 'rgba(234, 88, 12, 0.08)';
    ctx.beginPath();
    ctx.moveTo(srcScreen.x, srcScreen.y);
    ctx.lineTo(srcScreen.x + dx, srcScreen.y - dy);
    ctx.lineTo(srcScreen.x + dx, srcScreen.y + dy);
    ctx.closePath();
    ctx.fill();

    // Líneas tangentes envolventes
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 3]);

    ctx.beginPath();
    ctx.moveTo(srcScreen.x, srcScreen.y);
    ctx.lineTo(srcScreen.x + dx, srcScreen.y - dy);
    ctx.moveTo(srcScreen.x, srcScreen.y);
    ctx.lineTo(srcScreen.x + dx, srcScreen.y + dy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Indicador de ángulo de Mach
    ctx.font = '600 11px "Outfit", sans-serif';
    ctx.fillStyle = '#ea580c';
    ctx.fillText(`Cono de Mach: μ = ${q.machAngleDeg.toFixed(1)}° (M = ${mach.toFixed(2)})`, srcScreen.x + dir * 60, srcScreen.y - 18);
  }

  function drawSightLineAndAngle(ctx, q) {
    const srcScreen = worldToScreen(q.src.x, q.src.y);
    const obsScreen = worldToScreen(q.obs.x, q.obs.y);

    // Línea visual punteada
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(srcScreen.x, srcScreen.y);
    ctx.lineTo(obsScreen.x, obsScreen.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arco de ángulo theta en la fuente
    const angleRad = Math.atan2(-(obsScreen.y - srcScreen.y), obsScreen.x - srcScreen.x);
    const arcRadius = 26;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(srcScreen.x, srcScreen.y, arcRadius, 0, -angleRad, angleRad > 0);
    ctx.stroke();

    ctx.font = '600 10.5px "DM Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`θ = ${q.thetaDeg.toFixed(0)}°`, srcScreen.x + 30, srcScreen.y - 10);
  }

  function drawSourceTrajectory(ctx) {
    const p1 = worldToScreen(-300, 0);
    const p2 = worldToScreen(300, 0);

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSource(ctx, q) {
    const p = worldToScreen(q.src.x, q.src.y);

    // Aura pulsante
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Punto central de la fuente
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vector velocidad vs
    if (Math.abs(state.vs) > 1) {
      const arrowLen = (state.vs / state.c) * 55;
      drawArrow(ctx, p.x, p.y, p.x + arrowLen, p.y, '#ef4444', 2.2);
      ctx.font = '700 10px "DM Mono", monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`vs=${state.vs} m/s`, p.x - 20, p.y + 22);
    }
  }

  function drawObserver(ctx, q) {
    const p = worldToScreen(q.obs.x, q.obs.y);

    // Aura del observador
    ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Marcador observador
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Etiqueta
    ctx.font = '700 11px "Outfit", sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('Observador', p.x + 12, p.y - 6);

    ctx.font = '600 10px "DM Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`(${q.obs.x.toFixed(0)}, ${q.obs.y.toFixed(0)}) m`, p.x + 12, p.y + 8);

    // Vector vo si existe
    if (Math.abs(state.vo) > 1) {
      const arrowLen = (state.vo / state.c) * 55;
      drawArrow(ctx, p.x, p.y, p.x + arrowLen, p.y, '#10b981', 2);
    }
  }

  function drawArrow(ctx, fromX, fromY, toX, toY, color, width) {
    const headLen = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // ==========================================================================
  // 9. LIENZO SECUNDARIO: GRÁFICAS DE FRECUENCIA Y ESPECTRO
  // ==========================================================================
  function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        state.activeTab = btn.getAttribute('data-tab');
      });
    });
  }

  function drawSecondaryCanvas(q) {
    if (!secCtx) return;
    const ctx = secCtx;
    const w = state.secW;
    const h = state.secH;

    ctx.clearRect(0, 0, w, h);

    if (state.activeTab === 'time-curve') {
      drawFrequencyTimeCurve(ctx, w, h, q);
    } else if (state.activeTab === 'polar-wave') {
      drawPolarWavelength(ctx, w, h, q);
    } else if (state.activeTab === 'spectrum') {
      drawAcousticSpectrum(ctx, w, h, q);
    }
  }

  // Pestaña 1: Curva Sigmoide fo(t)
  function drawFrequencyTimeCurve(ctx, w, h, currentQ) {
    const padL = 60;
    const padR = 25;
    const padT = 20;
    const padB = 35;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Rango de frecuencias para graficar
    const fMaxTheoretical = Math.min(2000, currentQ.fMax === Infinity ? state.fs * 2.5 : currentQ.fMax * 1.15);
    const fMinTheoretical = Math.max(100, currentQ.fMin * 0.85);
    const fRange = fMaxTheoretical - fMinTheoretical;

    // Fondo y ejes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Línea horizontal fs (frecuencia propia)
    const yFs = padT + plotH - ((state.fs - fMinTheoretical) / fRange) * plotH;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, yFs);
    ctx.lineTo(padL + plotW, yFs);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px "DM Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`fs = ${state.fs} Hz`, padL + 8, yFs - 4);

    // Trazar la curva completa de fo(t) desde t=0 hasta t=timeMax
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.4;
    ctx.beginPath();

    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const sampleT = (i / steps) * state.timeMax;
      const sampleQ = calculatePhysicalQuantities(sampleT);
      const safeFo = Math.max(fMinTheoretical, Math.min(fMaxTheoretical, sampleQ.fo));

      const px = padL + (sampleT / state.timeMax) * plotW;
      const py = padT + plotH - ((safeFo - fMinTheoretical) / fRange) * plotH;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Punto indicador del instante actual
    const curX = padL + (state.t / state.timeMax) * plotW;
    const curY = padT + plotH - ((Math.min(fMaxTheoretical, Math.max(fMinTheoretical, currentQ.fo)) - fMinTheoretical) / fRange) * plotH;

    // Línea vertical t
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(curX, padT);
    ctx.lineTo(curX, padT + plotH);
    ctx.stroke();

    // Punto pulsante
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Etiqueta del punto
    ctx.font = '700 11px "DM Mono", monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`${currentQ.fo.toFixed(1)} Hz`, curX + 8, curY - 8);

    // Etiquetas de los ejes
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "DM Mono", monospace';
    ctx.fillText('0 s', padL, padT + plotH + 16);
    ctx.fillText(`${state.timeMax} s`, padL + plotW - 24, padT + plotH + 16);
    ctx.fillText('Tiempo t [s]', padL + plotW / 2 - 30, padT + plotH + 20);

    ctx.fillText(`${fMaxTheoretical.toFixed(0)} Hz`, 8, padT + 12);
    ctx.fillText(`${fMinTheoretical.toFixed(0)} Hz`, 8, padT + plotH);
  }

  // Pestaña 2: Diagrama polar de longitud de onda direccional λ(θ)
  function drawPolarWavelength(ctx, w, h, q) {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.42;

    // Círculos concéntricos de referencia
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1.0].forEach(frac => {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Ejes polar
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(cx - maxR, cy);
    ctx.lineTo(cx + maxR, cy);
    ctx.moveTo(cx, cy - maxR);
    ctx.lineTo(cx, cy + maxR);
    ctx.stroke();

    // Trazo de la envolvente polar de lambda(theta) = (c - vs*cos(theta)) / fs
    const lambda0 = state.c / state.fs; // longitud de onda en reposo
    ctx.strokeStyle = '#06b6d4';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    const points = 72;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const lam = (state.c - state.vs * cosA) / state.fs;
      const r = (lam / (lambda0 * 2.2)) * maxR;

      const px = cx + r * Math.cos(angle);
      const py = cy - r * Math.sin(angle);

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Marcador direccional de avance de la fuente
    drawArrow(ctx, cx - 18, cy, cx + 22, cy, '#ef4444', 2.2);

    ctx.font = '600 11px "Outfit", sans-serif';
    ctx.fillStyle = '#0284c7';
    ctx.fillText(`λ frontal = ${q.lambdaFront.toFixed(3)} m`, cx + maxR * 0.4, cy + 22);
    ctx.fillStyle = '#ea580c';
    ctx.fillText(`λ trasera = ${q.lambdaBack.toFixed(3)} m`, cx - maxR * 0.9, cy + 22);
  }

  // Pestaña 3: Espectro acústico emitido vs recibido
  function drawAcousticSpectrum(ctx, w, h, q) {
    const padL = 60;
    const padR = 40;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - 30 - padB;

    ctx.font = '600 12px "Outfit", sans-serif';

    // Barra 1: Frecuencia emitida fs
    const barW = 42;
    const xFs = padL + plotW * 0.28;
    const xFo = padL + plotW * 0.65;

    // Altura normalizada (amplitud acústica)
    const hFs = plotH * 0.8;
    const yFs = 30 + plotH - hFs;

    ctx.fillStyle = '#64748b';
    ctx.fillRect(xFs - barW / 2, yFs, barW, hFs);

    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.fs} Hz`, xFs, yFs - 8);
    ctx.fillText('Fuente (fs)', xFs, 30 + plotH + 18);

    // Barra 2: Frecuencia percibida fo
    const hFo = plotH * 0.8;
    const yFo = 30 + plotH - hFo;
    const isHigher = q.fo >= state.fs;

    ctx.fillStyle = isHigher ? '#0284c7' : '#ea580c';
    ctx.fillRect(xFo - barW / 2, yFo, barW, hFo);

    ctx.fillStyle = isHigher ? '#0284c7' : '#ea580c';
    ctx.fillText(`${q.fo.toFixed(1)} Hz`, xFo, yFo - 8);
    ctx.fillText('Observador (fo)', xFo, 30 + plotH + 18);

    // Flecha de desplazamiento Doppler (Δf)
    const delta = q.fo - state.fs;
    ctx.font = '700 12px "DM Mono", monospace';
    ctx.fillStyle = delta >= 0 ? '#10b981' : '#ef4444';
    ctx.fillText(`Δf = ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} Hz`, (xFs + xFo) / 2, yFs - 24);

    ctx.textAlign = 'start';
  }

  // ==========================================================================
  // 10. INTERACCIONES DEL LIENZO (ARRASTRAR OBSERVADOR, ZOOM Y PAN)
  // ==========================================================================
  function setupCanvasInteractions() {
    if (!mainCanvas) return;

    let isDraggingObserver = false;
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    mainCanvas.addEventListener('mousedown', e => {
      const rect = mainCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const q = calculatePhysicalQuantities(state.t);
      const obsScreen = worldToScreen(q.obs.x, q.obs.y);
      const distToObs = Math.hypot(mouseX - obsScreen.x, mouseY - obsScreen.y);

      // Si se hace clic a menos de 22px del observador, arrastrarlo
      if (distToObs < 22) {
        isDraggingObserver = true;
        mainCanvas.style.cursor = 'grabbing';
      } else {
        isPanning = true;
        startX = mouseX - state.view.offsetX;
        startY = mouseY - state.view.offsetY;
        mainCanvas.style.cursor = 'move';
      }
    });

    window.addEventListener('mousemove', e => {
      if (!mainCanvas) return;
      const rect = mainCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDraggingObserver) {
        const worldCoords = screenToWorld(mouseX, mouseY);
        state.observer.x = Math.round(worldCoords.x);
        state.observer.y = Math.round(worldCoords.y);
        updateInputValues();
        updateCalculations();
      } else if (isPanning) {
        state.view.offsetX = mouseX - startX;
        state.view.offsetY = mouseY - startY;
      }
    });

    window.addEventListener('mouseup', () => {
      isDraggingObserver = false;
      isPanning = false;
      if (mainCanvas) mainCanvas.style.cursor = 'crosshair';
    });

    // Zoom con la rueda del ratón
    mainCanvas.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      state.view.scale = Math.max(0.4, Math.min(6.0, state.view.scale * zoomFactor));
    }, { passive: false });
  }

  function setupToolbar() {
    const btnZoomIn = document.getElementById('toolZoomIn');
    const btnZoomOut = document.getElementById('toolZoomOut');
    const btnReset = document.getElementById('toolReset');
    const btnTheme = document.getElementById('toolTheme');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        state.view.scale = Math.min(6.0, state.view.scale * 1.25);
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        state.view.scale = Math.max(0.4, state.view.scale * 0.8);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        state.view.scale = 1.8;
        state.view.offsetX = 0;
        state.view.offsetY = 0;
      });
    }

    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.body.classList.toggle('theme-dark', state.theme === 'dark');
        btnTheme.innerHTML = state.theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      });
    }
  }

  // ==========================================================================
  // 11. SINTETIZADOR DE AUDIO DOPPLER EN TIEMPO REAL (WEB AUDIO API)
  // ==========================================================================
  function setupAudio() {
    const audioBtn = document.getElementById('btnToggleAudio');
    if (!audioBtn) return;

    audioBtn.addEventListener('click', () => {
      if (!state.audioEnabled) {
        startAudio();
      } else {
        stopAudio();
      }
    });
  }

  function startAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!state.audioCtx) state.audioCtx = new AudioContext();

      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }

      // Ganancia master
      state.gainNode = state.audioCtx.createGain();
      state.gainNode.gain.setValueAtTime(0.001, state.audioCtx.currentTime);

      // Panner estéreo espacial
      if (state.audioCtx.createStereoPanner) {
        state.pannerNode = state.audioCtx.createStereoPanner();
        state.pannerNode.connect(state.audioCtx.destination);
        state.gainNode.connect(state.pannerNode);
      } else {
        state.gainNode.connect(state.audioCtx.destination);
      }

      // Oscilador fundamental
      state.osc1 = state.audioCtx.createOscillator();
      state.osc1.type = 'sawtooth';

      // Oscilador armónico secundario para timbre realista de sirena/vehículo
      state.osc2 = state.audioCtx.createOscillator();
      state.osc2.type = 'sine';

      state.osc1.connect(state.gainNode);
      state.osc2.connect(state.gainNode);

      state.osc1.start();
      state.osc2.start();

      state.gainNode.gain.exponentialRampToValueAtTime(0.18, state.audioCtx.currentTime + 0.1);

      state.audioEnabled = true;
      const audioBtn = document.getElementById('btnToggleAudio');
      if (audioBtn) {
        audioBtn.classList.add('active');
        audioBtn.innerHTML = '<i class="fas fa-volume-high"></i> <span>Audio ON</span>';
      }
    } catch (err) {
      console.warn('Error inicializando Web Audio API:', err);
    }
  }

  function stopAudio() {
    if (state.gainNode && state.audioCtx) {
      state.gainNode.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.08);
      setTimeout(() => {
        if (state.osc1) { state.osc1.stop(); state.osc1.disconnect(); state.osc1 = null; }
        if (state.osc2) { state.osc2.stop(); state.osc2.disconnect(); state.osc2 = null; }
      }, 100);
    }
    state.audioEnabled = false;
    const audioBtn = document.getElementById('btnToggleAudio');
    if (audioBtn) {
      audioBtn.classList.remove('active');
      audioBtn.innerHTML = '<i class="fas fa-volume-xmark"></i> <span>Activar Audio</span>';
    }
  }

  function updateAudio(q) {
    if (!state.audioEnabled || !state.audioCtx || !state.osc1) return;

    const curTime = state.audioCtx.currentTime;
    const safePitch = Math.max(60, Math.min(2400, Math.abs(q.fo)));

    // Modulación de tono según la frecuencia recibida calculada
    state.osc1.frequency.setTargetAtTime(safePitch, curTime, 0.035);
    state.osc2.frequency.setTargetAtTime(safePitch * 1.5, curTime, 0.035);

    // Atenuación de volumen por distancia r (1 / (1 + r/40))
    const vol = Math.max(0.02, Math.min(0.28, 14 / (14 + q.dist * 0.4)));
    state.gainNode.gain.setTargetAtTime(vol, curTime, 0.05);

    // Panning estéreo (de izquierda a derecha respecto al observador)
    if (state.pannerNode) {
      const panVal = Math.max(-1, Math.min(1, (q.src.x - q.obs.x) / 80));
      state.pannerNode.pan.setTargetAtTime(panVal, curTime, 0.05);
    }

    // Estampido sónico al cruzar el cono de Mach
    if (q.mach >= 1.0 && !state.boomPlayed) {
      const machAngle = Math.asin(1 / q.mach);
      const coneX = q.src.x - Math.abs(q.obs.y) / Math.tan(machAngle);
      if (coneX >= q.obs.x) {
        playSonicBoom();
        state.boomPlayed = true;
      }
    }
  }

  function playSonicBoom() {
    if (!state.audioCtx) return;
    try {
      const bufferSize = state.audioCtx.sampleRate * 0.35;
      const noiseBuffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = state.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = state.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, state.audioCtx.currentTime);

      const boomGain = state.audioCtx.createGain();
      boomGain.gain.setValueAtTime(0.6, state.audioCtx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.34);

      whiteNoise.connect(filter);
      filter.connect(boomGain);
      boomGain.connect(state.audioCtx.destination);

      whiteNoise.start();
    } catch (e) {
      console.warn('Sonic boom error:', e);
    }
  }

  // ==========================================================================
  // 12. EXPORTACIÓN DE IMÁGENES Y DATOS JSON
  // ==========================================================================
  function setupExport() {
    const btnPNG = document.getElementById('btnExportPNG');
    if (btnPNG) {
      btnPNG.addEventListener('click', () => {
        if (!mainCanvas) return;
        const link = document.createElement('a');
        link.download = `doppler-lab-f3mo-${Date.now()}.png`;
        link.href = mainCanvas.toDataURL('image/png');
        link.click();
      });
    }

    const btnJSON = document.getElementById('btnExportJSON');
    if (btnJSON) {
      btnJSON.addEventListener('click', () => {
        const configData = {
          title: 'Laboratorio de Efecto Doppler - Física III',
          timestamp: new Date().toISOString(),
          parameters: {
            c: state.c,
            vs: state.vs,
            vo: state.vo,
            fs: state.fs,
            observer: state.observer
          }
        };
        const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `doppler-config-${Date.now()}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  // Ejecución cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
