/**
 * Helpers para funcionalidades PWA
 */

// Função para verificar se o dispositivo é mobile
export function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    (window.innerWidth <= 768)
  );
}

// Função para registrar o service worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/serviceWorker.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration);
        })
        .catch((error) => {
          console.error('Erro ao registrar o Service Worker:', error);
        });
    });
  }
}

// Função para verificar se o aplicativo já está instalado
export function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

// Interface para eventos de instalação do PWA
export function usePWAInstall() {
  let deferredPrompt: any = null;

  const setInstallPrompt = (e: any) => {
    deferredPrompt = e;
  };

  const clearInstallPrompt = () => {
    deferredPrompt = null;
  };

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    clearInstallPrompt();
    return outcome === 'accepted';
  };

  return {
    setInstallPrompt,
    clearInstallPrompt,
    promptInstall,
    deferredPrompt,
  };
}