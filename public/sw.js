self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("Ada konten baru", {
      body: "Buka aplikasi untuk melihat pembaruan.",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
