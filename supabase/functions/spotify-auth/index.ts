// Callback público do Spotify para o app nativo. O Spotify permite apenas
// callbacks HTTPS; este endpoint repassa a resposta à URL rotafit:// do app.
declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

Deno.serve((request) => {
  const incomingUrl = new URL(request.url);
  const hasAuthorizationResult =
    incomingUrl.searchParams.has('code') || incomingUrl.searchParams.has('error');

  if (!hasAuthorizationResult) {
    return new Response('Callback do Spotify: parâmetros de autorização ausentes.', {
      status: 400,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const appUrl = new URL('rotafit://spotify-auth');
  appUrl.search = incomingUrl.search;
  return Response.redirect(appUrl.toString(), 302);
});
