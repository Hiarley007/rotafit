# RotaFit

Aplicativo de corrida e caminhada com React Native e Expo. Registra rota por GPS, distância, duração e ritmo, salva o histórico no Supabase e oferece um player conectado ao Spotify.

## Funcionalidades

- Login com **Google** via Supabase Auth.
- Rastreamento de GPS com distância, tempo, ritmo e traçado em tempo real.
- Pausar, retomar, finalizar ou descartar uma atividade.
- Histórico, detalhes e exclusão de corridas.
- Resumo semanal de distância, duração e quantidade de atividades.
- **Spotify**: OAuth com PKCE, faixa atual, tocar/pausar, próxima/anterior.
- Temas **Claro** e **Escuro**, com paleta verde e laranja inspirada em corrida e trilha.
- Interface em **Liquid Glass**, com superfícies translúcidas, brilho e blur.

## Tecnologias

React Native · Expo SDK 58 · Expo Router · TypeScript · Supabase Auth · PostgreSQL e RLS · TanStack Query · expo-location · expo-auth-session · expo-secure-store · expo-blur · expo-linear-gradient · react-native-svg · Jest · PGlite

## Como executar

1. Instale as dependências: `npm install`.
2. Crie um projeto no [Supabase](https://supabase.com) e execute `supabase/schema.sql` no SQL Editor.
3. Ative Google em **Authentication → Providers → Google** e configure as credenciais OAuth.
4. Crie um app no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) para obter o Client ID.
5. Copie `.env.example` para `.env` e preencha a URL e chave pública do Supabase e o Client ID do Spotify. O `.env` não deve ser enviado ao Git.
6. Inicie com `npx expo start`. O app roda em Android, iOS e web; no navegador, a permissão de GPS exige um contexto seguro ou endereço local.

### Retorno do Spotify

- **Web local:** cadastre `http://127.0.0.1:8081/spotify-auth` nos Redirect URIs do Spotify. Em desenvolvimento, o RotaFit troca `localhost` por `127.0.0.1` automaticamente. Se a porta mudar, atualize a URI cadastrada e `EXPO_PUBLIC_SPOTIFY_REDIRECT_URI_WEB`.
- **App nativo:** o callback HTTPS padrão é `https://<PROJECT_REF>.supabase.co/functions/v1/spotify-auth`. Implante a função e cadastre essa URI no Spotify:

  ```bash
  npx supabase functions deploy spotify-auth --project-ref <PROJECT_REF>
  ```

  A função retorna a autorização ao app pelo scheme `rotafit://spotify-auth`. O fluxo nativo precisa de uma build que reconheça esse scheme; o callback não está publicado automaticamente ao executar o app.

## Serviços e custos

O percurso é desenhado em SVG e não depende de uma API de mapas. Limites, disponibilidade e eventuais custos do Supabase, Google e Spotify dependem das contas e condições vigentes de cada serviço.

## Testes

| Comando | O que testa |
| --- | --- |
| `npm test` | Suítes do app (Jest) e do banco (PGlite). |
| `npm run test:app` | Cálculos geográficos, formatação e estados do rastreador. |
| `npm run test:db` | RLS, restrições e `weekly_stats`. |
| `npm run typecheck` | Tipos TypeScript do app. |

Os testes de banco usam PGlite e aplicam o mesmo `supabase/schema.sql`, sem Docker.

## Arquitetura

```text
app/       rotas Expo Router, login, abas e telas de corrida
src/
  components/ interface, player, mapas e Liquid Glass
  context/    sessão, Spotify e tema
  hooks/      corridas, player e rastreador GPS
  lib/        Supabase, Google OAuth e Spotify
  services/   acesso ao banco e Spotify Web API
  theme/      tokens claro/escuro e ThemeProvider
  utils/      geolocalização, métricas e estado da corrida
supabase/
  schema.sql  tabela de corridas, RLS e weekly_stats
  functions/  callback HTTPS do Spotify nativo
  tests/      testes do banco
__tests__/   testes unitários do app
```

## Observações

- A localização é acompanhada em primeiro plano; rastreamento em segundo plano não está implementado.
- Saltos de GPS implausíveis são descartados; pausas não entram na duração final.
- A estimativa de calorias usa valores de referência e não é uma medição clínica.
- No nativo, os tokens do Spotify usam SecureStore; na web, ficam no armazenamento local do navegador.

## Autor

**Hiarley de Morais Rabelo** · [LinkedIn](https://www.linkedin.com/in/hiarley-morais-bbb360352) · [GitHub](https://github.com/Hiarley007)
