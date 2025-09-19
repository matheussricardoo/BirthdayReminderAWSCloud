/**
 * Birthday Reminder Frontend - JavaScript Module
 * Gerencia a interface do usuário e comunicação com a API
 * 
 * @author matheussricardoo
 * @version 1.0.0
 */

// Variáveis globais para armazenar estado da aplicação
let allBirthdays = []; // Array com todos os aniversários carregados da API
let currentFilter = 'all'; // Filtro atual selecionado pelo usuário

// Elementos DOM frequentemente utilizados - cache para melhor performance
const todayCount = document.getElementById('today-count'); // Contador de aniversários hoje
const upcomingCount = document.getElementById('upcoming-count'); // Contador de próximos aniversários
const birthdaysList = document.getElementById('birthdays-list'); // Container da lista de aniversários
const tabButtons = document.querySelectorAll('.tab-btn'); // Botões de filtro

/**
 * Inicialização da aplicação quando o DOM estiver carregado
 * Carrega os dados e configura os event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    loadBirthdays(); // Carrega dados da API
    setupEventListeners(); // Configura interações do usuário
});

/**
 * Configura os event listeners para interações do usuário
 * Adiciona funcionalidade de clique nos botões de filtro
 */
function setupEventListeners() {
    // Adiciona listener para cada botão de filtro
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Atualiza o filtro atual baseado no data-attribute do botão
            currentFilter = this.dataset.filter;
            // Atualiza a aparência visual do botão ativo
            updateActiveTab(this);
            // Aplica o novo filtro aos dados
            filterBirthdays();
        });
    });
}

/**
 * Atualiza a aparência visual dos botões de filtro
 * @param {HTMLElement} activeBtn - Botão que deve ficar ativo
 */
function updateActiveTab(activeBtn) {
    // Remove a classe 'active' de todos os botões
    tabButtons.forEach(btn => btn.classList.remove('active'));
    // Adiciona a classe 'active' apenas no botão selecionado
    activeBtn.classList.add('active');
}

/**
 * Carrega os dados de aniversários da API
 * Função assíncrona que faz requisição para o backend
 */
async function loadBirthdays() {
    try {
        // Mostra indicador de carregamento
        showLoading();
        
        // Faz requisição para a API através do proxy do frontend
        const response = await fetch('/api/birthdays');
        
        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error('Erro ao carregar dados');
        }
        
        // Converte a resposta para JSON
        const data = await response.json();
        
        // Armazena os dados globalmente para uso em filtros
        allBirthdays = data.birthdays || [];
        
        // Atualiza os contadores no cabeçalho
        updateSummary();
        
        // Renderiza a lista com todos os aniversários
        filterBirthdays();
        
    } catch (error) {
        // Log do erro para depuração
        console.error('Erro:', error);
        
        // Mostra mensagem de erro amigável para o usuário
        showError('Não foi possível carregar os aniversários');
    }
}

/**
 * Atualiza os contadores de resumo no cabeçalho da página
 * Calcula quantos aniversários são hoje e nos próximos 30 dias
 */
function updateSummary() {
    // Filtra aniversários que são hoje
    const today = allBirthdays.filter(b => b.is_birthday_today);
    
    // Filtra aniversários nos próximos 30 dias (incluindo hoje)
    const upcoming = allBirthdays.filter(b => b.days_until_birthday >= 0 && b.days_until_birthday <= 30);
    
    // Atualiza os elementos HTML com os números
    todayCount.textContent = today.length;
    upcomingCount.textContent = upcoming.length;
}

/**
 * Aplica filtros aos aniversários baseado na seleção atual
 * Filtra os dados e chama a função de renderização
 */
function filterBirthdays() {
    let filtered = [];
    
    // Aplica o filtro baseado na seleção atual
    switch(currentFilter) {
        case 'today':
            // Mostra apenas aniversários de hoje
            filtered = allBirthdays.filter(b => b.is_birthday_today);
            break;
        case 'upcoming':
            // Mostra aniversários nos próximos 30 dias
            filtered = allBirthdays.filter(b => b.days_until_birthday >= 0 && b.days_until_birthday <= 30);
            break;
        default:
            // Mostra todos os aniversários
            filtered = allBirthdays;
    }
    
    // Renderiza os dados filtrados
    renderBirthdays(filtered);
}

/**
 * Renderiza a lista de aniversários na interface
 * @param {Array} birthdays - Array de objetos de aniversário para renderizar
 */
function renderBirthdays(birthdays) {
    // Verifica se há aniversários para mostrar
    if (birthdays.length === 0) {
        birthdaysList.innerHTML = '<div class="loading">Nenhum aniversário encontrado</div>';
        return;
    }
    
    // Gera HTML para cada aniversário e junta em uma string
    const html = birthdays.map(birthday => createBirthdayHTML(birthday)).join('');
    
    // Atualiza o conteúdo da lista
    birthdaysList.innerHTML = html;
}

/**
 * Cria HTML para um único aniversário
 * @param {Object} birthday - Objeto com dados do aniversário
 * @returns {string} HTML string para o aniversário
 */
function createBirthdayHTML(birthday) {
    // Determina a classe CSS baseada na proximidade do aniversário
    const statusClass = getStatusClass(birthday.days_until_birthday);
    
    // Formata o texto de dias restantes
    const daysText = getDaysText(birthday.days_until_birthday);
    
    // Retorna HTML estruturado para o aniversário
    return `
        <div class="birthday-item">
            <div class="birthday-info">
                <h3>${birthday.name}</h3>
                <p>Nascimento: ${birthday.birth_date_formatted}</p>
            </div>
            <div class="birthday-status ${statusClass}">
                <div class="days">${daysText}</div>
                <div class="age">Fará ${birthday.age_next} anos</div>
            </div>
        </div>
    `;
}

/**
 * Determina a classe CSS baseada na proximidade do aniversário
 * @param {number} days - Número de dias até o aniversário
 * @returns {string} Nome da classe CSS apropriada
 */
function getStatusClass(days) {
    if (days === 0) return 'status-today'; // Aniversário é hoje - vermelho
    if (days <= 30) return 'status-upcoming'; // Próximos 30 dias - azul
    return 'status-distant'; // Mais distante - cinza
}

/**
 * Formata o texto de dias restantes para exibição
 * @param {number} days - Número de dias até o aniversário
 * @returns {string} Texto formatado para exibição
 */
function getDaysText(days) {
    if (days === 0) return 'HOJE!'; // Destaque especial para hoje
    if (days === 1) return '1 dia'; // Singular para um dia
    return `${days} dias`; // Plural para múltiplos dias
}

/**
 * Mostra indicador de carregamento na lista
 */
function showLoading() {
    birthdaysList.innerHTML = '<div class="loading">Carregando...</div>';
}

/**
 * Mostra mensagem de erro na lista
 * @param {string} message - Mensagem de erro para exibir
 */
function showError(message) {
    birthdaysList.innerHTML = `<div class="error">${message}</div>`;
}
