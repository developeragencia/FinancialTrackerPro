import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { isMobileDevice } from '@/pwaHelpers';
import { Download, X, Smartphone } from 'lucide-react';

// Variável global para armazenar o evento de instalação
let deferredPrompt: any = null;

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    // Força o banner a aparecer para teste
    const forceShow = true; // Sempre mostra para ajudar a testar
    
    // Verifica se o app já foi instalado pelo usuário
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
    
    // Verifica se a aplicação está sendo executada em um dispositivo móvel
    const isMobile = isMobileDevice();
    
    // Verifica se o usuário já fechou o prompt anteriormente nesta sessão
    const hasUserDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true';
    
    // Mostra o prompt com base nas condições ou força a exibição
    setShowPrompt((isMobile || forceShow) && !alreadyInstalled && !hasUserDismissed && !dismissed);
    
    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Previne que o Chrome mostre o prompt nativo
      e.preventDefault();
      // Armazena o evento para uso posterior
      console.log('BeforeInstallPrompt capturado!', e);
      deferredPrompt = e;
      setInstallable(true);
    };
    
    // Detecta quando o app é instalado
    const handleAppInstalled = () => {
      console.log('App instalado com sucesso!');
      setShowPrompt(false);
      deferredPrompt = null;
      setInstallable(false);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Verifica se estamos em iOS (Safari) onde 'beforeinstallprompt' não é suportado
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setShowManualInstructions(true);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismissed]);
  
  // Função para instalar o PWA
  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log('Nenhum evento de instalação disponível');
      setShowManualInstructions(true);
      return;
    }
    
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Espera pela resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
    
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
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="text-primary h-5 w-5" />
            <h4 className="text-base font-medium">Instale o Vale Cashback</h4>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDismiss}
            className="h-8 w-8 p-0 rounded-full"
          >
            <X size={16} />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Instale o aplicativo para acesso rápido e funcionalidades offline.
        </p>
        
        {showManualInstructions ? (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-xs font-medium mb-1">Como instalar:</p>
            <ol className="text-xs list-decimal pl-4 space-y-1">
              <li>Toque no botão de compartilhamento <span className="inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
              </span></li>
              <li>Selecione "Adicionar à tela inicial"</li>
              <li>Confirme a adição</li>
            </ol>
          </div>
        ) : (
          <Button 
            size="sm" 
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Instalar App
          </Button>
        )}
      </div>
    </div>
  );
}