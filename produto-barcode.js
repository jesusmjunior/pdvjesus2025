// assets/js/produto-barcode.js
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se os elementos necessários existem
  const btnScannerCodigo = document.getElementById('btn-scanner-codigo');
  const modalScanner = document.getElementById('modal-scanner');
  const btnCloseScanner = document.querySelectorAll('.btn-close-scanner');
  const scannerVideo = document.getElementById('scanner-video');
  const codigoBarrasInput = document.getElementById('codigo-barras');
  
  // Verificar se a biblioteca BarcodeScanner está disponível
  if (typeof BarcodeScanner === 'undefined') {
    console.warn('Biblioteca BarcodeScanner não encontrada. Usando implementação básica...');
    
    // Implementação básica usando Quagga diretamente
    let scanner = null;
    
    function iniciarScanner() {
      if (!scannerVideo) {
        console.error('Elemento de vídeo não encontrado');
        return;
      }
      
      // Exibir modal
      if (modalScanner) {
        modalScanner.style.display = 'flex';
      }
      
      // Inicializar Quagga
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerVideo,
          constraints: {
            width: 480,
            height: 320,
            facingMode: "environment"
          },
        },
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
          ]
        },
      }, function(err) {
        if (err) {
          console.error(err);
          alert("Erro ao inicializar o scanner: " + err);
          return;
        }
        
        console.log("Quagga inicializado!");
        
        // Iniciar scanner
        Quagga.start();
        scanner = true;
        
        // Detectar código de barras
        Quagga.onDetected(function(result) {
          // Obter código lido
          const code = result.codeResult.code;
          
          // Parar scanner
          pararScanner();
          
          // Preencher campo de código de barras
          if (codigoBarrasInput) {
            codigoBarrasInput.value = code;
            
            // Disparar evento de validação
            const event = new Event('blur');
            codigoBarrasInput.dispatchEvent(event);
          }
        });
      });
    }
    
    function pararScanner() {
      if (scanner) {
        Quagga.stop();
        scanner = false;
        
        // Ocultar modal
        if (modalScanner) {
          modalScanner.style.display = 'none';
        }
      }
    }
    
    // Adicionar eventos
    if (btnScannerCodigo) {
      btnScannerCodigo.addEventListener('click', function(e) {
        e.preventDefault();
        iniciarScanner();
      });
    }
    
    if (btnCloseScanner) {
      btnCloseScanner.forEach(btn => {
        btn.addEventListener('click', pararScanner);
      });
    }
  } else {
    // Usar a biblioteca BarcodeScanner
    const barcodeScanner = new BarcodeScanner({
      inputStream: {
        target: scannerVideo,
        constraints: {
          width: 480,
          height: 320,
          facingMode: "environment"
        }
      }
    });
    
    // Função para iniciar scanner
    function iniciarScanner() {
      // Exibir modal
      if (modalScanner) {
        modalScanner.style.display = 'flex';
      }
      
      // Iniciar scanner
      barcodeScanner.start(function(codeResult) {
        // Parar scanner
        barcodeScanner.stop();
        
        // Ocultar modal
        if (modalScanner) {
          modalScanner.style.display = 'none';
        }
        
        // Preencher campo de código de barras
        if (codigoBarrasInput) {
          codigoBarrasInput.value = codeResult.code;
          
          // Disparar evento de validação
          const event = new Event('blur');
          codigoBarrasInput.dispatchEvent(event);
        }
      });
    }
    
    // Função para parar scanner
    function pararScanner() {
      barcodeScanner.stop();
      
      // Ocultar modal
      if (modalScanner) {
        modalScanner.style.display = 'none';
      }
    }
    
    // Adicionar eventos
    if (btnScannerCodigo) {
      btnScannerCodigo.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Verificar permissão da câmera antes de iniciar
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(function(stream) {
            // Parar stream imediatamente
            stream.getTracks().forEach(track => track.stop());
            
            // Iniciar scanner
            iniciarScanner();
          })
          .catch(function(err) {
            console.error('Erro ao acessar câmera:', err);
            alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
          });
      });
    }
    
    if (btnCloseScanner) {
      btnCloseScanner.forEach(btn => {
        btn.addEventListener('click', pararScanner);
      });
    }
  }
  
  // Função para gerar código de barras EAN-13 válido
  function gerarCodigoBarras() {
    // Prefixo para GS1 Brasil (789 ou 790)
    let codigo = '789';
    
    // Gerar 9 dígitos aleatórios
    for (let i = 0; i < 9; i++) {
      codigo += Math.floor(Math.random() * 10);
    }
    
    // Calcular dígito verificador
    let soma = 0;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(codigo[i]) * (i % 2 === 0 ? 1 : 3);
    }
    
    const digitoVerificador = (10 - (soma % 10)) % 10;
    
    // Adicionar dígito verificador
    codigo += digitoVerificador;
    
    return codigo;
  }
  
  // Função para validar código de barras
  function validarCodigoBarras(codigo) {
    if (!codigo || codigo.length === 0) return true; // Permitir vazio
    
    // Verificar se contém apenas dígitos
    if (!/^\d+$/.test(codigo)) {
      return false;
    }
    
    // Verificar comprimento (EAN-8, EAN-13, UPC-A, etc.)
    const validLengths = [8, 12, 13, 14];
    if (!validLengths.includes(codigo.length)) {
      return false;
    }
    
    // Para EAN-13, validar dígito verificador
    if (codigo.length === 13) {
      let soma = 0;
      for (let i = 0; i < 12; i++) {
        soma += parseInt(codigo[i]) * (i % 2 === 0 ? 1 : 3);
      }
      
      const digitoVerificador = (10 - (soma % 10)) % 10;
      
      if (parseInt(codigo[12]) !== digitoVerificador) {
        return false;
      }
    }
    
    // Para EAN-8, validar dígito verificador
    if (codigo.length === 8) {
      let soma = 0;
      for (let i = 0; i < 7; i++) {
        soma += parseInt(codigo[i]) * (i % 2 !== 0 ? 1 : 3);
      }
      
      const digitoVerificador = (10 - (soma % 10)) % 10;
      
      if (parseInt(codigo[7]) !== digitoVerificador) {
        return false;
      }
    }
    
    return true;
  }
  
  // Adicionar evento ao botão de gerar código de barras
  const btnGerarCodigo = document.getElementById('btn-gerar-codigo');
  if (btnGerarCodigo && codigoBarrasInput) {
    btnGerarCodigo.addEventListener('click', function(e) {
      e.preventDefault();
      codigoBarrasInput.value = gerarCodigoBarras();
      
      // Disparar evento de validação
      const event = new Event('blur');
      codigoBarrasInput.dispatchEvent(event);
    });
  }
  
  // Expor funções globalmente para uso em produto.js
  window.validarCodigoBarras = validarCodigoBarras;
  window.gerarCodigoBarras = gerarCodigoBarras;
});
