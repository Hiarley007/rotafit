# RotaFit

**Aplicativo de corrida e caminhada com React Native, Expo, Supabase e integração com Spotify.**

O RotaFit registra corridas usando GPS, calcula distância, duração e ritmo, desenha o percurso e mantém um histórico associado à conta do usuário. A tela inicial mostra o resumo semanal, e a integração opcional com o Spotify exibe e controla a reprodução durante a atividade.

## Destaques

| Área | O que oferece |
| --- | --- |
| Rastreamento | Iniciar, pausar, retomar, finalizar ou descartar uma atividade. |
| Métricas | Distância, tempo em movimento e ritmo médio. |
| Percurso | Desenho da rota registrada pelo GPS e simplificação dos pontos antes de salvar. |
| Histórico | Lista de atividades, detalhes, mapa do percurso e exclusão. |
| Spotify | Faixa atual, pausar, retomar, avançar e voltar. |
| Conta | Login com Google via Supabase Auth e rotas protegidas. |
| Aparência | Temas claro e escuro com paleta inspirada em corrida e trilha. |
| Segurança | Corridas isoladas por usuário com Row Level Security (RLS). |

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Telas e rotas](#telas-e-rotas)
- [Dados e regras](#dados-e-regras)
- [Como executar](#como-executar)
- [Configurar o Supabase](#configurar-o-supabase)
- [Configurar o Spotify](#configurar-o-spotify)
- [Privacidade e limitações](#privacidade-e-limitações)
- [Testes e validação](#testes-e-validação)
- [Problemas comuns](#problemas-comuns)

## Funcionalidades

### Corrida e caminhada

- Solicita permissão de localização em primeiro plano.
- Registra pontos de latitude, longitude e horário durante a atividade.
- Calcula a distância entre pontos com a fórmula de Haversine.
- Ignora saltos de GPS que impliquem velocidade acima de 10 m/s.
- Permite pausar e retomar sem contar o tempo parado.
- Finaliza e salva percurso, distância, duração, ritmo e faixa que estava tocando.
- Permite descartar a atividade sem salvá-la.
- Evita salvar atividades sem distância registrada.

O rastreamento de localização é feito em primeiro plano. O aplicativo não implementa rastreamento contínuo em segundo plano.

### Resumo e histórico

- Resumo semanal de distância, duração total e número de corridas.
- Histórico ordenado por data, com distância, duração, ritmo e música associada.
- Detalhes da corrida com percurso e estimativa de calorias.
- Exclusão de corridas com confirmação.

A estimativa de calorias usa um peso padrão de 70 kg e um MET de referência. É apenas informativa, não uma avaliação clínica ou medição individual.

### Spotify

- Conexão por OAuth com PKCE, sem client secret no aplicativo.
- Renovação do access token usando o refresh token.
- Consulta da faixa atual e controles de reprodução.
- Atualização do estado do player a cada cinco segundos enquanto há uma conta conectada.

Os controles dependem de uma sessão Spotify válida e de um dispositivo de reprodução disponível.

### Conta e temas

- Login com Google delegado ao Supabase Auth.
- Sessão persistida no aparelho e navegação protegida.
- Opções de aparência somente **Claro** e **Escuro**.
- Confirmações de sair, excluir e descartar compatíveis com web e nativo.

## Tecnologias

| Tecnologia | Responsabilidade |
| --- | --- |
| React Native e Expo SDK 58 | Aplicativo multiplataforma. |
| TypeScript | Tipagem do aplicativo e dos serviços. |
| Expo Router | Navegação baseada em arquivos. |
| Expo Location | Permissões e atualizações de GPS. |
| Expo AuthSession e WebBrowser | Fluxos OAuth com Google/Supabase e Spotify. |
| Expo SecureStore | Armazenamento nativo dos tokens do Spotify. |
| Supabase Auth e PostgreSQL | Autenticação, persistência e estatísticas semanais. |
| Row Level Security | Isolamento de corridas por usuário. |
| TanStack Query | Cache, consultas e mutações remotas. |
| React Native SVG | Desenho do percurso. |
| AsyncStorage | Preferência de tema e persistência da sessão Supabase. |
| Jest, jest-expo e PGlite | Testes das regras do app e do schema SQL. |

As versões instaladas estão declaradas em [`package.json`](package.json) e [`package-lock.json`](package-lock.json).

## Arquitetura

```text
Telas (app/) → Hooks (src/hooks/) → Serviços (src/services/) → Supabase
      │                │                     │
      └── Componentes  └── Regras locais      └── PostgreSQL com RLS

Spotify OAuth → PKCE → Spotify Web API
                         │
                         └── Callback HTTPS Supabase → deep link nativo
```

| Camada | Local | Responsabilidade |
| --- | --- | --- |
| Rotas e telas | `app/` | Navegação, telas e interações. |
| Componentes | `src/components/` | Botões, cartões, mapas e player. |
| Contextos | `src/context/` | Sessão do usuário e conexão Spotify. |
| Hooks | `src/hooks/` | Rastreamento, consultas e mutações. |
| Serviços | `src/services/` | Acesso ao Supabase e à Spotify Web API. |
| Bibliotecas | `src/lib/` | Clientes, OAuth e armazenamento. |
| Regras puras | `src/utils/` | GPS, métricas, formatação e estados do tracker. |
| Tema | `src/theme/` | Tokens, persistência e seleção de aparência. |
| Backend | `supabase/` | Schema, políticas RLS, estatísticas e callback Spotify nativo. |

## Estrutura do projeto

```text
rotafit/
├── app/
│   ├── (auth)/login.tsx
│   └── (app)/
│       ├── (tabs)/            # Início, histórico e perfil
│       └── run/               # Rastreamento e detalhes da corrida
├── assets/
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── theme/
│   ├── types/
│   └── utils/
├── supabase/
│   ├── config.toml
│   ├── schema.sql
│   ├── functions/spotify-auth/
│   └── tests/
├── __tests__/
├── .env.example
├── app.json
├── package.json
└── README.md
```

## Telas e rotas

| Tela | Rota | Uso |
| --- | --- | --- |
| Login | `/login` | Entrar com Google. |
| Início | `/` | Resumo semanal e início de atividade. |
| Histórico | `/history` | Consultar corridas salvas. |
| Perfil | `/profile` | Tema, Spotify e encerramento da sessão. |
| Corrida ativa | `/run/active` | Iniciar, pausar, retomar, finalizar ou descartar. |
| Detalhe da corrida | `/run/[id]` | Ver percurso, métricas e excluir. |

Os grupos `(auth)`, `(app)` e `(tabs)` organizam a navegação sem aparecer nos caminhos públicos.

## Dados e regras

### Tabela `public.runs`

| Campo | Finalidade |
| --- | --- |
| `id` | Identificador UUID da corrida. |
| `user_id` | Proprietário; padrão `auth.uid()`. |
| `started_at`, `ended_at` | Início e fim da atividade. |
| `distance_meters` | Distância em metros, sem valores negativos. |
| `duration_seconds` | Duração em movimento, em segundos. |
| `avg_pace_sec_per_km` | Ritmo médio; nulo se não houver distância. |
| `route` | Pontos simplificados em JSONB (`lat`, `lng`, `t`). |
| `spotify_track_name` | Faixa que tocava ao finalizar, quando disponível. |
| `created_at` | Data de criação do registro. |

O schema aplica RLS para que cada usuário leia, crie e apague somente as próprias corridas. A função `weekly_stats()` soma distância, duração e quantidade de corridas da semana para o usuário autenticado.

### Regras do tracker

- Pausas não contam para a duração final.
- Saltos de GPS acima do limite plausível são descartados.
- A rota é reduzida para limitar o volume salvo e desenhado.
- O ritmo é calculado em segundos por quilômetro.
- Uma atividade sem distância não é persistida.

## Como executar

### Requisitos

- Node.js compatível com as dependências do projeto.
- npm e Expo CLI via `npx`.
- Projeto Supabase configurado.
- Client ID de um app Spotify para usar a integração musical.
- Para o app nativo, uma build instalada com o scheme `rotafit`.

### Instalação

```bash
npm install
```

Copie `.env.example` para `.env` e preencha as variáveis. O arquivo `.env` é local e não deve ser enviado ao Git.

```bash
# PowerShell
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

Inicie o Expo:

```bash
npx expo start
```

Para abrir no navegador:

```bash
npx expo start --web
```

Em desenvolvimento web, o RotaFit redireciona `localhost` para `127.0.0.1` para usar o callback permitido pelo Spotify. O callback local padrão é `http://127.0.0.1:8081/spotify-auth`; se o servidor usar outra porta, ajuste a URI cadastrada no painel Spotify ou defina `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI_WEB` com a URI exata.

## Configurar o Supabase

1. Crie um projeto Supabase.
2. Em **SQL Editor**, execute [`supabase/schema.sql`](supabase/schema.sql).
3. Habilite o provedor Google em **Authentication → Sign In / Providers** e configure as credenciais OAuth do Google.
4. Em **Authentication → URL Configuration**, adicione as URLs de retorno usadas pelo app para desenvolvimento e produção.
5. Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_KEY` no `.env`.

Use apenas a chave pública anon/publishable no aplicativo. Nunca coloque uma `service_role` key no app ou no `.env` usado no bundle.

## Configurar o Spotify

### Web local

Adicione ao Redirect URIs da aplicação no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) a URI exata:

```text
http://127.0.0.1:8081/spotify-auth
```

O endereço do servidor e a porta do navegador precisam coincidir. Em produção, use uma URI HTTPS do site e defina `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI_WEB` no ambiente de build.

### App nativo

O Spotify exige callback HTTPS cadastrado. O padrão do RotaFit usa:

```text
https://<PROJECT_REF>.supabase.co/functions/v1/spotify-auth
```

Implante a Edge Function e substitua `<PROJECT_REF>` pelo identificador do projeto Supabase:

```bash
npx supabase functions deploy spotify-auth --project-ref <PROJECT_REF>
```

Cadastre essa mesma URL no Redirect URIs do Spotify. A função [`supabase/functions/spotify-auth/index.ts`](supabase/functions/spotify-auth/index.ts) encaminha o código OAuth para `rotafit://spotify-auth`. A configuração `verify_jwt = false` é necessária para que o retorno do Spotify alcance a função sem uma sessão Supabase.

Também é possível definir `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI_NATIVE` se o callback HTTPS estiver em outro endereço. O valor usado aparece no Perfil do aplicativo. O `.env.example` não contém esse override porque o padrão é derivado de `EXPO_PUBLIC_SUPABASE_URL`.

## Privacidade e limitações

- Cada consulta e mutação de corridas é protegida por RLS.
- A rota GPS e as métricas são salvas no Supabase vinculadas ao usuário.
- O rastreamento ocorre em primeiro plano; não há serviço de localização em background.
- O token Supabase é persistido usando AsyncStorage.
- Tokens Spotify usam SecureStore em iOS/Android; na web, o armazenamento recorre a `localStorage`, que oferece proteção menor que o armazenamento seguro nativo.
- O app solicita localização para acompanhar a rota da atividade.
- A desconexão do Spotify remove os tokens locais do dispositivo.
- Spotify e Google dependem de configuração nos respectivos painéis de desenvolvedor.
- A callback function do Spotify nativo precisa estar publicada no Supabase antes de conectar pela build nativa.

## Testes e validação

O repositório contém testes Jest para geografia, formatação, saudação e estados do tracker, além de testes de banco com PGlite para RLS, constraints e estatísticas semanais.

```bash
npm run typecheck
npm run test:app
npm run test:db
npm test
```

O script `npm test` executa os testes do app e os testes de banco. `npm run format` formata os diretórios listados no `package.json`.

## Problemas comuns

| Sintoma | Verificação ou ação |
| --- | --- |
| Variáveis Supabase ausentes | Preencha `.env` e reinicie com `npx expo start -c`. |
| Login Google não retorna ao app | Confira provedor Google no Supabase e URLs de retorno permitidas. |
| Spotify informa callback incompatível | Confira a URI exata no Perfil e cadastre-a na allowlist Spotify. |
| Spotify funciona na web, mas não na build nativa | Implante `spotify-auth`, cadastre o callback HTTPS e atualize/recarregue a build nativa. |
| O callback web local não abre | Use `127.0.0.1` e confira se a porta é a mesma cadastrada no Spotify. |
| Corrida não inicia | Permita localização no sistema ou no navegador e verifique se o serviço de localização está ativo. |
| Player não controla música | Abra o Spotify, inicie uma faixa em um dispositivo disponível e confirme as permissões concedidas. |
| Erro de acesso ou lista vazia | Confira sessão, aplicação de `schema.sql` e políticas RLS. |

## Licença

Consulte o arquivo [`LICENSE`](LICENSE) na raiz do projeto.
