import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle, ArrowUpRight, ArrowDownRight, Users, Store, ShoppingCart, DollarSign, Wallet, Clock } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const statusColors: Record<string, string> = {
  completed: "bg-green-500",
  pending: "bg-orange-500",
  cancelled: "bg-red-500",
  refunded: "bg-blue-500"
};

export default function DemoMerchantDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Carregar dados de exemplo
  useEffect(() => {
    console.log("Carregando dashboard do lojista (modo demonstração)");
    
    // Simular tempo de carregamento
    const timer = setTimeout(() => {
      // Dados de exemplo para a demonstração
      const mockData = {
        balance: 2750.25,
        totalSales: 8650.75,
        totalTransactions: 42,
        totalCustomers: 28,
        pendingWithdrawals: 0,
        pendingTransactions: 3,
        
        recentSales: [
          {
            id: 1,
            customerName: "Maria Silva",
            amount: 270.50,
            cashbackAmount: 5.41,
            paymentMethod: "CREDIT_CARD",
            status: "completed",
            created_at: new Date().toISOString(),
            description: "Compra de produtos"
          },
          {
            id: 2,
            customerName: "João Santos",
            amount: 150.25,
            cashbackAmount: 3.00,
            paymentMethod: "PIX",
            status: "completed",
            created_at: new Date().toISOString(),
            description: "Serviços prestados"
          },
          {
            id: 3,
            customerName: "Ana Oliveira",
            amount: 320.00,
            cashbackAmount: 6.40,
            paymentMethod: "CASH",
            status: "pending",
            created_at: new Date().toISOString(),
            description: "Venda em processamento"
          },
          {
            id: 4,
            customerName: "Carlos Mendes",
            amount: 95.75,
            cashbackAmount: 1.92,
            paymentMethod: "DEBIT_CARD",
            status: "completed",
            created_at: new Date(Date.now() - 86400000).toISOString(), // Ontem
            description: "Compra na loja"
          },
          {
            id: 5,
            customerName: "Fernanda Costa",
            amount: 180.00,
            cashbackAmount: 3.60,
            paymentMethod: "CREDIT_CARD",
            status: "cancelled",
            created_at: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
            description: "Cancelado pelo cliente"
          }
        ],
        
        // Dados para gráficos
        salesByDay: [
          { name: "Segunda", vendas: 1250 },
          { name: "Terça", vendas: 980 },
          { name: "Quarta", vendas: 1420 },
          { name: "Quinta", vendas: 1650 },
          { name: "Sexta", vendas: 2100 },
          { name: "Sábado", vendas: 850 },
          { name: "Domingo", vendas: 400 }
        ],
        paymentMethods: [
          { method: "Cartão de Crédito", value: 45 },
          { method: "Cartão de Débito", value: 25 },
          { method: "PIX", value: 20 },
          { method: "Dinheiro", value: 8 },
          { method: "Outros", value: 2 }
        ],
        statusCounts: [
          { status: "Completados", count: 36, color: "bg-green-500" },
          { status: "Pendentes", count: 3, color: "bg-orange-500" },
          { status: "Cancelados", count: 2, color: "bg-red-500" },
          { status: "Reembolsados", count: 1, color: "bg-blue-500" }
        ]
      };
      
      setDashboardData(mockData);
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const PaymentMethod: Record<string, string> = {
    CREDIT_CARD: "Cartão de Crédito",
    DEBIT_CARD: "Cartão de Débito",
    CASH: "Dinheiro",
    TRANSFER: "Transferência",
    PIX: "PIX",
    CASHBACK: "Cashback",
    OTHER: "Outro"
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Saldo da Carteira */}
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Saldo da Carteira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.balance)}</div>
              <div className="p-2 bg-green-100 rounded-full">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Atualizado às {format(new Date(), 'HH:mm')}
            </p>
          </CardContent>
        </Card>
        
        {/* Total de Vendas */}
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalSales)}</div>
              <div className="p-2 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              42 transações realizadas
            </p>
          </CardContent>
        </Card>
        
        {/* Total de Clientes */}
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">{dashboardData.totalCustomers}</div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              5 novos esta semana
            </p>
          </CardContent>
        </Card>
        
        {/* Pendentes */}
        <Card className="bg-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Transações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">{dashboardData.pendingTransactions}</div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico de Vendas */}
        <Card className="lg:col-span-2 bg-white shadow-md">
          <CardHeader>
            <CardTitle>Vendas da Semana</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.salesByDay}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${formatCurrency(value)}`, 'Vendas']}
                  labelFormatter={(label: any) => `${label}`}
                />
                <Bar dataKey="vendas" fill="#0066B3" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Status das Transações */}
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Status das Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.statusCounts.map((item: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.status}</span>
                    <span className="text-sm text-gray-500">{item.count}</span>
                  </div>
                  <Progress
                    value={(item.count / dashboardData.totalTransactions) * 100}
                    className={`h-2 ${item.color}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Últimas Vendas */}
      <Card className="bg-white shadow-md mb-6">
        <CardHeader>
          <CardTitle>Últimas Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <ScrollArea className="h-64">
              <div className="grid gap-4">
                {dashboardData.recentSales.map((sale: any) => (
                  <div 
                    key={sale.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-gray-100 p-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{sale.customerName}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(sale.amount)}</p>
                      <Badge className={`${statusColors[sale.status] || 'bg-gray-500'} text-white`}>
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      
      {/* Métodos de Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.paymentMethods.map((item: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.method}</span>
                    <span className="text-sm text-gray-500">{item.value}%</span>
                  </div>
                  <Progress
                    value={item.value}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Ações Rápidas */}
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-blue-50"
                onClick={() => alert("Registrar Venda (Demonstração)")}
              >
                <ShoppingCart className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium">Registrar Venda</span>
              </button>
              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-green-50"
                onClick={() => alert("Scanner QR Code (Demonstração)")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-green-600 mb-2">
                  <rect width="5" height="5" x="3" y="3" rx="1" />
                  <rect width="5" height="5" x="16" y="3" rx="1" />
                  <rect width="5" height="5" x="3" y="16" rx="1" />
                  <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                  <path d="M21 21v.01" />
                  <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                  <path d="M3 12h.01" />
                  <path d="M12 3h.01" />
                  <path d="M12 16v.01" />
                  <path d="M16 12h1" />
                  <path d="M21 12v.01" />
                  <path d="M12 21v-1" />
                </svg>
                <span className="text-sm font-medium">Scanner QR Code</span>
              </button>
              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-purple-50"
                onClick={() => alert("Gerenciar Produtos (Demonstração)")}
              >
                <Store className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium">Gerenciar Produtos</span>
              </button>
              <button 
                className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-orange-50"
                onClick={() => alert("Solicitar Saque (Demonstração)")}
              >
                <Wallet className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium">Solicitar Saque</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}