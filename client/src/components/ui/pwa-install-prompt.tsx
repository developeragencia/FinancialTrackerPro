import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { isMobileDevice } from '@/pwaHelpers';
import { Download, X } from 'lucide-react';

let deferredPrompt: any = null;

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verifica se o app já foi instalado pelo usuário
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
    
    // Verifica se a aplicação está sendo executada em um dispositivo móvel
    const isMobile = isMobileDevice();
    
    // Verifica se o usuário já fechou o prompt anteriormente nesta sessão
    const hasUserDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true';
    
    // Só mostra o prompt se for em dispositivo móvel, não estiver instalado e não tiver sido fechado
    setShowPrompt(isMobile && !alreadyInstalled && !hasUserDismissed && !dismissed);
    
    // Captura o evento beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      // Previne que o Chrome mostre o prompt nativo
      e.preventDefault();
      // Armazena o evento para uso posterior
      deferredPrompt = e;
      setInstallable(true);
    });
    
    // Detecta quando o app é instalado
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      deferredPrompt = null;
      setInstallable(false);
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, [dismissed]);
  
  // Função para instalar o PWA
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Espera pela resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    // Se o usuário aceitou, esconde o banner
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    // Limpa a referência ao prompt - só pode ser usado uma vez
    deferredPrompt = null;
    setInstallable(false);
  };
  
  // Função para fechar o banner
  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    // Salva a preferência do usuário no localStorage
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <h4 className="text-sm font-medium">Instale nosso aplicativo</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Instale o Vale Cashback para facilitar o acesso e usar offline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDismiss}
            className="px-2"
          >
            <X size={16} />
          </Button>
          <Button 
            size="sm" 
            onClick={handleInstall}
            disabled={!installable}
            className="flex items-center gap-1"
          >
            <Download size={16} />
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
}