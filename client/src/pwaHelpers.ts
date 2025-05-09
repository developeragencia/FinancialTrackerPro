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

// Detectar o sistema operacional do dispositivo
export function getDeviceOS() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }
  
  // Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  return 'other';
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

// Função para obter links de download direto para as lojas
export function getAppStoreLinks() {
  return {
    // Links de exemplo para app stores - substitua pelos links reais quando disponíveis
    android: 'https://play.google.com/store/apps/details?id=com.valecashback.app',
    ios: 'https://apps.apple.com/app/vale-cashback/id0000000000'
  };
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
      // Se não tiver o prompt nativo, tenta direcionar para a loja apropriada
      const os = getDeviceOS();
      const storeLinks = getAppStoreLinks();
      
      if (os === 'android') {
        window.location.href = storeLinks.android;
        return true;
      } else if (os === 'ios') {
        window.location.href = storeLinks.ios;
        return true;
      }
      
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