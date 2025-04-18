// assets/js/barcode-scanner.js
/**
 * Biblioteca para integração simples de leitura de códigos de barras
 * utilizando a biblioteca Quagga.js
 */
class BarcodeScanner {
  constructor(options = {}) {
    // Configurações padrão
    this.config = {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: null,
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: "environment", // Usar câmera traseira em dispositivos móveis
          aspectRatio: { min: 1, max: 2 }
        },
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      frequency: 10,
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ],
        debug: {
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showRemainingPatchLabels: false
        }
      },
      locate: true,
      numOfWorkers: 4
    };
    
    // Sobrescrever configurações
    if (options.inputStream && options.inputStream.target) {
      this.config.inputStream.target = options.inputStream.target;
    }
    
    if (options.inputStream && options.inputStream.constraints) {
      this.config.inputStream.constraints = {
        ...this.config.inputStream.constraints,
        ...options.inputStream.constraints
      };
    }
    
    if (options.decoder && options.decoder.readers) {
      this.config.decoder.readers = options.decoder.readers;
    }
    
    if (options.numOfWorkers) {
      this.config.numOfWorkers = options.numOfWorkers;
    }
    
    // Estado
    this.isActive = false;
    this.lastResult = null;
    this.callbacks = {
      detected: null,
      error: null,
      processed: null
    };
    
    // Bind de métodos
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.onDetected = this.onDetected.bind(this);
    this.onProcessed = this.onProcessed.bind(this);
    this.onError = this.onError.bind(this);
    this.validateCode = this.validateCode.bind(this);
  }
  
  /**
   * Inicia o scanner
   * @param {Function} callback - Função a ser executada quando um código for detectado
   * @returns {Promise} Promessa que resolve quando o scanner estiver pronto
   */
  start(callback) {
    if (this.isActive) {
      console.warn('Scanner já está ativo');
      return Promise.resolve(false);
    }
    
    // Verificar se target foi definido
    if (!this.config.inputStream.target) {
      console.error('Elemento alvo não definido para scanner');
      return Promise.reject(new Error('Elemento alvo não definido para scanner'));
    }
    
    // Verificar se callback foi fornecido
    if (callback && typeof callback === 'function') {
      this.callbacks.detected = callback;
    }
    
    // Preparar para iniciar
    return new Promise((resolve, reject) => {
      // Inicializar Quagga
      Quagga.init(
        this.config,
        (err) => {
          if (err) {
            console.error('Erro ao inicializar scanner:', err);
            reject(err);
            return;
          }
          
          // Registrar callbacks
          Quagga.onDetected(this.onDetected);
          Quagga.onProcessed(this.onProcessed);
          
          // Iniciar scanner
          Quagga.start();
          this.isActive = true;
          
          console.log('Scanner iniciado com sucesso');
          resolve(true);
        }
      );
    });
  }
  
  /**
   * Para o scanner
   */
  stop() {
    if (!this.isActive) {
      console.warn('Scanner não está ativo');
      return;
    }
    
    Quagga.stop();
    this.isActive = false;
    console.log('Scanner parado');
  }
  
  /**
   * Callback para quando um código é detectado
   * @param {Object} result - Resultado da detecção
   */
  onDetected(result) {
    // Validar código
    if (!this.validateCode(result.codeResult)) {
      // Código inválido, ignorar
      return;
    }
    
    // Armazenar último resultado
    this.lastResult = result.codeResult;
    
    // Executar callback de detecção
    if (this.callbacks.detected && typeof this.callbacks.detected === 'function') {
      this.callbacks.detected(result.codeResult);
    }
  }
  
  /**
   * Callback para quando um frame é processado
   * @param {Object} result - Resultado do processamento
   */
  onProcessed(result) {
    if (result) {
      // Se houver um canvas de overlay, podemos desenhar nele
      const drawingCanvas = Quagga.canvas.dom.overlay;
      
      if (drawingCanvas) {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        
        // Limpar canvas
        drawingCtx.clearRect(
          0,
          0,
          Number(drawingCanvas.getAttribute("width")),
          Number(drawingCanvas.getAttribute("height"))
        );
        
        // Desenhar caixas de detecção
        if (result.boxes) {
          drawingCtx.strokeStyle = "rgba(0, 255, 0, 0.5)";
          drawingCtx.lineWidth = 2;
          
          for (let i = 0; i < result.boxes.length; i++) {
            const box = result.boxes[i];
            if (box !== result.box) {
              drawingCtx.beginPath();
              drawingCtx.moveTo(box[0][0], box[0][1]);
              drawingCtx.lineTo(box[1][0], box[1][1]);
              drawingCtx.lineTo(box[2][0], box[2][1]);
              drawingCtx.lineTo(box[3][0], box[3][1]);
              drawingCtx.lineTo(box[0][0], box[0][1]);
              drawingCtx.stroke();
            }
          }
        }
        
        // Se houver um código detectado, desenhar a caixa em destaque
        if (result.box) {
          drawingCtx.strokeStyle = "rgba(255, 0, 0, 0.8)";
          drawingCtx.lineWidth = 4;
          drawingCtx.beginPath();
          drawingCtx.moveTo(result.box[0][0], result.box[0][1]);
          drawingCtx.lineTo(result.box[1][0], result.box[1][1]);
          drawingCtx.lineTo(result.box[2][0], result.box[2][1]);
          drawingCtx.lineTo(result.box[3][0], result.box[3][1]);
          drawingCtx.lineTo(result.box[0][0], result.box[0][1]);
          drawingCtx.stroke();
        }
      }
      
      // Executar callback de processamento
      if (this.callbacks.processed && typeof this.callbacks.processed === 'function') {
        this.callbacks.processed(result);
      }
    }
  }
  
  /**
   * Registra um callback para quando ocorrer um erro
   * @param {Function} callback - Função a ser executada quando ocorrer um erro
   */
  onError(callback) {
    if (callback && typeof callback === 'function') {
      this.callbacks.error = callback;
    }
  }
  
  /**
   * Valida um código detectado
   * @param {Object} codeResult - Resultado da detecção
   * @returns {Boolean} Verdadeiro se o código for válido
   */
  validateCode(codeResult) {
    // Verificar se o código tem um formato conhecido
    const validFormats = [
      'code_128',
      'code_39',
      'code_39_vin',
      'ean',
      'ean_8',
      'ean_13',
      'upc',
      'upc_a',
      'upc_e',
      'codabar',
      'i2of5'
    ];
    
    if (!validFormats.includes(codeResult.format)) {
      return false;
    }
    
    // Verificar se o código tem um comprimento mínimo
    if (!codeResult.code || codeResult.code.length < 4) {
      return false;
    }
    
    // Verificar confiabilidade do código
    // startInfo.error representa o nível de erro na leitura (quanto menor, melhor)
    if (codeResult.startInfo && codeResult.startInfo.error > 0.25) {
      return false;
    }
    
    // Para códigos EAN/UPC, verificar dígito verificador
    if (['ean', 'ean_8', 'ean_13', 'upc', 'upc_a', 'upc_e'].includes(codeResult.format)) {
      // Esta validação já é feita pelo Quagga, mas podemos adicionar validação extra aqui
    }
    
    return true;
  }
  
  /**
   * Define o elemento alvo para o scanner
   * @param {HTMLElement} target - Elemento onde o scanner será exibido
   */
  setTarget(target) {
    if (!target || !(target instanceof HTMLElement)) {
      console.error('Alvo inválido para scanner');
      return;
    }
    
    this.config.inputStream.target = target;
  }
}

// Expor classe globalmente
window.BarcodeScanner = BarcodeScanner;
