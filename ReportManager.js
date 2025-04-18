// ReportManager Integrado com lógica fuzzy α → θ
// F(x-semântica): UI Service Layer + Data Visualization
// Score fuzzy: α=0.9 | γ=1.0 | θ=0.95

class OrionReportManager {
    constructor() {
        // R(r): dependência do banco de dados
        this.db = window.db;

        // R(r): Chart.js
        this.chartInstances = {};
    }

    // T(a): Geração de relatório de vendas
    gerarRelatorioVendas(filtros = {}) {
        // γ: Ação crítica de extração de dados
        const relatorio = this.db.gerarRelatorioVendas(filtros);
        return relatorio;
    }

    // T(a): Criação de gráfico com dados temporais
    criarGraficoVendasPorPeriodo(canvasId, dados, tipo = 'dia') {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !canvas.getContext) {
            console.error(`Canvas com ID ${canvasId} não encontrado`);
            return null;
        }

        // Destruir gráfico anterior se existir
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        const vendasPorPeriodo = dados.vendasPorData;
        const periodos = Object.keys(vendasPorPeriodo).sort();

        // R(r): dependente da função OrionCore.formatarData()
        const labels = periodos.map(periodo => {
            const data = new Date(periodo);
            if (tipo === 'dia') {
                return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            } else if (tipo === 'mes') {
                return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            } else if (tipo === 'semana') {
                return data.toLocaleDateString('pt-BR', { week: 'numeric', year: 'numeric' });
            }
        });

        const valores = periodos.map(periodo => vendasPorPeriodo[periodo]);

        // θ: Renderização otimizada do gráfico
        this.chartInstances[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Vendas',
                    data: valores,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true }
                }
            }
        });
    }
}
