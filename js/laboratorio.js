/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL DEL LABORATORIO DE MOVIMIENTO ONDULATORIO (MO)
 * ============================================================================
 * - Coordinación entre WaveEngine, GeoGebraWavePlane y la interfaz de usuario
 * - Sincronización en tiempo real entre vista principal y ventana modal ampliada
 * - Panel ajustable (Splitter) en escritorio y pestañas plegables en móvil
 * - Teclado virtual matemático interactivo con vista previa en vivo vía KaTeX
 * - Paleta completa de personalización estética y temas claro / oscuro
 * - Experiencia didáctica con 5 casos de estudio y preguntas de predicción
 * - Exportación / Importación completa a JSON y exportación de gráfica en PNG
 */

function initLaboratorio() {
  'use strict';

  // 1. Inicialización de motores
  const engine = new WaveEngine();
  const mainPlane = new GeoGebraWavePlane('waveCanvas', engine, {
    scaleX: 60,
    scaleY: 60,
    originXRatio: 0.5,
    originYRatio: 0.5
  });

  let modalPlane = null;
  let activeFormulaInput = null; // Input enfocado para el teclado virtual
  let lastFocusedElement = null; // Para restaurar foco al cerrar modal

  const byId = id => document.getElementById(id);
  const byClass = cls => document.getElementsByClassName(cls);

  // 2. Renderizado de fórmulas KaTeX
  function renderMath(element) {
    if (!element) return;
    if (window.renderMathInElement) {
      window.renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }

  // 3. Sincronización del bucle de animación único (60 FPS)
  let lastTimestamp = performance.now();
  function animationLoop(currentTimestamp) {
    const dt = (currentTimestamp - lastTimestamp) / 1000;
    lastTimestamp = currentTimestamp;

    if (engine.isPlaying) {
      engine.step(dt);
      updateTimeReadout();
    }

    // Renderizar lienzo principal
    mainPlane.render();

    // Si la ventana modal está abierta y no minimizada, renderizar también el lienzo modal
    const modal = byId('expandedModal');
    if (modal && modal.classList.contains('open') && !modal.classList.contains('minimized')) {
      if (modalPlane) {
        modalPlane.render();
      }
    }

    // Actualizar inspector si está activo
    if (mainPlane.mode === 'inspect') {
      mainPlane.triggerInspect();
    }

    requestAnimationFrame(animationLoop);
  }
  requestAnimationFrame(animationLoop);

  // 4. Actualización de lecturas de tiempo y controles de transporte
  function updateTimeReadout() {
    const tFormatted = engine.time.toFixed(2);
    const timeOut = byId('currentTime');
    const timeSlider = byId('timeSlider');
    const modalTimeOut = byId('modalCurrentTime');
    const modalTimeSlider = byId('modalTimeSlider');
    const dockTime = byId('dockTimeReadout');

    if (timeOut) timeOut.textContent = `${tFormatted} s`;
    if (timeSlider && !timeSlider.dataset.dragging) timeSlider.value = tFormatted;
    if (modalTimeOut) modalTimeOut.textContent = `${tFormatted} s`;
    if (modalTimeSlider && !modalTimeSlider.dataset.dragging) modalTimeSlider.value = tFormatted;
    if (dockTime) dockTime.textContent = `${tFormatted} s`;
  }

  function updatePlayPauseButtons() {
    const isPlaying = engine.isPlaying;
    const playIcon = isPlaying ? 'fa-pause' : 'fa-play';
    const label = isPlaying ? 'Pausar simulación' : 'Reproducir simulación';

    const mainBtn = byId('playToggle');
    const modalBtn = byId('modalPlayToggle');
    const dockBtn = byId('dockPlayToggle');

    [mainBtn, modalBtn, dockBtn].forEach(btn => {
      if (!btn) return;
      btn.innerHTML = `<i class="fas ${playIcon}"></i>`;
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      if (isPlaying) {
        btn.classList.add('playing');
      } else {
        btn.classList.remove('playing');
      }
    });
  }

  // 5. Configuración de controles de transporte
  byId('playToggle')?.addEventListener('click', () => {
    engine.togglePlay();
    updatePlayPauseButtons();
  });
  byId('resetTime')?.addEventListener('click', () => {
    engine.resetTime();
    updateTimeReadout();
  });
  byId('stepBack')?.addEventListener('click', () => {
    engine.stepBackward(0.05);
    updateTimeReadout();
  });
  byId('stepForward')?.addEventListener('click', () => {
    engine.stepForward(0.05);
    updateTimeReadout();
  });

  const timeSlider = byId('timeSlider');
  if (timeSlider) {
    timeSlider.addEventListener('mousedown', () => { timeSlider.dataset.dragging = 'true'; });
    timeSlider.addEventListener('touchstart', () => { timeSlider.dataset.dragging = 'true'; });
    timeSlider.addEventListener('input', (e) => {
      engine.setTime(Number(e.target.value));
      updateTimeReadout();
    });
    timeSlider.addEventListener('mouseup', () => { delete timeSlider.dataset.dragging; });
    timeSlider.addEventListener('touchend', () => { delete timeSlider.dataset.dragging; });
  }

  byId('speedSelect')?.addEventListener('change', (e) => {
    engine.setSpeed(Number(e.target.value));
  });

  // 6. Barra de herramientas del lienzo (Zoom, Paneo, Inspector, Reset)
  function setupPlotToolbar(prefix = '') {
    const p = prefix;
    byId(`${p}toolZoomIn`)?.addEventListener('click', () => {
      (prefix ? modalPlane : mainPlane).zoom(1.2);
    });
    byId(`${p}toolZoomOut`)?.addEventListener('click', () => {
      (prefix ? modalPlane : mainPlane).zoom(0.83);
    });
    byId(`${p}toolReset`)?.addEventListener('click', () => {
      (prefix ? modalPlane : mainPlane).resetView();
    });

    const panBtn = byId(`${p}toolPan`);
    const inspectBtn = byId(`${p}toolInspect`);

    panBtn?.addEventListener('click', () => {
      mainPlane.mode = 'pan';
      if (modalPlane) modalPlane.mode = 'pan';
      panBtn.classList.add('active');
      inspectBtn?.classList.remove('active');
      byId('inspectorBox')?.classList.remove('active');
    });

    inspectBtn?.addEventListener('click', () => {
      mainPlane.mode = 'inspect';
      if (modalPlane) modalPlane.mode = 'inspect';
      inspectBtn.classList.add('active');
      panBtn?.classList.remove('active');
      byId('inspectorBox')?.classList.add('active');
      mainPlane.triggerInspect();
    });
  }
  setupPlotToolbar('');
  setupPlotToolbar('modal_');

  // Callback del inspector para mostrar datos exactos en el HUD
  mainPlane.onInspectUpdate = (info, px, py) => {
    updateInspectorHUD(info, px, py);
  };

  function updateInspectorHUD(info, px, py) {
    const box = byId('inspectorBox');
    if (!box) return;

    byId('inspectCoordX').textContent = `${info.x >= 0 ? '+' : ''}${info.x.toFixed(2)} m`;
    byId('inspectCoordT').textContent = `${info.t.toFixed(2)} s`;
    byId('inspectResultantVal').textContent = `${info.resultant >= 0 ? '+' : ''}${info.resultant.toFixed(3)} m`;

    const list = byId('inspectComponentsList');
    if (list) {
      list.innerHTML = '';
      info.components.forEach((c) => {
        const item = document.createElement('div');
        item.className = 'inspect-item';
        const statusBadge = !c.activeInSum ? '<span class="tag-excluded" title="Excluida de la suma resultante">(Excl.)</span>' : '';
        const hiddenBadge = !c.visible ? '<span class="tag-hidden" title="Oculta del gráfico">(Oculta)</span>' : '';
        
        item.innerHTML = `
          <div class="inspect-item-name">
            <span class="color-swatch" style="background:${c.color}"></span>
            <span>${c.name}</span>
            ${statusBadge}
            ${hiddenBadge}
          </div>
          <strong>${Number.isFinite(c.value) ? (c.value >= 0 ? '+' : '') + c.value.toFixed(3) : 'NaN'} m</strong>
        `;
        list.appendChild(item);
      });
    }

    // Tooltip flotante sobre el canvas
    const tooltip = byId('geoTooltip');
    if (tooltip && mainPlane.mode === 'inspect') {
      tooltip.style.display = 'block';
      tooltip.style.left = `${Math.max(10, Math.min(mainPlane.width - 150, px))}px`;
      tooltip.style.top = `${Math.max(15, Math.min(mainPlane.height - 70, py - 15))}px`;
      tooltip.innerHTML = `
        <div><b>x:</b> ${info.x.toFixed(2)} m &nbsp;|&nbsp; <b>t:</b> ${info.t.toFixed(2)} s</div>
        <div><b>y<sub>total</sub>:</b> ${info.resultant.toFixed(3)} m</div>
      `;
    }
  }

  // 7. Lista de componentes y editor interactivo
  function renderComponentsList() {
    const container = byId('componentsContainer');
    if (!container) return;
    container.innerHTML = '';

    engine.components.forEach((comp, index) => {
      const card = document.createElement('div');
      card.className = `component-card ${comp.visible ? '' : 'is-hidden-curve'} ${comp.activeInSum ? '' : 'is-excluded-sum'}`;
      card.dataset.id = comp.id;

      // Generar formulario dinámico según tipo
      let specificParamsHTML = '';
      if (comp.type === 'gaussian' || comp.type === 'triangular' || comp.type === 'square' || comp.type === 'soliton') {
        specificParamsHTML = `
          <div class="param-row">
            <label>Centro inicial <i>x₀</i> [m]</label>
            <div class="input-twin">
              <input type="range" min="-12" max="12" step="0.1" value="${comp.x0}" data-param="x0">
              <input type="number" min="-20" max="20" step="0.1" value="${comp.x0.toFixed(2)}" data-param="x0" class="mini-number">
            </div>
          </div>
          <div class="param-row">
            <label>Ancho <i>w</i> [m]</label>
            <div class="input-twin">
              <input type="range" min="0.2" max="5" step="0.1" value="${comp.width}" data-param="width">
              <input type="number" min="0.1" max="10" step="0.1" value="${comp.width.toFixed(2)}" data-param="width" class="mini-number">
            </div>
          </div>
        `;
      } else if (comp.type === 'harmonic') {
        specificParamsHTML = `
          <div class="param-row">
            <label>Longitud de onda <i>λ</i> [m]</label>
            <div class="input-twin">
              <input type="range" min="0.5" max="12" step="0.1" value="${comp.wavelength}" data-param="wavelength">
              <input type="number" min="0.2" max="20" step="0.1" value="${comp.wavelength.toFixed(2)}" data-param="wavelength" class="mini-number">
            </div>
          </div>
          <div class="param-row">
            <label>Fase inicial <i>ϕ</i> [rad]</label>
            <div class="input-twin">
              <input type="range" min="-3.14" max="3.14" step="0.05" value="${comp.phase}" data-param="phase">
              <input type="number" min="-3.14" max="3.14" step="0.05" value="${comp.phase.toFixed(2)}" data-param="phase" class="mini-number">
            </div>
          </div>
        `;
      } else if (comp.type === 'custom') {
        specificParamsHTML = `
          <div class="param-row full-width">
            <label>Expresión f(x, t)</label>
            <div class="custom-formula-wrap">
              <input type="text" class="custom-formula-input" value="${comp.customExpression || ''}" placeholder="Ej: 1.5*exp(-((x-2*t+5)/1.2)^2)" data-param="customExpression">
              <button type="button" class="btn-open-vk" title="Abrir teclado matemático virtual" aria-label="Abrir teclado matemático"><i class="fas fa-keyboard"></i></button>
            </div>
            <div class="formula-latex-preview" id="preview_${comp.id}"></div>
          </div>
        `;
      }

      const vDirLabel = comp.velocity > 0 ? '→ Derecha (+x)' : (comp.velocity < 0 ? '← Izquierda (-x)' : '• Estacionaria');

      card.innerHTML = `
        <div class="comp-header">
          <div class="comp-title-group">
            <span class="color-indicator" style="background:${comp.style.color}"></span>
            <input type="text" class="comp-name-input" value="${comp.name}" data-action="rename" aria-label="Nombre de la componente">
          </div>
          <div class="comp-toggles" role="toolbar" aria-label="Controles de curva">
            <button type="button" class="toggle-btn ${comp.visible ? 'active' : ''}" data-action="toggle-visible" title="${comp.visible ? 'Visible en gráfico (clic para ocultar)' : 'Oculta en gráfico (clic para mostrar)'}" aria-label="Alternar visibilidad">
              <i class="fas ${comp.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
            </button>
            <button type="button" class="toggle-btn sum-btn ${comp.activeInSum ? 'active' : ''}" data-action="toggle-sum" title="${comp.activeInSum ? 'Incluida en la resultante (clic para excluir)' : 'Excluida de la resultante (clic para incluir)'}" aria-label="Alternar inclusión en la suma">
              <i class="fas fa-calculator"></i> <small>Σ</small>
            </button>
            <button type="button" class="toggle-btn delete-btn" data-action="delete" title="Eliminar componente" aria-label="Eliminar componente">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </div>

        <div class="comp-body">
          <div class="param-row">
            <label>Tipo de onda</label>
            <select class="type-selector" data-param="type">
              <option value="gaussian" ${comp.type === 'gaussian' ? 'selected' : ''}>Pulso Gaussiano</option>
              <option value="harmonic" ${comp.type === 'harmonic' ? 'selected' : ''}>Onda Sinusoidal Armónica</option>
              <option value="triangular" ${comp.type === 'triangular' ? 'selected' : ''}>Pulso Triangular</option>
              <option value="square" ${comp.type === 'square' ? 'selected' : ''}>Pulso Rectangular</option>
              <option value="soliton" ${comp.type === 'soliton' ? 'selected' : ''}>Solitón sech²</option>
              <option value="custom" ${comp.type === 'custom' ? 'selected' : ''}>Función personalizada f(x, t)</option>
            </select>
          </div>

          <div class="param-row">
            <label>Amplitud <i>A</i> [m]</label>
            <div class="input-twin">
              <input type="range" min="-3" max="3" step="0.05" value="${comp.amplitude}" data-param="amplitude">
              <input type="number" min="-5" max="5" step="0.05" value="${comp.amplitude.toFixed(2)}" data-param="amplitude" class="mini-number">
            </div>
          </div>

          <div class="param-row">
            <label>Velocidad <i>v</i> [m/s] <span class="v-dir">${vDirLabel}</span></label>
            <div class="input-twin">
              <input type="range" min="-5" max="5" step="0.1" value="${comp.velocity}" data-param="velocity">
              <input type="number" min="-10" max="10" step="0.1" value="${comp.velocity.toFixed(2)}" data-param="velocity" class="mini-number">
            </div>
          </div>

          ${specificParamsHTML}

          <div class="comp-style-bar">
            <span>Color & Trazo:</span>
            <input type="color" value="${comp.style.color}" data-style="color" title="Color de la curva" aria-label="Color de la curva">
            <select data-style="dash" title="Patrón de línea" aria-label="Patrón de línea">
              <option value="solid" ${!comp.style.dash || comp.style.dash.length === 0 ? 'selected' : ''}>Sólida</option>
              <option value="dashed" ${comp.style.dash && comp.style.dash[0] === 6 ? 'selected' : ''}>Guiones</option>
              <option value="dotted" ${comp.style.dash && comp.style.dash[0] === 2 ? 'selected' : ''}>Puntos</option>
            </select>
            <input type="range" min="1" max="5" step="0.5" value="${comp.style.lineWidth}" data-style="lineWidth" title="Grosor de línea" aria-label="Grosor de línea" style="width:70px">
          </div>
        </div>
      `;

      container.appendChild(card);

      // Renderizar vista previa LaTeX si es custom
      if (comp.type === 'custom') {
        const previewEl = byId(`preview_${comp.id}`);
        if (previewEl && comp.latex) {
          previewEl.innerHTML = `$$y(x, t) = ${comp.latex}$$`;
          renderMath(previewEl);
        }
      }
    });

    attachComponentEvents();
  }

  function attachComponentEvents() {
    const container = byId('componentsContainer');
    if (!container) return;

    // Escuchar cambios de inputs y sliders
    container.querySelectorAll('.component-card').forEach(card => {
      const id = card.dataset.id;
      const comp = engine.getComponent(id);
      if (!comp) return;

      // Toggles
      card.querySelector('[data-action="toggle-visible"]')?.addEventListener('click', (e) => {
        comp.visible = !comp.visible;
        renderComponentsList();
      });

      card.querySelector('[data-action="toggle-sum"]')?.addEventListener('click', (e) => {
        comp.activeInSum = !comp.activeInSum;
        renderComponentsList();
      });

      card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        if (engine.components.length <= 1) {
          alert('Debe permanecer al menos una componente en la simulación.');
          return;
        }
        engine.removeComponent(id);
        renderComponentsList();
      });

      card.querySelector('[data-action="rename"]')?.addEventListener('change', (e) => {
        comp.name = e.target.value;
      });

      // Cambio de tipo de onda
      card.querySelector('[data-param="type"]')?.addEventListener('change', (e) => {
        comp.type = e.target.value;
        comp.updateFormula();
        renderComponentsList();
      });

      // Parámetros numéricos
      card.querySelectorAll('input[data-param]').forEach(input => {
        const param = input.dataset.param;
        const isRange = input.type === 'range';

        input.addEventListener('input', (e) => {
          let val = e.target.value;
          if (param === 'customExpression') {
            comp.customExpression = val;
            comp.updateFormula();
            const previewEl = byId(`preview_${comp.id}`);
            if (previewEl) {
              previewEl.innerHTML = `$$y(x, t) = ${comp.latex}$$`;
              renderMath(previewEl);
            }
          } else {
            val = Number(val);
            comp[param] = val;
            comp.updateFormula();

            // Sincronizar par range/number
            const sibling = card.querySelector(`input[data-param="${param}"][type="${isRange ? 'number' : 'range'}"]`);
            if (sibling) sibling.value = isRange ? val.toFixed(2) : val;

            // Actualizar etiqueta de dirección si es velocidad
            if (param === 'velocity') {
              const dirSpan = card.querySelector('.v-dir');
              if (dirSpan) {
                dirSpan.textContent = val > 0 ? '→ Derecha (+x)' : (val < 0 ? '← Izquierda (-x)' : '• Estacionaria');
              }
            }
          }
        });
      });

      // Estilos propios
      card.querySelector('input[data-style="color"]')?.addEventListener('input', (e) => {
        comp.style.color = e.target.value;
        card.querySelector('.color-indicator').style.background = e.target.value;
      });

      card.querySelector('select[data-style="dash"]')?.addEventListener('change', (e) => {
        const val = e.target.value;
        comp.style.dash = val === 'dashed' ? [6, 4] : (val === 'dotted' ? [2, 3] : []);
      });

      card.querySelector('input[data-style="lineWidth"]')?.addEventListener('input', (e) => {
        comp.style.lineWidth = Number(e.target.value);
      });

      // Abrir teclado virtual
      card.querySelector('.btn-open-vk')?.addEventListener('click', () => {
        activeFormulaInput = card.querySelector('.custom-formula-input');
        openVirtualKeyboard();
      });

      // Capturar foco para teclado virtual
      card.querySelector('.custom-formula-input')?.addEventListener('focus', (e) => {
        activeFormulaInput = e.target;
      });
    });
  }

  byId('addComponentBtn')?.addEventListener('click', () => {
    engine.addComponent({
      name: `Componente ${engine.components.length + 1}`,
      type: 'gaussian',
      amplitude: 1.0,
      velocity: 1.5,
      x0: -4.0,
      width: 1.2,
      visible: true,
      activeInSum: true
    });
    renderComponentsList();
  });

  // 8. Teclado Virtual Matemático
  function openVirtualKeyboard() {
    const vk = byId('virtualKeyboardModal');
    if (!vk) return;
    vk.classList.add('open');
    vk.setAttribute('aria-hidden', 'false');
    updateVKPreview();
  }

  function closeVirtualKeyboard() {
    const vk = byId('virtualKeyboardModal');
    if (!vk) return;
    vk.classList.remove('open');
    vk.setAttribute('aria-hidden', 'true');
    if (activeFormulaInput) activeFormulaInput.focus();
  }

  byId('closeVirtualKeyboard')?.addEventListener('click', closeVirtualKeyboard);

  function insertTextIntoActive(text) {
    if (!activeFormulaInput) return;
    const start = activeFormulaInput.selectionStart || 0;
    const end = activeFormulaInput.selectionEnd || 0;
    const val = activeFormulaInput.value;

    activeFormulaInput.value = val.substring(0, start) + text + val.substring(end);
    const newPos = start + text.length;
    activeFormulaInput.setSelectionRange(newPos, newPos);
    activeFormulaInput.dispatchEvent(new Event('input', { bubbles: true }));
    updateVKPreview();
  }

  function updateVKPreview() {
    const preview = byId('vkFormulaPreview');
    if (!preview || !activeFormulaInput) return;
    const expr = activeFormulaInput.value || '0';
    const validation = MathParser.validate(expr);
    const statusMsg = byId('vkStatusMsg');

    if (validation.valid) {
      const latex = MathParser.toLatex(expr);
      preview.innerHTML = `$$f(x, t) = ${latex}$$`;
      renderMath(preview);
      if (statusMsg) {
        statusMsg.innerHTML = '<span class="status-valid"><i class="fas fa-check-circle"></i> Expresión válida</span>';
      }
    } else {
      preview.innerHTML = `<code>${expr}</code>`;
      if (statusMsg) {
        statusMsg.innerHTML = `<span class="status-invalid"><i class="fas fa-exclamation-triangle"></i> ${validation.error}</span>`;
      }
    }
  }

  document.querySelectorAll('.vk-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const insert = btn.dataset.insert;

      if (insert) {
        insertTextIntoActive(insert);
      } else if (action === 'backspace') {
        if (!activeFormulaInput) return;
        const start = activeFormulaInput.selectionStart || 0;
        const end = activeFormulaInput.selectionEnd || 0;
        const val = activeFormulaInput.value;
        if (start === end && start > 0) {
          activeFormulaInput.value = val.substring(0, start - 1) + val.substring(end);
          activeFormulaInput.setSelectionRange(start - 1, start - 1);
        } else if (start !== end) {
          activeFormulaInput.value = val.substring(0, start) + val.substring(end);
          activeFormulaInput.setSelectionRange(start, start);
        }
        activeFormulaInput.dispatchEvent(new Event('input', { bubbles: true }));
        updateVKPreview();
      } else if (action === 'clear') {
        if (!activeFormulaInput) return;
        activeFormulaInput.value = '';
        activeFormulaInput.dispatchEvent(new Event('input', { bubbles: true }));
        updateVKPreview();
      } else if (action === 'apply') {
        closeVirtualKeyboard();
      }
    });
  });

  // 9. Ventana Modal Ampliada (Maximizar, Minimizar, Pantalla completa, Sincronización)
  const modal = byId('expandedModal');
  const openModalBtn = byId('openModalBtn');
  const closeModalBtn = byId('closeModalBtn');
  const maximizeModalBtn = byId('maximizeModalBtn');
  const minimizeModalBtn = byId('minimizeModalBtn');
  const fullscreenModalBtn = byId('fullscreenModalBtn');
  const restoreDockBtn = byId('restoreDockBtn');
  const minimizedDock = byId('minimizedDock');

  function openModal() {
    lastFocusedElement = document.activeElement;
    modal.classList.add('open');
    modal.classList.remove('minimized');
    modal.setAttribute('aria-hidden', 'false');
    minimizedDock.classList.remove('visible');

    // Inicializar canvas modal si no existe
    if (!modalPlane) {
      modalPlane = new GeoGebraWavePlane('modalWaveCanvas', engine, {
        scaleX: mainPlane.scaleX,
        scaleY: mainPlane.scaleY,
        originXRatio: 0.5,
        originYRatio: 0.5,
        theme: mainPlane.options.theme
      });
      modalPlane.onInspectUpdate = (info, px, py) => {
        updateInspectorHUD(info, px, py);
      };
    } else {
      modalPlane.scaleX = mainPlane.scaleX;
      modalPlane.scaleY = mainPlane.scaleY;
      modalPlane.originPxX = mainPlane.originPxX;
      modalPlane.originPxY = mainPlane.originPxY;
      modalPlane.initDimensions();
    }

    closeModalBtn?.focus();
    updatePlayPauseButtons();
  }

  function closeModal() {
    modal.classList.remove('open', 'maximized', 'minimized');
    modal.setAttribute('aria-hidden', 'true');
    minimizedDock.classList.remove('visible');

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  function toggleMaximizeModal() {
    const isMax = modal.classList.toggle('maximized');
    maximizeModalBtn.innerHTML = `<i class="fas ${isMax ? 'fa-compress' : 'fa-expand'}"></i>`;
    maximizeModalBtn.setAttribute('title', isMax ? 'Restaurar tamaño' : 'Maximizar ventana');
    if (modalPlane) {
      setTimeout(() => {
        modalPlane.initDimensions();
        modalPlane.render();
      }, 50);
    }
  }

  function minimizeModal() {
    modal.classList.add('minimized');
    minimizedDock.classList.add('visible');
    restoreDockBtn?.focus();
  }

  function restoreFromDock() {
    modal.classList.remove('minimized');
    minimizedDock.classList.remove('visible');
    if (modalPlane) {
      modalPlane.initDimensions();
      modalPlane.render();
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (modal.requestFullscreen) {
        modal.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  openModalBtn?.addEventListener('click', openModal);
  closeModalBtn?.addEventListener('click', closeModal);
  maximizeModalBtn?.addEventListener('click', toggleMaximizeModal);
  minimizeModalBtn?.addEventListener('click', minimizeModal);
  fullscreenModalBtn?.addEventListener('click', toggleFullscreen);
  restoreDockBtn?.addEventListener('click', restoreFromDock);
  byId('dockCloseBtn')?.addEventListener('click', closeModal);
  byId('modalPlayToggle')?.addEventListener('click', () => {
    engine.togglePlay();
    updatePlayPauseButtons();
  });
  byId('modalResetTime')?.addEventListener('click', () => {
    engine.resetTime();
    updateTimeReadout();
  });
  byId('dockPlayToggle')?.addEventListener('click', () => {
    engine.togglePlay();
    updatePlayPauseButtons();
  });

  // Modal time slider
  const modalTimeSlider = byId('modalTimeSlider');
  if (modalTimeSlider) {
    modalTimeSlider.addEventListener('mousedown', () => { modalTimeSlider.dataset.dragging = 'true'; });
    modalTimeSlider.addEventListener('touchstart', () => { modalTimeSlider.dataset.dragging = 'true'; });
    modalTimeSlider.addEventListener('input', (e) => {
      engine.setTime(Number(e.target.value));
      updateTimeReadout();
    });
    modalTimeSlider.addEventListener('mouseup', () => { delete modalTimeSlider.dataset.dragging; });
    modalTimeSlider.addEventListener('touchend', () => { delete modalTimeSlider.dataset.dragging; });
  }

  // 10. Paleta de Estilos Gráficos
  const palettePopover = byId('palettePopover');
  byId('toolPalette')?.addEventListener('click', (e) => {
    e.stopPropagation();
    palettePopover.classList.toggle('open');
  });
  byId('closePalette')?.addEventListener('click', () => {
    palettePopover.classList.remove('open');
  });

  // Selector de Temas Claro/Oscuro
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const themeKey = btn.dataset.theme;
      mainPlane.setTheme(themeKey);
      if (modalPlane) modalPlane.setTheme(themeKey);

      // Sincronizar controles de paleta
      byId('planeBgColor').value = mainPlane.theme.background;
      byId('axisColor').value = mainPlane.theme.axisColor;
      byId('gridColor').value = rgbToHex(mainPlane.theme.gridMajor);
    });
  });

  function rgbToHex(colorStr) {
    if (!colorStr || colorStr.startsWith('#')) return colorStr || '#ffffff';
    // Fallback simple
    return '#172d33';
  }

  // Personalización fina
  byId('planeBgColor')?.addEventListener('input', (e) => {
    mainPlane.updateThemeStyles({ background: e.target.value });
    if (modalPlane) modalPlane.updateThemeStyles({ background: e.target.value });
  });
  byId('axisColor')?.addEventListener('input', (e) => {
    mainPlane.updateThemeStyles({ axisColor: e.target.value });
    if (modalPlane) modalPlane.updateThemeStyles({ axisColor: e.target.value });
  });
  byId('axisWidth')?.addEventListener('input', (e) => {
    mainPlane.updateThemeStyles({ axisWidth: Number(e.target.value) });
    if (modalPlane) modalPlane.updateThemeStyles({ axisWidth: Number(e.target.value) });
  });
  byId('gridColor')?.addEventListener('input', (e) => {
    mainPlane.updateThemeStyles({
      gridMajor: e.target.value,
      gridMinor: hexToRGBA(e.target.value, 0.25)
    });
    if (modalPlane) {
      modalPlane.updateThemeStyles({
        gridMajor: e.target.value,
        gridMinor: hexToRGBA(e.target.value, 0.25)
      });
    }
  });
  byId('fontSizeSelect')?.addEventListener('change', (e) => {
    mainPlane.updateThemeStyles({ fontBaseSize: Number(e.target.value) });
    if (modalPlane) modalPlane.updateThemeStyles({ fontBaseSize: Number(e.target.value) });
  });

  function hexToRGBA(hex, alpha) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      c = '0x' + c.join('');
      return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
    }
    return hex;
  }

  // Estilo de la resultante
  byId('resultantColor')?.addEventListener('input', (e) => {
    engine.resultantStyle.color = e.target.value;
  });
  byId('resultantWidth')?.addEventListener('input', (e) => {
    engine.resultantStyle.lineWidth = Number(e.target.value);
  });
  byId('resultantDash')?.addEventListener('change', (e) => {
    const val = e.target.value;
    engine.resultantStyle.dash = val === 'dashed' ? [8, 5] : (val === 'dotted' ? [2, 3] : []);
  });
  byId('showResultantToggle')?.addEventListener('change', (e) => {
    engine.resultantStyle.visible = e.target.checked;
  });

  // Vectores de propagación
  byId('showVectorsToggle')?.addEventListener('change', (e) => {
    engine.propagationStyle.show = e.target.checked;
  });
  byId('vectorLabelsToggle')?.addEventListener('change', (e) => {
    engine.propagationStyle.showLabels = e.target.checked;
  });

  // 11. Presets didácticos y preguntas orientadoras
  function renderDidacticPresets() {
    const selector = byId('presetSelector');
    if (!selector) return;
    selector.innerHTML = '';

    engine.getPresets().forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.title;
      if (p.id === engine.currentPresetId) opt.selected = true;
      selector.appendChild(opt);
    });

    selector.addEventListener('change', (e) => {
      loadPresetAndRefresh(e.target.value);
    });

    updateDidacticInfo();
  }

  function loadPresetAndRefresh(presetId) {
    const preset = engine.loadPreset(presetId);
    renderComponentsList();
    updateDidacticInfo();
    updateTimeReadout();
    mainPlane.resetView();
    if (modalPlane) modalPlane.resetView();
  }

  function updateDidacticInfo() {
    const preset = engine.getCurrentPreset();
    const titleEl = byId('didacticTitle');
    const descEl = byId('didacticDescription');
    const questionsContainer = byId('didacticQuestionsList');

    if (titleEl) titleEl.textContent = preset.title;
    if (descEl) {
      descEl.innerHTML = `<p>${preset.description}</p>`;
      renderMath(descEl);
    }

    if (questionsContainer && preset.questions) {
      questionsContainer.innerHTML = '';
      preset.questions.forEach((qObj, idx) => {
        const item = document.createElement('li');
        item.className = 'question-item';

        const qText = typeof qObj === 'string' ? qObj : qObj.question;
        const answer = typeof qObj === 'object' && qObj.answer ? qObj.answer : null;
        const answerId = `ans_${preset.id}_${idx}`;

        let answerHTML = '';
        if (answer) {
          answerHTML = `
            <div class="question-actions">
              <button type="button" class="btn-toggle-answer" data-target="${answerId}" aria-expanded="false" aria-controls="${answerId}">
                <i class="fas fa-eye"></i> <span>Ver respuesta</span>
              </button>
            </div>
            <div id="${answerId}" class="answer-box" style="display:none;">
              <div class="answer-badge"><i class="fas fa-graduation-cap"></i> Solución & Fundamentación Física</div>
              
              <div class="answer-direct">
                <strong>Respuesta:</strong> ${answer.direct}
              </div>

              <div class="answer-section">
                <span class="answer-section-label"><i class="fas fa-square-root-variable"></i> Fundamentación matemática y teórica:</span>
                <div class="answer-section-content">${answer.theory}</div>
              </div>

              <div class="pedagogy-tip">
                <span class="answer-section-label" style="color:var(--blue); margin-bottom:4px;"><i class="fas fa-lightbulb"></i> Explicación para aprender:</span>
                <p style="margin:0;">${answer.pedagogy}</p>
              </div>
            </div>
          `;
        }

        item.innerHTML = `
          <div class="question-text">
            <strong>Pregunta ${idx + 1}:</strong> ${qText}
          </div>
          ${answerHTML}
        `;

        // Añadir manejador de clic para alternar respuesta
        const toggleBtn = item.querySelector('.btn-toggle-answer');
        const answerBox = item.querySelector('.answer-box');
        if (toggleBtn && answerBox) {
          toggleBtn.addEventListener('click', () => {
            const isHidden = answerBox.style.display === 'none';
            if (isHidden) {
              answerBox.style.display = 'flex';
              toggleBtn.classList.add('active');
              toggleBtn.setAttribute('aria-expanded', 'true');
              toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> <span>Ocultar respuesta</span>';
              renderMath(answerBox);
            } else {
              answerBox.style.display = 'none';
              toggleBtn.classList.remove('active');
              toggleBtn.setAttribute('aria-expanded', 'false');
              toggleBtn.innerHTML = '<i class="fas fa-eye"></i> <span>Ver respuesta</span>';
            }
          });
        }

        questionsContainer.appendChild(item);
      });
      renderMath(questionsContainer);
    }
  }

  // 12. Panel ajustable (Splitter resizable) en escritorio
  const splitHandle = byId('splitHandle');
  const workspace = byId('workspaceGrid');

  if (splitHandle && workspace) {
    let isResizing = false;

    splitHandle.addEventListener('pointerdown', (e) => {
      isResizing = true;
      splitHandle.setPointerCapture(e.pointerId);
      document.body.classList.add('is-resizing');
    });

    window.addEventListener('pointermove', (e) => {
      if (!isResizing) return;
      const workspaceRect = workspace.getBoundingClientRect();
      const newLeftWidth = e.clientX - workspaceRect.left;

      // Límites mínimo y máximo
      const minLeft = 320;
      const maxLeft = workspaceRect.width - 400;

      if (newLeftWidth >= minLeft && newLeftWidth <= maxLeft) {
        workspace.style.gridTemplateColumns = `${newLeftWidth}px 8px 1fr`;
        mainPlane.initDimensions();
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (isResizing) {
        isResizing = false;
        document.body.classList.remove('is-resizing');
        try { splitHandle.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    });
  }

  // 13. Exportación / Importación JSON y Exportación a Imagen PNG
  byId('btnExportJSON')?.addEventListener('click', () => {
    const jsonStr = engine.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacion_ondas_mo_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  byId('btnImportJSON')?.addEventListener('click', () => {
    byId('importFileInput')?.click();
  });

  byId('importFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = engine.importJSON(event.target.result);
      if (res.success) {
        renderComponentsList();
        updateDidacticInfo();
        updateTimeReadout();
        mainPlane.render();
        alert(`¡Configuración importada exitosamente! Se cargaron ${res.count} componentes.`);
      } else {
        alert(`Error al importar el archivo: ${res.error}`);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  byId('btnExportPNG')?.addEventListener('click', () => {
    // Generar captura en alta definición
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = mainPlane.canvas.width;
    tempCanvas.height = mainPlane.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Copiar contenido del lienzo
    tempCtx.drawImage(mainPlane.canvas, 0, 0);

    // Añadir marca de agua pedagógica elegante
    tempCtx.save();
    tempCtx.fillStyle = 'rgba(23, 45, 51, 0.85)';
    tempCtx.font = '14px Outfit, sans-serif';
    tempCtx.fillText('Física III - Laboratorio de Movimiento Ondulatorio | Superposición e Interferencia', 20, 30);
    tempCtx.font = '11px DM Mono, monospace';
    tempCtx.fillText(`t = ${engine.time.toFixed(2)} s | Componentes activas: ${engine.components.filter(c => c.activeInSum).length}`, 20, 50);
    tempCtx.restore();

    const dataURL = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `grafica_ondas_t_${engine.time.toFixed(2)}s.png`;
    a.click();
  });

  // 14. Atajos de Teclado Globales y Accesibilidad
  window.addEventListener('keydown', (e) => {
    // Cerrar popover o modal con Escape
    if (e.key === 'Escape') {
      if (palettePopover?.classList.contains('open')) {
        palettePopover.classList.remove('open');
        return;
      }
      if (byId('virtualKeyboardModal')?.classList.contains('open')) {
        closeVirtualKeyboard();
        return;
      }
      if (modal?.classList.contains('open')) {
        closeModal();
        return;
      }
    }

    // Si el usuario está escribiendo en un input, no interceptar teclas de control
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      engine.togglePlay();
      updatePlayPauseButtons();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      engine.resetTime();
      updateTimeReadout();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      engine.stepForward(0.05);
      updateTimeReadout();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      engine.stepBackward(0.05);
      updateTimeReadout();
    } else if (e.key === 'i' || e.key === 'I') {
      e.preventDefault();
      byId('toolInspect')?.click();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      mainPlane.zoom(1.15);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      mainPlane.zoom(0.85);
    } else if (e.key === '0') {
      e.preventDefault();
      mainPlane.resetView();
    }
  });

  // Cierre de popovers al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (palettePopover && palettePopover.classList.contains('open')) {
      if (!palettePopover.contains(e.target) && !byId('toolPalette')?.contains(e.target)) {
        palettePopover.classList.remove('open');
      }
    }
  });

  // 15. Paneles plegables (especialmente útiles en móviles)
  document.querySelectorAll('.panel-card.collapsible').forEach(card => {
    const heading = card.querySelector('.card-heading');
    if (!heading) return;

    heading.addEventListener('click', (e) => {
      // Evitar que el clic en botones dentro del heading (ej. Añadir) colapse el panel
      if (e.target.closest('button')) return;
      
      const isCollapsed = card.classList.toggle('collapsed');
      heading.setAttribute('aria-expanded', !isCollapsed);
    });

    heading.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const isCollapsed = card.classList.toggle('collapsed');
        heading.setAttribute('aria-expanded', !isCollapsed);
      }
    });
  });

  // En pantallas estrechas / móviles, colapsar por defecto el editor para priorizar el gráfico
  if (window.innerWidth <= 768) {
    document.querySelectorAll('.panel-card.collapsible').forEach(card => {
      card.classList.add('collapsed');
      card.querySelector('.card-heading')?.setAttribute('aria-expanded', 'false');
    });
  }

  // Inicialización de la vista
  renderComponentsList();
  renderDidacticPresets();
  updateTimeReadout();
  updatePlayPauseButtons();
  renderMath(document.body);
  window.addEventListener('load', () => renderMath(document.body));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLaboratorio);
} else {
  initLaboratorio();
}

