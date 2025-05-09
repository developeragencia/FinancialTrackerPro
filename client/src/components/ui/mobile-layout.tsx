import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { CreditCard, Home, Settings, ShoppingBag, User, Menu, LogOut, X } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './button';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
}

export function MobileLayout({ children, title }: MobileLayoutProps) {
  const { isMobile } = useMobile();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  if (!isMobile) {
    return <>{children}</>;
  }
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  
  const userType = user?.type || 'client';
  const gradientClass = 
    userType === 'admin' 
      ? 'bg-gradient-to-r from-primary to-primary-dark' 
      : userType === 'merchant' 
        ? 'bg-gradient-to-r from-accent to-orange-600' 
        : 'bg-gradient-to-r from-secondary to-blue-700';
  
  return (
    <div className="relative min-h-screen">
      {/* Barra superior */}
      <header className={`mobile-top-nav ${gradientClass}`}>
        <div className="flex items-center gap-3">
          <button onClick={toggleMenu} className="p-1">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            {user?.photo ? (
              <img 
                src={user.photo} 
                alt={user.name} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User size={18} />
            )}
          </div>
        </div>
      </header>
      
      {/* Menu lateral (deslizante) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            
            <motion.div 
              className={`fixed top-0 left-0 h-full w-3/4 bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col`}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className={`p-4 ${gradientClass} text-white flex items-center justify-between`}>
                <h2 className="text-xl font-bold">Vale Cashback</h2>
                <button onClick={toggleMenu} className="p-1">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    {user?.photo ? (
                      <img 
                        src={user.photo} 
                        alt={user.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto py-2">
                {userType === 'client' && (
                  <nav className="space-y-1 px-2">
                    <Link href="/client/dashboard">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/client/dashboard' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <Home size={20} />
                        <span>Início</span>
                      </a>
                    </Link>
                    <Link href="/client/transactions">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/client/transactions' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <CreditCard size={20} />
                        <span>Transações</span>
                      </a>
                    </Link>
                    <Link href="/client/stores">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/client/stores' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <ShoppingBag size={20} />
                        <span>Lojas</span>
                      </a>
                    </Link>
                    <Link href="/client/profile">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/client/profile' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <Settings size={20} />
                        <span>Perfil</span>
                      </a>
                    </Link>
                  </nav>
                )}
                
                {userType === 'merchant' && (
                  <nav className="space-y-1 px-2">
                    <Link href="/merchant/dashboard">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/merchant/dashboard' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <Home size={20} />
                        <span>Dashboard</span>
                      </a>
                    </Link>
                    <Link href="/merchant/transactions">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/merchant/transactions' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <CreditCard size={20} />
                        <span>Vendas</span>
                      </a>
                    </Link>
                    <Link href="/merchant/products">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/merchant/products' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <ShoppingBag size={20} />
                        <span>Produtos</span>
                      </a>
                    </Link>
                    <Link href="/merchant/qrcode">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/merchant/qrcode' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <CreditCard size={20} />
                        <span>QR Code</span>
                      </a>
                    </Link>
                  </nav>
                )}
                
                {userType === 'admin' && (
                  <nav className="space-y-1 px-2">
                    <Link href="/admin/dashboard">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/admin/dashboard' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <Home size={20} />
                        <span>Dashboard</span>
                      </a>
                    </Link>
                    <Link href="/admin/merchants">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/admin/merchants' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <ShoppingBag size={20} />
                        <span>Lojistas</span>
                      </a>
                    </Link>
                    <Link href="/admin/clients">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/admin/clients' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <User size={20} />
                        <span>Clientes</span>
                      </a>
                    </Link>
                    <Link href="/admin/transactions">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/admin/transactions' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <CreditCard size={20} />
                        <span>Transações</span>
                      </a>
                    </Link>
                    <Link href="/admin/settings">
                      <a className={`flex items-center gap-3 p-3 rounded-lg ${location === '/admin/settings' ? 'bg-gray-100 dark:bg-gray-800' : ''}`} onClick={toggleMenu}>
                        <Settings size={20} />
                        <span>Configurações</span>
                      </a>
                    </Link>
                  </nav>
                )}
              </div>
              
              <div className="p-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  <LogOut size={18} />
                  <span>Sair</span>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Conteúdo principal */}
      <main className="mobile-page-content">
        {children}
      </main>
      
      {/* Barra de navegação inferior */}
      <nav className="mobile-bottom-nav">
        {userType === 'client' && (
          <>
            <Link href="/client/dashboard">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/client/dashboard' ? 'text-primary' : 'text-gray-500'}`}>
                <Home size={20} />
                <span className="text-xs mt-1">Início</span>
              </a>
            </Link>
            <Link href="/client/transactions">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/client/transactions' ? 'text-primary' : 'text-gray-500'}`}>
                <CreditCard size={20} />
                <span className="text-xs mt-1">Transações</span>
              </a>
            </Link>
            <Link href="/client/stores">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/client/stores' ? 'text-primary' : 'text-gray-500'}`}>
                <ShoppingBag size={20} />
                <span className="text-xs mt-1">Lojas</span>
              </a>
            </Link>
            <Link href="/client/profile">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/client/profile' ? 'text-primary' : 'text-gray-500'}`}>
                <User size={20} />
                <span className="text-xs mt-1">Perfil</span>
              </a>
            </Link>
          </>
        )}
        
        {userType === 'merchant' && (
          <>
            <Link href="/merchant/dashboard">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/merchant/dashboard' ? 'text-accent' : 'text-gray-500'}`}>
                <Home size={20} />
                <span className="text-xs mt-1">Painel</span>
              </a>
            </Link>
            <Link href="/merchant/transactions">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/merchant/transactions' ? 'text-accent' : 'text-gray-500'}`}>
                <CreditCard size={20} />
                <span className="text-xs mt-1">Vendas</span>
              </a>
            </Link>
            <Link href="/merchant/products">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/merchant/products' ? 'text-accent' : 'text-gray-500'}`}>
                <ShoppingBag size={20} />
                <span className="text-xs mt-1">Produtos</span>
              </a>
            </Link>
            <Link href="/merchant/qrcode">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/merchant/qrcode' ? 'text-accent' : 'text-gray-500'}`}>
                <CreditCard size={20} />
                <span className="text-xs mt-1">QR Code</span>
              </a>
            </Link>
          </>
        )}
        
        {userType === 'admin' && (
          <>
            <Link href="/admin/dashboard">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/admin/dashboard' ? 'text-primary' : 'text-gray-500'}`}>
                <Home size={20} />
                <span className="text-xs mt-1">Painel</span>
              </a>
            </Link>
            <Link href="/admin/merchants">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/admin/merchants' ? 'text-primary' : 'text-gray-500'}`}>
                <ShoppingBag size={20} />
                <span className="text-xs mt-1">Lojistas</span>
              </a>
            </Link>
            <Link href="/admin/clients">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/admin/clients' ? 'text-primary' : 'text-gray-500'}`}>
                <User size={20} />
                <span className="text-xs mt-1">Clientes</span>
              </a>
            </Link>
            <Link href="/admin/transactions">
              <a className={`flex flex-col items-center justify-center w-full p-1 ${location === '/admin/transactions' ? 'text-primary' : 'text-gray-500'}`}>
                <CreditCard size={20} />
                <span className="text-xs mt-1">Transações</span>
              </a>
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}