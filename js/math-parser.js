/**
 * ============================================================================
 * MOTOR MATEMÁTICO: PARSER, EVALUADOR Y CONVERSOR LATEX
 * ============================================================================
 * - Análisis léxico y sintáctico seguro de expresiones f(x, t)
 * - Soporte para multiplicación implícita (ej. 2x, 3sin(x), (x-t)(x+t))
 * - Funciones trigonométricas, hiperbólicas, exponenciales, pulsos especiales
 * - Compilación a función nativa ultra-rápida (60 FPS garantizados)
 * - Generador de código LaTeX para renderizado con KaTeX
 * - Detección y manejo robusto de singularidades y errores sintácticos
 */

(function (global) {
  'use strict';

  // Entorno seguro de evaluación matemática
  const Scope = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    atan2: Math.atan2,
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    exp: Math.exp,
    log: Math.log,
    ln: Math.log,
    log10: Math.log10,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    abs: Math.abs,
    sign: Math.sign,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    min: Math.min,
    max: Math.max,
    pow: Math.pow,
    pi: Math.PI,
    PI: Math.PI,
    e: Math.E,
    E: Math.E,
    tau: 2 * Math.PI,
    TAU: 2 * Math.PI,
    // Funciones didácticas de paquetes y pulsos de onda
    sinc: (u) => (Math.abs(u) < 1e-7 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u)),
    sech: (u) => (1 / Math.cosh(u)),
    rect: (u) => (Math.abs(u) <= 0.5 ? 1 : 0),
    tri: (u) => (Math.abs(u) <= 1 ? 1 - Math.abs(u) : 0),
    step: (u) => (u >= 0 ? 1 : 0)
  };

  class MathParser {
    /**
     * Limpia y normaliza una expresión matemática en texto
     */
    static normalize(expr) {
      if (!expr || typeof expr !== 'string') return '0';
      let s = expr.trim();
      // Reemplazar coma decimal europea por punto
      s = s.replace(/(\d+),(\d+)/g, '$1.$2');
      // Reemplazar signos de multiplicación alternativos
      s = s.replace(/[×·]/g, '*');
      s = s.replace(/[÷]/g, '/');
      return s;
    }

    /**
     * Valida sintácticamente una expresión f(x, t)
     * Retorna { valid: boolean, error: string | null }
     */
    static validate(expr) {
      const normalized = this.normalize(expr);
      if (!normalized) return { valid: false, error: 'La expresión está vacía.' };

      // Comprobar balance de paréntesis
      let depth = 0;
      for (let i = 0; i < normalized.length; i++) {
        if (normalized[i] === '(') depth++;
        else if (normalized[i] === ')') depth--;
        if (depth < 0) {
          return { valid: false, error: `Paréntesis de cierre ')' inesperado en posición ${i + 1}.` };
        }
      }
      if (depth !== 0) {
        return { valid: false, error: 'Paréntesis desbalanceados (falta cerrar paréntesis).' };
      }

      // Probar compilación y evaluación de prueba
      try {
        const fn = this.compile(normalized);
        const testVal = fn(1.0, 0.0);
        if (typeof testVal !== 'number') {
          return { valid: false, error: 'La expresión no evaluó a un valor numérico.' };
        }
        return { valid: true, error: null };
      } catch (err) {
        return { valid: false, error: err.message || 'Error de sintaxis en la expresión.' };
      }
    }

    /**
     * Transforma la expresión algebraica en código ejecutable seguro
     */
    static preprocessToJS(expr) {
      let s = this.normalize(expr);

      // Normalizar variables X y T a minúsculas
      s = s.replace(/\bX\b/g, 'x').replace(/\bT\b/g, 't');

      // Paso 1: Multiplicación implícita con números (ej: 2x -> 2*x, 3sin -> 3*sin, 3( -> 3*()
      s = s.replace(/(\d+(\.\d+)?)\s*([a-zA-Z(])/g, '$1 * $3');

      // Paso 2: Reemplazo de funciones matemáticas permitidas
      const funcNames = Object.keys(Scope).filter(k => typeof Scope[k] === 'function');
      funcNames.sort((a, b) => b.length - a.length);
      for (const name of funcNames) {
        const regex = new RegExp(`\\b${name}\\s*\\(`, 'g');
        s = s.replace(regex, `Scope.${name}(`);
      }

      // Paso 3: Reemplazo de constantes matemáticas
      const constNames = ['pi', 'PI', 'tau', 'TAU', 'e', 'E'];
      for (const name of constNames) {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        s = s.replace(regex, `Scope.${name}`);
      }

      // Paso 4: Manejo de operador potencia '^' -> Scope.pow(A, B)
      s = this.replacePowers(s);

      // Paso 5: Multiplicación implícita restante:
      // Paréntesis cerrado seguido de (, número, variable o Scope
      s = s.replace(/\)\s*(\(|[0-9xtu]|Scope\.)/g, ') * $1');
      // Variable x o t seguida de (, Scope o variable
      s = s.replace(/\b([xtu])\s*(\(|Scope\.)/g, '$1 * $2');
      s = s.replace(/\b([xtu])\s+([xtu])\b/g, '$1 * $2');

      // Paso 6: Verificación estricta de seguridad
      const sanitizedTest = s
        .replace(/Scope\.[a-zA-Z0-9_]+/g, '')
        .replace(/\b(x|t|u)\b/g, '')
        .replace(/[0-9.+\-*/%(),\s?:><=!]/g, '');

      if (sanitizedTest.length > 0) {
        throw new Error(`Símbolo o identificador no reconocido: "${sanitizedTest.trim()}"`);
      }

      return s;
    }

    /**
     * Convierte de forma robusta potencias A^B a Scope.pow(A, B)
     */
    static replacePowers(expr) {
      let s = expr;
      while (s.includes('^')) {
        const caretIdx = s.lastIndexOf('^');

        // Buscar operando izquierdo
        let leftStart = caretIdx - 1;
        while (leftStart >= 0 && /\s/.test(s[leftStart])) leftStart--;

        let leftEnd = leftStart + 1;
        if (s[leftStart] === ')') {
          let depth = 1;
          leftStart--;
          while (leftStart >= 0 && depth > 0) {
            if (s[leftStart] === ')') depth++;
            else if (s[leftStart] === '(') depth--;
            leftStart--;
          }
          leftStart++; // inicio del bloque entre paréntesis
          // Si estaba precedido por nombre de función o identificador (ej: Scope.sin(...)^2)
          while (leftStart > 0 && /[a-zA-Z0-9_.]/.test(s[leftStart - 1])) {
            leftStart--;
          }
        } else {
          while (leftStart >= 0 && /[a-zA-Z0-9_.]/.test(s[leftStart])) {
            leftStart--;
          }
          leftStart++;
        }
        const leftBase = s.slice(leftStart, leftEnd).trim();

        // Buscar operando derecho
        let rightStart = caretIdx + 1;
        while (rightStart < s.length && /\s/.test(s[rightStart])) rightStart++;

        let rightEnd = rightStart;
        if (s[rightStart] === '(') {
          let depth = 1;
          rightEnd++;
          while (rightEnd < s.length && depth > 0) {
            if (s[rightEnd] === '(') depth++;
            else if (s[rightEnd] === ')') depth--;
            rightEnd++;
          }
        } else {
          if (s[rightEnd] === '-' || s[rightEnd] === '+') rightEnd++;
          while (rightEnd < s.length && /[a-zA-Z0-9_.]/.test(s[rightEnd])) {
            rightEnd++;
          }
        }
        const rightExponent = s.slice(rightStart, rightEnd).trim();

        if (!leftBase || !rightExponent) {
          throw new Error('Operador de potencia ^ sin operandos válidos.');
        }

        const replacement = `Scope.pow(${leftBase}, ${rightExponent})`;
        s = s.slice(0, leftStart) + replacement + s.slice(rightEnd);
      }
      return s;
    }

    /**
     * Compila la expresión a una función JavaScript ejecutable de altísima velocidad:
     * (x, t) => number
     */
    static compile(expr) {
      const jsCode = this.preprocessToJS(expr);
      let fn;
      try {
        // eslint-disable-next-line no-new-func
        fn = new Function('x', 't', 'Scope', `
          try {
            const val = (${jsCode});
            return Number.isFinite(val) ? val : (isNaN(val) ? NaN : (val > 0 ? 1e6 : -1e6));
          } catch(e) {
            return NaN;
          }
        `);
      } catch (err) {
        throw new Error(`Error al compilar la expresión: ${err.message}`);
      }

      return function evaluate(x, t) {
        const res = fn(x, t, Scope);
        return isNaN(res) ? NaN : res;
      };
    }

    /**
     * Convierte una expresión algebraica a formato LaTeX para KaTeX
     */
    static toLatex(expr) {
      if (!expr || typeof expr !== 'string') return '0';
      let s = this.normalize(expr);

      // Reemplazos de funciones a comandos LaTeX
      s = s.replace(/\bsin\b/g, '\\sin');
      s = s.replace(/\bcos\b/g, '\\cos');
      s = s.replace(/\btan\b/g, '\\tan');
      s = s.replace(/\bexp\b/g, '\\exp');
      s = s.replace(/\bsqrt\b/g, '\\sqrt');
      s = s.replace(/\bsinc\b/g, '\\operatorname{sinc}');
      s = s.replace(/\bsech\b/g, '\\operatorname{sech}');
      s = s.replace(/\brect\b/g, '\\operatorname{rect}');
      s = s.replace(/\btri\b/g, '\\operatorname{tri}');
      s = s.replace(/\bpi\b/g, '\\pi');
      s = s.replace(/\bPI\b/g, '\\pi');
      s = s.replace(/\btau\b/g, '2\\pi');

      // Potencias: x^2 o (algo)^2 -> {x}^{2}
      s = s.replace(/\^([0-9a-zA-Z]+)/g, '^{$1}');
      s = s.replace(/\^(\([^\)]+\))/g, '^{$1}');

      // Multiplicaciones explícitas con punto centrado
      s = s.replace(/\*/g, ' \\cdot ');

      return s;
    }

    /**
     * Genera la expresión matemática canónica y el LaTeX para tipos de onda estándar
     */
    static buildStandardExpression(type, params) {
      const A = Number(params.amplitude || 1.0);
      const v = Number(params.velocity || 0.0);
      const x0 = Number(params.x0 || 0.0);
      const w = Math.max(0.01, Number(params.width || 1.0));
      const lambda = Math.max(0.01, Number(params.wavelength || 4.0));
      const phi = Number(params.phase || 0.0);

      // Argumento de traslación física u = x - v*t - x0
      // v > 0: onda hacia la derecha (+x)
      // v < 0: onda hacia la izquierda (-x)
      const vSign = v >= 0 ? '-' : '+';
      const absV = Math.abs(v);
      const x0Sign = x0 >= 0 ? (x0 === 0 ? '' : ` - ${x0}`) : ` + ${Math.abs(x0)}`;
      const uArg = absV === 0 ? `(x${x0Sign})` : `(x ${vSign} ${absV}*t${x0Sign})`;

      let expr = '';
      let latex = '';

      switch (type) {
        case 'gaussian':
          expr = `${A} * exp(-(${uArg}/${w})^2)`;
          latex = `${A} \\, e^{-\\left(\\frac{${uArg.replace(/\*/g, '\\cdot')}}{${w}}\\right)^2}`;
          break;

        case 'harmonic': {
          const k = Number((2 * Math.PI / lambda).toFixed(4));
          const omega = Number((k * absV).toFixed(4));
          const phiStr = phi !== 0 ? (phi > 0 ? ` + ${phi}` : ` - ${Math.abs(phi)}`) : '';
          const harmonicArg = absV === 0 ? `${k}*x${phiStr}` : `${k}*x ${vSign} ${omega}*t${phiStr}`;
          expr = `${A} * sin(${harmonicArg})`;
          latex = `${A} \\sin\\left(${harmonicArg.replace(/\*/g, '\\cdot')}\\right)`;
          break;
        }

        case 'triangular':
          expr = `${A} * tri(${uArg}/${w})`;
          latex = `${A} \\operatorname{tri}\\left(\\frac{${uArg.replace(/\*/g, '\\cdot')}}{${w}}\\right)`;
          break;

        case 'square':
          expr = `${A} * rect(${uArg}/${w})`;
          latex = `${A} \\operatorname{rect}\\left(\\frac{${uArg.replace(/\*/g, '\\cdot')}}{${w}}\\right)`;
          break;

        case 'soliton':
          expr = `${A} * (sech(${uArg}/${w}))^2`;
          latex = `${A} \\operatorname{sech}^2\\left(\\frac{${uArg.replace(/\*/g, '\\cdot')}}{${w}}\\right)`;
          break;

        case 'custom':
        default:
          expr = params.customExpression || '0';
          latex = this.toLatex(expr);
          break;
      }

      return { expression: expr, latex };
    }
  }

  // Exportar al entorno global
  global.MathParser = MathParser;
})(typeof window !== 'undefined' ? window : this);
