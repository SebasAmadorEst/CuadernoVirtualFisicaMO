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
  // 6. TECLADO MUSICAL VIRTUAL CON WEB AUDIO API (PÁGINA 11)
  // ==========================================================================
  class MusicalKeyboardSim {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;
      this.audioCtx = null;
      this.octave = 3;

      this.notes = [
        { name: 'Do', n: 1, sharp: false },
        { name: 'Do#', n: 2, sharp: true },
        { name: 'Re', n: 3, sharp: false },
        { name: 'Re#', n: 4, sharp: true },
        { name: 'Mi', n: 5, sharp: false },
        { name: 'Fa', n: 6, sharp: false },
        { name: 'Fa#', n: 7, sharp: true },
        { name: 'Sol', n: 8, sharp: false },
        { name: 'Sol#', n: 9, sharp: true },
        { name: 'La', n: 10, sharp: false },
        { name: 'La#', n: 11, sharp: true },
        { name: 'Si', n: 12, sharp: false }
      ];

      this.renderKeys();
      this.initEvents();
    }

    calcFreq(n, m) {
      // f(n, m) = 440 * 2^((m - 3) + (n - 10)/12)
      return 440 * Math.pow(2, (m - 3) + (n - 10) / 12);
    }

    initEvents() {
      const selectOct = document.getElementById('selectKeyboardOctave');
      if (selectOct) {
        selectOct.addEventListener('change', e => {
          this.octave = parseInt(e.target.value, 10);
          this.renderKeys();
        });
      }
    }

    renderKeys() {
      if (!this.container) return;
      this.container.innerHTML = '';

      this.notes.forEach(note => {
        const freq = this.calcFreq(note.n, this.octave);
        const keyBtn = document.createElement('button');
        keyBtn.className = `piano-key ${note.sharp ? 'key-sharp' : 'key-natural'}`;
        keyBtn.setAttribute('type', 'button');
        keyBtn.innerHTML = `<span>${note.name}</span><small>${freq.toFixed(1)} Hz</small>`;

        keyBtn.addEventListener('click', () => {
          this.playTone(freq);
          const readout = document.getElementById('keyboardNoteReadout');
          if (readout) readout.textContent = `${note.name} (Octava ${this.octave}): ${freq.toFixed(2)} Hz`;
        });

        this.container.appendChild(keyBtn);
      });
    }

    playTone(freq) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      // Envolvente rápida para evitar clics
      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.85);
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
