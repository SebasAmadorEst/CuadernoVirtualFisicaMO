/**
 * ============================================================================
 * MAIN APPLICATION CONTROLLER
 * Cuaderno Interactivo Virtual: Movimiento Ondulatorio - Física III
 * Autores: Camila Mora Pineda & Juan Sebastián Amador Martínez
 * ============================================================================
 * - Gestión de Páginas Secuenciales (1 a 20, 10 pliegos a doble página)
 * - Navegación responsiva por botones, selector desplegable, teclado y swipe táctil
 * - Integración de simuladores físicos y sintetizadores de audio Web Audio API
 * - Renderizado matemático KaTeX
 * - Banco de ejercicios guiados de 5 fases y quizzes formativos con feedback inmediato
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. Instanciación de Simuladores Interactivos
  let travelingWaveSim = null;
  let stringWaveSim = null;
  let standingWaveSim = null;
  let dopplerMachSim = null;
  let beatsAudioSim = null;
  let musicalKeyboardSim = null;
  let fourierSim = null;

  try {
    travelingWaveSim = new TravelingWaveSim('canvasTravelingWave');
    stringWaveSim = new StringWaveSim('canvasStringWave');
    standingWaveSim = new StandingWaveSim('canvasStandingWave');
    dopplerMachSim = new DopplerMachSim('canvasDopplerMach');
    beatsAudioSim = new BeatsAudioSim('canvasBeatsWave');
    musicalKeyboardSim = new MusicalKeyboardSim('pianoKeyboardGrid');
    fourierSim = new FourierSim('canvasFourier');
  } catch (err) {
    console.warn('Error inicializando simuladores:', err);
  }

  // 2. Control de Paginación del Cuaderno Virtual
  const notebookStage = document.getElementById('notebookStage');
  const pageCover = document.getElementById('page-cover');
  const contentPages = [
    ...document.querySelectorAll('.notebook-page:not(.page-cover)')
  ];
  const allPages = [pageCover, ...contentPages].filter(Boolean);

  // Soporte de scroll interno suave en cada página sin romper el layout
  contentPages.forEach(page => {
    const contentWrapper = page.querySelector('.page-content-wrapper');
    if (contentWrapper) {
      contentWrapper.addEventListener('wheel', event => {
        const maximumScroll = contentWrapper.scrollHeight - contentWrapper.clientHeight;
        if (maximumScroll <= 0) return;
        contentWrapper.scrollTop = Math.max(0, Math.min(maximumScroll, contentWrapper.scrollTop + event.deltaY));
        event.preventDefault();
      }, { passive: false });
    }
  });

  const pageSelector = document.getElementById('pageSelector');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnHome = document.getElementById('btnHome');
  const btnEnd = document.getElementById('btnEnd');
  const btnOpenNotebook = document.getElementById('btnOpenNotebook');

  let currentPage = 0;   // 0 = Portada, 1..20 = Páginas
  let currentSpread = 0; // 0 = Cerrado, 1..10 = Pliegos dobles
  const TOTAL_CONTENT_PAGES = contentPages.length; // 20
  const TOTAL_SPREADS = Math.ceil(TOTAL_CONTENT_PAGES / 2); // 10

  function isTwoPageMode() {
    return window.innerWidth >= 1024;
  }

  const PAGE_TITLES = [
    'Índice & Reseña Histórica',
    'Línea de Tiempo & Mapa Mental',
    'Función de Onda & EDP 1D',
    'Ondas Armónicas & Cinemática',
    'Ondas en Barras Sólidas (Y, G)',
    'Fluidos y Sonido en Gases',
    'Ondas en Cuerdas Tensas',
    'Superficie Libre de Líquidos',
    'Energía, Potencia e Intensidad',
    'Decibeles & Oído Humano',
    'Cualidades & Escala Musical',
    'Ondas 3D & Ley Inversa',
    'Membranas 2D (Chladni)',
    'Interferencia Espacial (Hipérbolas)',
    'Ondas Estacionarias en Cuerdas',
    'Tubos Sonoros (Abiertos/Cerrados)',
    'Efecto Doppler & Cono de Mach',
    'Batimientos (Pulsaciones)',
    'Reflexión, Refracción & Fronteras',
    'Síntesis de Fourier & Quizzes'
  ];

  function updatePageSelectorOptions() {
    if (!pageSelector) return;
    const isTwoPage = isTwoPageMode();
    pageSelector.innerHTML = '';

    if (isTwoPage) {
      const options = [{ value: '0', text: 'Portada Oficial (Cerrado)' }];
      for (let spread = 1; spread <= TOTAL_SPREADS; spread++) {
        const first = (spread * 2) - 1;
        const last = Math.min(spread * 2, TOTAL_CONTENT_PAGES);
        const firstLabel = PAGE_TITLES[first - 1] || 'Tema';
        const lastLabel = PAGE_TITLES[last - 1] || firstLabel;
        options.push({ value: String(spread), text: `Págs. ${first}-${last}: ${firstLabel} · ${lastLabel}` });
      }
      options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.text;
        pageSelector.appendChild(el);
      });
      pageSelector.value = currentSpread.toString();
    } else {
      const options = [{ value: '0', text: 'Portada Oficial (Cubierta)' }];
      for (let page = 1; page <= TOTAL_CONTENT_PAGES; page++) {
        options.push({ value: String(page), text: `Pág. ${page}: ${PAGE_TITLES[page - 1] || 'Tema'}` });
      }
      options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.text;
        pageSelector.appendChild(el);
      });
      pageSelector.value = currentPage.toString();
    }
  }

  function renderMathOnPages(elements) {
    if (window.renderMathInElement) {
      elements.forEach(el => {
        if (el) {
          renderMathInElement(el, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        }
      });
    }
  }

  function refreshActiveSimulators() {
    setTimeout(() => {
      if (travelingWaveSim) travelingWaveSim.resize();
      if (stringWaveSim) stringWaveSim.resize();
      if (standingWaveSim) standingWaveSim.resize();
      if (dopplerMachSim) dopplerMachSim.resize();
      if (beatsAudioSim) beatsAudioSim.resize();
      if (fourierSim) fourierSim.resize();
    }, 100);
  }

  function renderTwoPageSpread(spread) {
    if (spread < 0) spread = 0;
    if (spread > TOTAL_SPREADS) spread = TOTAL_SPREADS;
    currentSpread = spread;
    currentPage = spread === 0 ? 0 : (spread * 2 - 1);

    allPages.forEach(p => {
      p.classList.remove('active', 'page-left', 'page-right', 'page-enter');
    });

    const activeElements = [];

    if (currentSpread === 0) {
      if (notebookStage) {
        notebookStage.classList.add('stage-closed');
        notebookStage.classList.remove('stage-open');
      }
      if (pageCover) {
        pageCover.classList.add('active');
        activeElements.push(pageCover);
      }
      if (btnPrev) btnPrev.disabled = true;
      if (btnNext) {
        btnNext.disabled = false;
        btnNext.innerHTML = 'Abrir <i class="fas fa-book-open"></i>';
      }
    } else {
      if (notebookStage) {
        notebookStage.classList.remove('stage-closed');
        notebookStage.classList.add('stage-open');
      }

      const leftIdx = (currentSpread * 2) - 2;
      const rightIdx = (currentSpread * 2) - 1;

      const leftPage = contentPages[leftIdx];
      const rightPage = contentPages[rightIdx];

      if (leftPage) {
        leftPage.classList.add('active', 'page-left');
        leftPage.offsetWidth;
        leftPage.classList.add('page-enter');
        activeElements.push(leftPage);
      }
      if (rightPage) {
        rightPage.classList.add('active', 'page-right');
        rightPage.offsetWidth;
        rightPage.classList.add('page-enter');
        activeElements.push(rightPage);
      }

      if (btnPrev) btnPrev.disabled = false;
      if (btnNext) {
        btnNext.disabled = currentSpread >= TOTAL_SPREADS;
        btnNext.innerHTML = 'Siguiente <i class="fas fa-chevron-right"></i>';
      }
    }

    if (pageSelector) pageSelector.value = currentSpread.toString();

    renderMathOnPages(activeElements);
    refreshActiveSimulators();
  }

  function renderSinglePage(pageIndex) {
    if (pageIndex < 0) pageIndex = 0;
    if (pageIndex > TOTAL_CONTENT_PAGES) pageIndex = TOTAL_CONTENT_PAGES;
    currentPage = pageIndex;
    currentSpread = currentPage === 0 ? 0 : Math.ceil(currentPage / 2);

    allPages.forEach(p => {
      p.classList.remove('active', 'page-left', 'page-right', 'page-enter');
    });

    if (notebookStage) {
      if (currentPage === 0) {
        notebookStage.classList.add('stage-closed');
        notebookStage.classList.remove('stage-open');
      } else {
        notebookStage.classList.remove('stage-closed');
        notebookStage.classList.add('stage-open');
      }
    }

    const activeEl = currentPage === 0 ? pageCover : contentPages[currentPage - 1];
    if (activeEl) {
      activeEl.classList.add('active');
      activeEl.offsetWidth;
      activeEl.classList.add('page-enter');
    }

    if (btnPrev) btnPrev.disabled = currentPage === 0;
    if (btnNext) {
      btnNext.disabled = currentPage >= TOTAL_CONTENT_PAGES;
      btnNext.innerHTML = currentPage === 0
        ? 'Abrir <i class="fas fa-book-open"></i>'
        : 'Siguiente <i class="fas fa-chevron-right"></i>';
    }

    if (pageSelector) pageSelector.value = currentPage.toString();

    if (activeEl) renderMathOnPages([activeEl]);
    refreshActiveSimulators();
  }

  function navigateTo(target) {
    if (musicalKeyboardSim && typeof musicalKeyboardSim.stopMelody === 'function') {
      const targetPage = typeof target === 'number' ? target : 0;
      if (targetPage !== 11 && targetPage !== 12 && (Math.ceil(targetPage / 2) !== 6)) {
        musicalKeyboardSim.stopMelody();
      }
    }
    if (isTwoPageMode()) {
      let targetSpread = 0;
      if (typeof target === 'number') {
        targetSpread = target === 0 ? 0 : Math.ceil(target / 2);
      }
      renderTwoPageSpread(targetSpread);
    } else {
      renderSinglePage(target);
    }
  }

  // 3. Botones y Eventos de Paginación
  if (btnOpenNotebook) {
    btnOpenNotebook.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateTo(1);
    });
  }

  if (pageCover) {
    pageCover.addEventListener('click', (e) => {
      if (currentPage === 0 || currentSpread === 0) {
        navigateTo(1);
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (isTwoPageMode()) renderTwoPageSpread(currentSpread - 1);
      else renderSinglePage(currentPage - 1);
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (isTwoPageMode()) renderTwoPageSpread(currentSpread + 1);
      else renderSinglePage(currentPage + 1);
    });
  }

  if (btnHome) {
    btnHome.addEventListener('click', () => navigateTo(0));
  }

  if (btnEnd) {
    btnEnd.addEventListener('click', () => navigateTo(TOTAL_CONTENT_PAGES));
  }

  if (pageSelector) {
    pageSelector.addEventListener('change', e => {
      const val = parseInt(e.target.value, 10);
      if (isTwoPageMode()) renderTwoPageSpread(val);
      else renderSinglePage(val);
    });
  }

  // Enlaces de salto directo en el índice general (Página 1)
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-goto-page]');
    if (link) {
      e.preventDefault();
      const pageNum = parseInt(link.getAttribute('data-goto-page'), 10);
      navigateTo(pageNum);
    }
  });

  // Atajos de teclado
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (isTwoPageMode()) renderTwoPageSpread(currentSpread + 1);
      else renderSinglePage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (isTwoPageMode()) renderTwoPageSpread(currentSpread - 1);
      else renderSinglePage(currentPage - 1);
    } else if (e.key === 'Home') {
      navigateTo(0);
    } else if (e.key === 'End') {
      navigateTo(TOTAL_CONTENT_PAGES);
    }
  });

  // Soporte de gestos táctiles (Swipe)
  let touchStartX = 0;
  let touchStartY = 0;
  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        if (isTwoPageMode()) renderTwoPageSpread(currentSpread + 1);
        else renderSinglePage(currentPage + 1);
      } else {
        if (isTwoPageMode()) renderTwoPageSpread(currentSpread - 1);
        else renderSinglePage(currentPage - 1);
      }
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    updatePageSelectorOptions();
    if (isTwoPageMode()) renderTwoPageSpread(currentSpread);
    else renderSinglePage(currentPage);
  });

  // 4. Selector de Ejercicios Guiados
  document.querySelectorAll('.exercise-selector').forEach(sel => {
    sel.addEventListener('change', e => {
      const group = e.target.closest('.exercise-group');
      if (!group) return;
      const targetEx = e.target.value;
      group.querySelectorAll('.exercise-card').forEach(card => {
        if (card.getAttribute('data-exercise') === targetEx) {
          card.style.display = 'block';
          renderMathOnPages([card]);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 5. Calculadora Acústica: Sonómetro Digital de Laboratorio (Página 10)
  function initDecibelCalculator() {
    const slider1 = document.getElementById('sliderCh1Beta');
    const slider2 = document.getElementById('sliderCh2Beta');
    const inputI1 = document.getElementById('inputSonoI1');
    const inputI2 = document.getElementById('inputSonoI2');
    const labelBeta1 = document.getElementById('labelCh1Beta');
    const labelBeta2 = document.getElementById('labelCh2Beta');
    const readBeta1 = document.getElementById('readCh1Beta');
    const readBeta2 = document.getElementById('readCh2Beta');
    const sonoBetaTot = document.getElementById('sonoBetaTot');
    const sonoITot = document.getElementById('sonoITot');
    const sonoDelta = document.getElementById('sonoDelta');
    const gaugeBar = document.getElementById('gaugeBar');
    const gaugeCursor = document.getElementById('gaugeCursor');
    const sonoInsight = document.getElementById('sonoInsight');
    const presetBtns = document.querySelectorAll('.sono-preset-btn');
    const btnAudio = document.getElementById('btnPlaySonoTone');

    const I0 = 1e-12; // W/m^2 (umbral de audición)
    let currentBeta1 = 80;
    let currentBeta2 = 75;

    // Web Audio sintetizador para escuchar el nivel sonoro
    let audioCtx = null;
    let osc1 = null;
    let osc2 = null;
    let masterGain = null;
    let isPlayingAudio = false;

    function recalculate() {
      const i1 = I0 * Math.pow(10, currentBeta1 / 10);
      const i2 = I0 * Math.pow(10, currentBeta2 / 10);
      const iTot = i1 + i2;
      const betaTot = 10 * Math.log10(Math.max(1e-15, iTot) / I0);
      const maxBeta = Math.max(currentBeta1, currentBeta2);
      const delta = betaTot - maxBeta;

      // Actualizar valores del Canal A
      if (slider1) slider1.value = currentBeta1;
      if (labelBeta1) labelBeta1.textContent = `${currentBeta1.toFixed(0)} dB`;
      if (readBeta1) readBeta1.textContent = `${currentBeta1.toFixed(1)} dB`;
      if (inputI1 && document.activeElement !== inputI1) {
        inputI1.value = i1 < 1e-4 ? i1.toExponential(3) : i1.toFixed(6);
      }

      // Actualizar valores del Canal B
      if (slider2) slider2.value = currentBeta2;
      if (labelBeta2) labelBeta2.textContent = `${currentBeta2.toFixed(0)} dB`;
      if (readBeta2) readBeta2.textContent = `${currentBeta2.toFixed(1)} dB`;
      if (inputI2 && document.activeElement !== inputI2) {
        inputI2.value = i2 < 1e-4 ? i2.toExponential(3) : i2.toFixed(6);
      }

      // Pantalla OLED Principal
      if (sonoBetaTot) sonoBetaTot.textContent = betaTot.toFixed(2);
      if (sonoITot) sonoITot.textContent = `${iTot.toExponential(3)} W/m²`;
      if (sonoDelta) sonoDelta.textContent = `+${delta.toFixed(2)} dB s/máx`;

      // Barra de nivel LED (0 a 130 dB)
      const pct = Math.min(100, Math.max(0, (betaTot / 130) * 100));
      if (gaugeBar) gaugeBar.style.width = `${pct}%`;
      if (gaugeCursor) gaugeCursor.style.left = `${pct}%`;

      // Mensaje de interpretación física
      if (sonoInsight) {
        const diff = Math.abs(currentBeta1 - currentBeta2);
        let msg = '';
        if (diff < 0.2) {
          msg = `<i class="fas fa-lightbulb" style="color:#f59e0b;"></i> <strong>¡Fuentes idénticas!</strong> Duplicar la potencia física (+100%) suma exactamente <strong>+3.01 dB</strong> (de ${currentBeta1.toFixed(1)} a ${betaTot.toFixed(2)} dB).`;
        } else if (diff >= 15) {
          msg = `<i class="fas fa-bullhorn" style="color:#00f0ff;"></i> <strong>Efecto Máscara:</strong> La fuente de ${maxBeta.toFixed(1)} dB domina por completo. La fuente débil solo aporta +${delta.toFixed(2)} dB insignificantes.`;
        } else {
          msg = `<i class="fas fa-check-circle" style="color:#10b981;"></i> <strong>Superposición Acústica:</strong> ${currentBeta1.toFixed(1)} dB + ${currentBeta2.toFixed(1)} dB producen ${betaTot.toFixed(2)} dB (+${delta.toFixed(2)} dB sobre la fuente más ruidosa).`;
        }
        sonoInsight.innerHTML = msg;
      }

      // Actualizar volumen del oscilador Web Audio si está activo
      if (isPlayingAudio && masterGain && audioCtx) {
        // Mapear decibeles (30-100 dB) a ganancia audible cómoda (0.01 a 0.2)
        const targetGain = Math.min(0.25, Math.max(0.005, Math.pow(10, (betaTot - 80) / 40) * 0.08));
        masterGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);
      }
    }

    // Eventos de Sliders
    if (slider1) {
      slider1.addEventListener('input', e => {
        currentBeta1 = parseFloat(e.target.value);
        recalculate();
      });
    }

    if (slider2) {
      slider2.addEventListener('input', e => {
        currentBeta2 = parseFloat(e.target.value);
        recalculate();
      });
    }

    // Eventos de Inputs de Intensidad Física
    if (inputI1) {
      inputI1.addEventListener('change', e => {
        const val = Math.max(1e-15, parseFloat(e.target.value) || 1e-12);
        currentBeta1 = Math.min(130, Math.max(0, 10 * Math.log10(val / I0)));
        recalculate();
      });
    }

    if (inputI2) {
      inputI2.addEventListener('change', e => {
        const val = Math.max(1e-15, parseFloat(e.target.value) || 1e-12);
        currentBeta2 = Math.min(130, Math.max(0, 10 * Math.log10(val / I0)));
        recalculate();
      });
    }

    // Presets Rápidos
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const b1 = parseFloat(btn.getAttribute('data-b1'));
        const b2 = parseFloat(btn.getAttribute('data-b2'));
        if (!isNaN(b1) && !isNaN(b2)) {
          currentBeta1 = b1;
          currentBeta2 = b2;
          recalculate();
        }
      });
    });

    // Sintetizador Web Audio para escuchar el tono acústico
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        if (isPlayingAudio) {
          // Detener audio
          try {
            if (osc1) osc1.stop();
            if (osc2) osc2.stop();
          } catch (err) {}
          isPlayingAudio = false;
          btnAudio.classList.remove('is-playing');
          btnAudio.innerHTML = '<i class="fas fa-volume-high"></i> <span>Escuchar Tono Combinado</span>';
        } else {
          // Iniciar audio
          try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            audioCtx = new AudioContextClass();
            if (audioCtx.state === 'suspended') audioCtx.resume();

            masterGain = audioCtx.createGain();
            masterGain.connect(audioCtx.destination);

            // Generador de tono senoidal a 440 Hz
            osc1 = audioCtx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(440, audioCtx.currentTime);

            osc2 = audioCtx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(440, audioCtx.currentTime);

            osc1.connect(masterGain);
            osc2.connect(masterGain);

            osc1.start();
            osc2.start();

            isPlayingAudio = true;
            btnAudio.classList.add('is-playing');
            btnAudio.innerHTML = '<i class="fas fa-stop"></i> <span>Detener Audio</span>';
            recalculate();
          } catch (err) {
            console.warn('Audio no disponible:', err);
          }
        }
      });
    }

    recalculate();
  }

  initDecibelCalculator();

  // 6. Quizzes Formativos con Validación y Reinicio
  function setupQuizzes() {
    document.querySelectorAll('.quiz-panel').forEach(panel => {
      const validateBtn = panel.querySelector('.quiz-validate-btn');
      const resetBtn = panel.querySelector('.quiz-reset-btn');
      const resultDiv = panel.querySelector('.quiz-result');

      if (validateBtn) {
        validateBtn.addEventListener('click', () => {
          let score = 0;
          const questions = panel.querySelectorAll('.quiz-question');
          questions.forEach(q => {
            const correct = q.getAttribute('data-answer');
            const answerText = q.getAttribute('data-answer-text') || '';
            const checked = q.querySelector('input[type="radio"]:checked');
            const feedback = q.querySelector('.quiz-feedback');

            if (checked && checked.value === correct) {
              score++;
              q.classList.add('is-correct');
              q.classList.remove('is-incorrect', 'is-wrong');
              if (feedback) feedback.innerHTML = '<span style="color:#16a34a"><i class="fas fa-check-circle"></i> ¡Correcto!</span>';
            } else {
              q.classList.add('is-incorrect', 'is-wrong');
              q.classList.remove('is-correct');
              if (feedback) feedback.innerHTML = `<span style="color:#dc2626"><i class="fas fa-times-circle"></i> Incorrecto. Respuesta correcta: <strong>${answerText}</strong></span>`;
            }
          });

          if (resultDiv) {
            const percent = Math.round((score / questions.length) * 100);
            resultDiv.classList.add('visible');
            const praise = percent === 100 ? '¡Dominio perfecto del tema!' : percent >= 75 ? '¡Muy buen resultado!' : 'Repasa las secciones de esta unidad para reforzar.';
            resultDiv.innerHTML = `<div class="quiz-score-badge"><i class="fas fa-award"></i> Calificación: <strong>${score} de ${questions.length}</strong> (${percent}%) — ${praise}</div>`;
          }
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          panel.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
          panel.querySelectorAll('.quiz-question').forEach(q => {
            q.classList.remove('is-correct', 'is-incorrect', 'is-wrong');
            const fb = q.querySelector('.quiz-feedback');
            if (fb) fb.innerHTML = '';
          });
          if (resultDiv) {
            resultDiv.classList.remove('visible');
            resultDiv.innerHTML = '';
          }
        });
      }
    });
  }

  setupQuizzes();

  // 7. Inicialización de Estado y Renderizado con Soporte de Enlaces Hash
  updatePageSelectorOptions();

  let initialPage = 0;
  const hash = window.location.hash;
  if (hash && hash.startsWith('#page-')) {
    const pNum = parseInt(hash.replace('#page-', ''), 10);
    if (!isNaN(pNum) && pNum >= 0 && pNum <= TOTAL_CONTENT_PAGES) {
      initialPage = pNum;
    }
  }
  navigateTo(initialPage);

  window.addEventListener('hashchange', () => {
    const h = window.location.hash;
    if (h && h.startsWith('#page-')) {
      const pNum = parseInt(h.replace('#page-', ''), 10);
      if (!isNaN(pNum) && pNum >= 0 && pNum <= TOTAL_CONTENT_PAGES) {
        navigateTo(pNum);
      }
    }
  });
});
