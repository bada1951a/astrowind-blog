---
title: "Como Remover a Marca D'água do Windows 10 e 11 com Segurança via CMD"
description: "Guia prático de TI para remover a marca d'água de ativação do Windows pelo Prompt de Comando de forma segura e rápida."
publishDate: 2026-10-20T17:15:00.000Z
image: '/images/tech-photo/system%20(4).png'
category: 'tech'
tags: ["Windows", "CMD", "Suporte TI", "Dicas de Hardware"]
theme: "Deep Ocean Cobalt"
---










Eram exatamente 14h42 em um escritório na Avenida Paulista, em São Paulo. Faltavam dezoito minutos para a reunião mais crítica do semestre com a diretoria internacional. O notebook principal do gerente de operações estava projetado no telão da sala de reuniões e, bem no canto inferior direito da tela, brilhava aquela frase irritante: "Ativar o Windows - Vá para Configurações para ativar o Windows". O diretor executivo, conhecido por ser extremamente atento a detalhes visuais, olhou fixamente para a projeção e arqueou a sobrancelha. O clima na sala congelou. A licença corporativa estava em processo de renovação no setor de compras, mas o servidor KMS da matriz havia caído cinco minutos antes. Eu precisava sumir com aquela marca d'água imediatamente, sem reiniciar a máquina, sem instalar softwares suspeitos e sem correr o risco de corromper o registro do sistema na frente de todo mundo.

Nessas horas, o desespero faz o técnico tentar de tudo: baixar ativadores milagrosos da internet que só trazem vírus, reiniciar o processo do Explorador de Arquivos de forma desesperada ou fuçar em menus profundos das Configurações que não mudam nada. ![Tech Troubleshooting Guide](/images/tech-photo/ram%20(6).png)

Neste guia prático, vou te mostrar o procedimento exato, limpo e seguro utilizando o Prompt de Comando (CMD) para ocultar temporariamente a notificação e estabilizar o ambiente de trabalho quando você mais precisa. <div style="border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">
<strong>Aviso do Especialist

a:</strong> Este procedimento é voltado para situações emergenciais em ambientes corporativos onde a licença já foi adquirida, mas há um atraso na sincronização com o servidor de ativação da rede. Ele interrompe o processo de notificação visual do sistema operacional.
</div>

---

### Por que essa marca d'água aparece de repente?

Antes de executar qualquer comando, vale entender o cenário técnico por trás do problema para não culpar o hardware ou achar que o SSD pifou:

1. Perda de Comunicação com o Servidor KMS: Em redes corporativas, os PCs validam a licença periodicamente com um servidor interno. Se a VPN cair ou houver instabilidade no switch principal, o Windows perde o "contato" e entra em estado de carência.

2. Atualizações Cumulativas Recentes: O Windows Update frequentemente sobrescreve chaves de registro ou reinicia serviços de licenciamento (Software Protection Platform), fazendo com que a verificação de status reapareça na área de trabalho.

3. Expiração do Período de Graça (Grace Period): Quando uma instalação nova é feita e o script de automação de deployment falha em injetar a chave MAK/KMS no primeiro boot, o relógio interno começa a contar as horas até exibir o aviso.

---

### Passo a Passo: Removendo a Marca D'água via CMD

Vamos direto ao ponto crítico. Para realizar este procedimento sem erros, siga rigorosamente a sequência abaixo usando os caminhos nativos do sistema. ## Passo 1: Acessar o Prompt de Comando com privilégios elevados
Vá até a barra de pesquisa do Windows (ou pressione as teclas `Windows + S`), digite CMD. 
Não clique direto. Clique com o botão direito em cima do Prompt de Comandoe selecione "Executar como Administrador". 

*Dica de ouro:* Se você estiver em uma máquina corporativa com bloqueios restritos, certifique-se de que sua conta possui privilégios de Administrador local.

### Passo 2: Parar o Serviço de Proteção de Software
Na janela preta do CMD, digite o seguinte comando para interromper o serviço responsável por gerenciar as licenças do Windows e pressione Enter:

```cmd
net stop sppsvc
```
*Not

a:* Se o sistema informar que o serviço não está rodando ou pedir confirmação (pressione `S` ou `Y`), apenas prossiga. ## Passo 3: Modificar os Arquivos de Cópia de Teste (Token)
Agora vamos navegar até a pasta de proteção do sistema para resetar o gatilho visual. Copie e cole os comandos abaixo, um de cada vez, pressionando Enter após cada linh

a:

```cmd
cd %windir%\system32
cscript slmgr.vbs /rearm
```
Uma janela de diálogo do Windows Script Host aparecerá na tela informando que o comando foi concluído com êxito. Clique em OK.

### Passo 4: Reiniciar o Explorador de Arquivos (Explorer.exe)
Para fazer a marca d'água sumir instantaneamente da tela sem precisar reiniciar o computador inteiro (o que salvaria seus minutos preciosos antes da reunião), abra o Gerenciador de Tarefas (pressione `Ctrl + Shift + Esc`).

1. Na aba Processos, role a lista para baixo até encontrarExplorador de Windows (ou *Windows Explorer*).

2. Clique com o botão direito nele e selecione Reiniciar.

3. A barra de tarefas e a área de trabalho vão sumir por um segundo e retornar limpas. A marca d'água terá desaparecido.

---

### Precauções de Segurança e Boas Práticas de TI

<div style="border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">
<strong>Segurança em Primeiro Lugar:</strong> Nunca utilize ativadores piratas (como KMSAuto, scripts desconhecidos do GitHub ou arquivos executáveis `.exe`) em máquinas corporativas. Eles injetam payloads maliciosos, comprometem a integridade do Windows Defender e podem vazar credenciais da empresa para servidores externos.
</div>

* Verifique a Rede: Se a máquina for da empresa, reconecte o cabo de rede ou reinicie a VPN corporativa logo após a reunião para que o licenciamento oficial seja aplicado de forma definitiva. * Logs de Eventos:Se o problema persistir diariamente, verifique oVisualizador de Eventos do Windows na seção *Logs do Aplicativo* procurando por erros relacionados ao componente `Microsoft-Windows-Security-Licensing-Manager`.

---

### Perguntas Frequentes (FAQ)

1. Esse procedimento funciona no Windows 11 Pro e Home? Sim, os comandos baseados no `slmgr.vbs` e a manipulação do serviço `sppsvc` funcionam tanto no Windows 10 quanto no Windows 11. No entanto, edições Home possuem limitações quanto à conexão com servidores de volume KMS corporativo.

2. A marca d'água vai voltar depois que eu reiniciar o computador? Depende. Se o computador voltar a se comunicar com o servidor de licenças da empresa ou se a chave digital original for revalidada, ela continuará sumida. Caso contrário, após alguns dias ou após novas atualizações do sistema, o aviso poderá retornar, exigindo a inserção da chave definitiva de ativação nasConfigurações.

3. O comando `/rearm` afeta meus arquivos ou programas instalados?

De forma alguma. O comando `slmgr.vbs /rearm` apenas redefine o estado de licenciamento do sistema operacional e limpa o cache de notificações visuais. Seus arquivos pessoais, planilhas, softwares instalados e configurações de usuário permanecem absolutamente intactos.
