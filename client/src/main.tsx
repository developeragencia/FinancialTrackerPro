import { createRoot } from "react-dom/client";
import { Helmet } from "react-helmet";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./pwaHelpers";

// Registra o service worker para suporte PWA
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <>
    <Helmet>
      <title>Vale Cashback - Sistema de Cashback</title>
      <meta name="description" content="Sistema completo para gerenciar cashback e fidelizar clientes." />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <meta name="theme-color" content="#0066B3" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <link rel="manifest" href="/manifest.json" />
    </Helmet>
    <App />
  </>
);
