import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

/**
 * Botão de instalação do aplicativo que pode ser incluído em qualquer lugar da UI
 * Usa a função exposta no window pelo PWAInstallPrompt para mostrar o banner de instalação
 */
export function InstallButton() {
  const handleShowInstallPrompt = () => {
    // Verifica se a função existe no window (adicionada pelo componente PWAInstallPrompt)
    if (typeof (window as any).showInstallBanner === 'function') {
      // Chama a função para mostrar o banner de instalação
      (window as any).showInstallBanner();
    } else {
      // Fallback caso a função não esteja disponível
      console.warn('Função de instalação não disponível. O componente PWAInstallPrompt não está carregado.');
      // Redireciona para a página inicial como fallback
      window.location.href = '/';
    }
  };

  return (
    <Button 
      onClick={handleShowInstallPrompt}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Download size={16} />
      Instalar App
    </Button>
  );
}