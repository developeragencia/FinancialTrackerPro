// Função para verificar se o app pode ser instalado (PWA)
export function usePWAInstall() {
  let deferredPrompt: any = null;
  let installable = false;

  // Captura o evento beforeinstallprompt para mais tarde mostrar ao usuário
  window.addEventListener('beforeinstallprompt', (e) => {
    // Previne que o Chrome mostre automaticamente o prompt de instalação
    e.preventDefault();
    // Armazena o evento para poder disparar mais tarde
    deferredPrompt = e;
    // Atualiza o estado para mostrar o botão de instalação
    installable = true;
    
    console.log('O aplicativo pode ser instalado');
  });

  // Função para mostrar o prompt de instalação
  const promptInstall = () => {
    if (!deferredPrompt) {
      console.log('Aplicativo já instalado ou não pode ser instalado neste momento');
      return;
    }
    
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Espera o usuário responder ao prompt
    deferredPrompt.userChoice.then((choiceResult: {outcome: string}) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação do PWA');
      } else {
        console.log('Usuário recusou a instalação do PWA');
      }
      // Limpa o prompt salvo, pois só pode ser usado uma vez
      deferredPrompt = null;
      installable = false;
    });
  };

  // Detecta se o aplicativo já está instalado
  window.addEventListener('appinstalled', () => {
    console.log('PWA instalado com sucesso');
    deferredPrompt = null;
    installable = false;
  });

  // Retorna o estado e a função para instalar
  return {
    installable,
    promptInstall
  };
}

// Registra o service worker para funcionalidade PWA
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/serviceWorker.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso:', registration);
        })
        .catch(error => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    });
  }
}

// Detecta se o usuário está em um dispositivo móvel
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}