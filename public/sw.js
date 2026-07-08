// Service Worker do Canal de Denúncias — recebe Web Push da equipe e mostra a
// notificação mesmo com o painel fechado. O payload nunca traz conteúdo sensível.

self.addEventListener("push", (event) => {
  let dados = {
    title: "Nova denúncia recebida",
    body: "Abra o painel para triar.",
    url: "/painel",
  };
  try {
    if (event.data) dados = Object.assign(dados, event.data.json());
  } catch (e) {
    // payload ausente/ inválido: usa o padrão genérico
  }

  event.waitUntil(
    self.registration.showNotification(dados.title, {
      body: dados.body,
      tag: "nova-denuncia",
      renotify: true,
      data: { url: dados.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || "/painel";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((janelas) => {
        for (const janela of janelas) {
          if (janela.url.includes("/painel") && "focus" in janela) {
            return janela.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
