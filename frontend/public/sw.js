// public/sw.js
self.addEventListener('install', () => {
  // Fuerza al Service Worker a activarse inmediatamente
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Permite que el SW tome el control de la página sin tener que recargar
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data.json();

  const options = {
    body: data.message,
    icon: "https://i.ibb.co/VkwP241/logogirorides.png", // Un icono cualquiera
    badge: "https://i.ibb.co/VkwP241/logogirorides.png",
    data: {
      url: "https://www.girorides.com/drivers",
    },
  };

  // Esta línea es la que realmente "pinta" la notificación en Windows/Mac/Android
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 2. NUEVO: Escuchar el CLIC en la notificación
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const url = notification.data.url; // Obtenemos la URL que guardamos arriba

  // Cerramos la notificación para que no se quede ahí estorbando
  notification.close();

  // Abrir la ventana o enfocarla si ya está abierta
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Si ya hay una pestaña abierta con esa URL, le ponemos el foco
        for (var i = 0; i < windowClients.length; i++) {
          var client = windowClients[i];
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // Si no hay ninguna abierta, abrimos una nueva
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});
