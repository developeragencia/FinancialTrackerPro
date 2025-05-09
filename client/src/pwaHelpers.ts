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

// Função para lidar com instalação direta do app
export function handleDirectInstall() {
  // Verificar se há um evento de instalação armazenado globalmente
  if ((window as any).deferredPrompt) {
    try {
      (window as any).deferredPrompt.prompt();
      return true;
    } catch (error) {
      console.error('Erro ao tentar instalar diretamente:', error);
      return false;
    }
  }
  return false;
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
      console.log('Não há prompt de instalação disponível');
      // Tentar acessar diretamente a variável global
      if ((window as any).deferredPrompt) {
        try {
          (window as any).deferredPrompt.prompt();
          return true;
        } catch (error) {
          console.error('Erro ao tentar instalação direta:', error);
        }
      }
      
      // Não há opções de instalação disponíveis
      alert('O aplicativo já está instalado ou seu navegador não suporta instalação de PWAs');
      return false;
    }

    // Temos um prompt local, vamos utilizá-lo
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
      clearInstallPrompt();
      return outcome === 'accepted';
    } catch (error) {
      console.error('Erro ao processar escolha de instalação:', error);
      return false;
    }
  };

  return {
    setInstallPrompt,
    clearInstallPrompt,
    promptInstall,
    deferredPrompt,
  };
}