# SpaceManagementSim
 
Simulador de central de monitoramento de missões espaciais desenvolvido com React Native e Expo. O projeto foi criado como trabalho acadêmico com o objetivo de demonstrar na prática o uso das principais tecnologias do ecossistema Expo: roteamento com Expo Router, gerenciamento de estado com Context API, persistência de dados com AsyncStorage, formulários com validação de campos e navegação entre telas.
 
O tema escolhido é a missão fictícia ARES-VII, uma missão tripulada a Marte. O aplicativo exibe dados de telemetria, comunicação, saúde dos sistemas e monitoramento orbital em tempo real, com animações e atualizações automáticas a cada segundo.
 
---
 
## Tecnologias utilizadas
 
- React Native 0.79 com TypeScript
- Expo SDK 56
- Expo Router 4 (roteamento baseado em arquivos)
- React Context API (gerenciamento de estado global)
- AsyncStorage (persistência local de dados)
- React Native SVG (gráficos e animações vetoriais)
- Expo Font (fontes customizadas: Orbitron e Share Tech Mono)
- Expo Splash Screen
---
 
 
## Funcionalidades implementadas
 
### Dashboard principal
Tela central com cinco painéis de monitoramento: missão geral, telemetria, comunicação, saúde dos sistemas e estabilidade orbital. Cada painel exibe dados atualizados em tempo real e redireciona para a tela de detalhes correspondente ao ser tocado. O contador MET (Mission Elapsed Time) e o relógio UTC atualizam a cada segundo. Alertas críticos abrem automaticamente um modal ao entrar no aplicativo.
 
### Navegacao entre telas com Expo Router
O roteamento utiliza o sistema de arquivos do Expo Router. Cada arquivo dentro da pasta `app/` corresponde a uma rota. A navegacao e feita com `router.push()` para avancar e `router.back()` para retornar ao dashboard. A animacao de transicao entre telas e do tipo `fade`, definida nas opcoes globais do Stack no `_layout.tsx`.
 
### Gerenciamento de estado com Context API
O `MissionContext` centraliza todos os dados da missao e os disponibiliza para qualquer tela atraves do hook `useMission()`. O provider envolve toda a aplicacao no layout raiz. Um `setInterval` de 1 segundo atualiza continuamente o tempo de missao, a distancia da Terra, o nivel de sinal e o angulo orbital, e todas as telas refletem essas mudancas em tempo real sem comunicacao direta entre elas.
 
### Persistencia de dados com AsyncStorage
Ao iniciar, o `MissionContext` tenta carregar o estado salvo anteriormente com `AsyncStorage.getItem()`. Se existir um estado salvo, ele substitui os valores iniciais — o que significa que alertas dispensados pelo usuario permanecem dispensados mesmo apos fechar e reabrir o aplicativo. A cada mudanca de estado, `AsyncStorage.setItem()` salva o estado atual de forma assincrona. A chave utilizada e `@space_mission_v1`.
 
### Formulario com validacao de campos
Na tela de Comunicacoes (`comms.tsx`), o usuario pode digitar e enviar mensagens para o controle em Terra. O formulario valida dois casos antes de permitir o envio: campo vazio e mensagem com menos de 4 caracteres. Em caso de erro, a borda do campo muda para vermelho e uma mensagem descritiva e exibida abaixo. Apos o envio bem-sucedido, a mensagem aparece no log com status "ENVIANDO" e transiciona para "ACK" apos o tempo real de latencia do sinal (4.3 segundos simulados).
 
### Alertas automaticos
Tres alertas sao gerados automaticamente no estado inicial da missao: temperatura externa critica, combustivel baixo e sinal fraco. O badge com a contagem aparece no topo do dashboard e o modal abre sozinho na primeira renderizacao. Cada alerta pode ser dispensado individualmente com um toque, e essa acao e persistida pelo AsyncStorage.
 
---
 
## Como executar o projeto
 
### Pre-requisitos
 
- Node.js 18 ou superior
- npm 9 ou superior
- Expo Go instalado no celular (apenas para SDK 54 — para SDK 56 usar build de desenvolvimento) ou navegador para testar na web
### Passo a passo
 
**1. Clonar o repositorio**
 
```bash
git clone https://github.com/seu-usuario/SpaceManagementSim.git
cd SpaceManagementSim
```
 
**2. Instalar as dependencias**
 
```bash
npm install
```
 
**3. Instalar as fontes**
 
Baixar as familias tipograficas no Google Fonts:
- Share Tech Mono: https://fonts.google.com/specimen/Share+Tech+Mono
- Orbitron: https://fonts.google.com/specimen/Orbitron
Colocar os arquivos `.ttf` em `assets/fonts/` com exatamente estes nomes:
 
```
assets/fonts/
├── ShareTechMono-Regular.ttf
├── Orbitron-Regular.ttf
├── Orbitron-SemiBold.ttf
└── Orbitron-Bold.ttf
```
 
**4. Iniciar o servidor de desenvolvimento**
 
Para testar no navegador:
 
```bash
npx expo start --web
```
 
Para testar em dispositivo fisico com build de desenvolvimento (requer Android Studio ou Xcode):
 
```bash
npx expo run:android
# ou
npx expo run:ios
```
 
**5. Acessar o aplicativo**
 
Com `--web`, o aplicativo abre automaticamente em `http://localhost:8081`. Use as setas de navegacao do browser ou interaja diretamente com os paineis do dashboard para navegar entre as telas.
 
---
 
## Dependencias principais
 
```json
{
  "expo": "~56.0.0",
  "expo-router": "~4.0.0",
  "expo-font": "~13.0.0",
  "expo-splash-screen": "~0.29.0",
  "expo-status-bar": "~2.0.0",
  "@react-native-async-storage/async-storage": "^2.1.0",
  "react-native-svg": "^15.0.0",
  "react": "19.0.0",
  "react-native": "0.79.0"
}
```
 
As versoes exatas de todas as dependencias estao registradas no `package-lock.json`. Ao rodar `npm install`, o ambiente sera reproduzido identicamente.
 
---
 
## Decisoes de projeto
 
**Por que as fontes precisam ser baixadas manualmente?**
As fontes Orbitron e Share Tech Mono sao licenciadas pela SIL Open Font License e podem ser redistribuidas livremente, mas foram omitidas do repositorio para manter o tamanho do projeto reduzido. O `expo-font` carrega as fontes localmente a partir dos arquivos `.ttf` em `assets/fonts/`.

## RM dos integrantes do grupo:
Pedro Henrique dos Santos Cardoso - 563268
Gabriel Gibin Leoncio - 565462
Raí Augusto Ribeiro - 562870