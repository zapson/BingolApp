var app = {
    
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.main();
    },

    // main function
    main: function () {

        /**
         * Define a altura máxima da página por meio do body e html
         * @type {[type]}
         */
        var body    = document.body,
        html        = document.documentElement;
        var altura  = Math.max( body.scrollHeight, body.offsetHeight, 
                           html.clientHeight, html.scrollHeight, html.offsetHeight );
        
        /**
         * Armazena os números que seram lançados
         * ou que lançaram não lembro mais
         * @type {Array}
         */
        chubs = [];

        /**
         * Acho que armazena os números que saíram
         * @type {Array}
         */
        var numeros = [];
        var igual = false;
        var n;
        var stop = false;

        /**
         * Váriavel de controle para verificar se está movendo
         * o modal ou não
         * @type {Boolean}
         */
        var moving = false;

        // vai criar uma nova instancia no localstorage toda vez
        //  que entrar na pagina para armazenar o jogo :D
        var d = new Date();
        entry = d.toJSON();

        // Armazena a posição do mouse
        currentMousePos = { x: -1, y: -1 };

        /**
         * Armazena a posição inicial do touch
         */
        var startTouch = 0;

        $(document).on('touchmove', function(e) {
            currentMousePos.x = e.pageX;
            currentMousePos.y = e.pageY;

            if(moving) {

                // caso esteja movendo reduzir o tamanho do modal
                // agora que a putaria vai começar...
                var height = $('.modal-dialog').height();

                // Caso a altura atual do modal seja maior que
                // a metade da inicial do modal reduz o tamanho
                // caso contrário da um close
                if((altura / 6) < height) {
                    if(startTouch < e.originalEvent.touches[0].clientY) {
                        var diferencaMove = e.originalEvent.touches[0].clientY - startTouch;
                        diferencaMove -= diferencaMove * 0.9;
                        $('#bingolModal').css('height', height - diferencaMove + 'px');
                        var marginAntiga = $('#bingolModal').css('margin-top');
                        marginAntiga = parseFloat(marginAntiga.replace('px', ''));
                        $('#bingolModal').css('margin-top', (marginAntiga + diferencaMove) + 'px');
                        // $('#bingolModal').css('margin-top', (height + diferencaMove) + 'px');
                    }
                } else {

                    // Reseta o heigth ao fechar o modal
                    $('#bingolModal').modal('hide');
                }
            }
        }).mouseup(function (e) {
            moving = false;
        });

        /** Indica se é já há um jogo ocorrendo para iniciar um novo */
        var jogoIniciado = false;

        $(function () {

            /**
             * Duplo clique no número para rodar a bolinha
             */
            var tapped=false;
            $(".bingol-numero").on("touchstart", function(e){
                if(!tapped){ //if tap is not set, set up single tap
                  tapped=setTimeout(function(){
                      tapped=null
                      //insert things you want to do when single tapped
                  },300);   //wait 300ms then run single click code
                } else {    //tapped within 300ms of last tap. double tap
                  clearTimeout(tapped); //stop single tap callback
                  tapped=null
                  // console.log('teste');
                  //insert things you want to do when double tapped
                  jogoIniciado = true;
                  tirarBolinha();

                  // Muda os botões
                  var button1 = '<a href="#bingolModal" role="button" data-toggle="modal" class="button"> Continuar </a>';
                  var button2 = '<a id="iniciarNovoJogo" href="#bingolModal" role="button" data-toggle="modal" class="button"> Novo </a>';
                  $('.buttons').html(button1 + button2);

                  // Evento de clique de novo jogo
                  $('#iniciarNovoJogo').click(function () {
                      iniciarNovoJogo();
                  })
                }
                e.preventDefault()
            });

            // $(document).keypress(function (e) {
            //     if(e.charCode === 32){
            //         tirarBolinha();
            //     }
            // });

            // Preenche do 1 ao 75
            for (var i = 1; i <= 75; i++) {
                numeros.push(i);
            }

            $('#btnBingo').click(function () {
                checaCaracter();
            })

            $('.btn-validar').click(function () {
                validarCampos();
            })

            intervalo = null;

            // Versão 2 genial...
            // ou quase genial...
            $(".btnHideContainer").on('touchmove', function(e) {
                
                // Caso seja um movimento inicial
                // armazena a primeira posição porra
                if(!moving) {

                    // Armazena o y de quando começa o movimento
                    startTouch = e.originalEvent.touches[0].clientY;
                }

                moving = true;
                inicial = $('#bingolModal').height();
            }).on('touchend', function (e) {
                moving = false;

                // Restaura o modal caso pare de mover
                $('#bingolModal').css('height', '');
                $('#bingolModal').css('margin-top', '');
            })

            /** Tela dos números já lançados */
            $('.btnCimaContainer').click(function () {
                $('.modal-numero').find('.align-items-center').removeClass('align-items-center');
                $('.btnHideContainer').html('<div class="d-flex p-2 justify-content-center"><a class="btnBaixoContainer align-self-center"><img src="img/btnBaixo.png"></a></div>');
                $('.btnHideContainer').append('<div class="d-flex p-2 numeros-lancados flex-wrap"></div>');

                $(chubs).each(function (index, value) {
                    $('.numeros-lancados').append('<a class="button-numero-lancado" style="margin: 10px 10px 10px 10px; width: 33px;">' + value + '</a>');
                });

                $('.bingol-numero').hide();
                $('.bingol-footer').hide();

                $('.btnBaixoContainer').click(function () {
                    $('.bingol-footer').show();
                    $('.btnHideContainer').html('<span class="btnHide" draggable="false"></span>');
                    $('.bingol-numero').show();
                    $('.btnHideContainer').parent().addClass('align-items-center');
                })
            })

            $('.btnBaixoContainer').click(function () {
                $('.bingol-footer').show();
            })
        });

        /** Função para retirar um numero */
        function tirarBolinha(){
            // console.log('tirando a bolinha')
            if(!stop) {
                if(numeros.length === 0){
                    stop = true;
                    return true;
                }
         
                n = gerarNumero(numeros);

                // Printa o numero que saiu na tela
                $('.bingol-numero').html(n);
                chubs.push(n);
                localStorage.setItem(entry, JSON.stringify(chubs));
                // atualizaNumeros(n);

                $.fn.disableSelection = function() {
                    return this
                             .attr('unselectable', 'on')
                             .css('user-select', 'none')
                             .on('selectstart', false);
                };
            }
        }

        /**
        *   Retorna um valor do array de numeros
        *   e remove esse valor retornando o numero tirado
        */
        function gerarNumero(numeros){
            var indexRandom = Math.floor(Math.random() * numeros.length);
            var numero      = numeros[indexRandom];

            // Diz o JS que isso já vai alterar a variavel
            numeros.splice(indexRandom, 1);

            return numero;
        }

        /** Evento de iniciar novo jogo */
        function iniciarNovoJogo() {

            // Reseta os números
            numeros = []; 
            
            // Preenche do 1 ao 75
            for (var i = 1; i <= 75; i++) {
                numeros.push(i);
            }

            // Reseta os números já lançados
            chubs = [];

            // Reseta os números lançados
            $('.numeros-lancados').html('');

            // Reseta o texto
            $('.bingol-numero').html('<span style="font-size: 20pt;">Clique duplo para iniciar</span>');
        }

        /**
         * Verifica se na cartela do bingo já atingiu o máximo de caracteres e
         * pula para o próximo!
         */
        // function checaCaracter() {
            
        //     var cells = $('.bingol-cell').keydown(function (e) {
        //         // console.log(window.getSelection);
        //         // Caso seja diferente de teclas de apagar ou TAB
        //         if(e.keyCode !== 8 && e.keyCode !== 46 && e.keyCode !== 9){
        //             if($(this).val().length == 2) {
        //                 var nextCell = cells.get(cells.index(this) + 1);
        //                 if(nextCell){
        //                     nextCell.focus();
        //                 } else {
        //                     nextCell = cells.get(cells.index(this) + 2);
        //                     if(nextCell){
        //                         nextCell.focus();
        //                     }
        //                 }
        //             }
        //         }
        //     })
        // }

        /**
         * Valida se todos os numeros lançados correspondem
         * a cartela indicada nos campos
         */
        // function validarCampos() {
        //     $('.bingol-cells').find('input').removeClass('bingol-success');
        //     $('.bingol-cells').find('input').removeClass('bingol-error');
        //     /**
        //      * Armazena os números marcados da cartela
        //      * já preenchida
        //      * @type {Array}
        //      */
        //     var campos = [];

        //     /**
        //      * Variável de controle quando um número 
        //      * está errado
        //      */
        //     var erro = { 
        //                 i:null,
        //                 valor:null 
        //                 };

        //     /**
        //      * Array para conter todos os erros
        //      */
        //     var erros = [];

        //     /**
        //      * Variável de controle para pular a iteração
        //      */
        //     var skip = false;

        //     /**
        //      * Variável de controle para pular todas as iterações
        //      */
        //     var skipAll = false;

        //     var verdadeiro = false;

        //     /**
        //      * Percorre todas os campos da cartela
        //      * armazenando no vetor campos
        //      * @param  {int} index   da célula
        //      */
        //     $('.bingol-cell').each(function (index, celula) {
        //         campos.push($(celula));
        //     });

        //     $(campos).each(function (indexCampo, campo) {
        //         verdadeiro = false;
        //         $(chubs).each(function (indexChubs, chub) {

        //             // Verifica se é igual a algum elemento
        //             // presente em chubs e se o campo n eh verdade
        //             if(verdadeiro == false){
        //                 if($(campo).val() == chub){

        //                     // Diz que o campo é verdadeiro
        //                     verdadeiro = true;
        //                 } else {
        //                     if(indexChubs == chubs.length - 1){
        //                             erros.push({i:indexCampo, valor:$(campo).val()});
        //                     }
        //                 }
        //             }
        //         })
        //     })

        //     if(erros.length !==  0) {
        //         $('.bingol-cells').find('input').addClass('bingol-success');

        //         $(erros).each(function (index, erro) {
        //             $('.bingol-cells').find('#'+erro.i).removeClass('bingol-success');
        //             $('.bingol-cells').find('#'+erro.i).addClass('bingol-error');
        //         });
        //     } else {
        //         stop = false;
        //         var audio = new Audio('assets/audio/tetra.mp3');
        //         $('.bingol-cells').find('input').addClass('bingol-success');
        //         $('#modalGanhou').modal('show');

        //         $('#modalGanhou').on('hidden.bs.modal', function (e) {
        //             stop = true;
        //         });

        //         $('#modalGanhou').on('shown.bs.modal', function (e) {
        //             audio.play();
        //             fade();
        //         });

        //         function fade() {
        //             if(!stop){
        //                 $('#modalGanhou').fadeTo(600, 0.1, function () {
        //                     if(!stop){
        //                         $('#modalGanhou').fadeTo(600, 1.0 , fade($('#modalGanhou')));
        //                     }
        //                 });
        //             }
        //         }
        //     }
        // }

        /**
         * Função para mostrar os numeros que já sairam
         * na tela de jogar
         * @param  Array numeros que já foram
         */
        // function atualizaNumeros(numeros) {
        //     $(numeros).each(function (index, value) {
        //         $('#numerosForam').append('<span class="btn btn-success numerinho">' + value + '</span>')
        //     });
        // }
    }
}

// Inicia a aplicação
app.initialize();