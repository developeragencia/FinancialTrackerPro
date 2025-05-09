import React, { ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { Home, ShoppingBag, QrCode, Users, User, Settings, LogOut, Wallet, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  hideHeader?: boolean;
}

export function MobileLayout({ children, title, hideHeader = false }: MobileLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const userTypePrefix = user?.type || '';

  const menuItems = [
    {
      path: `/${userTypePrefix}/dashboard`,
      icon: <Home className="h-6 w-6" />,
      label: 'Home'
    },
    user?.type === 'client' && {
      path: '/client/qr-code',
      icon: <QrCode className="h-6 w-6" />,
      label: 'QR Code'
    },
    user?.type === 'client' && {
      path: '/client/stores',
      icon: <ShoppingBag className="h-6 w-6" />,
      label: 'Lojas'
    },
    user?.type === 'client' && {
      path: '/client/transfers',
      icon: <Wallet className="h-6 w-6" />,
      label: 'Transferir'
    },
    user?.type === 'client' && {
      path: '/client/cashbacks',
      icon: <CreditCard className="h-6 w-6" />,
      label: 'Cashback'
    },
    user?.type === 'merchant' && {
      path: '/merchant/sales',
      icon: <ShoppingBag className="h-6 w-6" />,
      label: 'Vendas'
    },
    user?.type === 'merchant' && {
      path: '/merchant/scanner',
      icon: <QrCode className="h-6 w-6" />,
      label: 'Scanner'
    },
    user?.type === 'merchant' && {
      path: '/merchant/transactions',
      icon: <CreditCard className="h-6 w-6" />,
      label: 'Transações'
    },
    user?.type === 'merchant' && {
      path: '/merchant/referrals',
      icon: <Users className="h-6 w-6" />,
      label: 'Indicações'
    },
    (user?.type === 'merchant' || user?.type === 'admin') && {
      path: `/${userTypePrefix}/customers`,
      icon: <Users className="h-6 w-6" />,
      label: 'Clientes'
    },
    {
      path: `/${userTypePrefix}/profile`,
      icon: <User className="h-6 w-6" />,
      label: 'Perfil'
    },
    user?.type === 'admin' && {
      path: '/admin/settings',
      icon: <Settings className="h-6 w-6" />,
      label: 'Config'
    }
  ].filter(Boolean); // Remove itens falsely

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      {!hideHeader && (
        <header className="sticky top-0 z-50 w-full border-b bg-primary text-white shadow-md">
          <div className="container py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-primary-foreground/10"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 container overflow-auto px-2 max-w-full",
        hideHeader ? "pt-2 pb-4" : "py-4"
      )}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 border-t bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)] w-full">
        <div className="container grid grid-cols-5 gap-1 py-2">
          {menuItems.slice(0, 5).map((item, index) => (
            <Link
              key={index}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-1 rounded-md text-xs font-medium transition-colors",
                location === item.path 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {item.icon}
              <span className="mt-1 truncate text-[0.65rem]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* PWA Status Bar Color */}
      <meta name="theme-color" content="#0466c8" />
    </div>
  );
}