/**
 * ============================================================================
 * MOTOR DE MODELADO FÍSICO DE ONDAS Y SUPERPOSICIÓN (WAVE ENGINE)
 * ============================================================================
 * - Gestión rigurosa del principio de superposición lineal: y_total(x, t) = \sum y_i(x, t)
 * - Separación estricta entre:
 *     * Componente VISIBLE (se grafica en el lienzo)
 *     * Componente INCLUIDA EN LA SUMA (participa en la resultante)
 * - Dirección física correcta de propagación: u = x - v*t - x0 (v > 0 derecha, v < 0 izquierda)
 * - Cronómetro y controles de reproducción continuos y paso a paso
 * - Catálogo completo de ejemplos didácticos prediseñados con preguntas orientadoras
 * - Serialización e importación completa del estado en formato JSON
 */

(function (global) {
  'use strict';

  // Generador de identificadores únicos
  let nextIdCounter = 1;
  function generateId(prefix = 'wave') {
    return `${prefix}_${Date.now()}_${nextIdCounter++}`;
  }

  // Paleta de colores predeterminada con alto contraste estético
  const DEFAULT_COLORS = [
    '#0284c7', // Azul cielo vibrante
    '#10b981', // Esmeralda vivo
    '#f59e0b', // Ámbar cálido
    '#8b5cf6', // Violeta moderno
    '#ec4899', // Fucsia intenso
    '#06b6d4', // Cian brillante
    '#f97316'  // Naranja enérgico
  ];

  class WaveComponent {
    constructor(config = {}) {
      this.id = config.id || generateId('comp');
      this.name = config.name || 'Componente de onda';
      this.type = config.type || 'gaussian'; // 'gaussian' | 'harmonic' | 'triangular' | 'square' | 'soliton' | 'custom'

      // Parámetros físicos
      this.amplitude = config.amplitude !== undefined ? Number(config.amplitude) : 1.2;
      this.velocity = config.velocity !== undefined ? Number(config.velocity) : 2.0; // [m/s] (+: derecha, -: izquierda)
      this.x0 = config.x0 !== undefined ? Number(config.x0) : 0.0;                    // Centro inicial [m]
      this.width = config.width !== undefined ? Math.max(0.01, Number(config.width)) : 1.5; // Ancho característico [m]
      this.wavelength = config.wavelength !== undefined ? Math.max(0.01, Number(config.wavelength)) : 4.0; // [m]
      this.frequency = config.frequency !== undefined ? Number(config.frequency) : 0.5; // [Hz]
      this.phase = config.phase !== undefined ? Number(config.phase) : 0.0;            // [rad]
      this.customExpression = config.customExpression || '';

      // Controles fundamentales de superposición y visualización
      // REQUISITO: Diferencia estricta entre ocultar y excluir de la suma
      this.visible = config.visible !== undefined ? Boolean(config.visible) : true;
      this.activeInSum = config.activeInSum !== undefined ? Boolean(config.activeInSum) : true;

      // Estilo visual propio
      this.style = Object.assign({
        color: DEFAULT_COLORS[nextIdCounter % DEFAULT_COLORS.length],
        lineWidth: 2.2,
        opacity: 0.9,
        dash: [] // [] continua, [6, 4] guiones, [2, 3] puntos
      }, config.style || {});

      // Función compilada en caché
      this._compiledFn = null;
      this._compiledExpr = '';
      this.updateFormula();
    }

    /**
     * Actualiza la expresión matemática y compila la función de evaluación rápida
     */
    updateFormula() {
      if (this.type === 'custom') {
        const expr = this.customExpression || '0';
        if (expr !== this._compiledExpr) {
          try {
            this._compiledFn = global.MathParser.compile(expr);
            this._compiledExpr = expr;
            this.latex = global.MathParser.toLatex(expr);
          } catch (e) {
            this._compiledFn = () => NaN;
            this.latex = '\\text{Error sintáctico}';
          }
        }
      } else {
        const res = global.MathParser.buildStandardExpression(this.type, this);
        this.expression = res.expression;
        this.latex = res.latex;
        this._compiledFn = global.MathParser.compile(res.expression);
        this._compiledExpr = res.expression;
      }
    }

    /**
     * Evalúa el desplazamiento físico y_i(x, t) en la posición x y tiempo t
     */
    evaluate(x, t) {
      if (!this._compiledFn) {
        this.updateFormula();
      }
      try {
        const val = this._compiledFn(x, t);
        return Number.isFinite(val) ? val : 0;
      } catch (e) {
        return 0;
      }
    }

    /**
     * Calcula la posición central o cresta instantánea para el indicador de propagación
     */
    getCenter(t) {
      // Para pulsos con centro inicial x0 y velocidad v: x(t) = x0 + v * t
      if (this.type === 'harmonic') {
        // En armónicas periódicas, el paquete se propaga continuamente
        return this.x0 + this.velocity * t;
      }
      return this.x0 + this.velocity * t;
    }

    toJSON() {
      return {
        id: this.id,
        name: this.name,
        type: this.type,
        amplitude: this.amplitude,
        velocity: this.velocity,
        x0: this.x0,
        width: this.width,
        wavelength: this.wavelength,
        frequency: this.frequency,
        phase: this.phase,
        customExpression: this.customExpression,
        visible: this.visible,
        activeInSum: this.activeInSum,
        style: { ...this.style }
      };
    }
  }

  // Definición de los 5 Ejemplos Didácticos Pedagógicos Obligatorios con Soluciones y Fundamentación
  const DIDACTIC_PRESETS = [
    {
      id: 'two_equal_pulses_opposite',
      title: '1. Dos pulsos iguales en sentidos opuestos',
      subtitle: 'Interferencia constructiva simétrica',
      description: 'Dos pulsos gaussianos idénticos de igual amplitud positiva viajan uno hacia el otro (+v y -v). Al encontrarse en el centro (x = 0), sus amplitudes se suman puntualmente hasta duplicar la altura máxima (2A). Posteriormente, se atraviesan mutuamente sin afectarse ni perder su identidad ni su forma.',
      questions: [
        {
          question: '¿Cuál será el valor máximo del desplazamiento en x = 0 en el instante de máxima coincidencia (t ≈ 3.0 s)?',
          answer: {
            direct: 'El desplazamiento máximo en x = 0 m es exactamente +3.00 m (el doble de la amplitud individual A = 1.50 m).',
            theory: 'Por el <strong>Principio de Superposición Lineal</strong>, la elongación transversal total en cualquier punto es la suma algebraica directa de las perturbaciones individuales:<br>$$y(x, t) = y_1(x, t) + y_2(x, t)$$ Como el pulso 1 viaja a $v_1 = +2.0\\text{ m/s}$ desde $x_{01} = -6.0\\text{ m}$ y el pulso 2 viaja a $v_2 = -2.0\\text{ m/s}$ desde $x_{02} = +6.0\\text{ m}$, ambos alcanzan el origen exactamente en:<br>$$t_{\\text{encuentro}} = \\frac{6.0\\text{ m}}{2.0\\text{ m/s}} = 3.00\\text{ s}$$ En ese instante, ambas crestas de $1.50\\text{ m}$ coinciden en $x = 0\\text{ m}$:<br>$$y(0, 3) = 1.50\\text{ m} + 1.50\\text{ m} = 3.00\\text{ m}$$',
            pedagogy: 'Este fenómeno se conoce como <strong>interferencia constructiva</strong> pura. Fíjate en que las ondas no son objetos sólidos que rebotan, sino perturbaciones de un medio continuo: cuando coinciden en la misma posición, el medio simplemente suma los dos estiramientos. Puedes pausar en t = 3.00 s y usar el Inspector para verificar que la suma da exactamente 3.00 m.'
          }
        },
        {
          question: '¿Al cruzarse, los pulsos rebotan, se anulan o se atraviesan mutuamente conservando su forma original?',
          answer: {
            direct: 'Se atraviesan mutuamente de forma limpia, continuando su camino sin ninguna deformación ni pérdida de amplitud.',
            theory: 'La ecuación de onda clásica de d\'Alembert es estrictamente lineal en medios elásticos ideales:<br>$$\\frac{\\partial^2 y}{\\partial t^2} = v^2 \\frac{\\partial^2 y}{\\partial x^2}$$ Toda combinación lineal de soluciones independientes $f(x - vt) + g(x + vt)$ sigue siendo una solución válida. No existen términos de acoplamiento no lineal que puedan disipar, dispersar o alterar los perfiles de onda.',
            pedagogy: 'Deja correr la simulación hasta t = 5.0 s o 6.0 s: verás con total claridad que el pulso azul sigue viajando hacia la derecha como si nada hubiera pasado, y el pulso verde continúa hacia la izquierda. Las ondas se cruzan como rayos de luz en el aire.'
          }
        },
        {
          question: 'Si ocultas uno de los pulsos del gráfico pero lo dejas marcado para incluirlo en la suma, ¿qué ocurre con la onda resultante?',
          answer: {
            direct: 'La curva resultante (roja) sigue alcanzando los 3.00 m y comportándose de manera idéntica, pues la física de la suma depende del cálculo numérico, no de su representación en pantalla.',
            theory: 'En la arquitectura de la simulación, el control de visibilidad (ojo) solo activa o desactiva el renderizado gráfico de la curva individual en el Canvas (`ctx.stroke()`). El cálculo físico de la resultante se rige por el estado booleano `activeInSum`:<br>$$y_{\\text{res}}(x, t) = \\sum_{i \\in \\text{activas}} y_i(x, t)$$',
            pedagogy: 'Esta función es muy útil en clases de Física: un profesor puede ocultar una de las ondas y pedirle a los estudiantes que deduzcan qué onda oculta está generando la perturbación resultante que observan en pantalla.'
          }
        }
      ],
      defaultTime: 0.0,
      components: [
        {
          name: 'Pulso Gaussiano 1 (+x)',
          type: 'gaussian',
          amplitude: 1.5,
          velocity: 2.0,
          x0: -6.0,
          width: 1.2,
          visible: true,
          activeInSum: true,
          style: { color: '#0284c7', lineWidth: 2.4, opacity: 0.9, dash: [] }
        },
        {
          name: 'Pulso Gaussiano 2 (-x)',
          type: 'gaussian',
          amplitude: 1.5,
          velocity: -2.0,
          x0: 6.0,
          width: 1.2,
          visible: true,
          activeInSum: true,
          style: { color: '#10b981', lineWidth: 2.4, opacity: 0.9, dash: [6, 4] }
        }
      ]
    },
    {
      id: 'two_opposite_pulses',
      title: '2. Dos pulsos de signos contrarios',
      subtitle: 'Interferencia destructiva completa',
      description: 'Un pulso con amplitud positiva (+A) viaja hacia la derecha y otro con amplitud negativa (-A) viaja hacia la izquierda. En el instante exacto de coincidencia (t ≈ 3.0 s), la suma algebraica y_1(x) + y_2(x) resulta exactamente cero en toda la cuerda. La energía elástica aparente es nula, pero la energía cinética transversal de la cuerda es máxima, lo que permite que los pulsos continúen intactos.',
      questions: [
        {
          question: 'Cuando la cuerda parece completamente plana en el instante t = 3.0 s, ¿ha desaparecido la onda o sigue existiendo?',
          answer: {
            direct: 'La onda sigue existiendo plenamente; no ha desaparecido ni se ha destruido.',
            theory: 'Una onda mecánica en una cuerda posee dos variables de estado fundamentales en cada punto $x$:<br>1. El desplazamiento transversal $y(x, t)$.<br>2. La velocidad transversal de las partículas del medio $v_y(x, t) = \\frac{\\partial y}{\\partial t}$.<br>En $t = 3.00\\text{ s}$, $y_1(x) = -y_2(x)$, por lo que $y_{\\text{total}}(x) = 0\\text{ m}$. Sin embargo, sus velocidades transversales tienen el mismo signo y se refuerzan:<br>$$\\frac{\\partial y_{\\text{total}}}{\\partial t} = \\frac{\\partial y_1}{\\partial t} + \\frac{\\partial y_2}{\\partial t} \\neq 0$$',
            pedagogy: 'Una fotografía instantánea en t = 3.00 s solo muestra la posición (cuerda plana), pero no la velocidad de las partículas. Cada porción de la cuerda se está moviendo verticalmente a toda velocidad en ese instante, lo que impulsa a las ondas a resurgir inmediatamente después.'
          }
        },
        {
          question: '¿Dónde reside la energía del sistema en el instante en que la elongación resultante es exactamente cero?',
          answer: {
            direct: 'Toda la energía mecánica del sistema se encuentra en forma de energía cinética transversal de las partículas de la cuerda.',
            theory: 'La densidad de energía mecánica en una cuerda tensa es la suma de la energía potencial elástica y la cinética:<br>$$u(x, t) = \\frac{1}{2}\\mu \\left(\\frac{\\partial y}{\\partial t}\\right)^2 + \\frac{1}{2}T \\left(\\frac{\\partial y}{\\partial x}\\right)^2$$ Cuando la cuerda está completamente plana en $t = 3.00\\text{ s}$, la deformación espacial $\\frac{\\partial y}{\\partial x} = 0$, por lo que la energía potencial es cero ($E_p = 0$). Toda la energía del sistema se convierte en energía cinética ($E_k = E_{\\text{total}}$).',
            pedagogy: 'Es idéntico a lo que ocurre en un péndulo o en un oscilador masa-resorte cuando pasa a toda velocidad por el punto de equilibrio central: el estiramiento es cero, pero la energía cinética es máxima.'
          }
        },
        {
          question: '¿Conserva cada pulso su signo original (positivo o negativo) después de haberse cruzado?',
          answer: {
            direct: 'Sí. El pulso positivo continúa siendo positivo viajando a la derecha (+x), y el negativo sigue siendo un valle negativo viajando a la izquierda (-x).',
            theory: 'La solución matemática $y(x, t) = f(x - vt) + g(x + vt)$ no sufre inversión de signo porque no hay ninguna condición de frontera o extremo fijo que obligue a una reflexión con cambio de fase de $\\pi$ radianes.',
            pedagogy: 'Avanza la simulación paso a paso con el botón de paso adelante tras t = 3.0 s: verás resurgir la cresta azul moviéndose hacia la derecha y el valle rojo hacia la izquierda con sus formas y signos originales intactos.'
          }
        }
      ],
      defaultTime: 0.0,
      components: [
        {
          name: 'Pulso Cresta (+)',
          type: 'gaussian',
          amplitude: 1.6,
          velocity: 2.0,
          x0: -6.0,
          width: 1.2,
          visible: true,
          activeInSum: true,
          style: { color: '#0284c7', lineWidth: 2.4, opacity: 0.9, dash: [] }
        },
        {
          name: 'Pulso Valle (-)',
          type: 'gaussian',
          amplitude: -1.6,
          velocity: -2.0,
          x0: 6.0,
          width: 1.2,
          visible: true,
          activeInSum: true,
          style: { color: '#ef4444', lineWidth: 2.4, opacity: 0.9, dash: [6, 4] }
        }
      ]
    },
    {
      id: 'different_amplitudes_widths',
      title: '3. Pulsos con diferentes amplitudes y anchuras',
      subtitle: 'Superposición asimétrica de perfiles distintos',
      description: 'Un pulso ancho y de baja amplitud se propaga hacia la derecha, mientras un pulso estrecho y agudo de alta velocidad y gran amplitud viaja a la izquierda. Durante la colisión, la forma resultante es una combinación no simétrica que ilustra cómo cada punto del medio responde linealmente a la suma simultánea de las perturbaciones.',
      questions: [
        {
          question: '¿En qué posición x ocurre el desplazamiento máximo durante la interacción?',
          answer: {
            direct: 'El encuentro no ocurre en el centro x = 0, sino desplazado en x ≈ -1.13 m, con un pico máximo combinado de +3.30 m.',
            theory: 'Las posiciones de las crestas en función del tiempo son:<br>$$x_1(t) = -6.0 + 1.5t$$<br>$$x_2(t) = 7.0 - 2.5t$$<br>Igualando $x_1(t) = x_2(t)$ para encontrar el instante de encuentro:<br>$$-6.0 + 1.5t = 7.0 - 2.5t \\implies 4.0t = 13.0 \\implies t = 3.25\\text{ s}$$ Sustituyendo el tiempo en cualquiera de las ecuaciones:<br>$$x = -6.0 + 1.5(3.25) = -1.125\\text{ m}$$ La elongación máxima es la suma de amplitudes: $A_1 + A_2 = 1.0\\text{ m} + 2.3\\text{ m} = 3.30\\text{ m}$.',
            pedagogy: 'Como el pulso angosto viaja más rápido (2.5 m/s) que el ancho (1.5 m/s), recorre más distancia en el mismo tiempo, desplazando el punto de colisión hacia la izquierda del plano cartesiano.'
          }
        },
        {
          question: '¿Altera el pulso de mayor amplitud la forma o la anchura del pulso menor después del encuentro?',
          answer: {
            direct: 'No. Ninguna característica geométrica (anchura, altura ni simetría) de ninguno de los dos pulsos sufre alteración permanente.',
            theory: 'En el régimen elástico lineal, el operador diferencial de onda conserva cada modo o paquete de ondas de Fourier de manera totalmente independiente. No existe transferencia neta de energía ni deformación permanente.',
            pedagogy: 'Durante la superposición parece formarse un pulso deforme asimétrico (el pulso estrecho cabalga sobre el ancho), pero en cuanto se separan, cada uno retoma su forma geométrica pura.'
          }
        },
        {
          question: '¿Qué diferencia notas entre la velocidad de propagación de ambos pulsos?',
          answer: {
            direct: 'El pulso estrecho viaja a 2.5 m/s (hacia la izquierda), mientras que el pulso ancho viaja a 1.5 m/s (hacia la derecha).',
            theory: 'En el simulador, la velocidad $v$ de cada componente se especifica de forma independiente. En el plano cartesiano, esto se visualiza directamente a través de los vectores de propagación: el vector del pulso violeta es más largo y apunta a la izquierda, reflejando $|v| = 2.5\\text{ m/s}$.',
            pedagogy: 'Observa las flechas de propagación en la parte superior de cada pulso: la longitud de la flecha es directamente proporcional a la rapidez, permitiendo comparar visualmente las velocidades a simple vista.'
          }
        }
      ],
      defaultTime: 0.0,
      components: [
        {
          name: 'Pulso Ancho y Bajo',
          type: 'gaussian',
          amplitude: 1.0,
          velocity: 1.5,
          x0: -6.0,
          width: 2.4,
          visible: true,
          activeInSum: true,
          style: { color: '#f59e0b', lineWidth: 2.4, opacity: 0.9, dash: [] }
        },
        {
          name: 'Pulso Estrecho y Alto',
          type: 'gaussian',
          amplitude: 2.3,
          velocity: -2.5,
          x0: 7.0,
          width: 0.8,
          visible: true,
          activeInSum: true,
          style: { color: '#8b5cf6', lineWidth: 2.4, opacity: 0.9, dash: [4, 3] }
        }
      ]
    },
    {
      id: 'three_or_more_components',
      title: '4. Superposición de tres o más componentes',
      subtitle: 'Linealidad generalizada y formas mixtas',
      description: 'Tres perturbaciones distintas (un pulso gaussiano, un pulso triangular y un paquete cuasi-solitónico) se propagan simultáneamente en la misma cuerda. Este ejemplo demuestra que el principio de superposición es válido para cualquier número N de fuentes y formas funcionales arbitrarias.',
      questions: [
        {
          question: '¿Qué ocurre con la curva resultante si excluyes la componente triangular de la suma?',
          answer: {
            direct: 'La curva resultante pierde instantáneamente la muesca puntiaguda invertida y pasa a ser suave, compuesta solo por las dos curvas gaussianas y solitónicas.',
            theory: 'La suma se evalúa matemáticamente como:<br>$$y_{\\text{res}}(x, t) = \\sum_{i \\in \\text{activas}} y_i(x, t)$$ Al desactivar el botón $\\Sigma$ de la componente triangular, el término $y_2(x, t)$ se omite del sumatorio, recalculando la resultante en tiempo real a 60 FPS.',
            pedagogy: 'Prueba a hacer clic en el botón de calculadora (Σ) del pulso triangular: verás cómo la curva roja resultante se suaviza de inmediato, demostrando la contribución exacta que aportaba esa componente.'
          }
        },
        {
          question: '¿Es posible tener interferencia constructiva en una región del espacio y destructiva en otra al mismo tiempo?',
          answer: {
            direct: 'Sí. La interferencia es un fenómeno local en cada punto x del medio.',
            theory: 'En puntos donde las componentes tengan el mismo signo ($y_i \\cdot y_j > 0$), las amplitudes se refuerzan (constructiva). En puntos donde tengan signos opuestos ($y_i \\cdot y_j < 0$), las amplitudes se cancelan parcialmente (destructiva).',
            pedagogy: 'Fíjate en la onda resultante: en una zona puede haber una cresta reforzada muy alta, mientras que a pocos metros de distancia la cuerda está deprimida por debajo de cero debido a la componente triangular negativa.'
          }
        },
        {
          question: 'Observa el inspector: ¿la suma indicada en el inspector coincide exactamente con la suma aritmética de las tres componentes?',
          answer: {
            direct: 'Sí, la resultante calculada coincide al milímetro con la suma aritmética de los valores de las componentes en cualquier posición x.',
            theory: 'El motor evalúa con precisión matemática de punto flotante de 64 bits (doble precisión IEEE 754):<br>$$y_{\\text{res}} = y_1(x, t) + y_2(x, t) + y_3(x, t)$$',
            pedagogy: 'Presiona la tecla I para activar el Inspector, haz clic sobre cualquier punto de la cuerda y comprueba sumando mentalmente o con calculadora los números que aparecen en el recuadro del inspector.'
          }
        }
      ],
      defaultTime: 0.0,
      components: [
        {
          name: 'Pulso Gaussiano (+x)',
          type: 'gaussian',
          amplitude: 1.4,
          velocity: 2.0,
          x0: -7.0,
          width: 1.2,
          visible: true,
          activeInSum: true,
          style: { color: '#0284c7', lineWidth: 2.2, opacity: 0.9, dash: [] }
        },
        {
          name: 'Pulso Triangular Invertido (-x)',
          type: 'triangular',
          amplitude: -1.2,
          velocity: -1.8,
          x0: 6.0,
          width: 1.6,
          visible: true,
          activeInSum: true,
          style: { color: '#ec4899', lineWidth: 2.2, opacity: 0.9, dash: [5, 3] }
        },
        {
          name: 'Solitón Central (+x lento)',
          type: 'soliton',
          amplitude: 0.9,
          velocity: 0.6,
          x0: -1.0,
          width: 1.1,
          visible: true,
          activeInSum: true,
          style: { color: '#10b981', lineWidth: 2.2, opacity: 0.9, dash: [2, 2] }
        }
      ]
    },
    {
      id: 'two_harmonic_waves_phases',
      title: '5. Dos ondas sinusoidales con distintas fases',
      subtitle: 'Ondas estacionarias, nodos y antinodos',
      description: 'Dos ondas armónicas viajeras continuas de igual amplitud (A = 1.2 m), longitud de onda (λ = 4.0 m) y frecuencia (f = 0.5 Hz) viajan en sentidos contrarios. Su superposición matemática genera una onda estacionaria perfecta: y(x, t) = 2A sin(kx) cos(ωt). Aparecen nodos estacionarios inmóviles (donde y = 0 siempre) y antinodos que oscilan con el doble de amplitud.',
      questions: [
        {
          question: 'Localiza en el plano los puntos donde la elongación es permanentemente cero (Nodos). ¿Qué separación hay entre nodos adyacentes?',
          answer: {
            direct: 'Los nodos se encuentran en x = 0 m, ±2.0 m, ±4.0 m, ±6.0 m... La distancia entre dos nodos consecutivos es exactamente λ/2 = 2.00 m.',
            theory: 'Superponiendo dos ondas armónicas idénticas en sentidos opuestos usando identidades trigonométricas:<br>$$y(x, t) = A\\sin(kx - \\omega t) + A\\sin(kx + \\omega t) = 2A\\sin(kx)\\cos(\\omega t)$$ Los nodos ocurren donde la envolvente espacial es siempre cero:<br>$$\\sin(kx) = 0 \\implies kx = n\\pi \\implies \\frac{2\\pi}{\\lambda}x = n\\pi \\implies x_n = n \\frac{\\lambda}{2}$$ Dado que $\\lambda = 4.0\\text{ m}$, la separación nodal es $\\Delta x = \\frac{4.0\\text{ m}}{2} = 2.0\\text{ m}$.',
            pedagogy: 'Coloca el cursor del Inspector exactamente sobre x = 2.00 m o x = 4.00 m mientras la animación se reproduce: notarás que el valor de la resultante permanece en 0.00 m sin moverse jamás. Esos puntos están completamente quietos.'
          }
        },
        {
          question: '¿Se propaga la onda resultante hacia la izquierda o hacia la derecha, o permanece confinada en el espacio?',
          answer: {
            direct: 'No se propaga en ninguna dirección. Es una onda estacionaria pura confinada en el espacio.',
            theory: 'En una onda viajera $y = f(x \\pm vt)$, la fase espacial y temporal avanzan juntas. En la onda estacionaria $y(x, t) = [2A\\sin(kx)] \\cdot \\cos(\\omega t)$, la parte espacial y temporal están factorizadas independientemente. El flujo de energía medio a través de los nodos es estrictamente nulo.',
            pedagogy: 'La cuerda entera palpita hacia arriba y hacia abajo al unísono entre nodos fijos. Los puntos de mayor oscilación se llaman vientres o antinodos (amplitud máxima = 2A = 2.40 m).'
          }
        },
        {
          question: 'Si modificas la fase de una de las ondas a π radianes (3.14 rad), ¿dónde quedan los nuevos nodos?',
          answer: {
            direct: 'Los nodos y antinodos se intercambian: los nuevos nodos pasan a estar en x = ±1.0 m, ±3.0 m, ±5.0 m...',
            theory: 'Al introducir un desfase de $\\phi = \\pi$, $\\sin(kx + \\omega t + \\pi) = -\\sin(kx + \\omega t)$. La resultante se transforma en:<br>$$y(x, t) = 2A\\cos(kx)\\sin(\\omega t)$$ Ahora los nodos ocurren donde $\\cos(kx) = 0$, es decir en $x_n = (2n+1)\\frac{\\lambda}{4} = \\pm 1\\text{ m}, \\pm 3\\text{ m}\\dots$',
            pedagogy: 'Desliza el control de Fase inicial (ϕ) de la segunda onda hasta 3.14 rad: verás cómo x = 0 deja de ser un nodo inmóvil y pasa a ser un antinodo de máxima oscilación.'
          }
        }
      ],
      defaultTime: 0.0,
      components: [
        {
          name: 'Onda Sinusoidal (+x)',
          type: 'harmonic',
          amplitude: 1.2,
          velocity: 2.0,
          wavelength: 4.0,
          frequency: 0.5,
          phase: 0.0,
          visible: true,
          activeInSum: true,
          style: { color: '#0284c7', lineWidth: 2.2, opacity: 0.85, dash: [] }
        },
        {
          name: 'Onda Sinusoidal (-x)',
          type: 'harmonic',
          amplitude: 1.2,
          velocity: -2.0,
          wavelength: 4.0,
          frequency: 0.5,
          phase: 0.0,
          visible: true,
          activeInSum: true,
          style: { color: '#f59e0b', lineWidth: 2.2, opacity: 0.85, dash: [6, 4] }
        }
      ]
    }
  ];

  class WaveEngine {
    constructor() {
      this.components = [];
      this.time = 0.0;
      this.isPlaying = true;
      this.playbackSpeed = 1.0; // 0.25, 0.5, 1.0, 2.0
      this.timeDirection = 1;

      // Estilo global de la resultante
      this.resultantStyle = {
        name: 'Onda Resultante (Suma)',
        visible: true,
        color: '#d45743', // Color coral emblemático de Física III
        lineWidth: 3.5,
        opacity: 1.0,
        dash: [] // continua
      };

      // Configuración de indicadores de propagación
      this.propagationStyle = {
        show: true,
        showLabels: true,
        size: 14,
        color: '#172d33'
      };

      this.currentPresetId = null;
      this.loadPreset('two_equal_pulses_opposite');
    }

    /**
     * Carga uno de los ejemplos didácticos prediseñados
     */
    loadPreset(presetId) {
      const preset = DIDACTIC_PRESETS.find(p => p.id === presetId) || DIDACTIC_PRESETS[0];
      this.currentPresetId = preset.id;
      this.time = preset.defaultTime || 0.0;
      this.components = preset.components.map(c => new WaveComponent(c));
      return preset;
    }

    getPresets() {
      return DIDACTIC_PRESETS;
    }

    getCurrentPreset() {
      return DIDACTIC_PRESETS.find(p => p.id === this.currentPresetId) || DIDACTIC_PRESETS[0];
    }

    /**
     * Añade una nueva componente
     */
    addComponent(config = {}) {
      const comp = new WaveComponent(config);
      this.components.push(comp);
      return comp;
    }

    /**
     * Elimina una componente por su id
     */
    removeComponent(id) {
      const idx = this.components.findIndex(c => c.id === id);
      if (idx !== -1) {
        this.components.splice(idx, 1);
        return true;
      }
      return false;
    }

    getComponent(id) {
      return this.components.find(c => c.id === id);
    }

    /**
     * Evalúa la suma numérica de todas las componentes activas en la suma
     */
    evaluateResultant(x, t = this.time) {
      let sum = 0;
      for (let i = 0; i < this.components.length; i++) {
        const c = this.components[i];
        if (c.activeInSum) {
          const val = c.evaluate(x, t);
          if (Number.isFinite(val)) {
            sum += val;
          }
        }
      }
      return sum;
    }

    /**
     * Retorna el desglose de valores en una posición x dada para el inspector
     */
    inspectAt(x, t = this.time) {
      const values = [];
      let sumActive = 0;
      let sumAll = 0;

      for (let i = 0; i < this.components.length; i++) {
        const c = this.components[i];
        const val = c.evaluate(x, t);
        values.push({
          id: c.id,
          name: c.name,
          type: c.type,
          color: c.style.color,
          dash: c.style.dash,
          value: val,
          visible: c.visible,
          activeInSum: c.activeInSum
        });
        if (c.activeInSum && Number.isFinite(val)) {
          sumActive += val;
        }
        if (Number.isFinite(val)) {
          sumAll += val;
        }
      }

      return {
        x,
        t,
        components: values,
        resultant: sumActive,
        totalArithmetic: sumAll
      };
    }

    /**
     * Avanza el tiempo según el intervalo delta (en segundos)
     */
    step(dt) {
      if (!this.isPlaying) return;
      const safeDt = Math.min(0.1, Math.max(0, dt));
      this.time += safeDt * this.playbackSpeed * this.timeDirection;
      // Normalizar rango si es excesivo
      if (this.time > 1000) this.time = 0;
      if (this.time < -1000) this.time = 0;
    }

    stepForward(dt = 0.05) {
      this.time += dt * this.playbackSpeed;
    }

    stepBackward(dt = 0.05) {
      this.time -= dt * this.playbackSpeed;
    }

    resetTime() {
      this.time = 0.0;
    }

    setTime(t) {
      this.time = Number(t) || 0;
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      return this.isPlaying;
    }

    setSpeed(speed) {
      this.playbackSpeed = Number(speed) || 1.0;
    }

    /**
     * Exportación de la configuración a JSON
     */
    exportJSON() {
      return JSON.stringify({
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        presetId: this.currentPresetId,
        time: this.time,
        playbackSpeed: this.playbackSpeed,
        resultantStyle: this.resultantStyle,
        propagationStyle: this.propagationStyle,
        components: this.components.map(c => c.toJSON())
      }, null, 2);
    }

    /**
     * Importación y validación de configuración desde JSON
     */
    importJSON(jsonString) {
      try {
        const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        if (!data || !Array.isArray(data.components)) {
          throw new Error('El archivo JSON no tiene un formato válido de simulación de ondas.');
        }

        this.time = Number(data.time) || 0.0;
        this.playbackSpeed = Number(data.playbackSpeed) || 1.0;
        if (data.resultantStyle) Object.assign(this.resultantStyle, data.resultantStyle);
        if (data.propagationStyle) Object.assign(this.propagationStyle, data.propagationStyle);

        this.components = data.components.map(c => new WaveComponent(c));
        this.currentPresetId = data.presetId || null;
        return { success: true, count: this.components.length };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }

  // Exportar al entorno global
  global.WaveComponent = WaveComponent;
  global.WaveEngine = WaveEngine;
  global.DIDACTIC_PRESETS = DIDACTIC_PRESETS;
})(typeof window !== 'undefined' ? window : this);
