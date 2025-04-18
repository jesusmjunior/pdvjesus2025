// assets/js/auth.js
class OrionAuth {
    constructor() {
        this.SESSION_KEY = 'orion_session';
        this.SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas em milissegundos
    }

    // Login de usuário
    login(username, password) {
        // Verificar se os dados foram fornecidos
        if (!username || !password) {
            return {
                sucesso: false,
                mensagem: 'Usuário e senha são obrigatórios'
            };
        }

        // Obter usuário do banco de dados
        const db = window.db; // Sistema de banco de dados
        const usuario = db.getUsuario(username);

        // Verificar se o usuário existe
        if (!usuario) {
            return {
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            };
        }

        // Fazer hash da senha
        const senhaHash = db.hashPassword(password);

        // Verificar se a senha está correta
        if (senhaHash !== usuario.senha_hash) {
            return {
                sucesso: false,
                mensagem: 'Senha incorreta'
            };
        }

        // Criar sessão
        const session = {
            username: usuario.username,
            nome: usuario.nome,
            perfil: usuario.perfil,
            ultimo_acesso: new Date().toISOString(),
            expira_em: new Date(Date.now() + this.SESSION_DURATION).toISOString()
        };

        // Salvar sessão no localStorage
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

        // Atualizar último acesso do usuário
        usuario.ultimo_acesso = session.ultimo_acesso;
        db.adicionarUsuario(usuario);

        return {
            sucesso: true,
            usuario: {
                username: usuario.username,
                nome: usuario.nome,
                perfil: usuario.perfil
            }
        };
    }

    // Verificar se o usuário está autenticado
    verificarAutenticacao() {
        // Obter dados da sessão
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        
        if (!sessionData) {
            return false;
        }

        try {
            // Converter dados da sessão para objeto
            const session = JSON.parse(sessionData);

            // Verificar se a sessão expirou
            const agora = new Date();
            const expiraEm = new Date(session.expira_em);

            if (agora > expiraEm) {
                // Sessão expirada, remover dados
                this.fazerLogout();
                return false;
            }

            // Renovar sessão
            this.renovarSessao();

            return true;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return false;
        }
    }

    // Obter dados do usuário atual
    getUsuarioAtual() {
        // Verificar se está autenticado
        if (!this.verificarAutenticacao()) {
            return null;
        }

        // Obter dados da sessão
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        
        if (!sessionData) {
            return null;
        }

        try {
            // Converter dados da sessão para objeto
            const session = JSON.parse(sessionData);

            return {
                username: session.username,
                nome: session.nome,
                perfil: session.perfil
            };
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            return null;
        }
    }

    // Renovar sessão
    renovarSessao() {
        // Obter dados da sessão
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        
        if (!sessionData) {
            return false;
        }

        try {
            // Converter dados da sessão para objeto
            const session = JSON.parse(sessionData);

            // Atualizar data de expiração
            session.expira_em = new Date(Date.now() + this.SESSION_DURATION).toISOString();

            // Salvar sessão atualizada
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

            return true;
        } catch (error) {
            console.error('Erro ao renovar sessão:', error);
            return false;
        }
    }

    // Fazer logout
    fazerLogout() {
        localStorage.removeItem(this.SESSION_KEY);
        return true;
    }

    // Verificar se usuário tem uma permissão específica
    verificarPermissao(permissao) {
        // Obter usuário atual
        const usuario = this.getUsuarioAtual();

        if (!usuario) {
            return false;
        }

        // Verificar se é administrador (tem todas as permissões)
        if (usuario.perfil === 'admin') {
            return true;
        }

        // Implementar verificação de permissões específicas conforme necessário
        // Exemplo: buscar permissões por perfil em um objeto ou banco de dados

        return false;
    }

    // Alterar senha do usuário
    alterarSenha(username, senhaAtual, novaSenha) {
        // Verificar se os dados foram fornecidos
        if (!username || !senhaAtual || !novaSenha) {
            return {
                sucesso: false,
                mensagem: 'Todos os campos são obrigatórios'
            };
        }

        // Obter usuário do banco de dados
        const db = window.db;
        const usuario = db.getUsuario(username);

        // Verificar se o usuário existe
        if (!usuario) {
            return {
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            };
        }

        // Fazer hash da senha atual
        const senhaAtualHash = db.hashPassword(senhaAtual);

        // Verificar se a senha atual está correta
        if (senhaAtualHash !== usuario.senha_hash) {
            return {
                sucesso: false,
                mensagem: 'Senha atual incorreta'
            };
        }

        // Fazer hash da nova senha
        const novaSenhaHash = db.hashPassword(novaSenha);

        // Atualizar senha do usuário
        usuario.senha_hash = novaSenhaHash;
        db.adicionarUsuario(usuario);

        return {
            sucesso: true,
            mensagem: 'Senha alterada com sucesso'
        };
    }
}

// Inicialização global
const auth = new OrionAuth();
