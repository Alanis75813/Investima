document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. TELAS DO JOGO
    // ========================================

    const telas = document.querySelectorAll(".tela");

    const telaInicial = document.getElementById("telaInicial");
    const telaSuspeitos = document.getElementById("telaSuspeitos");
    const telaInvestigacao = document.getElementById("telaInvestigacao");
    const telaDepoimentos = document.getElementById("telaDepoimentos");
    const telaAcusacao = document.getElementById("telaAcusacao");
    const telaResultado = document.getElementById("telaResultado");

    function mostrarTela(tela) {
        if (!tela) {
            console.error("Uma das telas não foi encontrada no HTML.");
            return;
        }

        telas.forEach((item) => {
            item.style.display = "none";
            item.classList.remove("animar-entrada");
        });

        tela.style.display = "block";

        // REINICIA A ANIMAÇÃO SEMPRE QUE A TELA É ABERTA
        void tela.offsetWidth;
        tela.classList.add("animar-entrada");

        // LEVA O JOGADOR AO INÍCIO DA NOVA TELA
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // ========================================
    // 2. BOTÕES
    // ========================================

    const btnJogar = document.getElementById("btnJogar");
    const btnColetarPistas = document.getElementById("btnColetarPistas");
    const btnVoltar = document.getElementById("btnVoltar");
    const btnDepoimentos = document.getElementById("btnDepoimentos");

    const btnVoltarInvestigacao =
        document.getElementById("btnVoltarInvestigacao");

    const btnAcusar = document.getElementById("btnAcusar");

    const btnVoltarDepoimentos =
        document.getElementById("btnVoltarDepoimentos");

    const btnJogarNovamente =
        document.getElementById("btnJogarNovamente");

    // ========================================
    // 3. ELEMENTOS DA INVESTIGAÇÃO
    // ========================================

    const nomeLocal = document.getElementById("nomeLocal");
    const textoLocal = document.getElementById("textoLocal");
    const contadorPistas = document.getElementById("contadorPistas");

    const evidencia = document.getElementById("evidencia");
    const nomeEvidencia = document.getElementById("nomeEvidencia");

    const descricaoEvidencia =
        document.getElementById("descricaoEvidencia");

    const mensagemPista = document.getElementById("mensagemPista");

    // ========================================
    // 4. ELEMENTOS DOS DEPOIMENTOS
    // ========================================

    const depoimentoAnna = document.getElementById("depoimentoAnna");
    const depoimentoDiego = document.getElementById("depoimentoDiego");
    const depoimentoLucia = document.getElementById("depoimentoLucia");

    // ========================================
    // 5. ELEMENTOS DO RESULTADO
    // ========================================

    const iconeResultado = document.getElementById("iconeResultado");
    const resultadoTitulo = document.getElementById("resultadoTitulo");
    const resultadoTexto = document.getElementById("resultadoTexto");
    const culpadoRevelado = document.getElementById("culpadoRevelado");
    const pontuacaoFinal = document.getElementById("pontuacaoFinal");
    const classificacaoFinal =
        document.getElementById("classificacaoFinal");
    const rankingFinal = document.getElementById("rankingFinal");

    // ========================================
    // 6. ELEMENTOS DA DEDUÇÃO
    // ========================================

    const hipoteseSuspeito =
        document.getElementById("hipoteseSuspeito");

    const anotacoesDeducao =
        document.getElementById("anotacoesDeducao");

    const btnSalvarDeducao =
        document.getElementById("btnSalvarDeducao");

    const mensagemDeducao =
        document.getElementById("mensagemDeducao");

    // ========================================
    // 7. VARIÁVEIS DO JOGO
    // ========================================

    let culpadoAtual = "";
    let localAtual = "";

    let pistasEncontradas = new Set();
    let jogoIniciado = false;

    let hipoteseAtual = "";
    let anotacoesAtuais = "";
    let pontosDeducao = 0;
    let resultadoRegistrado = false;

    const CHAVE_RANKING = "investimaRanking";
    const MODO_TESTE = false;

    const suspeitos = ["Anna", "Diego", "Lúcia"];

    // ========================================
    // 8. EFEITOS SONOROS
    // ========================================

    function tocarSom(tipo) {
        try {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) return;

            const contexto = new AudioContextClass();
            const agora = contexto.currentTime;

            const notas = {
                clique: [
                    { freq: 520, duracao: 0.045, atraso: 0 }
                ],

                pista: [
                    { freq: 520, duracao: 0.08, atraso: 0 },
                    { freq: 760, duracao: 0.12, atraso: 0.09 }
                ],

                certo: [
                    { freq: 523, duracao: 0.12, atraso: 0 },
                    { freq: 659, duracao: 0.12, atraso: 0.13 },
                    { freq: 784, duracao: 0.2, atraso: 0.26 }
                ],

                errado: [
                    { freq: 330, duracao: 0.16, atraso: 0 },
                    { freq: 247, duracao: 0.22, atraso: 0.17 }
                ]
            };

            (notas[tipo] || notas.clique).forEach((nota) => {
                const oscilador = contexto.createOscillator();
                const volume = contexto.createGain();

                const inicio = agora + nota.atraso;

                oscilador.type = "sine";
                oscilador.frequency.setValueAtTime(
                    nota.freq,
                    inicio
                );

                volume.gain.setValueAtTime(0.0001, inicio);

                volume.gain.exponentialRampToValueAtTime(
                    0.12,
                    inicio + 0.015
                );

                volume.gain.exponentialRampToValueAtTime(
                    0.0001,
                    inicio + nota.duracao
                );

                oscilador.connect(volume);
                volume.connect(contexto.destination);

                oscilador.start(inicio);
                oscilador.stop(inicio + nota.duracao + 0.02);
            });

            window.setTimeout(() => contexto.close(), 900);

        } catch (erro) {
            console.warn("Não foi possível reproduzir o som:", erro);
        }
    }

    // ========================================
    // 9. RANKING SALVO NO NAVEGADOR
    // ========================================

    function lerRanking() {
        try {
            const dados = JSON.parse(
                localStorage.getItem(CHAVE_RANKING) || "[]"
            );

            return Array.isArray(dados) ? dados : [];

        } catch (erro) {
            console.warn("O ranking salvo não pôde ser lido.", erro);
            return [];
        }
    }

    function salvarNoRanking(nome, pontos) {
        const ranking = lerRanking();

        ranking.push({
            nome: nome || "Detetive",
            pontos: pontos,
            data: new Date().toISOString()
        });

        ranking.sort((a, b) => b.pontos - a.pontos);
        ranking.splice(10);

        try {
            localStorage.setItem(
                CHAVE_RANKING,
                JSON.stringify(ranking)
            );

        } catch (erro) {
            console.warn("Não foi possível salvar o ranking.", erro);
        }

        mostrarRanking();
    }

    function mostrarRanking() {
        if (!rankingFinal) return;

        const ranking = lerRanking();

        rankingFinal.replaceChildren();

        if (ranking.length === 0) {
            rankingFinal.textContent =
                "Ainda não há pontuações salvas.";
            return;
        }

        const tituloRanking = document.createElement("strong");
        tituloRanking.textContent = "🏆 Ranking dos detetives";

        rankingFinal.appendChild(tituloRanking);

        const lista = document.createElement("ol");

        ranking.forEach((registro) => {
            const item = document.createElement("li");

            item.textContent =
                `${registro.nome} — ${registro.pontos} pontos`;

            lista.appendChild(item);
        });

        rankingFinal.appendChild(lista);
    }

    // ========================================
    // 10. PISTAS DOS SUSPEITOS
    // ========================================

    const pistasPorCulpado = {
        Anna: {
            sala: {
                nome: "Registro do cartão",
                descricao:
                    "O cartão identificado como pertencente a Anna foi usado próximo à Sala 404 às 14h12. Anna afirmou que foi diretamente para o laboratório."
            },

            laboratorio: {
                nome: "Atividade no computador",
                descricao:
                    "A sessão de Anna no computador começou às 14h20, oito minutos depois do registro próximo à Sala 404."
            },

            arquivos: {
                nome: "Documento rasgado",
                descricao:
                    "Um documento contém uma anotação feita às 14h12, horário que coincide com o acesso registrado no cartão de Anna."
            },

            tecnica: {
                nome: "Câmera de segurança",
                descricao:
                    "A gravação mostra Anna passando pelo corredor da sala técnica às 14h15, antes de sua sessão no laboratório."
            },

            corredor: {
                nome: "Pegadas no corredor",
                descricao:
                    "As pegadas seguem da área da Sala 404 em direção ao laboratório, compatíveis com o trajeto registrado naquele intervalo."
            }
        },

        Diego: {
            sala: {
                nome: "Registro do cartão",
                descricao:
                    "O cartão de Diego foi registrado próximo à Sala 404 em um horário que contradiz parte de seu depoimento."
            },

            laboratorio: {
                nome: "Atividade no computador",
                descricao:
                    "O computador do laboratório apresenta registros de atividade que ajudam a verificar o horário informado por Diego."
            },

            arquivos: {
                nome: "Documento rasgado",
                descricao:
                    "O documento encontrado nos arquivos apresenta informações que podem estar relacionadas ao depoimento de Diego."
            },

            tecnica: {
                nome: "Câmera de segurança",
                descricao:
                    "A gravação da sala técnica registra uma movimentação que precisa ser comparada com o horário informado por Diego."
            },

            corredor: {
                nome: "Pegadas no corredor",
                descricao:
                    "As pegadas encontradas no corredor ajudam a reconstruir o caminho percorrido durante o desaparecimento do objeto."
            }
        },

        "Lúcia": {
            sala: {
                nome: "Registro do cartão",
                descricao:
                    "O cartão de Lúcia aparece no registro de acesso da área da Sala 404. O horário deve ser comparado com seu depoimento."
            },

            laboratorio: {
                nome: "Atividade no computador",
                descricao:
                    "Os registros do computador ajudam a conferir se Lúcia estava no laboratório no horário que informou."
            },

            arquivos: {
                nome: "Documento rasgado",
                descricao:
                    "O documento encontrado nos arquivos contém uma informação que pode ser relacionada ao depoimento de Lúcia."
            },

            tecnica: {
                nome: "Câmera de segurança",
                descricao:
                    "A câmera registra uma movimentação na área técnica que pode ajudar a confirmar ou contradizer o relato de Lúcia."
            },

            corredor: {
                nome: "Pegadas no corredor",
                descricao:
                    "As pegadas no corredor ajudam a identificar o trajeto feito durante o período em que o objeto desapareceu."
            }
        }
    };

        // ========================================
    // 11. DEPOIMENTOS
    // ========================================

    const depoimentos = {
        Anna: {
            normal:
                "Saí da reunião por volta das 14h05 e fui para o laboratório. Comecei a trabalhar no computador às 14h20. Não voltei à Sala 404.",

            contradicao:
                "Anna afirmou que foi diretamente ao laboratório e não voltou à Sala 404. Compare essa versão com os horários do cartão de acesso e da atividade no computador.",

            alibi:
                "Anna afirma que estava no laboratório durante o período do desaparecimento. O registro da sessão no computador pode ajudar a verificar sua versão."
        },

        Diego: {
            normal:
                "Depois da reunião, fui organizar documentos nos arquivos. Não entrei na Sala 404 e não precisei usar a sala técnica.",

            contradicao:
                "Diego negou ter entrado na sala técnica. Compare essa afirmação com a gravação da câmera e com o trajeto indicado pelas pegadas.",

            alibi:
                "Diego afirma que permaneceu organizando documentos nos arquivos. Os registros de acesso e os horários das evidências podem confirmar ou contradizer essa versão."
        },

        "Lúcia": {
            normal:
                "Fiquei alguns minutos na sala de reunião depois que todos saíram. Em seguida, fui conversar com a equipe. Não peguei nenhum objeto.",

            contradicao:
                "Lúcia afirmou que foi conversar com a equipe depois da reunião. Compare sua declaração com os registros de acesso e com as pegadas encontradas no corredor.",

            alibi:
                "Lúcia afirma que estava conversando com a equipe. Seria necessário confirmar o horário e verificar se seu trajeto corresponde às evidências."
        }
    };

    // ========================================
    // 12. INICIAR O JOGO
    // ========================================

    function iniciarJogo() {
        if (jogoIniciado) {
            contadorPistas.textContent =
                `Pistas encontradas: ${pistasEncontradas.size}/5`;

            mostrarTela(telaSuspeitos);
            return;
        }

        culpadoAtual =
            suspeitos[Math.floor(Math.random() * suspeitos.length)];

        jogoIniciado = true;
        resultadoRegistrado = false;
        localAtual = "";

        pistasEncontradas.clear();

        hipoteseAtual = "";
        anotacoesAtuais = "";
        pontosDeducao = 0;

        if (hipoteseSuspeito) {
            hipoteseSuspeito.value = "";
        }

        if (anotacoesDeducao) {
            anotacoesDeducao.value = "";
        }

        if (mensagemDeducao) {
            mensagemDeducao.textContent = "";
            mensagemDeducao.classList.remove("deducao-salva");
        }

        contadorPistas.textContent = "Pistas encontradas: 0/5";

        evidencia.style.display = "none";
        mensagemPista.textContent = "";

        if (MODO_TESTE) {
            console.log("Culpado atual:", culpadoAtual);
        }

        mostrarTela(telaSuspeitos);
    }

    // ========================================
    // 13. COMEÇAR UM NOVO JOGO
    // ========================================

    function novoJogo() {
        jogoIniciado = false;
        culpadoAtual = "";
        localAtual = "";

        pistasEncontradas.clear();

        hipoteseAtual = "";
        anotacoesAtuais = "";
        pontosDeducao = 0;
        resultadoRegistrado = false;

        iniciarJogo();
    }

    // ========================================
    // 14. SELECIONAR UM LOCAL
    // ========================================

    document.querySelectorAll(".btnLocais").forEach((botao) => {
        botao.addEventListener("click", () => {
            localAtual = botao.dataset.local;
            abrirLocal(localAtual);
        });
    });

    // ========================================
    // 15. ABRIR UM LOCAL
    // ========================================

    function abrirLocal(local) {
        const nomesLocais = {
            sala: "Sala de Reunião",
            laboratorio: "Laboratório de Informática",
            arquivos: "Arquivos",
            tecnica: "Sala Técnica",
            corredor: "Corredor"
        };

        const descricoesLocais = {
            sala:
                "O local onde a reunião aconteceu e onde o objeto foi visto pela última vez.",

            laboratorio:
                "Computadores e registros podem revelar quem acessou o sistema.",

            arquivos:
                "Documentos importantes estão guardados neste local.",

            tecnica:
                "A sala possui equipamentos e câmeras de segurança.",

            corredor:
                "O corredor conecta os principais locais da investigação."
        };

        nomeLocal.textContent = nomesLocais[local];
        textoLocal.textContent = descricoesLocais[local];

        evidencia.style.display = "none";
        mensagemPista.textContent = "";

        mostrarTela(telaInvestigacao);
    }

    // ========================================
    // 16. COLETAR PISTAS
    // ========================================

    btnColetarPistas.addEventListener("click", () => {
        if (!localAtual) {
            mensagemPista.textContent =
                "Escolha um local antes de coletar uma pista.";
            return;
        }

        if (pistasEncontradas.has(localAtual)) {
            tocarSom("pista");
            mensagemPista.textContent =
                "Você já investigou este local.";
            return;
        }

        const pista =
            pistasPorCulpado[culpadoAtual][localAtual];

        pistasEncontradas.add(localAtual);

        nomeEvidencia.textContent = pista.nome;
        descricaoEvidencia.textContent = pista.descricao;

        evidencia.style.display = "block";

        contadorPistas.textContent =
            `Pistas encontradas: ${pistasEncontradas.size}/5`;

        mensagemPista.textContent =
            `🔎 Nova evidência em ${nomeLocal.textContent}! ` +
            "Analise o que ela revela e compare com os depoimentos.";

        tocarSom("pista");

        if (pistasEncontradas.size === 5) {
            mensagemPista.textContent =
                "🏆 Você encontrou todas as cinco evidências! " +
                "Agora compare os depoimentos e registre sua dedução.";
        }
    });

    // ========================================
    // 17. ABRIR OS DEPOIMENTOS
    // ========================================

    btnDepoimentos.addEventListener("click", () => {
        if (pistasEncontradas.size < 5) {
            alert(
                "Você precisa investigar os cinco locais primeiro."
            );

            mostrarTela(telaSuspeitos);
            return;
        }

        mostrarDepoimentos();
    });

    // ========================================
    // 18. MOSTRAR OS DEPOIMENTOS
    // ========================================

    function mostrarDepoimentos() {
        depoimentoAnna.textContent =
            `Anna: ${depoimentos.Anna.normal}`;

        depoimentoDiego.textContent =
            `Diego: ${depoimentos.Diego.normal}`;

        depoimentoLucia.textContent =
            `Lúcia: ${depoimentos["Lúcia"].normal}`;

        mostrarTela(telaDepoimentos);
    }
    // ========================================
    // 19. MOSTRAR CONTRADIÇÕES
    // ========================================

    function mostrarContradicao(suspeito) {
        const dados = depoimentos[suspeito];

        if (!dados) return;

        const mensagem = `
${suspeito}

Depoimento:
${dados.normal}

Álibi:
${dados.alibi}

Possível contradição:
${dados.contradicao}
        `;

        alert(mensagem);
    }

    // ========================================
    // 20. CLICAR NOS DEPOIMENTOS
    // ========================================

    depoimentoAnna.addEventListener("click", () => {
        mostrarContradicao("Anna");
    });

    depoimentoDiego.addEventListener("click", () => {
        mostrarContradicao("Diego");
    });

    depoimentoLucia.addEventListener("click", () => {
        mostrarContradicao("Lúcia");
    });

    // ========================================
    // 21. SALVAR A DEDUÇÃO
    // ========================================

    if (btnSalvarDeducao) {
        btnSalvarDeducao.addEventListener("click", () => {
            const suspeito = hipoteseSuspeito.value;
            const anotacoes = anotacoesDeducao.value.trim();

            if (!suspeito) {
                mensagemDeducao.textContent =
                    "⚠️ Selecione um suspeito antes de registrar sua hipótese.";

                mensagemDeducao.classList.remove("deducao-salva");
                return;
            }

            if (!anotacoes) {
                mensagemDeducao.textContent =
                    "⚠️ Escreva uma observação explicando o que chamou sua atenção.";

                mensagemDeducao.classList.remove("deducao-salva");
                return;
            }

            hipoteseAtual = suspeito;
            anotacoesAtuais = anotacoes;

            let pontos = 0;
            const texto = anotacoes.toLowerCase();

            const palavrasInvestigacao = [
                "pista",
                "evidência",
                "evidencia",
                "cartão",
                "cartao",
                "câmera",
                "camera",
                "pegada",
                "horário",
                "horario",
                "depoimento",
                "contradição",
                "contradicao",
                "registro",
                "sala",
                "laboratório",
                "laboratorio",
                "arquivos",
                "técnica",
                "tecnica",
                "corredor"
            ];

            palavrasInvestigacao.forEach((palavra) => {
                if (texto.includes(palavra)) {
                    pontos += 5;
                }
            });

            pontosDeducao = Math.min(pontos, 20);

            mensagemDeducao.textContent =
                `✅ Hipótese registrada: ${suspeito}. ` +
                `Sua análise recebeu ${pontosDeducao}/20 pontos. ` +
                "Agora compare sua hipótese com os depoimentos antes de acusar.";

            mensagemDeducao.classList.add("deducao-salva");

            console.log("Hipótese:", hipoteseAtual);
            console.log("Anotações:", anotacoesAtuais);
            console.log("Pontos da dedução:", pontosDeducao);
        });
    }

    // ========================================
    // 22. VERIFICAR A ACUSAÇÃO
    // ========================================

    function verificarAcusacao(suspeitoEscolhido) {
        let pontuacao = 0;

        if (pistasEncontradas.size === 5) {
            pontuacao += 20;
        }

        pontuacao += pontosDeducao;

        const acertou = suspeitoEscolhido === culpadoAtual;

        if (acertou) {
            pontuacao += 100;

            if (hipoteseAtual === culpadoAtual) {
                pontuacao += 10;
            }

            iconeResultado.textContent = "🏆";
            resultadoTitulo.textContent = "Caso resolvido!";
            resultadoTexto.textContent =
                "Parabéns! Você identificou o verdadeiro culpado.";

            telaResultado.classList.add("resultado-certo");
            telaResultado.classList.remove("resultado-errado");

            tocarSom("certo");

        } else {
            iconeResultado.textContent = "🔎";
            resultadoTitulo.textContent = "Caso não resolvido!";
            resultadoTexto.textContent =
                "Sua acusação estava incorreta. Analise as pistas novamente.";

            telaResultado.classList.add("resultado-errado");
            telaResultado.classList.remove("resultado-certo");

            tocarSom("errado");
        }

        culpadoRevelado.textContent =
            "O verdadeiro culpado era: " + culpadoAtual;

        pontuacaoFinal.textContent = pontuacao + " pontos";

        if (pontuacao >= 120) {
            classificacaoFinal.textContent =
                "🏆 Mestre da Dedução!";

        } else if (pontuacao >= 90) {
            classificacaoFinal.textContent =
                "🥇 Detetive Experiente!";

        } else if (pontuacao >= 50) {
            classificacaoFinal.textContent =
                "🔍 Detetive em Treinamento!";

        } else {
            classificacaoFinal.textContent =
                "🕵️ Investigador Iniciante!";
        }

        // Salva o resultado apenas uma vez por partida.
        if (!resultadoRegistrado) {
            resultadoRegistrado = true;

            let nomeJogador = "Detetive";

            const nomeInformado = window.prompt(
                "Digite seu nome para aparecer no ranking:"
            );

            if (nomeInformado && nomeInformado.trim()) {
                nomeJogador = nomeInformado.trim().slice(0, 30);
            }

            salvarNoRanking(nomeJogador, pontuacao);
        }

        telaResultado.classList.remove("animar-resultado");

        setTimeout(() => {
            telaResultado.classList.add("animar-resultado");
        }, 10);

        mostrarTela(telaResultado);
    }

    // ========================================
    // 23. BOTÕES DE ACUSAÇÃO
    // ========================================

    document.querySelectorAll(".btn-acusar").forEach((botao) => {
        botao.addEventListener("click", () => {
            const suspeitoEscolhido = botao.dataset.suspeito;
            verificarAcusacao(suspeitoEscolhido);
        });
    });

    // ========================================
    // 24. NAVEGAÇÃO ENTRE AS TELAS
    // ========================================

    btnJogar.addEventListener("click", (event) => {
        event.preventDefault();
        iniciarJogo();
    });

    btnVoltar.addEventListener("click", (event) => {
        event.preventDefault();
        mostrarTela(telaSuspeitos);
    });

    btnVoltarInvestigacao.addEventListener("click", (event) => {
        event.preventDefault();
        mostrarTela(telaInvestigacao);
    });

    btnAcusar.addEventListener("click", (event) => {
        event.preventDefault();

        if (pistasEncontradas.size < 5) {
            alert(
                "Investigue os cinco locais antes de fazer a acusação."
            );

            mostrarTela(telaSuspeitos);
            return;
        }

        mostrarTela(telaAcusacao);
    });

    btnVoltarDepoimentos.addEventListener("click", (event) => {
        event.preventDefault();
        mostrarTela(telaDepoimentos);
    });

    btnJogarNovamente.addEventListener("click", (event) => {
        event.preventDefault();
        novoJogo();
    });

    // ========================================
    // 25. SONS DOS BOTÕES
    // ========================================

    document.querySelectorAll("button").forEach((botao) => {
        botao.addEventListener("click", () => {
            if (!botao.classList.contains("btn-acusar")) {
                tocarSom("clique");
            }
        });
    });

    // ========================================
    // 26. INICIALIZAÇÃO
    // ===============
    // =========================

    mostrarRanking();
    mostrarTela(telaInicial);

});