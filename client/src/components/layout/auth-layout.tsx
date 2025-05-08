import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  showHero?: boolean;
}

export function AuthLayout({
  children,
  title,
  description,
  footer,
  showHero = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>{title} | Vale Cashback</title>
      </Helmet>

      {/* Header */}
      <header className="bg-primary p-4 text-white text-center">
        <h1 className="text-2xl font-bold">Vale Cashback</h1>
        <p className="text-sm">{description || "Sistema de gerenciamento de cashback"}</p>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">{title}</CardTitle>
              {description && (
                <CardDescription className="text-center">
                  {description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer && <CardFooter>{footer}</CardFooter>}
          </Card>
        </div>

        {showHero && (
          <div className="bg-gray-50 py-8 px-4 flex-1 hidden md:block">
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-primary mb-4">
                Bem-vindo ao Vale Cashback
              </h2>
              <p className="text-gray-600 mb-6">
                O sistema completo para gerenciar cashback e fidelizar clientes.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="bg-secondary p-3 rounded-full text-white mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Acesso ao seu saldo</h3>
                    <p className="text-gray-600 text-sm">
                      Acompanhe seu saldo de cashback e transações em tempo real.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-secondary p-3 rounded-full text-white mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Transferências simples</h3>
                    <p className="text-gray-600 text-sm">
                      Envie e receba cashback de outros usuários facilmente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-secondary p-3 rounded-full text-white mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Sistema de referência</h3>
                    <p className="text-gray-600 text-sm">
                      Indique amigos e ganhe bônus de cashback em cada indicação.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-secondary p-3 rounded-full text-white mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Gestão para lojistas</h3>
                    <p className="text-gray-600 text-sm">
                      Ferramentas completas para gerenciar vendas e cashback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
