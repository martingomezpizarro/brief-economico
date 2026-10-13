/* Service worker de Prebisch: solo avisos. No guarda nada en caché, así la página
   siempre carga la versión publicada. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// El Worker manda el aviso sin contenido; el texto lo deja preparado la página
// (brief que sigue y tarjetas) en la caché «prebisch-aviso».
self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let d = {};
    try { d = e.data ? e.data.json() : {}; } catch (_) { }
    try {
      const r = await (await caches.open("prebisch-aviso")).match("aviso");
      if (r) d = Object.assign(await r.json(), d);
    } catch (_) { }
    await self.registration.showNotification(d.titulo || "Prebisch · tu estudio de hoy", {
      body: d.cuerpo || "Tu brief y tus tarjetas de hoy te esperan.",
      icon: "iconos/icono-192.png",
      badge: "iconos/insignia-96.png",
      tag: "prebisch-diario",
      data: { url: d.url || "./#hoy" },
    });
  })());
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./#hoy", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) if (w.url.startsWith(self.registration.scope)) return w.navigate(url).then(x => (x || w).focus());
    return self.clients.openWindow(url);
  }));
});
