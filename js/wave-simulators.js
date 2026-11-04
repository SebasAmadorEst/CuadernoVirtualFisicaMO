/**
 * ============================================================================
 * WAVE SIMULATORS & INTERACTIVE AUDIO ENGINES
 * Cuaderno Interactivo Virtual: Movimiento Ondulatorio - Física III
 * Autores: Camila Mora Pineda & Juan Sebastián Amador Martínez
 * ============================================================================
 */

(function (global) {
  'use strict';

  // ==========================================================================
  // 1. SIMULADOR DE ONDA VIAJERA 1D (PÁGINA 4)
  // ==========================================================================
  class TravelingWaveSim {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.animId = null;
      this.time = 0;
      this.isPlaying = true;

      // Parámetros físicos
      this.amp = 1.2;      // A [m]
      this.freq = 0.5;     // f [Hz]
      this.lambda = 4.0;   // lambda [m]
      this.direction = 1;  // +1: hacia la derecha (+X), -1: hacia la izquierda (-X)
      this.phase = 0;      // phi [rad]

      this.initEvents();
      this.resize();
      this.loop = this.loop.bind(this);
      this.animId = requestAnimationFrame(this.loop);
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.max(300, rect.width * dpr);
      this.canvas.height = Math.max(160, rect.height * dpr);
      this.ctx.scale(dpr, dpr);
      this.cssWidth = rect.width;
      this.cssHeight = rect.height;
    }

    initEvents() {
      const sliderA = document.getElementById('sliderWaveA');
      const sliderF = document.getElementById('sliderWaveF');
      const sliderL = document.getElementById('sliderWaveL');
      const btnDir = document.getElementById('btnWaveDir');
      const btnPlay = document.getElementById('btnWavePlay');
      const btnReset = document.getElementById('btnWaveReset');

      if (sliderA) sliderA.addEventListener('input', e => { this.amp = parseFloat(e.target.value); this.updateReadout(); });
      if (sliderF) sliderF.addEventListener('input', e => { this.freq = parseFloat(e.target.value); this.updateReadout(); });
      if (sliderL) sliderL.addEventListener('input', e => { this.lambda = parseFloat(e.target.value); this.updateReadout(); });

      if (btnDir) {
        btnDir.addEventListener('click', () => {
          this.direction *= -1;
          btnDir.innerHTML = this.direction > 0
            ? '<i class="fas fa-arrow-right"></i> +X (Derecha)'
            : '<i class="fas fa-arrow-left"></i> -X (Izquierda)';
          this.updateReadout();
        });
      }

      if (btnPlay) {
        btnPlay.addEventListener('click', () => {
          this.isPlaying = !this.isPlaying;
          btnPlay.innerHTML = this.isPlaying
            ? '<i class="fas fa-pause"></i> Pausar'
            : '<i class="fas fa-play"></i> Reanudar';
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', () => {
          this.time = 0;
          this.amp = 1.2;
          this.freq = 0.5;
          this.lambda = 4.0;
          this.direction = 1;
          if (sliderA) sliderA.value = 1.2;
          if (sliderF) sliderF.value = 0.5;
          if (sliderL) sliderL.value = 4.0;
          if (btnDir) btnDir.innerHTML = '<i class="fas fa-arrow-right"></i> +X (Derecha)';
          this.updateReadout();
        });
      }

      this.updateReadout();
    }

    updateReadout() {
      const v = this.lambda * this.freq;
      const k = (2 * Math.PI) / this.lambda;
      const omega = 2 * Math.PI * this.freq;
      const readV = document.getElementById('readWaveV');
      const readK = document.getElementById('readWaveK');
      const readW = document.getElementById('readWaveW');
      if (readV) readV.textContent = `${v.toFixed(2)} m/s`;
      if (readK) readK.textContent = `${k.toFixed(2)} rad/m`;
      if (readW) readW.textContent = `${omega.toFixed(2)} rad/s`;
    }

    loop() {
      if (this.isPlaying) {
        this.time += 0.016;
      }
      this.draw();
      this.animId = requestAnimationFrame(this.loop);
    }

    draw() {
      if (!this.canvas) return;
      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;

      ctx.clearRect(0, 0, w, h);

      // Fondo y rejilla
      ctx.fillStyle = '#09111e';
      ctx.fillRect(0, 0, w, h);

      const midY = h / 2;
      const scaleX = w / 10; // 10 metros en el lienzo
      const scaleY = (h * 0.36) / 2.0;

      // Líneas de cuadrícula
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 10; x += 1) {
        const px = x * scaleX;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
      }

      // Eje X central
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      // Parámetros de onda
      const k = (2 * Math.PI) / this.lambda;
      const omega = 2 * Math.PI * this.freq;

      // Dibujar la onda sinusoidal
      ctx.beginPath();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.8;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
      ctx.shadowBlur = 8;

      for (let px = 0; px <= w; px += 2) {
        const x = px / scaleX;
        const phaseTerm = k * x - this.direction * omega * this.time;
        const y = this.amp * Math.sin(phaseTerm);
        const py = midY - y * scaleY;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Partícula testigo oscilante en x = 3 m
      const testX = 3.0;
      const testPx = testX * scaleX;
      const testPhase = k * testX - this.direction * omega * this.time;
      const testY = this.amp * Math.sin(testPhase);
      const testPy = midY - testY * scaleY;
      const testVy = -this.direction * omega * this.amp * Math.cos(testPhase);

      // Línea guía vertical de la partícula
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.4)';
      ctx.beginPath();
      ctx.moveTo(testPx, midY - this.amp * scaleY);
      ctx.lineTo(testPx, midY + this.amp * scaleY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Partícula destacada
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(testPx, testPy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Vector de velocidad transversal de partícula
      const arrowLen = (testVy / (omega * 2)) * 30;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(testPx, testPy);
      ctx.lineTo(testPx, testPy - arrowLen);
      ctx.stroke();

      // Etiquetas informativas en el canvas
      ctx.font = '11px Outfit, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Partícula testigo (M.A.S. vertical)', testPx + 8, testPy - 8);
      ctx.fillText('+A', 8, midY - this.amp * scaleY + 4);
      ctx.fillText('-A', 8, midY + this.amp * scaleY + 4);
    }
  }

  // ==========================================================================
  // 2. SIMULADOR DE ONDAS EN CUERDA TENSA (PÁGINA 7)
  // ==========================================================================
  class StringWaveSim {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.time = 0;
      this.isPlaying = true;

      this.tension = 50;  // T [N]
      this.mu = 0.005;    // mu [kg/m]
      this.pulseX = 0;

      this.initEvents();
      this.resize();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.max(300, rect.width * dpr);
      this.canvas.height = Math.max(140, rect.height * dpr);
      this.ctx.scale(dpr, dpr);
      this.cssWidth = rect.width;
      this.cssHeight = rect.height;
    }

    initEvents() {
      const sliderT = document.getElementById('sliderStringT');
      const sliderMu = document.getElementById('sliderStringMu');
      const btnPulse = document.getElementById('btnStringPulse');

      if (sliderT) sliderT.addEventListener('input', e => { this.tension = parseFloat(e.target.value); this.update(); });
      if (sliderMu) sliderMu.addEventListener('input', e => { this.mu = parseFloat(e.target.value); this.update(); });
      if (btnPulse) btnPulse.addEventListener('click', () => { this.pulseX = 0; });
      this.update();
    }

    update() {
      const v = Math.sqrt(this.tension / this.mu);
      const readV = document.getElementById('readStringV');
      if (readV) readV.textContent = `${v.toFixed(1)} m/s`;
    }

    loop() {
      const v = Math.sqrt(this.tension / this.mu);
      this.pulseX += v * 0.0003;
      if (this.pulseX > 1.2) this.pulseX = 0;

      this.draw();
      requestAnimationFrame(this.loop);
    }

    draw() {
      if (!this.canvas) return;
      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;
      const midY = h / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#09111e';
      ctx.fillRect(0, 0, w, h);

      // Cuerda vibrante con pulso gaussiano
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.2;

      const L = 1.0;
      const pCenter = this.pulseX;
      const pWidth = 0.08;

      for (let px = 0; px <= w; px += 2) {
        const x = px / w;
        // Pulso gaussiano viajero
        const pulse = 28 * Math.exp(-Math.pow((x - pCenter) / pWidth, 2));
        const py = midY - pulse;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Soporte izquierdo y derecho
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, midY - 20, 8, 40);
      ctx.fillRect(w - 8, midY - 20, 8, 40);

      // Indicador HUD
      ctx.font = '11px Outfit, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`Rapidez v = √(T/μ) = ${Math.sqrt(this.tension/this.mu).toFixed(1)} m/s`, 14, 20);
    }
  }

  // ==========================================================================
  // 3. SIMULADOR DE ONDAS ESTACIONARIAS (PÁGINA 15)
  // ==========================================================================
  class StandingWaveSim {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.time = 0;
      this.harmonic = 2; // n = 1, 2, 3, 4, 5
      this.type = 'fixed'; // 'fixed' (cuerda fija) | 'open' (tubo abierto) | 'closed' (tubo cerrado)

      this.initEvents();
      this.resize();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.max(300, rect.width * dpr);
      this.canvas.height = Math.max(160, rect.height * dpr);
      this.ctx.scale(dpr, dpr);
      this.cssWidth = rect.width;
      this.cssHeight = rect.height;
    }

    initEvents() {
      const selectH = document.getElementById('selectHarmonic');
      const selectType = document.getElementById('selectBoundary');

      if (selectH) {
        selectH.addEventListener('change', e => {
          this.harmonic = parseInt(e.target.value, 10);
        });
      }

      if (selectType) {
        selectType.addEventListener('change', e => {
          this.type = e.target.value;
        });
      }
    }

    loop() {
      this.time += 0.035;
      this.draw();
      requestAnimationFrame(this.loop);
    }

    draw() {
      if (!this.canvas) return;
      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;
      const midY = h / 2;
      const n = this.harmonic;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#09111e';
      ctx.fillRect(0, 0, w, h);

      // Línea de equilibrio
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, midY);
      ctx.lineTo(w - 20, midY);
      ctx.stroke();

      const spanW = w - 40;
      const amp = 42 * Math.cos(this.time);
      const envAmp = 42;

      // Envolvente punteada de la onda estacionaria
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let px = 0; px <= spanW; px += 2) {
        const xFrac = px / spanW;
        let shape = 0;
        if (this.type === 'fixed') shape = Math.sin(n * Math.PI * xFrac);
        else if (this.type === 'closed') shape = Math.sin((2 * n - 1) * 0.5 * Math.PI * xFrac);
        else shape = Math.cos(n * Math.PI * xFrac);

        const py = midY - envAmp * Math.abs(shape);
        if (px === 0) ctx.moveTo(20 + px, py);
        else ctx.lineTo(20 + px, py);
      }
      for (let px = spanW; px >= 0; px -= 2) {
        const xFrac = px / spanW;
        let shape = 0;
        if (this.type === 'fixed') shape = Math.sin(n * Math.PI * xFrac);
        else if (this.type === 'closed') shape = Math.sin((2 * n - 1) * 0.5 * Math.PI * xFrac);
        else shape = Math.cos(n * Math.PI * xFrac);

        const py = midY + envAmp * Math.abs(shape);
        ctx.lineTo(20 + px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Cuerda animada en tiempo real
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      for (let px = 0; px <= spanW; px += 2) {
        const xFrac = px / spanW;
        let shape = 0;
        if (this.type === 'fixed') shape = Math.sin(n * Math.PI * xFrac);
        else if (this.type === 'closed') shape = Math.sin((2 * n - 1) * 0.5 * Math.PI * xFrac);
        else shape = Math.cos(n * Math.PI * xFrac);

        const py = midY - amp * shape;
        if (px === 0) ctx.moveTo(20 + px, py);
        else ctx.lineTo(20 + px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Nodos (N) y Antinodos (A) señalados
      ctx.font = '10px Outfit, sans-serif';
      if (this.type === 'fixed') {
        for (let i = 0; i <= n; i++) {
          const nx = 20 + (i / n) * spanW;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(nx, midY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillText('N', nx - 3, midY + 16);
        }
        for (let i = 0; i < n; i++) {
          const ax = 20 + ((i + 0.5) / n) * spanW;
          ctx.fillStyle = '#10b981';
          ctx.fillText('A', ax - 3, midY - envAmp - 6);
        }
      }
    }
  }

  // ==========================================================================
  // ==========================================================================
  // 4. SIMULADOR DE EFECTO DOPPLER Y CONO DE MACH (PÁGINA 17)
  // ==========================================================================
  class DopplerMachSim {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.fronts = [];
      this.sourceX = 50;
      this.c = 120; // velocidad de la onda
      this.vf = 60; // velocidad de la fuente
      this.fs = 440; // frecuencia propia en Hz
      this.emitTimer = 0;
      this.audioCtx = null;
      this.osc = null;
      this.gain = null;
      this.audioActive = false;

      this.initEvents();
      this.resize();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.max(300, rect.width * dpr);
      this.canvas.height = Math.max(160, rect.height * dpr);
      this.ctx.scale(dpr, dpr);
      this.cssWidth = rect.width;
      this.cssHeight = rect.height;
    }

    initEvents() {
      const sliderVf = document.getElementById('sliderDopplerVf');
      if (sliderVf) {
        sliderVf.addEventListener('input', e => {
          this.vf = parseFloat(e.target.value);
          this.updateReadout();
        });
      }

      const audioBtn = document.getElementById('btnAudioDopplerNotebook');
      if (audioBtn) {
        audioBtn.addEventListener('click', () => {
          this.toggleAudio(audioBtn);
        });
      }
    }

    toggleAudio(btn) {
      if (!this.audioActive) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!this.audioCtx) this.audioCtx = new AudioContext();
          if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

          this.gain = this.audioCtx.createGain();
          this.gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
          this.gain.connect(this.audioCtx.destination);

          this.osc = this.audioCtx.createOscillator();
          this.osc.type = 'sawtooth';
          this.osc.connect(this.gain);
          this.osc.start();

          this.gain.gain.exponentialRampToValueAtTime(0.12, this.audioCtx.currentTime + 0.1);
          this.audioActive = true;
          if (btn) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-volume-high"></i> Silenciar';
          }
        } catch (e) {
          console.warn('Audio Doppler error:', e);
        }
      } else {
        if (this.gain && this.audioCtx) {
          this.gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.05);
          setTimeout(() => {
            if (this.osc) { this.osc.stop(); this.osc.disconnect(); this.osc = null; }
          }, 80);
        }
        this.audioActive = false;
        if (btn) {
          btn.classList.remove('active');
          btn.innerHTML = '<i class="fas fa-volume-xmark"></i> Escuchar';
        }
      }
    }

    updateReadout(foVal) {
      const mach = this.vf / this.c;
      const readM = document.getElementById('readDopplerMach');
      if (readM) {
        const foStr = foVal ? ` · fo ≈ ${foVal.toFixed(0)} Hz` : '';
        readM.textContent = `Mach ${mach.toFixed(2)} (${this.vf} m/s)${foStr}`;
      }
    }

    loop() {
      const dt = 0.016;
      const w = this.cssWidth;
      const midY = this.cssHeight / 2;

      this.sourceX += this.vf * dt;
      if (this.sourceX > w + 60) {
        this.sourceX = -40;
        this.fronts = [];
      } else if (this.sourceX < -60) {
        this.sourceX = w + 40;
        this.fronts = [];
      }

      this.emitTimer += dt;
      if (this.emitTimer >= 0.12) {
        this.emitTimer = 0;
        this.fronts.push({ x: this.sourceX, y: midY, r: 0 });
      }

      // Expandir frentes de onda
      this.fronts.forEach(f => { f.r += this.c * dt; });
      this.fronts = this.fronts.filter(f => f.r < w * 1.5);

      this.draw();
      requestAnimationFrame(this.loop);
    }

    draw() {
      if (!this.canvas) return;
      const ctx = this.ctx;
      const w = this.cssWidth;
      const h = this.cssHeight;
      const midY = h / 2;
      const mach = this.vf / this.c;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#09111e';
      ctx.fillRect(0, 0, w, h);

      // Posición del observador en el lienzo del cuaderno
      const obsX = w * 0.55;
      const obsY = h * 0.22;

      // Calcular ángulo theta y frecuencia observada instantánea
      const dx = obsX - this.sourceX;
      const dy = obsY - midY;
      const dist = Math.hypot(dx, dy);
      const cosTheta = dist > 0.01 ? (dx / dist) : 0;
      let fo = this.fs;
      const denom = this.c - this.vf * cosTheta;
      if (Math.abs(denom) > 1) {
        fo = this.fs * (this.c / denom);
      }
      this.updateReadout(Math.abs(fo));

      // Actualizar audio si está activo
      if (this.audioActive && this.osc && this.audioCtx) {
        const safePitch = Math.max(80, Math.min(2200, Math.abs(fo)));
        this.osc.frequency.setTargetAtTime(safePitch, this.audioCtx.currentTime, 0.04);
      }

      // Dibujar frentes de onda circulares
      ctx.lineWidth = 1.3;
      this.fronts.forEach(f => {
        ctx.strokeStyle = mach >= 1.0 ? 'rgba(234, 88, 12, 0.45)' : 'rgba(0, 240, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Si es supersónico, trazar envolvente del Cono de Mach
      if (mach >= 1.0) {
        const sinTheta = 1.0 / mach;
        const theta = Math.asin(Math.min(1, sinTheta));
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([4, 2]);

        const coneLen = 300;
        const cdx = coneLen * Math.cos(theta);
        const cdy = coneLen * Math.sin(theta);

        ctx.beginPath();
        ctx.moveTo(this.sourceX, midY);
        ctx.lineTo(this.sourceX - cdx, midY - cdy);
        ctx.moveTo(this.sourceX, midY);
        ctx.lineTo(this.sourceX - cdx, midY + cdy);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '11px Outfit, sans-serif';
        ctx.fillStyle = '#f97316';
        ctx.fillText(`Cono de Mach: θ = ${(theta * 180 / Math.PI).toFixed(1)}°`, 14, 20);
      } else {
        ctx.font = '11px Outfit, sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(`Régimen subsónico · f_o = ${Math.abs(fo).toFixed(0)} Hz`, 14, 20);
      }

      // Línea visual Fuente -> Observador
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(this.sourceX, midY);
      ctx.lineTo(obsX, obsY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Observador
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(obsX, obsY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '10px "DM Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText('Observador', obsX + 9, obsY + 3);

      // Fuente en movimiento
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(this.sourceX, midY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // ==========================================================================
  // 5. SIMULADOR Y SINTETIZADOR DE BATIMIENTOS CON AUDIO (PÁGINA 18)
  // ==========================================================================
  class BeatsAudioSim {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.f1 = 440;
      this.f2 = 443;
      this.audioCtx = null;
      this.osc1 = null;
      this.osc2 = null;
      this.isPlayingAudio = false;
      this.animTime = 0;
      this.cssWidth = 360;
      this.cssHeight = 120;

      this.initEvents();
      this.resize();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const parentW = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 360;
      const dpr = window.devicePixelRatio || 1;
      
      const targetW = rect.width > 20 ? rect.width : (parentW > 20 ? parentW : 360);
      const targetH = rect.height > 20 ? rect.height : 120;

      this.cssWidth = targetW;
      this.cssHeight = targetH;
      this.canvas.width = Math.round(targetW * dpr);
      this.canvas.height = Math.round(targetH * dpr);

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.draw();
    }

    initEvents() {
      const sliderF1 = document.getElementById('sliderBeatF1');
      const sliderF2 = document.getElementById('sliderBeatF2');
      const btnAudio = document.getElementById('btnBeatAudio');

      if (sliderF1) sliderF1.addEventListener('input', e => { this.f1 = parseFloat(e.target.value); this.update(); });
      if (sliderF2) sliderF2.addEventListener('input', e => { this.f2 = parseFloat(e.target.value); this.update(); });

      if (btnAudio) {
        btnAudio.addEventListener('click', () => {
          if (this.isPlayingAudio) {
            this.stopAudio();
            btnAudio.innerHTML = '<i class="fas fa-volume-up"></i> Escuchar batimiento';
          } else {
            this.startAudio();
            btnAudio.innerHTML = '<i class="fas fa-volume-mute"></i> Detener audio';
          }
        });
      }
      this.update();
    }

    update() {
      const fBeat = Math.abs(this.f1 - this.f2);
      const readBeat = document.getElementById('readBeatFreq');
      const readCarrier = document.getElementById('readCarrierFreq');
      if (readBeat) readBeat.textContent = `${fBeat.toFixed(1)} Hz`;
      if (readCarrier) readCarrier.textContent = `${((this.f1 + this.f2) / 2).toFixed(1)} Hz`;

      if (this.isPlayingAudio && this.osc1 && this.osc2 && this.audioCtx) {
        this.osc1.frequency.setValueAtTime(this.f1, this.audioCtx.currentTime);
        this.osc2.frequency.setValueAtTime(this.f2, this.audioCtx.currentTime);
      }
      this.draw();
    }

    startAudio() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!this.audioCtx) this.audioCtx = new AudioContext();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        this.osc1 = this.audioCtx.createOscillator();
        this.osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        this.osc1.type = 'sine';
        this.osc1.frequency.setValueAtTime(this.f1, this.audioCtx.currentTime);

        this.osc2.type = 'sine';
        this.osc2.frequency.setValueAtTime(this.f2, this.audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime);

        this.osc1.connect(gainNode);
        this.osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        this.osc1.start();
        this.osc2.start();
        this.isPlayingAudio = true;
      } catch (err) {
        console.warn('Audio Batimientos error:', err);
      }
    }

    stopAudio() {
      if (this.osc1) { try { this.osc1.stop(); this.osc1.disconnect(); } catch (e) {} }
      if (this.osc2) { try { this.osc2.stop(); this.osc2.disconnect(); } catch (e) {} }
      if (this.audioCtx) { try { this.audioCtx.close(); } catch (e) {} this.audioCtx = null; }
      this.isPlayingAudio = false;
    }

    loop() {
      this.animTime += 0.018;
      this.draw();
      requestAnimationFrame(this.loop);
    }

    draw() {
      if (!this.canvas) return;
      const ctx = this.ctx;

      // Autochequeo de tamaño si el contenedor cambió de visibilidad
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width > 20 && Math.abs(rect.width - this.cssWidth) > 5) {
        this.resize();
        return;
      }

      const w = this.cssWidth || 360;
      const h = this.cssHeight || 120;
      const midY = h / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#09111e';
      ctx.fillRect(0, 0, w, h);

      // Líneas sutiles de cuadrícula
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      const fBeat = Math.abs(this.f1 - this.f2);
      const fCarrier = (this.f1 + this.f2) / 2;
      const visualBeatOmega = Math.max(0.8, fBeat * 1.2);
      const visualCarrierOmega = 16;
      const maxAmp = Math.min(48, h * 0.38);

      // 1. Envolvente superior e inferior (Naranja punteada)
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let px = 0; px <= w; px += 2) {
        const xNorm = (px / w) * 4 * Math.PI;
        const envVal = maxAmp * Math.abs(Math.cos(visualBeatOmega * (this.animTime * 0.8) - xNorm * 0.35));
        const py = midY - envVal;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let px = w; px >= 0; px -= 2) {
        const xNorm = (px / w) * 4 * Math.PI;
        const envVal = maxAmp * Math.abs(Math.cos(visualBeatOmega * (this.animTime * 0.8) - xNorm * 0.35));
        const py = midY + envVal;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Onda Portadora Compuesta (Cian brillante)
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let px = 0; px <= w; px += 1) {
        const xNorm = (px / w) * 4 * Math.PI;
        const env = maxAmp * Math.cos(visualBeatOmega * (this.animTime * 0.8) - xNorm * 0.35);
        const carrier = Math.cos(visualCarrierOmega * (this.animTime * 1.5) - xNorm * 2.5);
        const y = env * carrier;
        const py = midY - y;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 3. Rótulos informativos
      ctx.font = '10.5px Outfit, sans-serif';
      ctx.fillStyle = '#f97316';
      ctx.fillText(`Envolvente: f_bat = ${fBeat.toFixed(1)} Hz (T_bat = ${(1 / Math.max(0.1, fBeat)).toFixed(2)} s)`, 12, 18);

      ctx.font = '10px "DM Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Portadora: ${fCarrier.toFixed(1)} Hz`, w - 145, 18);
    }
  }

  // ==========================================================================
  // 6. ESTUDIO ACÚSTICO MULTINSTRUMENTO: PIANO, GUITARRA Y FLAUTA (PÁGINA 11)
  // ==========================================================================
  class MusicalKeyboardSim {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;

      this.audioCtx = null;
      this.masterCompressor = null;
      this.currentFluteVoice = null;
      this.instrument = 'piano'; // 'piano' | 'guitar' | 'flute'
      this.octave = 4; // 4ta octava estándar (La 4 = 440 Hz)
      this.isPlayingMelody = false;
      this.melodyTimeout = null;
      this.melodyStep = 0;
      this.activePressedKeys = new Set();

      // Mapeo completo de 15 notas cromáticas y diatónicas con atajos de teclado de computadora
      // Para octOffset = 1, se utiliza n estándar (Do=1, Do#=2, Re=3) con escala temperada f(n, m)
      this.notes = [
        { name: 'Do', n: 1, sharp: false, key: 'a', keyDisplay: 'A', octOffset: 0, gStr: 4, fret: 3, fluteHole: 0 },
        { name: 'Do#', n: 2, sharp: true, key: 'w', keyDisplay: 'W', octOffset: 0, gStr: 4, fret: 4, fluteHole: 1 },
        { name: 'Re', n: 3, sharp: false, key: 's', keyDisplay: 'S', octOffset: 0, gStr: 3, fret: 0, fluteHole: 1 },
        { name: 'Re#', n: 4, sharp: true, key: 'e', keyDisplay: 'E', octOffset: 0, gStr: 3, fret: 1, fluteHole: 2 },
        { name: 'Mi', n: 5, sharp: false, key: 'd', keyDisplay: 'D', octOffset: 0, gStr: 3, fret: 2, fluteHole: 2 },
        { name: 'Fa', n: 6, sharp: false, key: 'f', keyDisplay: 'F', octOffset: 0, gStr: 3, fret: 3, fluteHole: 3 },
        { name: 'Fa#', n: 7, sharp: true, key: 't', keyDisplay: 'T', octOffset: 0, gStr: 2, fret: 2, fluteHole: 4 },
        { name: 'Sol', n: 8, sharp: false, key: 'g', keyDisplay: 'G', octOffset: 0, gStr: 2, fret: 0, fluteHole: 4 },
        { name: 'Sol#', n: 9, sharp: true, key: 'y', keyDisplay: 'Y', octOffset: 0, gStr: 2, fret: 1, fluteHole: 5 },
        { name: 'La', n: 10, sharp: false, key: 'h', keyDisplay: 'H', octOffset: 0, gStr: 2, fret: 2, fluteHole: 5 },
        { name: 'La#', n: 11, sharp: true, key: 'u', keyDisplay: 'U', octOffset: 0, gStr: 1, fret: 1, fluteHole: 6 },
        { name: 'Si', n: 12, sharp: false, key: 'j', keyDisplay: 'J', octOffset: 0, gStr: 1, fret: 0, fluteHole: 6 },
        { name: 'Do (+1)', n: 1, sharp: false, key: 'k', keyDisplay: 'K', octOffset: 1, gStr: 1, fret: 1, fluteHole: 7 },
        { name: 'Do# (+1)', n: 2, sharp: true, key: 'o', keyDisplay: 'O', octOffset: 1, gStr: 0, fret: 2, fluteHole: 7 },
        { name: 'Re (+1)', n: 3, sharp: false, key: 'l', keyDisplay: 'L', octOffset: 1, gStr: 0, fret: 3, fluteHole: 7 }
      ];

      // Catálogo pedagógico de melodías icónicas por instrumento (frases completas y tempo calibrado)
      this.melodies = {
        piano: [
          {
            id: 'fur_elise',
            title: 'Para Elisa (Beethoven - Frase Completa)',
            tempo: 82, // Tempo calmado y musical (evita sensación acelerada)
            notes: [
              // Frase principal A
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Re#', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Re#', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'Re', oct: 0, dur: 0.55 },
              { n: 'Do', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 1.15 },
              // Arpegio La menor
              { n: 'Do', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 1.15 },
              // Arpegio Mi mayor
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Sol#', oct: 0, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 1.2 },
              // Segunda vuelta de la frase principal
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Re#', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Re#', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'Re', oct: 0, dur: 0.55 },
              { n: 'Do', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 1.15 },
              // Resolución final cadencial
              { n: 'Do', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 1.0 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 1.8 }
            ]
          },
          {
            id: 'ode_to_joy',
            title: 'Himno a la Alegría (Beethoven - Sinfonía Nº 9)',
            tempo: 78,
            notes: [
              // Frase A
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Fa', oct: 0, dur: 0.65 },
              { n: 'Sol', oct: 0, dur: 0.65 },
              { n: 'Sol', oct: 0, dur: 0.65 },
              { n: 'Fa', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Do', oct: 0, dur: 0.65 },
              { n: 'Do', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.9 },
              { n: 'Re', oct: 0, dur: 0.4 },
              { n: 'Re', oct: 0, dur: 1.25 },
              // Frase B
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Fa', oct: 0, dur: 0.65 },
              { n: 'Sol', oct: 0, dur: 0.65 },
              { n: 'Sol', oct: 0, dur: 0.65 },
              { n: 'Fa', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Do', oct: 0, dur: 0.65 },
              { n: 'Do', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.9 },
              { n: 'Do', oct: 0, dur: 0.4 },
              { n: 'Do', oct: 0, dur: 1.35 },
              // Frase C (Puente de desarrollo)
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Do', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.35 },
              { n: 'Fa', oct: 0, dur: 0.35 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Do', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.35 },
              { n: 'Fa', oct: 0, dur: 0.35 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Do', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 1.25 },
              // Frase D (Conclusión)
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Fa', oct: 0, dur: 0.65 },
              { n: 'Sol', oct: 0, dur: 0.65 },
              { n: 'Sol', oct: 0, dur: 0.65 },
              { n: 'Fa', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Do', oct: 0, dur: 0.65 },
              { n: 'Do', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.65 },
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Re', oct: 0, dur: 0.9 },
              { n: 'Do', oct: 0, dur: 0.4 },
              { n: 'Do', oct: 0, dur: 1.7 }
            ]
          },
          {
            id: 'moonlight',
            title: 'Claro de Luna (Beethoven - Sonata Quasi una Fantasia)',
            tempo: 62, // Adagio sostenuto suave y tranquilo
            notes: [
              // Compás 1: Tríadas de Do# menor
              { n: 'Sol#', oct: 0, dur: 0.6 },
              { n: 'Do#', oct: 0, dur: 0.6 },
              { n: 'Mi', oct: 0, dur: 0.6 },
              { n: 'Sol#', oct: 0, dur: 0.6 },
              { n: 'Do#', oct: 0, dur: 0.6 },
              { n: 'Mi', oct: 0, dur: 0.6 },
              // Compás 2
              { n: 'Sol#', oct: 0, dur: 0.6 },
              { n: 'Do#', oct: 0, dur: 0.6 },
              { n: 'Mi', oct: 0, dur: 0.6 },
              { n: 'Sol#', oct: 0, dur: 0.6 },
              { n: 'Do#', oct: 0, dur: 0.6 },
              { n: 'Mi', oct: 0, dur: 0.6 },
              // Compás 3: Tríada de La mayor
              { n: 'La', oct: 0, dur: 0.6 },
              { n: 'Do#', oct: 0, dur: 0.6 },
              { n: 'Mi', oct: 0, dur: 0.6 },
              { n: 'La', oct: 0, dur: 0.6 },
              { n: 'Do#', oct: 0, dur: 0.6 },
              { n: 'Mi', oct: 0, dur: 0.6 },
              // Compás 4: Modulación hacia Re mayor
              { n: 'La', oct: 0, dur: 0.6 },
              { n: 'Re', oct: 0, dur: 0.6 },
              { n: 'Fa#', oct: 0, dur: 0.6 },
              { n: 'La', oct: 0, dur: 0.6 },
              { n: 'Re', oct: 0, dur: 0.6 },
              { n: 'Fa#', oct: 0, dur: 0.6 },
              // Compás 5: Cadencia y reposo
              { n: 'Sol#', oct: 0, dur: 0.6 },
              { n: 'Do#', oct: 0, dur: 0.6 },
              { n: 'Mi', oct: 0, dur: 0.6 },
              { n: 'Sol#', oct: 0, dur: 0.6 },
              { n: 'Re#', oct: 0, dur: 0.6 },
              { n: 'Fa#', oct: 0, dur: 0.6 },
              { n: 'Sol#', oct: 0, dur: 0.6 },
              { n: 'Do#', oct: 0, dur: 0.6 },
              { n: 'Mi', oct: 0, dur: 1.8 }
            ]
          }
        ],
        guitar: [
          {
            id: 'romance',
            title: 'Romance Anónimo (Romanza Española - Completo)',
            tempo: 80,
            notes: [
              // Parte 1: Arpegio descendente
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Re', oct: 0, dur: 0.55 },
              { n: 'Do', oct: 0, dur: 0.55 },
              { n: 'Do', oct: 0, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 0.55 },
              { n: 'Do', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 1.15 },
              // Parte 2: Arpegio y agudos
              { n: 'La', oct: 0, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 0.55 },
              { n: 'Sol#', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Sol#', oct: 0, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 1.8 }
            ]
          },
          {
            id: 'smoke_water',
            title: 'Smoke on the Water (Deep Purple - Riff Completo)',
            tempo: 84,
            notes: [
              // Vuelta 1
              { n: 'Sol', oct: 0, dur: 0.55 },
              { n: 'La#', oct: 0, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 0.85 },
              { n: 'Sol', oct: 0, dur: 0.55 },
              { n: 'La#', oct: 0, dur: 0.55 },
              { n: 'Do# (+1)', oct: 1, dur: 0.4 },
              { n: 'Do (+1)', oct: 1, dur: 0.9 },
              { n: 'Sol', oct: 0, dur: 0.55 },
              { n: 'La#', oct: 0, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 0.85 },
              { n: 'La#', oct: 0, dur: 0.55 },
              { n: 'Sol', oct: 0, dur: 1.3 },
              // Vuelta 2 (Repetición sincopada)
              { n: 'Sol', oct: 0, dur: 0.55 },
              { n: 'La#', oct: 0, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 0.85 },
              { n: 'Sol', oct: 0, dur: 0.55 },
              { n: 'La#', oct: 0, dur: 0.55 },
              { n: 'Do# (+1)', oct: 1, dur: 0.4 },
              { n: 'Do (+1)', oct: 1, dur: 0.9 },
              { n: 'Sol', oct: 0, dur: 0.55 },
              { n: 'La#', oct: 0, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 0.85 },
              { n: 'La#', oct: 0, dur: 0.55 },
              { n: 'Sol', oct: 0, dur: 1.8 }
            ]
          },
          {
            id: 'guantanamera',
            title: 'Guantanamera (Melodía Latina - Verso y Coro)',
            tempo: 86,
            notes: [
              // Verso A
              { n: 'Sol', oct: 0, dur: 0.45 },
              { n: 'Do', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.55 },
              { n: 'Mi', oct: 0, dur: 0.45 },
              { n: 'Re', oct: 0, dur: 0.5 },
              { n: 'Do', oct: 0, dur: 0.5 },
              { n: 'Re', oct: 0, dur: 0.9 },
              // Verso B
              { n: 'Sol', oct: 0, dur: 0.45 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'Re', oct: 0, dur: 0.55 },
              { n: 'Re', oct: 0, dur: 0.45 },
              { n: 'Do', oct: 0, dur: 0.5 },
              { n: 'Si', oct: 0, dur: 0.5 },
              { n: 'Do', oct: 0, dur: 0.9 },
              // Coro 1: Guan-ta-na-me-ra...
              { n: 'Mi', oct: 0, dur: 0.5 },
              { n: 'Mi', oct: 0, dur: 0.5 },
              { n: 'Mi', oct: 0, dur: 0.5 },
              { n: 'Re', oct: 0, dur: 0.5 },
              { n: 'Do', oct: 0, dur: 0.5 },
              { n: 'Re', oct: 0, dur: 1.0 },
              // Coro 2: Gua-ji-ra Guan-ta-na-me-ra...
              { n: 'Re', oct: 0, dur: 0.5 },
              { n: 'Re', oct: 0, dur: 0.5 },
              { n: 'Re', oct: 0, dur: 0.5 },
              { n: 'Do', oct: 0, dur: 0.5 },
              { n: 'Si', oct: 0, dur: 0.5 },
              { n: 'Do', oct: 0, dur: 1.7 }
            ]
          }
        ],
        flute: [
          {
            id: 'condor_pasa',
            title: 'El Cóndor Pasa (Melodía Andina - Tema Completo)',
            tempo: 74,
            notes: [
              // Frase A (Tema introspectivo andino)
              { n: 'Mi', oct: 0, dur: 0.65 },
              { n: 'Sol', oct: 0, dur: 0.65 },
              { n: 'La', oct: 0, dur: 0.75 },
              { n: 'Si', oct: 0, dur: 1.05 },
              { n: 'La', oct: 0, dur: 0.5 },
              { n: 'Sol', oct: 0, dur: 0.5 },
              { n: 'Mi', oct: 0, dur: 0.85 },
              { n: 'Sol', oct: 0, dur: 0.5 },
              { n: 'Mi', oct: 0, dur: 0.5 },
              { n: 'Re', oct: 0, dur: 0.5 },
              { n: 'Mi', oct: 0, dur: 1.3 },
              // Frase B (Elevación melódica)
              { n: 'Sol', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.75 },
              { n: 'Do (+1)', oct: 1, dur: 0.75 },
              { n: 'Re (+1)', oct: 1, dur: 1.15 },
              { n: 'Do (+1)', oct: 1, dur: 0.55 },
              { n: 'Si', oct: 0, dur: 0.55 },
              { n: 'La', oct: 0, dur: 0.75 },
              { n: 'Si', oct: 0, dur: 0.6 },
              { n: 'La', oct: 0, dur: 0.5 },
              { n: 'Sol', oct: 0, dur: 0.5 },
              { n: 'Mi', oct: 0, dur: 0.85 },
              { n: 'Sol', oct: 0, dur: 0.5 },
              { n: 'Re', oct: 0, dur: 0.5 },
              { n: 'Mi', oct: 0, dur: 1.8 }
            ]
          },
          {
            id: 'titanic',
            title: 'Titanic - My Heart Will Go On (Tema y Verso)',
            tempo: 76,
            notes: [
              // Frase 1
              { n: 'Fa', oct: 0, dur: 0.6 },
              { n: 'Sol', oct: 0, dur: 0.6 },
              { n: 'Sol', oct: 0, dur: 0.6 },
              { n: 'Fa', oct: 0, dur: 0.45 },
              { n: 'Sol', oct: 0, dur: 0.65 },
              { n: 'La', oct: 0, dur: 0.95 },
              { n: 'Sol', oct: 0, dur: 0.6 },
              { n: 'Fa', oct: 0, dur: 0.6 },
              { n: 'Sol', oct: 0, dur: 0.8 },
              { n: 'Do', oct: 0, dur: 1.3 },
              // Frase 2 (Repetición del motivo)
              { n: 'Fa', oct: 0, dur: 0.6 },
              { n: 'Sol', oct: 0, dur: 0.6 },
              { n: 'Sol', oct: 0, dur: 0.6 },
              { n: 'Fa', oct: 0, dur: 0.45 },
              { n: 'Sol', oct: 0, dur: 0.65 },
              { n: 'La', oct: 0, dur: 0.95 },
              { n: 'Sol', oct: 0, dur: 0.6 },
              { n: 'Fa', oct: 0, dur: 0.6 },
              { n: 'Sol', oct: 0, dur: 0.8 },
              { n: 'Do', oct: 0, dur: 1.3 },
              // Frase 3 (Subida lírica al coro)
              { n: 'Fa', oct: 0, dur: 0.55 },
              { n: 'Sol', oct: 0, dur: 0.55 },
              { n: 'Do (+1)', oct: 1, dur: 1.15 },
              { n: 'Si', oct: 0, dur: 0.6 },
              { n: 'La', oct: 0, dur: 0.6 },
              { n: 'Sol', oct: 0, dur: 0.6 },
              { n: 'La', oct: 0, dur: 0.7 },
              { n: 'Sol', oct: 0, dur: 0.5 },
              { n: 'Fa', oct: 0, dur: 1.8 }
            ]
          },
          {
            id: 'flauta_magica',
            title: 'La Flauta Mágica (Mozart - Aria de Papageno)',
            tempo: 84,
            notes: [
              // Llamada 1 de la flauta de pan
              { n: 'Sol', oct: 0, dur: 0.45 },
              { n: 'La', oct: 0, dur: 0.45 },
              { n: 'Si', oct: 0, dur: 0.45 },
              { n: 'Do (+1)', oct: 1, dur: 0.45 },
              { n: 'Re (+1)', oct: 1, dur: 0.9 },
              // Retorno
              { n: 'Do (+1)', oct: 1, dur: 0.45 },
              { n: 'Si', oct: 0, dur: 0.45 },
              { n: 'La', oct: 0, dur: 0.45 },
              { n: 'Sol', oct: 0, dur: 1.0 },
              // Llamada 2
              { n: 'Sol', oct: 0, dur: 0.45 },
              { n: 'La', oct: 0, dur: 0.45 },
              { n: 'Si', oct: 0, dur: 0.45 },
              { n: 'Do (+1)', oct: 1, dur: 0.45 },
              { n: 'Re (+1)', oct: 1, dur: 0.9 },
              // Retorno
              { n: 'Do (+1)', oct: 1, dur: 0.45 },
              { n: 'Si', oct: 0, dur: 0.45 },
              { n: 'La', oct: 0, dur: 0.45 },
              { n: 'Sol', oct: 0, dur: 1.0 },
              // Frase complementaria de Papageno
              { n: 'Mi', oct: 0, dur: 0.5 },
              { n: 'Fa', oct: 0, dur: 0.5 },
              { n: 'Sol', oct: 0, dur: 0.5 },
              { n: 'La', oct: 0, dur: 0.5 },
              { n: 'Si', oct: 0, dur: 0.5 },
              { n: 'Do (+1)', oct: 1, dur: 0.65 },
              { n: 'Si', oct: 0, dur: 0.5 },
              { n: 'La', oct: 0, dur: 0.5 },
              { n: 'Sol', oct: 0, dur: 1.7 }
            ]
          }
        ]
      };

      this.renderKeys();
      this.renderGuitar();
      this.renderFlute();
      this.populateMelodiesDropdown();
      this.initEvents();
    }

    getAudioContext() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      // Compresor dinámico maestro para evitar distorsión armónica o clipping digital
      if (!this.masterCompressor && this.audioCtx) {
        this.masterCompressor = this.audioCtx.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-14, this.audioCtx.currentTime);
        this.masterCompressor.knee.setValueAtTime(10, this.audioCtx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.masterCompressor.release.setValueAtTime(0.12, this.audioCtx.currentTime);
        this.masterCompressor.connect(this.audioCtx.destination);
      }
      return this.audioCtx;
    }

    calcFreq(n, m) {
      // Ecuación de escala temperada: f(n, m) = 440 * 2^((m - 4) + (n - 10)/12)
      // Con La 4 (n=10, m=4) -> 440 Hz
      return 440 * Math.pow(2, (m - 4) + (n - 10) / 12);
    }

    initEvents() {
      // 1. Selector de Octava
      const selectOct = document.getElementById('selectKeyboardOctave');
      if (selectOct) {
        selectOct.addEventListener('change', e => {
          this.octave = parseInt(e.target.value, 10);
          this.renderKeys();
          this.renderGuitar();
          this.renderFlute();
        });
      }

      // 2. Selector de Instrumento
      const pillPiano = document.getElementById('pillInstPiano');
      const pillGuitar = document.getElementById('pillInstGuitar');
      const pillFlute = document.getElementById('pillInstFlute');

      const setInstrument = (inst) => {
        this.instrument = inst;
        [pillPiano, pillGuitar, pillFlute].forEach(p => {
          if (p) {
            const isActive = p.dataset.instrument === inst;
            p.classList.toggle('active', isActive);
            p.setAttribute('aria-selected', isActive ? 'true' : 'false');
          }
        });

        // Alternar vistas visuales
        const vPiano = document.getElementById('visualPianoContainer');
        const vGuitar = document.getElementById('visualGuitarContainer');
        const vFlute = document.getElementById('visualFluteContainer');
        if (vPiano) vPiano.classList.toggle('active', inst === 'piano');
        if (vGuitar) vGuitar.classList.toggle('active', inst === 'guitar');
        if (vFlute) vFlute.classList.toggle('active', inst === 'flute');

        // Actualizar textos e información acústica
        const badge = document.getElementById('currentInstrumentBadge');
        const insight = document.getElementById('musicPhysicsInsight');

        if (inst === 'piano') {
          if (badge) badge.textContent = 'PIANO DE COLA · CUERDAS PERCUTIDAS';
          if (insight) insight.innerHTML = 'Timbre armónico percutivo: fundamental con armónicos $f, 2f, 3f\dots$ y decaimiento exponencial natural.';
        } else if (inst === 'guitar') {
          if (badge) badge.textContent = 'GUITARRA ACÚSTICA · CUERDAS PULSADAS';
          if (insight) insight.innerHTML = 'Cuerda punteada (Karplus-Strong): armónicos brillantes iniciales con decaimiento rápido de altas frecuencias y resonancia de caja.';
        } else if (inst === 'flute') {
          if (badge) badge.textContent = 'FLAUTA TRAVERSA · COLUMNA DE AIRE RESONANTE';
          if (insight) insight.innerHTML = 'Tubo acústico abierto: fundamental predominante ($f_n = n \\frac{v}{2L}$) con soplido de embocadura y vibrato acústico.';
        }

        // Actualizar dropdown de melodías
        this.populateMelodiesDropdown();
        this.stopMelody();
      };

      if (pillPiano) pillPiano.addEventListener('click', () => setInstrument('piano'));
      if (pillGuitar) pillGuitar.addEventListener('click', () => setInstrument('guitar'));
      if (pillFlute) pillFlute.addEventListener('click', () => setInstrument('flute'));

      // 3. Controles de Melodía
      const btnPlay = document.getElementById('btnPlayMelody');
      const btnStop = document.getElementById('btnStopMelody');
      const selectMelody = document.getElementById('selectMelody');

      if (btnPlay) {
        btnPlay.addEventListener('click', () => {
          if (this.isPlayingMelody) {
            this.stopMelody();
          } else {
            const melId = selectMelody ? selectMelody.value : null;
            this.playMelody(melId);
          }
        });
      }

      if (btnStop) {
        btnStop.addEventListener('click', () => this.stopMelody());
      }

      // 4. Interacción con Teclado de Computadora (Hardware Keyboard)
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleKeyUp = this.handleKeyUp.bind(this);
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }

    handleKeyDown(e) {
      // Ignorar si el usuario está escribiendo en un input, textarea o select
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if (e.repeat) return; // Evitar disparos múltiples continuos por repetición del sistema operativo

      const pressedKey = e.key.toLowerCase();
      const noteIndex = this.notes.findIndex(n => n.key === pressedKey);

      if (noteIndex !== -1) {
        e.preventDefault();
        this.activePressedKeys.add(pressedKey);
        this.triggerNoteByIndex(noteIndex);
      }
    }

    handleKeyUp(e) {
      const releasedKey = e.key.toLowerCase();
      if (this.activePressedKeys.has(releasedKey)) {
        this.activePressedKeys.delete(releasedKey);
        const noteIndex = this.notes.findIndex(n => n.key === releasedKey);
        if (noteIndex !== -1) {
          this.releaseNoteByIndex(noteIndex);
        }
      }
    }

    populateMelodiesDropdown() {
      const selectMelody = document.getElementById('selectMelody');
      if (!selectMelody) return;
      selectMelody.innerHTML = '';

      const list = this.melodies[this.instrument] || [];
      list.forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.title;
        if (idx === 0) opt.selected = true;
        selectMelody.appendChild(opt);
      });
    }

    renderKeys() {
      if (!this.container) return;
      this.container.innerHTML = '';

      this.notes.forEach((note, index) => {
        const noteOctave = this.octave + (note.octOffset || 0);
        const freq = this.calcFreq(note.n, noteOctave);
        const keyBtn = document.createElement('button');
        keyBtn.className = `piano-key ${note.sharp ? 'key-sharp' : 'key-natural'}`;
        keyBtn.setAttribute('type', 'button');
        keyBtn.dataset.noteIndex = index;
        keyBtn.id = `pianoKey_${index}`;

        keyBtn.innerHTML = `
          <span class="key-kbd-badge">${note.keyDisplay}</span>
          <span>${note.name}</span>
          <small>${freq.toFixed(1)} Hz</small>
        `;

        keyBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.triggerNoteByIndex(index);
        });

        keyBtn.addEventListener('mouseup', () => {
          this.releaseNoteByIndex(index);
        });

        keyBtn.addEventListener('mouseleave', () => {
          this.releaseNoteByIndex(index);
        });

        // Soporte táctil
        keyBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.triggerNoteByIndex(index);
        }, { passive: false });

        keyBtn.addEventListener('touchend', () => {
          this.releaseNoteByIndex(index);
        });

        this.container.appendChild(keyBtn);
      });
    }

    renderGuitar() {
      const grid = document.getElementById('guitarStringsGrid');
      if (!grid) return;
      grid.innerHTML = '';

      // 6 cuerdas clásicas afinadas en intervalos de cuarta y tercera (E2, A2, D3, G3, B3, E4)
      const guitarStringsInfo = [
        { num: '1ª', name: 'Mi (E)', thick: '1.5px', baseNote: 'Mi' },
        { num: '2ª', name: 'Si (B)', thick: '2.0px', baseNote: 'Si' },
        { num: '3ª', name: 'Sol (G)', thick: '2.5px', baseNote: 'Sol' },
        { num: '4ª', name: 'Re (D)', thick: '3.0px', baseNote: 'Re' },
        { num: '5ª', name: 'La (A)', thick: '3.8px', baseNote: 'La' },
        { num: '6ª', name: 'Mi (E)', thick: '4.5px', baseNote: 'Mi' }
      ];

      guitarStringsInfo.forEach((str, sIdx) => {
        const row = document.createElement('div');
        row.className = 'guitar-string-row';
        row.id = `guitarStringRow_${sIdx}`;
        row.style.setProperty('--string-thick', str.thick);

        // Al hacer clic en la cuerda se pulsa
        row.addEventListener('click', () => {
          // Busca una nota correspondiente a esta cuerda
          const matchedNoteIdx = this.notes.findIndex(n => n.gStr === sIdx);
          if (matchedNoteIdx !== -1) {
            this.triggerNoteByIndex(matchedNoteIdx);
          } else {
            this.triggerNoteByIndex(sIdx % this.notes.length);
          }
        });

        row.innerHTML = `
          <div class="guitar-string-label">${str.name.split(' ')[0]}</div>
          <div class="guitar-wire-track">
            <div class="guitar-wire-line"></div>
            <div class="guitar-frets-grid">
              <span class="guitar-fret-dot" data-str="${sIdx}" data-fret="0" title="Cuerda al aire">0</span>
              <span class="guitar-fret-dot" data-str="${sIdx}" data-fret="1">1</span>
              <span class="guitar-fret-dot" data-str="${sIdx}" data-fret="2">2</span>
              <span class="guitar-fret-dot" data-str="${sIdx}" data-fret="3">3</span>
              <span class="guitar-fret-dot" data-str="${sIdx}" data-fret="4">4</span>
              <span class="guitar-fret-dot" data-str="${sIdx}" data-fret="5">5</span>
            </div>
          </div>
        `;
        grid.appendChild(row);
      });
    }

    renderFlute() {
      const grid = document.getElementById('fluteHolesGrid');
      if (!grid) return;
      grid.innerHTML = '';

      // 8 orificios tonales de digitación acústica
      const fluteHoles = [
        { id: 0, label: 'Do' },
        { id: 1, label: 'Re' },
        { id: 2, label: 'Mi' },
        { id: 3, label: 'Fa' },
        { id: 4, label: 'Sol' },
        { id: 5, label: 'La' },
        { id: 6, label: 'Si' },
        { id: 7, label: 'Do+' }
      ];

      fluteHoles.forEach((hole, hIdx) => {
        const unit = document.createElement('div');
        unit.className = 'flute-hole-unit';
        unit.id = `fluteHoleUnit_${hIdx}`;
        unit.innerHTML = `
          <div class="flute-tone-hole" id="fluteHole_${hIdx}"></div>
          <span>${hole.label}</span>
        `;

        unit.addEventListener('click', () => {
          // Toca la nota asociada a este orificio
          const noteIdx = this.notes.findIndex(n => n.name.startsWith(hole.label));
          if (noteIdx !== -1) {
            this.triggerNoteByIndex(noteIdx);
          }
        });

        grid.appendChild(unit);
      });
    }

    triggerNoteByIndex(index, customDur = null) {
      if (index < 0 || index >= this.notes.length) return;
      const note = this.notes[index];
      const noteOctave = this.octave + (note.octOffset || 0);
      const freq = this.calcFreq(note.n, noteOctave);

      // Reproducir sonido físico con el instrumento actual
      this.playTone(freq, this.instrument, customDur);

      // Resaltar visualmente en piano
      const keyBtn = document.getElementById(`pianoKey_${index}`);
      if (keyBtn) {
        keyBtn.classList.add('is-pressed');
      }
      const pBox = document.querySelector('.piano-acoustic-box');
      if (pBox) {
        pBox.classList.add('hammer-hit');
        setTimeout(() => pBox.classList.remove('hammer-hit'), 280);
      }

      // Resaltar en guitarra
      if (note.gStr !== undefined) {
        const sRow = document.getElementById(`guitarStringRow_${note.gStr}`);
        if (sRow) {
          sRow.classList.add('string-vibrating');
          setTimeout(() => sRow.classList.remove('string-vibrating'), 380);
        }
        const fretDot = document.querySelector(`.guitar-fret-dot[data-str="${note.gStr}"][data-fret="${note.fret || 0}"]`);
        if (fretDot) {
          fretDot.classList.add('is-active');
          setTimeout(() => fretDot.classList.remove('is-active'), 400);
        }
      }

      // Resaltar en flauta
      if (note.fluteHole !== undefined) {
        const mPiece = document.getElementById('fluteMouthpiece');
        if (mPiece) {
          mPiece.classList.add('blowing');
          setTimeout(() => mPiece.classList.remove('blowing'), 350);
        }
        const fHole = document.getElementById(`fluteHole_${note.fluteHole}`);
        if (fHole) {
          fHole.classList.add('is-open', 'is-melody-active');
          setTimeout(() => fHole.classList.remove('is-melody-active'), 400);
        }
      }

      // Actualizar pantalla OLED de nota
      const readout = document.getElementById('keyboardNoteReadout');
      if (readout) {
        const instName = this.instrument === 'piano' ? 'Piano' : this.instrument === 'guitar' ? 'Guitarra' : 'Flauta';
        readout.innerHTML = `<i class="fas fa-volume-high"></i> <strong>${note.name}</strong> (${noteOctave}ª Octava) = <strong>${freq.toFixed(2)} Hz</strong> &nbsp;|&nbsp; Atajo PC: <span style="background:rgba(255,255,255,0.15); padding:1px 5px; border-radius:3px;">[${note.keyDisplay}]</span> &nbsp;|&nbsp; <em>${instName}</em>`;
      }
    }

    releaseNoteByIndex(index) {
      const keyBtn = document.getElementById(`pianoKey_${index}`);
      if (keyBtn) {
        keyBtn.classList.remove('is-pressed');
      }

      // Si se toca la flauta manualmente, cortar suavemente el aire al soltar la tecla (resuelve distorsión por acumulación de notas)
      if (this.instrument === 'flute' && this.currentFluteVoice && !this.isPlayingMelody) {
        const ctx = this.getAudioContext();
        if (ctx) {
          const now = ctx.currentTime;
          const stopTime = now + 0.04; // 40 ms release suave sin chasquidos
          try {
            this.currentFluteVoice.gainNode.gain.cancelScheduledValues(now);
            this.currentFluteVoice.gainNode.gain.setValueAtTime(this.currentFluteVoice.gainNode.gain.value, now);
            this.currentFluteVoice.gainNode.gain.linearRampToValueAtTime(0.0001, stopTime);
            this.currentFluteVoice.oscillators.forEach(osc => {
              try { osc.stop(stopTime + 0.01); } catch (e) {}
            });
          } catch (e) {}
          this.currentFluteVoice = null;
        }
      }
    }

    // ========================================================================
    // SÍNTESIS FÍSICA Y ACÚSTICA CON WEB AUDIO API
    // ========================================================================
    playTone(freq, instrument = 'piano', duration = null) {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (instrument === 'piano') {
        this.playPianoSound(ctx, freq, now, duration || 1.3);
      } else if (instrument === 'guitar') {
        this.playGuitarSound(ctx, freq, now, duration || 1.4);
      } else if (instrument === 'flute') {
        this.playFluteSound(ctx, freq, now, duration || 1.1);
      }
    }

    // 1. PIANO: Cuerdas percutidas con martillo y resonancia armónica
    playPianoSound(ctx, freq, now, dur) {
      const masterGain = ctx.createGain();
      const dest = this.masterCompressor || ctx.destination;
      masterGain.connect(dest);

      // Armónicos aditivos: f, 2f, 3f, 4f, 5f con decaimiento percusivo natural
      const harmonics = [
        { mult: 1, gain: 0.65 },
        { mult: 2, gain: 0.28 },
        { mult: 3, gain: 0.15 },
        { mult: 4, gain: 0.08 },
        { mult: 5, gain: 0.03 }
      ];

      harmonics.forEach(h => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = h.mult % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq * h.mult, now);

        g.gain.setValueAtTime(h.gain, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(now);
        osc.stop(now + dur + 0.05);
      });

      // Ataque percusivo de martillo fiel
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.36, now + 0.006);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    }

    // 2. GUITARRA: Cuerda pulsada (Plucked String) con decaimiento rápido de sobretonos
    playGuitarSound(ctx, freq, now, dur) {
      const masterGain = ctx.createGain();
      const dest = this.masterCompressor || ctx.destination;
      const filter = ctx.createBiquadFilter();

      // Filtro pasa-bajas dinámico (amortiguamiento por fricción interna del alambre)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(8000, freq * 7), now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.18);

      masterGain.connect(dest);
      filter.connect(masterGain);

      // Oscilador de cuerda brillante
      const oscString = ctx.createOscillator();
      oscString.type = 'sawtooth';
      oscString.frequency.setValueAtTime(freq, now);

      // Resonador de caja armónica
      const oscBody = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      oscBody.type = 'sine';
      oscBody.frequency.setValueAtTime(freq, now);
      bodyGain.gain.setValueAtTime(0.3, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 1.1);
      oscBody.connect(bodyGain);
      bodyGain.connect(masterGain);

      oscString.connect(filter);

      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.38, now + 0.003); // Plectro
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      oscString.start(now);
      oscBody.start(now);
      oscString.stop(now + dur + 0.05);
      oscBody.stop(now + dur + 0.05);
    }

    // 3. FLAUTA: Columna de aire en tubo abierto con monofonía física y vibrato acústico puro
    playFluteSound(ctx, freq, now, dur) {
      // Regla física de instrumento de viento: Monofonía estricta.
      // Si ya hay una nota sonando en la flauta, atenuarla suavemente en 25 ms para evitar batimientos
      if (this.currentFluteVoice) {
        const oldVoice = this.currentFluteVoice;
        try {
          const fadeOutTime = now + 0.025;
          oldVoice.gainNode.gain.cancelScheduledValues(now);
          oldVoice.gainNode.gain.setValueAtTime(oldVoice.gainNode.gain.value, now);
          oldVoice.gainNode.gain.linearRampToValueAtTime(0.0001, fadeOutTime);
          oldVoice.oscillators.forEach(osc => {
            try { osc.stop(fadeOutTime + 0.01); } catch (e) {}
          });
        } catch (e) {}
        this.currentFluteVoice = null;
      }

      const masterGain = ctx.createGain();
      const dest = this.masterCompressor || ctx.destination;
      masterGain.connect(dest);

      // Oscilador fundamental senoidal puro (modo fundamental tubo abierto fn = v/2L)
      const oscFund = ctx.createOscillator();
      oscFund.type = 'sine';
      oscFund.frequency.setValueAtTime(freq, now);

      // Armónico 2do muy suave (elimina asperezas)
      const oscH2 = ctx.createOscillator();
      const gH2 = ctx.createGain();
      oscH2.type = 'sine';
      oscH2.frequency.setValueAtTime(freq * 2, now);
      gH2.gain.setValueAtTime(0.04, now);
      oscH2.connect(gH2);
      gH2.connect(masterGain);

      // LFO de Vibrato natural suave (5.2 Hz) con entrada retardada (250 ms)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.2, now);
      lfoGain.gain.setValueAtTime(0, now);
      // Desviación moderada (máximo 2.8 Hz) para evitar choque armónico
      const maxDev = Math.min(2.8, freq * 0.005);
      lfoGain.gain.linearRampToValueAtTime(maxDev, now + 0.25);
      lfo.connect(lfoGain);
      lfoGain.connect(oscFund.frequency);
      lfo.start(now);
      lfo.stop(now + dur + 0.1);

      // Envolvente de soplo: ataque suave de 35 ms y volumen controlado sin distorsión
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.25, now + 0.035);
      masterGain.gain.setValueAtTime(0.25, now + Math.max(0.04, dur - 0.07));
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      oscFund.connect(masterGain);
      oscFund.start(now);
      oscH2.start(now);
      oscFund.stop(now + dur + 0.05);
      oscH2.stop(now + dur + 0.05);

      this.currentFluteVoice = {
        gainNode: masterGain,
        oscillators: [oscFund, oscH2, lfo],
        startTime: now,
        dur: dur
      };
    }

    // ========================================================================
    // REPRODUCTOR DE MELODÍAS CON REFLEJO VISUAL EN TIEMPO REAL
    // ========================================================================
    playMelody(melodyId) {
      this.stopMelody();

      const list = this.melodies[this.instrument] || [];
      const melody = list.find(m => m.id === melodyId) || list[0];
      if (!melody || !melody.notes || melody.notes.length === 0) return;

      this.isPlayingMelody = true;
      this.melodyStep = 0;

      const btnPlay = document.getElementById('btnPlayMelody');
      const btnStop = document.getElementById('btnStopMelody');
      if (btnPlay) {
        btnPlay.innerHTML = '<i class="fas fa-pause"></i> <span>Pausar</span>';
        btnPlay.classList.add('danger');
        btnPlay.classList.remove('primary');
      }
      if (btnStop) {
        btnStop.disabled = false;
      }

      const noteDurationBase = (60 / melody.tempo);

      const playNextStep = () => {
        if (!this.isPlayingMelody) return;

        if (this.melodyStep >= melody.notes.length) {
          this.stopMelody();
          const readout = document.getElementById('keyboardNoteReadout');
          if (readout) {
            readout.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> Fin de la melodía: <strong>"${melody.title}"</strong>`;
          }
          return;
        }

        const noteInfo = melody.notes[this.melodyStep];
        const stepNum = this.melodyStep + 1;
        const totalSteps = melody.notes.length;

        // Búsqueda inteligente de nota respetando octava superior si aplica
        let matchedIndex = -1;
        if (noteInfo.oct === 1) {
          matchedIndex = this.notes.findIndex(n => n.octOffset === 1 && (n.name === noteInfo.n || n.name.startsWith(noteInfo.n)));
        }
        if (matchedIndex === -1) {
          matchedIndex = this.notes.findIndex(n => !n.octOffset && n.name === noteInfo.n);
        }
        if (matchedIndex === -1) {
          matchedIndex = this.notes.findIndex(n => n.name === noteInfo.n);
        }
        if (matchedIndex === -1) {
          matchedIndex = this.notes.findIndex(n => n.name.startsWith(noteInfo.n));
        }

        const noteDuration = (noteInfo.dur || 0.6) * noteDurationBase;

        if (matchedIndex !== -1) {
          this.triggerNoteByIndex(matchedIndex, noteDuration);

          // Resaltar con clase de melodía activa
          const keyBtn = document.getElementById(`pianoKey_${matchedIndex}`);
          if (keyBtn) {
            keyBtn.classList.add('is-melody-active');
            setTimeout(() => keyBtn.classList.remove('is-melody-active'), Math.max(150, noteDuration * 900));
          }

          const readout = document.getElementById('keyboardNoteReadout');
          if (readout) {
            const currentFreq = this.calcFreq(this.notes[matchedIndex].n, this.octave + (this.notes[matchedIndex].octOffset || 0));
            readout.innerHTML = `<span style="color:#38bdf8;"><i class="fas fa-music"></i> Melodía en curso:</span> <strong>${noteInfo.n}</strong> (${currentFreq.toFixed(1)} Hz) — <em>"${melody.title}"</em> <small>[${stepNum}/${totalSteps}]</small>`;
          }
        }

        this.melodyStep++;
        this.melodyTimeout = setTimeout(playNextStep, noteDuration * 1000);
      };

      playNextStep();
    }

    stopMelody() {
      this.isPlayingMelody = false;
      if (this.melodyTimeout) {
        clearTimeout(this.melodyTimeout);
        this.melodyTimeout = null;
      }
      this.melodyStep = 0;

      // Silenciar flauta si quedó una nota resonando
      if (this.currentFluteVoice && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        try {
          this.currentFluteVoice.gainNode.gain.cancelScheduledValues(now);
          this.currentFluteVoice.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.03);
          this.currentFluteVoice.oscillators.forEach(osc => {
            try { osc.stop(now + 0.04); } catch (e) {}
          });
        } catch (e) {}
        this.currentFluteVoice = null;
      }

      // Limpiar clases de melodía activa en teclas y elementos
      document.querySelectorAll('.is-melody-active').forEach(el => el.classList.remove('is-melody-active'));
      document.querySelectorAll('.is-pressed').forEach(el => el.classList.remove('is-pressed'));

      const btnPlay = document.getElementById('btnPlayMelody');
      const btnStop = document.getElementById('btnStopMelody');
      if (btnPlay) {
        btnPlay.innerHTML = '<i class="fas fa-play"></i> <span>Tocar</span>';
        btnPlay.classList.remove('danger');
        btnPlay.classList.add('primary');
      }
      if (btnStop) {
        btnStop.disabled = true;
      }
    }
  }

  // ==========================================================================
  // 7. SINTETIZADOR ARMÓNICO DE FOURIER (PÁGINA 20)
  // ==========================================================================
  class FourierSim {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.numHarmonics = 3; // número de términos impares (1, 3, 5...)
      this.h = 35; // Desplazamiento inicial / deflexión del pellizco en px (10 a 60)
      this.isOscillating = false; // Modo por defecto: forma estática en t=0 para notar el desplazamiento
      this.time = 0;

      this.initEvents();
      this.resize();
      this.updateCoeffsDisplay();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const parentW = this.canvas.parentElement ? this.canvas.parentElement.clientWidth - 28 : 360;
      const cssW = (rect.width && rect.width > 60) ? rect.width : (parentW > 60 ? parentW : 360);
      const cssH = (rect.height && rect.height > 60) ? rect.height : 130;
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = Math.round(cssW * dpr);
      this.canvas.height = Math.round(cssH * dpr);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Limpiar transform anterior para evitar acumulación
      this.ctx.scale(dpr, dpr);
      this.cssWidth = cssW;
      this.cssHeight = cssH;
    }

    initEvents() {
      // Slider de desplazamiento h (altura de punteado)
      const sliderH = document.getElementById('sliderFourierH');
      if (sliderH) {
        sliderH.addEventListener('input', e => {
          this.h = parseFloat(e.target.value);
          const badgeH = document.getElementById('badgeFourierH');
          if (badgeH) badgeH.textContent = `${this.h} mm`;
          const readH = document.getElementById('readFourierH');
          if (readH) readH.textContent = `h = ${this.h} mm`;
          this.updateCoeffsDisplay();
        });
      }

      // Slider de armónicos impares N
      const sliderN = document.getElementById('sliderFourierN');
      if (sliderN) {
        sliderN.addEventListener('input', e => {
          this.numHarmonics = parseInt(e.target.value, 10);
          const badgeN = document.getElementById('badgeFourierN');
          if (badgeN) badgeN.textContent = `${this.numHarmonics} término(s)`;
          const readN = document.getElementById('readFourierN');
          if (readN) readN.textContent = `N = ${this.numHarmonics} armónico(s)`;
          this.updateCoeffsDisplay();
        });
      }

      // Botón Modo Estático t = 0 (inspección de la forma del desplazamiento)
      const btnStatic = document.getElementById('btnFourierStatic');
      const btnAnim = document.getElementById('btnFourierAnim');

      if (btnStatic) {
        btnStatic.addEventListener('click', () => {
          this.isOscillating = false;
          this.time = 0;
          btnStatic.classList.add('active');
          if (btnAnim) btnAnim.classList.remove('active');
        });
      }

      if (btnAnim) {
        btnAnim.addEventListener('click', () => {
          this.isOscillating = true;
          btnAnim.classList.add('active');
          if (btnStatic) btnStatic.classList.remove('active');
        });
      }
    }

    updateCoeffsDisplay() {
      const pill = document.getElementById('fourierCoeffsPill');
      if (!pill) return;
      // C_n = (8h / (pi^2 * n^2)) * sin(n*pi/2)
      const c1 = (8 * this.h) / (Math.PI * Math.PI);
      const c3 = -(8 * this.h) / (9 * Math.PI * Math.PI);
      const c5 = (8 * this.h) / (25 * Math.PI * Math.PI);
      pill.innerHTML = `C₁ = <strong>${c1.toFixed(1)} mm</strong>, C₃ = <strong>${c3.toFixed(1)} mm</strong>, C₅ = <strong>${c5.toFixed(1)} mm</strong>`;
    }

    loop() {
      if (this.isOscillating) {
        this.time += 0.025;
      }
      this.draw();
      requestAnimationFrame(this.loop);
    }

    draw() {
      if (!this.canvas) return;
      const ctx = this.ctx;
      const w = this.cssWidth || 360;
      const h = this.cssHeight || 130;
      const midY = h / 2 + 5;
      const padX = 24;
      const spanW = Math.max(100, w - padX * 2);
      const A = this.h; // Amplitud / desplazamiento en píxeles

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#09111e';
      ctx.fillRect(0, 0, w, h);

      // Rejilla de fondo tenue
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, midY);
      ctx.lineTo(padX + spanW, midY);
      ctx.moveTo(padX + spanW / 2, 10);
      ctx.lineTo(padX + spanW / 2, h - 10);
      ctx.stroke();

      // Perfil objetivo triangular ideal punteado (desplazamiento puro en t=0)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(padX, midY);
      ctx.lineTo(padX + spanW / 2, midY - A);
      ctx.lineTo(padX + spanW, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Suma finita de Fourier de la cuerda triangular
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.8;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      let centerPy = midY;

      for (let px = 0; px <= spanW; px += 2) {
        const x = px / spanW;
        let ySum = 0;

        for (let k = 0; k < this.numHarmonics; k++) {
          const n = 2 * k + 1;
          const sign = Math.pow(-1, k);
          const coeff = (8 * A) / (Math.PI * Math.PI * n * n);
          const spatial = Math.sin(n * Math.PI * x);
          const temporal = this.isOscillating ? Math.cos(n * this.time) : 1;
          ySum += sign * coeff * spatial * temporal;
        }

        const py = midY - ySum;
        if (Math.abs(px - spanW / 2) < 2) centerPy = py;

        if (px === 0) ctx.moveTo(padX + px, py);
        else ctx.lineTo(padX + px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Cúspide / punto central móvil
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(padX + spanW / 2, centerPy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Indicadores en el canvas
      ctx.font = '11px Outfit, sans-serif';
      ctx.fillStyle = '#94a3b8';
      const modeStr = this.isOscillating ? '▶ Modo Dinámico (Vibrando)' : '⏸ Modo Estático (Pellizco t = 0)';
      ctx.fillText(`h = ${A.toFixed(0)} mm | N = ${this.numHarmonics} armónico(s) | ${modeStr}`, padX, 16);

      // Cota de desplazamiento en el centro
      ctx.fillStyle = '#f97316';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillText(`y(L/2) = ${(midY - centerPy).toFixed(1)} mm`, padX + spanW / 2 + 8, Math.min(midY - 10, centerPy));
    }
  }

  // Exportar al ámbito global
  global.TravelingWaveSim = TravelingWaveSim;
  global.StringWaveSim = StringWaveSim;
  global.StandingWaveSim = StandingWaveSim;
  global.DopplerMachSim = DopplerMachSim;
  global.BeatsAudioSim = BeatsAudioSim;
  global.MusicalKeyboardSim = MusicalKeyboardSim;
  global.FourierSim = FourierSim;

})(window);
