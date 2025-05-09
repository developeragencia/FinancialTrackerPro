import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { isMobileDevice, getDeviceOS, getAppStoreLinks } from '@/pwaHelpers';
import { Download, X, Smartphone, Play, Apple } from 'lucide-react';

// Variável global para armazenar o evento de instalação
let deferredPrompt: any = null;

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(true); // Sempre mostra o banner de instalação
  const [installable, setInstallable] = useState(true); // Sempre permite instalar
  const [dismissed, setDismissed] = useState(false);
  const [deviceOS, setDeviceOS] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // Detecta o sistema operacional do dispositivo
    setDeviceOS(getDeviceOS() as 'android' | 'ios' | 'other');
    
    // Verifica se a aplicação está sendo executada em um dispositivo móvel
    const isMobile = isMobileDevice();
    
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
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  // Função para instalar ou baixar o aplicativo
  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        // Mostra o prompt de instalação
        deferredPrompt.prompt();
        
        // Espera pela resposta do usuário
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
        
        // Se o usuário aceitou, esconde o banner
        if (outcome === 'accepted') {
          setShowPrompt(false);
        }
      } catch (error) {
        console.error('Erro no prompt de instalação:', error);
        // Em caso de erro, redireciona para a loja apropriada
        redirectToStore();
      }
      
      // Limpa a referência ao prompt - só pode ser usado uma vez
      deferredPrompt = null;
    } else {
      // Caso contrário, redirecionamos para a loja apropriada
      redirectToStore();
    }
  };
  
  // Função para redirecionar para a loja apropriada
  const redirectToStore = () => {
    const storeLinks = getAppStoreLinks();
    
    if (deviceOS === 'android') {
      window.location.href = storeLinks.android;
    } else if (deviceOS === 'ios') {
      window.location.href = storeLinks.ios;
    }
  };
  
  // Função para download direto da app store
  const handleAppStoreDownload = (platform: 'android' | 'ios') => {
    const storeLinks = getAppStoreLinks();
    window.location.href = platform === 'android' ? storeLinks.android : storeLinks.ios;
  };
  
  // Função para fechar o banner
  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
  };
  
  if (!showPrompt || dismissed) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="text-primary h-5 w-5" />
            <h4 className="text-base font-medium">Baixe o Vale Cashback</h4>
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
          Instale para aproveitar a experiência completa de app nativo:
        </p>
        
        {/* Botão principal de instalação */}
        <Button 
          onClick={handleInstall}
          className="w-full flex items-center justify-center gap-2 mb-3"
          variant="default"
          size="lg"
        >
          <Download size={20} />
          Instalar Aplicativo
        </Button>
        
        {/* Opções alternativas - lojas de aplicativos */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => handleAppStoreDownload('android')}
            className="flex items-center justify-center gap-2"
            variant="outline"
          >
            <Play size={16} />
            Google Play
          </Button>
          
          <Button 
            onClick={() => handleAppStoreDownload('ios')}
            className="flex items-center justify-center gap-2"
            variant="outline"
          >
            <Apple size={16} />
            App Store
          </Button>
        </div>
      </div>
    </div>
  );
}