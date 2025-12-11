'use strict';

// ----------------------------------------------------
// 1. CONFIGURAÇÃO (CHAVES DA API E REGRAS DE ATIVIDADE)
// ----------------------------------------------------

const API_KEY = '83a36ed654224857a28221157251410'; // Sua chave da WeatherAPI

// ATENÇÃO: As chaves (Primeira, Segunda, etc.) DEVEM corresponder aos 'value's no seu HTML!
const regrasDeAtividade = {
    // ⚠️ ATIVIDADE: Caminhada (Value: 'Primeira')
    Primeira: { 
        dias_preferenciais: [0, 1, 2, 3, 4, 5, 6], // Todos os dias
        clima_ideal: { temperatura_min: 15, temperatura_max: 28, chuva_max_mm: 0.5 }
    },
    // ⚠️ ATIVIDADE: Ir pra Piscina (Value: 'Segunda')
    Segunda: { 
        dias_preferenciais: [0, 1, 2, 3, 4, 5, 6],
        clima_ideal: { temperatura_min: 22, temperatura_max: 35, chuva_max_mm: 0.1 }
    },
    // ⚠️ ATIVIDADE: Ir tomar sorvete (Value: 'terceira')
    terceira: { 
        dias_preferenciais: [0, 5, 6], // Domingo, Sexta, Sábado
        clima_ideal: { temperatura_min: 18, temperatura_max: 35, chuva_max_mm: 1 }
    },
    // ⚠️ ATIVIDADE: Surfar (Value: 'quarta')
    quarta: { 
        dias_preferenciais: [0, 1, 2, 3, 4, 5, 6],
        clima_ideal: { temperatura_min: 18, temperatura_max: 35, chuva_max_mm: 5 }
    },
    // ⚠️ ATIVIDADE: Praticar esportes (Value: 'quinta')
    quinta: { 
        dias_preferenciais: [0, 1, 2, 3, 4, 5, 6],
        clima_ideal: { temperatura_min: 16, temperatura_max: 28, chuva_max_mm: 0.2 }
    },
    // ⚠️ ATIVIDADE: Encontro de amigos (Value: 'sexta')
    sexta: { 
        dias_preferenciais: [0, 5, 6],
        clima_ideal: { temperatura_min: 18, temperatura_max: 28, chuva_max_mm: 1 }
    },
    // ⚠️ ATIVIDADE: Passear no centro (Value: 'Setima')
    Setima: { 
        dias_preferenciais: [0, 1, 2, 3, 4, 5, 6],
        clima_ideal: { temperatura_min: 18, temperatura_max: 27, chuva_max_mm: 1 }
    },
    // ⚠️ ATIVIDADE: Ir para a praia (Value: 'Oitava')
    Oitava: { 
        dias_preferenciais: [0, 1, 2, 3, 4, 5, 6],
        clima_ideal: { temperatura_min: 22, temperatura_max: 35, chuva_max_mm: 0.1 }
    },
    // ⚠️ ATIVIDADE: Piquinique (Value: 'Nono')
    Nono: { 
        dias_preferenciais: [0, 1, 2, 3, 4, 5, 6],
        clima_ideal: { temperatura_min: 18, temperatura_max: 28, chuva_max_mm: 0.2 }
    },
};

// ----------------------------------------------------
// 2. FUNÇÕES DE BUSCA DA API (CLIMA ATUAL E FUTURO)
// ----------------------------------------------------

// Função para buscar o CLIMA ATUAL (usada para preencher o cartão de clima)
async function pesquisarClima(cidade) {
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${cidade}&aqi=no`;
    const response = await fetch(url);
    return await response.json();
}

// Função para buscar a PREVISÃO FUTURA (usada para a análise do Dia Ideal)
async function pesquisarPrevisao(cidade, dias) {
    // Usa o endpoint 'forecast.json' para buscar a previsão de N dias.
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${cidade}&days=${dias}&aqi=no`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro ao buscar previsão ou cidade não encontrada.');
        }
        const data = await response.json();
        // Retorna a lista de previsões diárias
        return data.forecast.forecastday; 
    } catch (error) {
        console.error("Erro na API de previsão:", error);
        return null;
    }
}

// ----------------------------------------------------
// 3. FUNÇÕES DE INTERAÇÃO COM O USUÁRIO (HTML)
// ----------------------------------------------------

// Função que preenche o cartão de clima quando o usuário digita a cidade
async function prencherFormulario(evento) {
    if (evento.key === "Enter") {
        const cidade = evento.target.value;
        const info = await pesquisarClima(cidade);
        
        // Verifica se a busca foi bem sucedida
        if (info && info.current) {
            document.getElementById('weather-image')
                .src = info.current.condition.icon.replaceAll('64', '128');
            document.getElementById('weather-temperature')
                .textContent = `${Math.round(info.current.temp_c)} °C`;
            document.getElementById('weather-city')
                .textContent = info.location.name;
        } else {
            document.getElementById('weather-city').textContent = "Cidade não encontrada";
            document.getElementById('weather-temperature').textContent = "--";
            document.getElementById('weather-image').src = "";
        }
    }
}

