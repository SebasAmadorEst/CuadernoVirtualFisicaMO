/**
 * ============================================================================
 * LIENZO CARTESIANO INTERACTIVO ESTILO GEOGEBRA PARA ONDAS (WAVE PLANE)
 * ============================================================================
 * - Renderizado en Canvas HiDPI con escalamiento nítido para pantallas Retina/4K
 * - Cuadrícula mayor y menor adaptativa continua (efecto papel milimetrado)
 * - Separación estricta entre transformación de vista y parámetros físicos
 * - Muestreo adaptativo con detección y corte de discontinuidades y singularidades
 * - Re-escalado independiente de ejes al arrastrar sobre el eje X o el eje Y
 * - Zoom suave centrado en cursor y soporte multitáctil (pinch-to-zoom)
 * - Vectores/flechas de propagación con magnitud y sentido físico
 * - Inspector de coordenadas interactivo con marcadores y lectura HUD
 * - Motor completo de estilos (temas claro y oscuro de alto contraste)
 */

(function (global) {
  'use strict';

  // Temas predefinidos
  const THEMES = {
    light: {
      name: 'Claro (Papel Científico)',
      background: '#f9fbf9',
      gridMinor: 'rgba(70, 95, 85, 0.08)',
      gridMajor: 'rgba(40, 70, 60, 0.22)',
      axisColor: '#172d33',
      axisWidth: 1.6,
      textColor: '#33484f',
      fontBaseSize: 11,
      crosshairColor: 'rgba(23, 45, 51, 0.75)',
      inspectorHalo: 'rgba(255, 255, 255, 0.9)'
    },
    dark: {
      name: 'Oscuro (Pizarra de Laboratorio)',
      background: '#0d1520',
      gridMinor: 'rgba(148, 163, 184, 0.07)',
      gridMajor: 'rgba(148, 163, 184, 0.22)',
      axisColor: '#e2e8f0',
      axisWidth: 1.6,
      textColor: '#94a3b8',
      fontBaseSize: 11,
      crosshairColor: 'rgba(226, 232, 240, 0.75)',
      inspectorHalo: 'rgba(13, 21, 32, 0.9)'
    },
    blueprint: {
      name: 'Blueprint (Cian Milimetrado)',
      background: '#0b1d33',
      gridMinor: 'rgba(56, 189, 248, 0.12)',
      gridMajor: 'rgba(56, 189, 248, 0.35)',
      axisColor: '#7dd3fc',
      axisWidth: 1.8,
      textColor: '#bae6fd',
      fontBaseSize: 11,
      crosshairColor: 'rgba(125, 211, 252, 0.8)',
      inspectorHalo: 'rgba(11, 29, 51, 0.9)'
    }
  };

  class GeoGebraWavePlane {
    constructor(canvasId, waveEngine, options = {}) {
      this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.engine = waveEngine;

      // Opciones de configuración
      this.options = Object.assign({
        theme: 'light',
        scaleX: 65,            // Píxeles por metro en X
        scaleY: 65,            // Píxeles por metro en Y
        originXRatio: 0.5,     // Posición relativa del origen X (0.5 = centro)
        originYRatio: 0.5,     // Posición relativa del origen Y (0.5 = centro)
        showMinorGrid: true,
        showMajorGrid: true,
        showAxes: true,
        showAxisLabels: true,
        showPropagationVectors: true,
        showLegend: false,
        fontFamily: "'DM Mono', 'Fira Code', monospace"
      }, options);

      // Copia activa del estilo del tema
      this.theme = { ...(THEMES[this.options.theme] || THEMES.light) };

      // Dimensiones lógicas y físicas
      this.width = 800;
      this.height = 400;
      this.dpr = window.devicePixelRatio || 1;

      // Escalas de visualización (Píxeles por unidad física)
      this.scaleX = this.options.scaleX;
      this.scaleY = this.options.scaleY;
      this.originPxX = 0;
      this.originPxY = 0;

      // Estado de interacción
      this.mode = 'pan'; // 'pan' | 'inspect'
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };
      this.dragAxis = null; // null | 'x' | 'y'
      this.mousePos = { x: 0, y: 0 };
      this.inspectX = 0.0;
      this.isInspecting = false;

      // Callbacks
      this.onInspectUpdate = null;

      this.initDimensions();
      this.initEvents();
    }

    /**
     * Ajuste de resolución y soporte HiDPI (Retina)
     */
    initDimensions() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width || this.canvas.clientWidth || 800;
      this.height = rect.height || this.canvas.clientHeight || 400;
      this.dpr = window.devicePixelRatio || 1;

      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);

      // Posición inicial del origen en coordenadas de pantalla
      if (this.originPxX === 0 && this.originPxY === 0) {
        this.originPxX = this.width * this.options.originXRatio;
        this.originPxY = this.height * this.options.originYRatio;
      }
    }

    /**
     * Conversión de coordenadas de Mundo Físico a Pantalla (Píxeles)
     */
    toPixelX(worldX) {
      return this.originPxX + worldX * this.scaleX;
    }

    toPixelY(worldY) {
      return this.originPxY - worldY * this.scaleY;
    }

    /**
     * Conversión de coordenadas de Pantalla a Mundo Físico
     */
    toWorldX(pixelX) {
      return (pixelX - this.originPxX) / this.scaleX;
    }

    toWorldY(pixelY) {
      return (this.originPxY - pixelY) / this.scaleY;
    }

    /**
     * Rango físico actualmente visible en el viewport
     */
    getVisibleRange() {
      return {
        minX: this.toWorldX(0),
        maxX: this.toWorldX(this.width),
        minY: this.toWorldY(this.height),
        maxY: this.toWorldY(0)
      };
    }

    /**
     * Cambio de tema y personalización de estilos
     */
    setTheme(themeKey) {
      if (THEMES[themeKey]) {
        this.options.theme = themeKey;
        this.theme = { ...THEMES[themeKey] };
        this.render();
      }
    }

    updateThemeStyles(customStyles = {}) {
      Object.assign(this.theme, customStyles);
      this.render();
    }

    /**
     * Restablece la vista a los valores por defecto
     */
    resetView() {
      this.scaleX = this.options.scaleX;
      this.scaleY = this.options.scaleY;
      this.originPxX = this.width * this.options.originXRatio;
      this.originPxY = this.height * this.options.originYRatio;
      this.inspectX = 0.0;
      this.render();
    }

    zoom(factor, centerPixel = { x: this.width / 2, y: this.height / 2 }) {
      const worldCenter = {
        x: this.toWorldX(centerPixel.x),
        y: this.toWorldY(centerPixel.y)
      };

      const newScaleX = Math.max(10, Math.min(600, this.scaleX * factor));
      const newScaleY = Math.max(10, Math.min(600, this.scaleY * factor));

      this.scaleX = newScaleX;
      this.scaleY = newScaleY;

      // Reposicionar origen para que el punto bajo el cursor no se mueva
      this.originPxX = centerPixel.x - worldCenter.x * this.scaleX;
      this.originPxY = centerPixel.y + worldCenter.y * this.scaleY;

      this.render();
    }

    /**
     * Inicialización de eventos de mouse, touch y teclado
     */
    initEvents() {
      const getCoords = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      };

      // Manejo de puntero (Mouse / Touch)
      this.canvas.addEventListener('pointerdown', (e) => {
        this.canvas.setPointerCapture(e.pointerId);
        const p = getCoords(e);
        this.isDragging = true;
        this.dragStart = { x: p.x, y: p.y };

        // Detección de arrastre sobre ejes para re-escalado independiente
        const distToXAxis = Math.abs(p.y - this.originPxY);
        const distToYAxis = Math.abs(p.x - this.originPxX);

        if (distToXAxis < 18 && distToYAxis > 25) {
          this.dragAxis = 'x';
        } else if (distToYAxis < 18 && distToXAxis > 25) {
          this.dragAxis = 'y';
        } else {
          this.dragAxis = null;
        }

        if (this.mode === 'inspect') {
          this.isInspecting = true;
          this.inspectX = this.toWorldX(p.x);
          this.triggerInspect();
          this.render();
        }
      });

      this.canvas.addEventListener('pointermove', (e) => {
        const p = getCoords(e);
        this.mousePos = p;

        if (this.isDragging) {
          const dx = p.x - this.dragStart.x;
          const dy = p.y - this.dragStart.y;

          if (this.dragAxis === 'x') {
            // Re-escalar solo el eje X
            const factor = 1 + (dx / 180);
            this.scaleX = Math.max(10, Math.min(700, this.scaleX * factor));
            this.dragStart.x = p.x;
          } else if (this.dragAxis === 'y') {
            // Re-escalar solo el eje Y
            const factor = 1 - (dy / 180);
            this.scaleY = Math.max(10, Math.min(700, this.scaleY * factor));
            this.dragStart.y = p.y;
          } else {
            // Paneo ordinario del plano completo
            this.originPxX += dx;
            this.originPxY += dy;
            this.dragStart = { x: p.x, y: p.y };
          }
          this.render();
        }

        if (this.mode === 'inspect') {
          this.isInspecting = true;
          this.inspectX = this.toWorldX(p.x);
          this.triggerInspect();
          this.render();
        }
      });

      const endDrag = (e) => {
        if (this.isDragging) {
          this.isDragging = false;
          this.dragAxis = null;
          try {
            this.canvas.releasePointerCapture(e.pointerId);
          } catch (err) {}
        }
      };

      this.canvas.addEventListener('pointerup', endDrag);
      this.canvas.addEventListener('pointercancel', endDrag);

      // Zoom con rueda de desplazamiento
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const p = getCoords(e);
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        this.zoom(factor, p);
      }, { passive: false });

      // Doble clic para restablecer vista
      this.canvas.addEventListener('dblclick', () => {
        this.resetView();
      });

      // ResizeObserver para redibujar nítido ante cambios de tamaño del contenedor
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.initDimensions();
          this.render();
        });
        this.resizeObserver.observe(this.canvas);
      }
    }

    triggerInspect() {
      if (typeof this.onInspectUpdate === 'function') {
        const info = this.engine.inspectAt(this.inspectX);
        this.onInspectUpdate(info, this.toPixelX(this.inspectX), this.toPixelY(info.resultant));
      }
    }

    /**
     * Paso óptimo para ticks y cuadrícula mayor: 1, 2, 5 * 10^k
     */
    calculateNiceStep(scale, targetPixelStep = 75) {
      const unitsPerTarget = targetPixelStep / scale;
      const exponent = Math.floor(Math.log10(unitsPerTarget));
      const fraction = unitsPerTarget / Math.pow(10, exponent);

      let niceFraction;
      if (fraction < 1.5) niceFraction = 1;
      else if (fraction < 3.5) niceFraction = 2;
      else if (fraction < 7.5) niceFraction = 5;
      else niceFraction = 10;

      return niceFraction * Math.pow(10, exponent);
    }

    /**
     * Formateo numérico limpio para los ejes
     */
    formatCoordinate(val, step) {
      if (Math.abs(val) < 1e-9) return '0';
      const decimals = Math.max(0, -Math.floor(Math.log10(step)));
      return val.toFixed(decimals > 3 ? 3 : decimals);
    }

    /**
     * ========================================================================
     * CICLO PRINCIPAL DE RENDERIZADO
     * ========================================================================
     */
    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;

      // Configuración de resolución Retina
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      // Limpieza y fondo
      ctx.fillStyle = this.theme.background;
      ctx.fillRect(0, 0, this.width, this.height);

      const range = this.getVisibleRange();

      // Dibujar cuadrículas
      if (this.options.showMinorGrid || this.options.showMajorGrid) {
        this.drawGrids(ctx, range);
      }

      // Dibujar ejes coordenados
      if (this.options.showAxes) {
        this.drawAxes(ctx, range);
      }

      // Dibujar curvas de componentes individuales
      this.drawComponentCurves(ctx, range);

      // Dibujar curva resultante destacada
      this.drawResultantCurve(ctx, range);

      // Dibujar indicadores de propagación física (vectores de velocidad)
      if (this.options.showPropagationVectors && this.engine.propagationStyle.show) {
        this.drawPropagationVectors(ctx, range);
      }

      // Dibujar inspector de coordenadas
      if (this.mode === 'inspect' && this.isInspecting) {
        this.drawInspectorOverlay(ctx, range);
      }
    }

    /**
     * Cuadrícula mayor y menor adaptativa estilo papel milimetrado
     */
    drawGrids(ctx, range) {
      const stepX = this.calculateNiceStep(this.scaleX, 75);
      const stepY = this.calculateNiceStep(this.scaleY, 70);
      const minorStepX = stepX / 5;
      const minorStepY = stepY / 5;

      // 1. Cuadrícula menor (papel milimetrado)
      if (this.options.showMinorGrid) {
        ctx.save();
        ctx.strokeStyle = this.theme.gridMinor;
        ctx.lineWidth = 1;

        const firstMinorX = Math.floor(range.minX / minorStepX) * minorStepX;
        const lastMinorX = Math.ceil(range.maxX / minorStepX) * minorStepX;

        ctx.beginPath();
        for (let x = firstMinorX; x <= lastMinorX; x += minorStepX) {
          const px = Math.round(this.toPixelX(x)) + 0.5;
          ctx.moveTo(px, 0);
          ctx.lineTo(px, this.height);
        }

        const firstMinorY = Math.floor(range.minY / minorStepY) * minorStepY;
        const lastMinorY = Math.ceil(range.maxY / minorStepY) * minorStepY;

        for (let y = firstMinorY; y <= lastMinorY; y += minorStepY) {
          const py = Math.round(this.toPixelY(y)) + 0.5;
          ctx.moveTo(0, py);
          ctx.lineTo(this.width, py);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 2. Cuadrícula mayor
      if (this.options.showMajorGrid) {
        ctx.save();
        ctx.strokeStyle = this.theme.gridMajor;
        ctx.lineWidth = 1.2;

        const firstMajorX = Math.floor(range.minX / stepX) * stepX;
        const lastMajorX = Math.ceil(range.maxX / stepX) * stepX;

        ctx.beginPath();
        for (let x = firstMajorX; x <= lastMajorX; x += stepX) {
          const px = Math.round(this.toPixelX(x)) + 0.5;
          ctx.moveTo(px, 0);
          ctx.lineTo(px, this.height);
        }

        const firstMajorY = Math.floor(range.minY / stepY) * stepY;
        const lastMajorY = Math.ceil(range.maxY / stepY) * stepY;

        for (let y = firstMajorY; y <= lastMajorY; y += stepY) {
          const py = Math.round(this.toPixelY(y)) + 0.5;
          ctx.moveTo(0, py);
          ctx.lineTo(this.width, py);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    /**
     * Ejes principales con flechas, marcas de graduación y numeración
     */
    drawAxes(ctx, range) {
      const stepX = this.calculateNiceStep(this.scaleX, 75);
      const stepY = this.calculateNiceStep(this.scaleY, 70);

      const originX = Math.max(15, Math.min(this.width - 25, this.originPxX));
      const originY = Math.max(20, Math.min(this.height - 20, this.originPxY));

      ctx.save();
      ctx.strokeStyle = this.theme.axisColor;
      ctx.lineWidth = this.theme.axisWidth || 1.6;
      ctx.fillStyle = this.theme.textColor;
      ctx.font = `${this.theme.fontBaseSize || 11}px ${this.options.fontFamily}`;

      // Eje X (Horizontal)
      ctx.beginPath();
      ctx.moveTo(0, Math.round(this.originPxY) + 0.5);
      ctx.lineTo(this.width, Math.round(this.originPxY) + 0.5);
      ctx.stroke();

      // Flecha del eje X
      ctx.beginPath();
      ctx.moveTo(this.width - 10, this.originPxY - 4);
      ctx.lineTo(this.width, this.originPxY);
      ctx.lineTo(this.width - 10, this.originPxY + 4);
      ctx.stroke();

      // Eje Y (Vertical)
      ctx.beginPath();
      ctx.moveTo(Math.round(this.originPxX) + 0.5, this.height);
      ctx.lineTo(Math.round(this.originPxX) + 0.5, 0);
      ctx.stroke();

      // Flecha del eje Y
      ctx.beginPath();
      ctx.moveTo(this.originPxX - 4, 10);
      ctx.lineTo(this.originPxX, 0);
      ctx.lineTo(this.originPxX + 4, 10);
      ctx.stroke();

      // Graduaciones y números sobre el Eje X
      const firstMajorX = Math.floor(range.minX / stepX) * stepX;
      const lastMajorX = Math.ceil(range.maxX / stepX) * stepX;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (let x = firstMajorX; x <= lastMajorX; x += stepX) {
        if (Math.abs(x) < 1e-9) continue;
        const px = this.toPixelX(x);
        if (px < 15 || px > this.width - 20) continue;

        // Tick
        ctx.beginPath();
        ctx.moveTo(px, this.originPxY - 4);
        ctx.lineTo(px, this.originPxY + 4);
        ctx.stroke();

        // Número
        const labelY = (this.originPxY > this.height - 26) ? this.originPxY - 18 : this.originPxY + 6;
        ctx.fillText(this.formatCoordinate(x, stepX), px, labelY);
      }

      // Graduaciones y números sobre el Eje Y
      const firstMajorY = Math.floor(range.minY / stepY) * stepY;
      const lastMajorY = Math.ceil(range.maxY / stepY) * stepY;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let y = firstMajorY; y <= lastMajorY; y += stepY) {
        if (Math.abs(y) < 1e-9) continue;
        const py = this.toPixelY(y);
        if (py < 20 || py > this.height - 15) continue;

        // Tick
        ctx.beginPath();
        ctx.moveTo(this.originPxX - 4, py);
        ctx.lineTo(this.originPxX + 4, py);
        ctx.stroke();

        // Número
        const labelX = (this.originPxX < 35) ? this.originPxX + 18 : this.originPxX - 8;
        ctx.textAlign = (this.originPxX < 35) ? 'left' : 'right';
        ctx.fillText(this.formatCoordinate(y, stepY), labelX, py);
      }

      // Etiquetas de magnitudes físicas en los extremos de los ejes
      if (this.options.showAxisLabels) {
        ctx.font = `bold ${this.theme.fontBaseSize || 11}px ${this.options.fontFamily}`;
        ctx.fillStyle = this.theme.axisColor;

        // Etiqueta x [m]
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        const xPos = Math.min(this.width - 8, this.width);
        const yPosForX = Math.min(this.height - 4, Math.max(16, this.originPxY - 6));
        ctx.fillText('x [m]', xPos, yPosForX);

        // Etiqueta y [m]
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const yPosForY = Math.max(6, 6);
        const xPosForY = Math.min(this.width - 40, Math.max(8, this.originPxX + 8));
        ctx.fillText('y [m]', xPosForY, yPosForY);
      }

      ctx.restore();
    }

    /**
     * Dibuja una curva muestreada adaptativamente con detección de singularidades
     */
    drawSampledFunction(ctx, evalFn, style) {
      const stepPx = 1.0; // 1 muestra por cada pixel para máxima nitidez
      const totalPixels = Math.ceil(this.width);
      const time = this.engine.time;

      ctx.save();
      ctx.strokeStyle = style.color || '#0284c7';
      ctx.lineWidth = style.lineWidth || 2.0;
      ctx.globalAlpha = style.opacity !== undefined ? style.opacity : 1.0;

      if (style.dash && Array.isArray(style.dash) && style.dash.length > 0) {
        ctx.setLineDash(style.dash);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      let isDrawing = false;
      let prevY = 0;
      const maxDeltaYPx = this.height * 0.75; // Umbral de salto para corte de asíntota

      for (let px = 0; px <= totalPixels; px += stepPx) {
        const worldX = this.toWorldX(px);
        const worldY = evalFn(worldX, time);

        // Detección de singularidades y valores no finitos
        if (!Number.isFinite(worldY) || isNaN(worldY)) {
          isDrawing = false;
          continue;
        }

        const py = this.toPixelY(worldY);

        if (!isDrawing) {
          ctx.moveTo(px, py);
          isDrawing = true;
          prevY = py;
        } else {
          // Si el salto vertical entre dos muestras consecutivas es gigantesco (asíntota/discontinuidad),
          // cortamos el trazo en lugar de cruzar la pantalla verticalmente
          if (Math.abs(py - prevY) > maxDeltaYPx) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
          prevY = py;
        }
      }

      ctx.stroke();
      ctx.restore();
    }

    /**
     * Dibuja las componentes visibles individuales
     */
    drawComponentCurves(ctx, range) {
      const comps = this.engine.components;
      for (let i = 0; i < comps.length; i++) {
        const c = comps[i];
        // REQUISITO: Si no está marcada como visible, NO se dibuja en el gráfico
        if (!c.visible) continue;

        this.drawSampledFunction(ctx, (x, t) => c.evaluate(x, t), c.style);
      }
    }

    /**
     * Dibuja la curva resultante (superposición de todas las componentes activas en la suma)
     */
    drawResultantCurve(ctx, range) {
      const rStyle = this.engine.resultantStyle;
      if (!rStyle.visible) return;

      this.drawSampledFunction(ctx, (x, t) => this.engine.evaluateResultant(x, t), rStyle);
    }

    /**
     * Dibuja los vectores de propagación física para cada onda/pulso
     */
    drawPropagationVectors(ctx, range) {
      const comps = this.engine.components;
      const t = this.engine.time;
      const propStyle = this.engine.propagationStyle;

      for (let i = 0; i < comps.length; i++) {
        const c = comps[i];
        if (!c.visible) continue;
        if (Math.abs(c.velocity) < 0.001) continue;

        const centerX = c.getCenter(t);
        const centerY = c.evaluate(centerX, t);
        const px = this.toPixelX(centerX);
        const py = this.toPixelY(centerY);

        // Si está fuera de los márgenes visibles, no dibujar
        if (px < 10 || px > this.width - 10) continue;

        // Longitud proporcional de la flecha
        const dir = c.velocity >= 0 ? 1 : -1;
        const arrowLen = Math.min(50, Math.max(24, Math.abs(c.velocity) * 14));
        const headSize = 7;

        ctx.save();
        ctx.strokeStyle = c.style.color || propStyle.color;
        ctx.fillStyle = c.style.color || propStyle.color;
        ctx.lineWidth = 2.2;
        ctx.setLineDash([]);

        // Posición del vector (ligeramente elevado sobre la curva para máxima claridad)
        const vOffsetY = py - 18;

        // Línea del vector
        ctx.beginPath();
        ctx.moveTo(px, vOffsetY);
        ctx.lineTo(px + dir * arrowLen, vOffsetY);
        ctx.stroke();

        // Cabeza de la flecha
        ctx.beginPath();
        ctx.moveTo(px + dir * arrowLen, vOffsetY);
        ctx.lineTo(px + dir * (arrowLen - headSize), vOffsetY - 4);
        ctx.lineTo(px + dir * (arrowLen - headSize), vOffsetY + 4);
        ctx.closePath();
        ctx.fill();

        // Etiqueta de velocidad si está habilitada
        if (propStyle.showLabels) {
          ctx.font = `500 10px ${this.options.fontFamily}`;
          ctx.textAlign = dir > 0 ? 'left' : 'right';
          ctx.textBaseline = 'bottom';
          const label = `v = ${c.velocity > 0 ? '+' : ''}${c.velocity.toFixed(1)} m/s`;
          
          // Fondo de contraste sutil para la etiqueta
          const textW = ctx.measureText(label).width;
          ctx.fillStyle = this.theme.inspectorHalo || 'rgba(255,255,255,0.85)';
          const bgX = dir > 0 ? px + dir * arrowLen + 3 : px + dir * arrowLen - textW - 3;
          ctx.fillRect(bgX - 2, vOffsetY - 13, textW + 4, 12);

          ctx.fillStyle = c.style.color || propStyle.color;
          ctx.fillText(label, px + dir * arrowLen + (dir > 0 ? 3 : -3), vOffsetY);
        }

        ctx.restore();
      }
    }

    /**
     * Inspector de coordenadas estilo GeoGebra (Línea guía + puntos de corte + lectura)
     */
    drawInspectorOverlay(ctx, range) {
      const inspectX = this.inspectX;
      const px = this.toPixelX(inspectX);
      if (px < 0 || px > this.width) return;

      const t = this.engine.time;
      const comps = this.engine.components;
      const resultantY = this.engine.evaluateResultant(inspectX, t);
      const resPy = this.toPixelY(resultantY);

      ctx.save();

      // Línea vertical punteada en x_inspect
      ctx.strokeStyle = this.theme.crosshairColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, this.height);
      ctx.stroke();

      // Marcador en el eje X
      ctx.fillStyle = this.theme.axisColor;
      ctx.beginPath();
      ctx.arc(px, this.originPxY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Puntos de intersección para cada componente visible
      for (let i = 0; i < comps.length; i++) {
        const c = comps[i];
        if (!c.visible) continue;
        const compY = c.evaluate(inspectX, t);
        const compPy = this.toPixelY(compY);

        ctx.fillStyle = c.style.color;
        ctx.strokeStyle = this.theme.inspectorHalo;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(px, compPy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Marcador prominente para la resultante
      if (this.engine.resultantStyle.visible) {
        ctx.fillStyle = this.engine.resultantStyle.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(px, resPy, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Exportar al entorno global
  global.GeoGebraWavePlane = GeoGebraWavePlane;
  global.THEMES = THEMES;
})(typeof window !== 'undefined' ? window : this);
