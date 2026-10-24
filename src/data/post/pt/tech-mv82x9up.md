---
title: "O PC liga mas não dá vídeo: A saga do pente de RAM oxidado e o infalível teste de bancada"
description: "Aprenda a diagnosticar e resolver o clássico problema de computador que liga mas não dá vídeo focando em oxidação de memória RAM e slots."
publishDate: 2026-10-14T17:15:00.000Z
image: "/images/tech-photo/tech-photo (9).jpg"
category: "Hardware"
tags: ["Manutenção", "Hardware", "Suporte TI", "Dicas de TI"]
theme: "Graphite Technical Paper"
---








Eram exatamente 8h45 de uma segunda-feira caótica quando o chefe do comercial brotou na minha baia com aquela cara de quem engoliu um parafuso. O relatório de fechamento de trimestre, que precisava ser apresentado para a diretoria às 10h, estava trancado na máquina principal dele. O sintoma? O gabinete ligava, os coolers berravam, o LED azul acendia bonitinho, mas o monitor continuava com aquela maldita mensagem flutuante de "Sem Sinal". Nada de BIOS, nada de POST, tela preta absoluta. <div style="border-left: 4px solid #475569; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px;">
<strong>Nota do Analista (Estilo Paper Técnico):</strong> O cenário de "cooler roda mas não dá vídeo" é o clássico indicativo de que o processador não conseguiu inicializar o firmware básico (UEFI/BIOS). Na maioria das vezes, o culpado não é a placa-mãe moribunda, mas sim um falso contato nos barramentos de memória. </div>

1. Mapeamento de Causas Raiz (Hipóteses e Diagnóstico)

Antes de sair trocando peça ou chorando no cantinho da copa, precisamos isolar o problema. Em ambientes de escritório com ar-condicionado oscilante e maresia (para quem é do litoral), os problemas de hardware costumam seguir um padrão bem previsível:

*   Oxidação nos Contatos (Greve dos Pinos): Camada microscópica de zinabre ou poeira acumulada nos contatos dourados do pente de RAM. O barramento de dados perde a continuidade e a placa-mãe paralisa o POST.
*   Microfissuras ou Sujeira no Slot DIMM: Acúmulo de detritos dentro do slot da placa-mãe ou empenamento leve causado pelo cooler stock apertado demais.
*   Desalinhamento por Dilatação Térmic

a: O ciclo de liga/desliga expande e contrai a placa-mãe, fazendo o pente "andar" milímetros para fora do encaixe perfeito.

![Hardware Diagnostic & Troubleshooting](https://picsum.photos/seed/hardware-876/1000/550)

2. Metodologia de Resolução Passo a Passo (O Guia Definitivo)

Esquece tentativa e erro aleatória. Vamos tratar isso como um procedimento cirúrgico de bancada. ### Passo 1: Desenergização Total (Segurança em Primeiro Lugar)
Desligue o cabo de força da tomada. Abra o gabinete e pressione o botão Power por 10 segundos com o PC fora da tomada para descarregar os capacitores da placa-mãe. Se você pular isso, pode fechar curto nos trilhos de 3.3V/5V da RAM.

### Passo 2: Remoção e Limpeza Cirúrgica da RAM

1. Puxe as travas laterais do slot e retire o(s) pente(s) de memória com cuidado.

2. Inspecione os contatos dourados. Se notar manchas escuras ou opacas, pegue uma borracha branca escolar (limpa e macia) e passe delicadamente no sentido dos pinos (nunca de um lado para o outro para não levantar as bordas do circuito).

3. Remova todos os resíduos de borracha com um pincel antiestático ou jatos de ar seco. Nunca use álcool comum, se precisar limpar resíduos de gordura dos dedos, use Álcool Isopropílico 99%.

### Passo 3: Teste de Isolamento de Slots (A Regra do "Um por Um")
Se o seu PC tem dois ou quatro pentes, não coloque todos de volta de uma vez. 
* Insira apenas um pente no slot primário (geralmente o DIMM_A2, o segundo mais distante do processador, conforme o manual da placa-mãe).
* Empurre com firmeza até ouvir o "clique" mecânico das travas laterais fechando sozinhas.

### Passo 4: Validação via Sistema e Diagnóstico de Software
Com o PC finalmente dando vídeo, entre no Windows e faça um pente-fino para garantir que a memória está sendo 100% reconhecida e sem setores defeituosos. 

Abra o Prompt de Comando (CMD) como Administrador e execute a ferramenta nativa de diagnóstico de memória do Windows:

```cmd
mdsched.exe
```

Escolha a opção para reiniciar imediatamente e verificar problemas na próxima inicialização. Além disso, abra o Gerenciador de Dispositivos (`devmgmt.msc`) e verifique se há algum erro de driver de chipset ou barramento que possa estar mascarando instabilidades de hardware.

<div style="border-left: 4px solid #475569; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px;">
<strong>Dica de Ouro do Suporte:</strong> Se o PC ainda persistir em não dar vídeo após limpar a RAM, remova a bateria CMOS (CR2032) da placa-mãe por 5 minutos para resetar a BIOS para o padrão de fábrica (Clear CMOS). Isso resolve conflitos de overclock automático ou perfis XMP corrompidos.
</div>

3. Precauções Críticas do Engenheiro de TI

*   Eletricidade Estática (ESD): Sempre toque na carcaça de metal da fonte (ainda ligada na tomada desligada, se o aterramento for confiável) antes de mexer nos componentes internos, ou use pulseira antiestática. Uma descarga de ESD invisível pode fritar o controlador de memória integrado à CPU.
*   Força Bruta Excessiv

a: Placas-mãe modernas flexionam bastante. Ao encaixar a RAM, apoie o dedo indicador por baixo do PCB da placa-mãe para contra-apoiar a pressão exercida ao encaixar o pente.

4. Perguntas Frequentes (FAQ)

P: Posso usar limpa-contatos em spray direto nos slots de RAM?

R: Apenas se for um limpa-contatos específicosem lubrificante(seco) e com evaporção instantânea. Se usar spray oleoso, ele vai atrair poeira e transformar o slot numa pasta condutora corrosiva. O ideal para os slots é usar ar comprimido ou um pincel de cerdas firmes.P: O cooler gira, acende os LEDs, mas o teclado e o mouse não piscam. O problema é certeza que é RAM?

R: É o suspeito número um. Quando o teclado e o mouse não inicializam (as luzes NumLock/Caps Lock não acendem ao apertar), significa que o teste POST travou antes de carregar os controladores USB, o que reforça uma falha de comunicação na inicialização da memória ou do processador.P: Se eu limpar a RAM e o PC funcionar por 2 dias e morrer de novo, o que pode ser?

R: Oxidação recorrente indica que o ambiente tem umidade excessiva (umidade relativa do ar acima de 70%). Vale a pena investir em sílica gel dentro do gabinete (longe de áreas quentes) ou verificar se há infiltrações/goteiras próximas à mesa do computador. Outra hipótese é o slot da placa-mãe estar com solda fria (trinca microscópica).
