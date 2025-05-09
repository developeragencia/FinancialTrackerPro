import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { isMobileDevice, getDeviceOS } from '@/pwaHelpers';
import { Download, X, Smartphone } from 'lucide-react';

// Variável global para armazenar o evento de instalação
let deferredPrompt: any = null;
// Quando a janela carrega, limpa variáveis de instalação do localStorage
if (typeof window !== 'undefined') {
  (window as any).deferredPrompt = null;
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(true); // Sempre mostra o banner
  const [installable, setInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar se o banner já foi fechado antes
    const wasDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    if (wasDismissed) {
      setDismissed(true);
      setShowPrompt(false);
    }
    
    // Verificar se o app já está instalado
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
    
    if (isAppInstalled) {
      setShowPrompt(false);
    }
    
    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Previne que o Chrome mostre o prompt nativo
      e.preventDefault();
      // Armazena o evento para uso posterior
      console.log('BeforeInstallPrompt capturado!', e);
      deferredPrompt = e;
      setInstallable(true);
      
      // Mostra o banner se não estiver dispensado
      if (!wasDismissed) {
        setShowPrompt(true);
      }
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
  
  // Função para instalar o aplicativo
  const handleInstall = async () => {
    console.log('Tentando instalar com deferredPrompt:', deferredPrompt);
    
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
      }
      
      // Limpa a referência ao prompt - só pode ser usado uma vez
      deferredPrompt = null;
    } else {
      console.log('Nenhum evento de instalação disponível');
      alert('Este aplicativo já está instalado ou seu navegador não suporta instalação de PWAs.');
    }
  };
  
  // Força a instalação através de um botão presente em algum lugar da UI
  const forceShowInstallBanner = () => {
    console.log('Forçando exibição do banner de instalação');
    setShowPrompt(true);
    setDismissed(false);
  };
  
  // Expõe a função para o window para poder ser chamada de qualquer lugar
  useEffect(() => {
    (window as any).showInstallBanner = forceShowInstallBanner;
    
    // Para testes - registrar manualmente a função na janela
    console.log('Função de instalação registrada globalmente');
  }, []);
  
  // Função para fechar o banner
  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    // Salva a preferência do usuário no localStorage
    localStorage.setItem('pwa-install-dismissed', 'true');
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
          className="w-full flex items-center justify-center gap-2"
          variant="default"
          size="lg"
        >
          <Download size={20} />
          Instalar Aplicativo
        </Button>
      </div>
    </div>
  );
}