import React from "react";
import { AppRouter } from "./routes/AppRouter";
import { Toaster } from "sonner";
import NotificationProvider from "./context/NotificationContext"; // Import NotificationProvider

function App() {
  return (
    <NotificationProvider> {/* Wrap AppRouter with NotificationProvider */}
  <AppRouter />
  {/* Toaster único en bottom-right (se eliminó el de MainLayout para evitar duplicados) */}
  <Toaster richColors position="bottom-right" />
    </NotificationProvider>
  );
}

export default App;
