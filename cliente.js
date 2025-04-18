// assets/js/cliente.js
document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticação
  if (!auth.verificarAutenticacao()) {
    window.location.href = 'index.html';
    return;
  }
  
  // Elementos DOM
  const buscaClienteInput = document.getElementById('busca-cliente');
  const tabelaClientes = document.getElementById('tabela-clientes');
  const btnNovoCliente = document.getElementById('btn-novo-cliente');
  const formCliente = document.getElementById('form-cliente');
  const cardFormulario = document.getElementById('card-formulario');
  const formTitulo = document.getElementById('form-titulo');
  const clienteIdInput = document.getElementById('cliente-id');
  const nomeInput = document.getElementById('nome');
  const documentoInput = document.getElementById('documento');
  const telefoneInput = document.getElementById('telefone');
  const emailInput = document.getElementById('email');
  const enderecoInput = document.getElementById('endereco');
  const cidadeInput = document.getElementById('cidade');
  const btnCancelar = document.getElementById('btn-cancelar');
  
  // Variáveis de controle
  let modoEdicao = false;
  
  // Dados do usuário
  const user = auth.getUsuarioAtual();
  document.getElementById('user-name').textContent = user.nome;
  
  // Data atual
  const dataAtual = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = dataAtual.toLocaleDateString('pt-BR', options);
  
  // Carregar dados iniciais
  carregarClientes();
  
  // Verificar se tem parâmetro na URL para edição de cliente
  const urlParams = new URLSearchParams(window.location.search);
  const idCliente = urlParams.get('id');
  if (idCliente) {
    editarCliente(idCliente);
  }
  
  // Event Listeners
  buscaClienteInput.addEventListener('input', carregarClientes);
  formCliente.addEventListener('submit', salvarCliente);
  btnNovoCliente.addEventListener('click', novoCliente);
  btnCancelar.addEventListener('click', cancelarFormulario);
  
  // Validação de CPF/CNPJ
  documentoInput.addEventListener('blur', function() {
    validarDocumento(this.value);
  });
  
  // Formatação de telefone
  telefoneInput.addEventListener('input', function() {
    formatarTelefone(this);
  });
  
  // Logout
  document.getElementById('btn-logout').addEventListener('click', function() {
    auth.fazerLogout();
    window.location.href = 'index.html';
  });
  
  // Funções para manipulação de dados
  function carregarClientes() {
    const clientes = db.getClientes();
    const termoBusca = buscaClienteInput.value.toLowerCase();
    
    // Limpar tabela
    const tbody = tabelaClientes.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Filtrar clientes
    let clientesFiltrados = clientes;
    
    if (termoBusca) {
      clientesFiltrados = clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(termoBusca) || 
        (cliente.documento && cliente.documento.includes(termoBusca)) ||
        (cliente.telefone && cliente.telefone.includes(termoBusca)) ||
        (cliente.email && cliente.email.toLowerCase().includes(termoBusca))
      );
    }
    
    // Ordenar por nome
    clientesFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
    
    // Adicionar à tabela
    clientesFiltrados.forEach(cliente => {
      // Pular o cliente "Consumidor Final" na listagem se estiver buscando
      if (termoBusca && cliente.nome === "Consumidor Final") {
        return;
      }
      
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>${cliente.nome}</td>
        <td>${cliente.documento || ''}</td>
        <td>${cliente.telefone || ''}</td>
        <td>${cliente.email || ''}</td>
        <td>
          <button class="btn btn-outline-primary btn-sm btn-editar" data-id="${cliente.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline-danger btn-sm btn-excluir" data-id="${cliente.id}" ${cliente.nome === "Consumidor Final" ? 'disabled' : ''}>
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
    
    // Adicionar eventos aos botões
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        editarCliente(id);
      });
    });
    
    document.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        excluirCliente(id);
      });
    });
  }
  
  function novoCliente() {
    // Limpar formulário
    formCliente.reset();
    clienteIdInput.value = '';
    
    // Configurar modo
    modoEdicao = false;
    formTitulo.textContent = 'Novo Cliente';
  }
  
  function editarCliente(id) {
    const cliente = db.getCliente(id);
    
    if (cliente) {
      // Preencher formulário
      clienteIdInput.value = cliente.id;
      nomeInput.value = cliente.nome;
      documentoInput.value = cliente.documento || '';
      telefoneInput.value = cliente.telefone || '';
      emailInput.value = cliente.email || '';
      enderecoInput.value = cliente.endereco || '';
      cidadeInput.value = cliente.cidade || '';
      
      // Configurar modo
      modoEdicao = true;
      formTitulo.textContent = 'Editar Cliente';
      
      // Desabilitar edição para cliente "Consumidor Final"
      const isConsumidorFinal = cliente.nome === "Consumidor Final";
      nomeInput.disabled = isConsumidorFinal;
      
      // Scroll até o formulário em dispositivos móveis
      if (window.innerWidth < 768) {
        cardFormulario.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
  
  function excluirCliente(id) {
    const cliente = db.getCliente(id);
    
    if (cliente) {
      // Não permitir excluir o cliente "Consumidor Final"
      if (cliente.nome === "Consumidor Final") {
        exibirMensagem('O cliente "Consumidor Final" não pode ser excluído', 'warning');
        return;
      }
      
      const confirmar = confirm(`Deseja realmente excluir o cliente "${cliente.nome}"?`);
      
      if (confirmar) {
        try {
          db.deletarCliente(id);
          carregarClientes();
          exibirMensagem('Cliente excluído com sucesso', 'success');
        } catch (erro) {
          exibirMensagem('Erro ao excluir cliente: ' + erro, 'error');
        }
      }
    }
  }
  
  function salvarCliente(e) {
    e.preventDefault();
    
    // Validar documento
    if (documentoInput.value && !validarDocumento(documentoInput.value)) {
      return;
    }
    
    // Obter dados do formulário
    const cliente = {
      id: clienteIdInput.value,
      nome: nomeInput.value,
      documento: documentoInput.value,
      telefone: telefoneInput.value,
      email: emailInput.value,
      endereco: enderecoInput.value,
      cidade: cidadeInput.value
    };
    
    try {
      // Salvar cliente
      db.salvarCliente(cliente);
      
      // Atualizar tabela
      carregarClientes();
      
      // Limpar formulário
      formCliente.reset();
      clienteIdInput.value = '';
      
      // Resetar modo
      modoEdicao = false;
      formTitulo.textContent = 'Novo Cliente';
      
      // Mensagem de sucesso
      exibirMensagem('Cliente salvo com sucesso', 'success');
    } catch (erro) {
      exibirMensagem('Erro ao salvar cliente: ' + erro, 'error');
    }
  }
  
  function cancelarFormulario() {
    // Limpar formulário
    formCliente.reset();
    clienteIdInput.value = '';
    
    // Resetar modo
    modoEdicao = false;
    formTitulo.textContent = 'Novo Cliente';
    
    // Habilitar todos os campos
    nomeInput.disabled = false;
  }
  
  // Funções de validação e formatação
  
  function validarDocumento(documento) {
    // Remover formatação
    const doc = documento.replace(/[^\d]/g, '');
    
    if (!doc) return true; // Campo vazio é permitido
    
    // Verificar se é CPF ou CNPJ
    if (doc.length === 11) {
      return validarCPF(doc);
    } else if (doc.length === 14) {
      return validarCNPJ(doc);
    } else {
      exibirMensagem('Documento inválido. CPF deve ter 11 dígitos e CNPJ 14 dígitos.', 'warning');
      return false;
    }
  }
  
  function validarCPF(cpf) {
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) {
      exibirMensagem('CPF inválido', 'warning');
      return false;
    }
    
    // Validar dígitos verificadores
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) {
      exibirMensagem('CPF inválido', 'warning');
      return false;
    }
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) {
      exibirMensagem('CPF inválido', 'warning');
      return false;
    }
    
    // Formatar CPF
    documentoInput.value = formatarCPF(cpf);
    return true;
  }
  
  function validarCNPJ(cnpj) {
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cnpj)) {
      exibirMensagem('CNPJ inválido', 'warning');
      return false;
    }
    
    // Validar dígitos verificadores
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    const digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) {
      exibirMensagem('CNPJ inválido', 'warning');
      return false;
    }
    
    tamanho += 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) {
      exibirMensagem('CNPJ inválido', 'warning');
      return false;
    }
    
    // Formatar CNPJ
    documentoInput.value = formatarCNPJ(cnpj);
    return true;
  }
  
  function formatarCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  function formatarCNPJ(cnpj) {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  function formatarTelefone(input) {
    let telefone = input.value.replace(/\D/g, '');
    
    if (telefone.length <= 10) {
      // Formato (XX) XXXX-XXXX
      telefone = telefone.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      // Formato (XX) XXXXX-XXXX
      telefone = telefone.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    
    input.value = telefone;
  }
  
  function exibirMensagem(mensagem, tipo) {
    // Criar toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${tipo}`;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'warning' ? 'exclamation-circle' : tipo === 'info' ? 'info-circle' : 'times-circle'}"></i>
        <span>${mensagem}</span>
      </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(toast);
    
    // Exibir com animação
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
});