// Função para obter as escolhas do usuário nos radio buttons e campo de texto
function getEscolhasDoUsuario() {
    const atividadeSelecionada = document.querySelector('input[name="escolha"]:checked');
    const periodoSelecionado = document.querySelector('input[name="escolha2"]:checked');
    const cidade = document.getElementById('weather-search').value;

    if (!atividadeSelecionada || !periodoSelecionado || !cidade) {
        alert("Por favor, escolha uma atividade, o período e digite a cidade.");
        return null;
    }

    let diasParaAnalisar = 0;
    // Mapeamento dos 'value's do período para o número de dias que a API deve buscar.
    switch (periodoSelecionado.value) {
        case 'Primeira2': diasParaAnalisar = 2; break; 
        case 'Segunda2': diasParaAnalisar = 4; break; 
        case 'terceira2': diasParaAnalisar = 7; break; // 1 Semana
        case 'quarta2': diasParaAnalisar = 14; break; // 2 Semanas
    }

    return {
        atividadeKey: atividadeSelecionada.value, // Ex: 'Primeira'
        dias: diasParaAnalisar,
        cidade: cidade
    };
}


// ----------------------------------------------------
// 4. LÓGICA DE ANÁLISE (O CÉREBRO)
// ----------------------------------------------------

/**
 * Verifica se um dia da previsão climática é considerado "Ideal" para a regra da atividade.
 * @param {object} regra - Regras da atividade (temperatura min/max, chuva max, etc.)
 * @param {object} previsaoDoDia - Objeto de previsão da WeatherAPI para um dia.
 * @returns {boolean} True se o dia for ideal, False caso contrário.
 */
function analisarDiaIdeal(regra, previsaoDoDia) {
    const data = new Date(previsaoDoDia.date);
    const diaDaSemana = data.getDay(); // 0 (Dom) a 6 (Sáb)

    // A WeatherAPI usa 'avgtemp_c' para temperatura média diária e 'totalprecip_mm' para chuva.
    const tempMedia = previsaoDoDia.day.avgtemp_c; 
    const chuva = previsaoDoDia.day.totalprecip_mm;

    // 1. ANÁLISE DO DIA DA SEMANA
    const isDiaPreferencial = regra.dias_preferenciais.includes(diaDaSemana);

    // 2. ANÁLISE DO CLIMA
    const isClimaIdeal = (
        tempMedia >= regra.clima_ideal.temperatura_min &&
        tempMedia <= regra.clima_ideal.temperatura_max &&
        chuva <= regra.clima_ideal.chuva_max_mm
    );

    return isDiaPreferencial && isClimaIdeal;
}


// ATENÇÃO: Corrija o nome da sua variável de chave para API_KEY (CAIXA ALTA) no topo do arquivo!
// const API_KEY = '83a36ed654224857a28221157251410'; 

async function encontrarDiaIdeal() {
    console.log("1. Botão 'Ver Dia Ideal' Clicado."); 
    

    const escolhas = getEscolhasDoUsuario();
    
    if (!escolhas) {
        console.error("2. FALHA AO LER INPUTS.");
        alert("Por favor, preencha todos os campos: Cidade, Atividade e Período.");
        return;
    }
    
    console.log("2. Inputs Lidos com Sucesso:", escolhas); 
    
    const regraDaAtividade = regrasDeAtividade[escolhas.atividadeKey];
    
    if (!regraDaAtividade) {
        console.error("3. ERRO: Chave da Atividade '" + escolhas.atividadeKey + "' não existe no objeto de regras.");
        return;
    }

    console.log("3. Regra Encontrada. Iniciando busca na API...");
    
    // CHAMADA CRUCIAL: A falha deve estar aqui.
    const previsoes = await pesquisarPrevisao(escolhas.cidade, escolhas.dias);
    
    // 🛑 PONTO DE VERIFICAÇÃO FINAL: O que a API realmente retornou?
    console.log("4. Resultado da API (Previsões):", previsoes); 

    const resultadoDiv = document.getElementById('resultadoAnalise'); 

    if (previsoes && previsoes.length > 0) {
        // Se a API retornou dados com sucesso (Array de previsões)
        
        let melhorDia = null;

        // Itera sobre os dias
        for (const previsaoDoDia of previsoes) {
            if (analisarDiaIdeal(regraDaAtividade, previsaoDoDia)) {
                melhorDia = previsaoDoDia.date;
                break; 
            }
        }
        
        // Exibe o resultado da análise
        if (melhorDia) {
            const dataFormatada = new Date(melhorDia).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
            resultadoDiv.innerHTML = `<span style="color: #28a745;">&#128640; O Dia Ideal é:</span><br><strong>${dataFormatada}</strong>`;
        } else {
            resultadoDiv.innerHTML = `<span style="color: #dc3545;">&#128683; Nenhum Dia Ideal</span><br>encontrado nos próximos ${escolhas.dias} dias.`;
        }


    } else {
        // Se a API retornou null, undefined ou um array vazio (falha)
        resultadoDiv.innerHTML = `<span style="color: red;">&#10060; FALHA na conexão API.</span> Verifique o Console (F12) para erros.`;
    }
}


// ----------------------------------------------------
// 5. EVENT LISTENERS E INICIALIZAÇÃO
// ----------------------------------------------------

// Ligar o campo de busca de clima ao evento 'Enter'
document.getElementById('weather-search').addEventListener('keydown', prencherFormulario);

// Ligar o botão 'Ver o dia ideal' à função principal de análise
document.querySelector('.botao1').addEventListener('click', encontrarDiaIdeal);

// Função do Relógio (Sua função)
function atualizarRelogio() {
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    document.getElementById('relogio').textContent = `${horas}:${minutos}:${segundos}`;
}

// Inicia o relógio e atualiza a cada segundo
setInterval(atualizarRelogio, 1000); 
atualizarRelogio();

const resultadoDiv = document.getElementById('resultadoAnalise');