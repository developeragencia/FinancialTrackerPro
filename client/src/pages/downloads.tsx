import React from 'react';
import { Helmet } from 'react-helmet';
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { getDeviceOS } from '@/pwaHelpers';
import { LogoIcon } from '@/components/ui/icons';

export default function DownloadsPage() {
  const deviceOS = getDeviceOS();
  const isAndroid = deviceOS === 'android';
  const isIOS = deviceOS === 'ios';
  
  return (
    <>
      <Helmet>
        <title>Vale Cashback - Baixar Aplicativo</title>
        <meta name="description" content="Baixe o aplicativo Vale Cashback para Android e iOS e aproveite todos os benefícios de cashback e indicações." />
      </Helmet>
      
      <AuthLayout title="Baixar Aplicativo" description="Escolha a versão do Vale Cashback para seu dispositivo">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="bg-primary rounded-3xl shadow-lg w-28 h-28 flex items-center justify-center p-5">
              <LogoIcon className="w-full h-full text-white" />
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">Vale Cashback</h2>
            <p className="text-sm text-gray-500 mt-1">Versão 1.0.5</p>
          </div>
          
          <div className="grid gap-4">
            <div className={`border rounded-xl p-5 ${isAndroid ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5051 7.46332V16.0916C17.5051 16.6139 17.0834 17.0355 16.5611 17.0355H15.9508V20.1866C15.9508 21.1888 15.1392 22.0004 14.137 22.0004C13.1348 22.0004 12.3232 21.1888 12.3232 20.1866V17.0355H11.6763V20.1866C11.6763 21.1888 10.8647 22.0004 9.86248 22.0004C8.86029 22.0004 8.04868 21.1888 8.04868 20.1866V17.0355H7.43844C6.9161 17.0355 6.49448 16.6139 6.49448 16.0916V7.46332H17.5051ZM3.94752 7.46332C4.94971 7.46332 5.76133 8.27493 5.76133 9.27712V14.2778C5.76133 15.28 4.94971 16.0916 3.94752 16.0916C2.94533 16.0916 2.13372 15.28 2.13372 14.2778V9.27712C2.13372 8.27493 2.94533 7.46332 3.94752 7.46332ZM20.0521 7.46332C21.0543 7.46332 21.8659 8.27493 21.8659 9.27712V14.2778C21.8659 15.28 21.0543 16.0916 20.0521 16.0916C19.0499 16.0916 18.2383 15.28 18.2383 14.2778V9.27712C18.2383 8.27493 19.0499 7.46332 20.0521 7.46332Z" fill="currentColor"/>
                    <path d="M15.2316 2.06026L16.6212 0.67067C16.8134 0.47845 16.8134 0.167814 16.6212 -0.0244027C16.429 -0.21662 16.1183 -0.21662 15.9261 -0.0244027L14.3774 1.52423C13.6309 1.17866 12.8316 0.986877 11.9995 0.986877C11.1679 0.986877 10.3685 1.17866 9.62201 1.52423L8.07331 -0.0244027C7.88109 -0.21662 7.57046 -0.21662 7.37824 -0.0244027C7.18602 0.167814 7.18602 0.47845 7.37824 0.67067L8.76783 2.06026C7.35429 3.11171 6.44138 4.79525 6.44138 6.67903C6.44138 6.74057 6.44285 6.8016 6.44529 6.86212H17.5542C17.5566 6.8016 17.5581 6.74057 17.5581 6.67903C17.5581 4.79525 16.6452 3.11171 15.2316 2.06026Z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Android</h3>
                  <p className="text-sm text-gray-500">Baixe o aplicativo para seu dispositivo Android</p>
                </div>
              </div>
              
              <div className="mt-4 grid gap-3">
                <a 
                  href="/downloads/vale-cashback-android.apk" 
                  download="vale-cashback-android.apk"
                  type="application/vnd.android.package-archive"
                  className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-center flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  <span className="font-medium">Baixar APK Direto (5.2 MB)</span>
                </a>
                
                <a 
                  href="https://play.google.com/store/apps/details?id=com.valecashback.app" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg text-center"
                >
                  Obter na Play Store
                </a>
              </div>
            </div>
            
            <div className={`border rounded-xl p-5 ${isIOS ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.4 1.4C13.4 1.4 12.7 3.2 10.7 3.2C8.6 3.2 6.7 1.4 4.6 1.4C2.5 1.4 0 3.2 0 7.3C0 11.3 4.4 17.7 7.8 17.7C9.7 17.7 10.6 16.3 12.8 16.3C14.9 16.3 15.7 17.7 17.7 17.7C20.6 17.7 24 12.7 24 7.3C23.9 3.2 21.6 1.4 16.4 1.4Z" fill="currentColor"/>
                    <path d="M14.4 0C13.8 0.9 13.5 2 13.5 3.2C13.5 5.5 14.5 7.5 16.1 8.5C16.6 7.6 17 6.5 17 5.2C17 2.9 15.9 0.9 14.4 0Z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">iOS</h3>
                  <p className="text-sm text-gray-500">Baixe o aplicativo para seu iPhone ou iPad</p>
                </div>
              </div>
              
              <div className="mt-4 grid gap-3">
                <a 
                  href="/downloads/vale-cashback-ios.ipa" 
                  download="vale-cashback-ios.ipa"
                  type="application/octet-stream"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-center flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  <span className="font-medium">Baixar IPA (8.7 MB)</span>
                </a>
                
                <a 
                  href="https://apps.apple.com/app/vale-cashback/id123456789" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg text-center"
                >
                  Obter na App Store
                </a>
              </div>
            </div>
            
            <div className="border rounded-xl p-5 bg-white">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gray-100 p-3">
                  <svg className="h-8 w-8 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 8H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Desktop</h3>
                  <p className="text-sm text-gray-500">Baixe o aplicativo para seu computador</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <a 
                  href="/downloads/vale-cashback-windows.exe" 
                  download="vale-cashback-windows.exe"
                  type="application/vnd.microsoft.portable-executable"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg text-center text-sm"
                >
                  Windows (.exe)
                </a>
                
                <a 
                  href="/downloads/vale-cashback-mac.dmg" 
                  download="vale-cashback-mac.dmg"
                  type="application/x-apple-diskimage"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg text-center text-sm"
                >
                  macOS (.dmg)
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <Link href="/">
              <Button variant="outline" className="w-full flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para o site
              </Button>
            </Link>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 text-sm">
            <p className="font-medium mb-1">Instruções de instalação:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Para Android: Após baixar o arquivo APK, abra-o para iniciar a instalação. <a href="/downloads/installers/android-instructions.html" target="_blank" className="font-medium underline">Ver instruções detalhadas</a></li>
              <li>Para iOS: Após download, use o AltStore ou Sideloadly para instalar o aplicativo. <a href="/downloads/installers/ios-instructions.html" target="_blank" className="font-medium underline">Ver instruções detalhadas</a></li>
              <li>Para Windows: Execute o arquivo .exe baixado e siga as instruções do instalador que aparecerá na tela.</li>
              <li>Para macOS: Abra o arquivo .dmg, arraste o aplicativo para a pasta Aplicativos e inicie-o normalmente.</li>
              <li>Para instruções detalhadas, visite nossa <a href="#" className="underline">central de ajuda</a>.</li>
            </ul>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}