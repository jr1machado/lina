# Gravação de Sessões

A Hash Access grava sessões **seletivamente**, não tudo-ou-nada. A decisão é
sempre calculada no backend, no momento em que o token de conexão é emitido
— nem o operador nem o gateway (KoKo/Lion) escolhem se uma sessão grava.

## Quando uma sessão é gravada

Uma sessão grava quando **qualquer uma** destas condições é verdadeira:

1. A **conta** usada na conexão está marcada como **Privilegiada**
   (`Account.privileged`).
2. O **ativo** de destino está marcado como **Crítico** (`Asset.is_critical`).
3. O método de conexão é **browser-vnc** (acesso via navegador a appliances
   web como Fortinet, Check Point, VMware, Palo Alto) — essas sessões
   **sempre** gravam, sem depender de tag nenhuma, porque acesso
   administrativo a um appliance de segurança é inerentemente equivalente a
   acesso privilegiado.

Se nenhuma das três for verdadeira, a sessão **não** grava — isso é
intencional: gravar tudo indiscriminadamente gera custo de armazenamento e
ruído de revisão sem aumentar a segurança real.

## Como marcar uma conta como privilegiada

Na tela de edição da conta, marque o campo **Privilegiada**. Isso também
afeta outros comportamentos da plataforma (KRIs de risco, elegibilidade de
rotação automática).

## Como marcar um ativo como crítico

Diferente da conta, **marcar um ativo como crítico exige um ticket
aprovado** — não é um checkbox livre. Isso existe para que a decisão "este
ativo é crítico o suficiente pra gravar tudo" não seja tomada
unilateralmente por quem está configurando o ativo no dia a dia.

1. Abra o ativo e solicite a mudança de criticidade.
2. Um aprovador (definido no fluxo de aprovação de tickets) precisa aceitar.
3. Depois de aprovado, toda sessão nova contra esse ativo passa a gravar,
   independente da conta usada.

## Onde ficam as gravações e como reproduzir

- Sessões SSH/Telnet (KoKo) gravam em formato **asciicast** (texto puro,
  leve, reproduzido como um terminal).
- Sessões RDP/VNC (Lion, incluindo browser-vnc) gravam como um **stream de
  instruções Guacamole**, reproduzido pelo player nativo — não é um vídeo
  codificado (sem FFmpeg), então não há controle de bitrate/fps configurável
  hoje.
- A reprodução acontece na própria tela de **Sessões** (aba Terminal), pelo
  botão de replay de cada sessão gravada.

## Marca d'água (watermark)

Toda sessão gravada (e toda revelação excepcional de segredo) pode exibir
uma marca d'água discreta sobre a tela, com usuário, tenant/organização e
horário — dificulta o reaproveitamento de um print/vídeo capturado sem
atribuição.

- Configuração global: **Configurações → Segurança → Marca d'água**
  (`SECURITY_WATERMARK_ENABLED`).
- **Override por ativo**: um ativo específico pode forçar a marca d'água
  ligada ou desligada, independente da configuração global — útil para um
  ativo de teste que nunca deve mostrar marca d'água, ou o oposto. Esse
  campo só pode ser alterado por um **Org Admin**.

## Clipboard e transferência de arquivo

Controlado **por concessão de acesso** (Regra de Acesso / AssetPermission),
não por um toggle global — cada concessão define independentemente:

| Ação | Efeito |
|---|---|
| **Copy** | Permite copiar da sessão remota para a área de transferência local (RDP/VNC). |
| **Paste** | Permite colar da área de transferência local para a sessão remota (RDP/VNC). |
| **Upload** | Permite enviar arquivo para o ativo (RDP/SFTP). |
| **Download** | Permite baixar arquivo do ativo (RDP/SFTP). |
| **Delete** | Permite apagar arquivo via SFTP. |

Essas restrições são aplicadas **no protocolo** pelos gateways (Guacamole
para RDP/VNC, SFTP nativo para SSH) — não é um filtro só de interface, o
próprio protocolo recusa a operação quando desligada.

## Boas práticas

- Marque como **Privilegiada** toda conta que tenha acesso administrativo
  real (root, Administrator, contas de serviço com privilégio elevado).
- Reserve o status de **Crítico** para ativos cuja sessão precisa ser
  auditável mesmo com conta não-privilegiada (ex.: um servidor de produção
  onde qualquer acesso interessa, independente de qual conta).
- Desligue **Copy/Paste/Upload/Download** por padrão em concessões de
  acesso a ativos críticos, e libere pontualmente quando houver necessidade
  operacional real.
- Use a marca d'água em qualquer ambiente sujeito a auditoria/compliance —
  o custo de exibição é mínimo e a atribuição em caso de vazamento de
  print/vídeo é real.
