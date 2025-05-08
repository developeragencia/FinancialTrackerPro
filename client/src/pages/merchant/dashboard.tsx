import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { BarChartComponent } from "@/components/ui/charts";
import { ShoppingCart, DollarSign, Users, Percent, Eye } from "lucide-react";
import { Link } from "wouter";

// Mock data - would be replaced with real data from API
const salesSummary = {
  today: {
    total: 2150.75,
    transactions: 23,
    average: 93.51,
    commission: 43.01
  }
};

const weekSalesData = [
  { day: "Segunda", value: 1800 },
  { day: "Terça", value: 2200 },
  { day: "Quarta", value: 1950 },
  { day: "Quinta", value: 2100 },
  { day: "Sexta", value: 2350 },
  { day: "Sábado", value: 2500 },
  { day: "Domingo", value: 2150.75 }
];

const recentSales = [
  { id: 1, customer: "Maria Silva", date: "21/07/2023 15:45", amount: 150.00, cashback: 3.00, items: "5 itens" },
  { id: 2, customer: "José Santos", date: "21/07/2023 14:30", amount: 75.20, cashback: 1.50, items: "3 itens" },
  { id: 3, customer: "Ana Oliveira", date: "21/07/2023 11:15", amount: 200.00, cashback: 4.00, items: "7 itens" }
];

const topProducts = [
  { name: "Arroz Integral", sales: 45, total: 675.00 },
  { name: "Leite Desnatado", sales: 38, total: 190.00 },
  { name: "Café Gourmet", sales: 30, total: 450.00 }
];

export default function MerchantDashboard() {
  // Query to get merchant dashboard data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/merchant/dashboard'],
  });

  return (
    <DashboardLayout title="Dashboard" type="merchant">
      {/* Summary Cards */}
      <StatCardGrid className="mb-6">
        <StatCard
          title="Total de Vendas Hoje"
          value={`R$ ${salesSummary.today.total.toFixed(2)}`}
          icon={<DollarSign className="h-5 w-5 text-accent" />}
        />
        <StatCard
          title="Transações Hoje"
          value={salesSummary.today.transactions.toString()}
          icon={<ShoppingCart className="h-5 w-5 text-accent" />}
        />
        <StatCard
          title="Valor Médio"
          value={`R$ ${salesSummary.today.average.toFixed(2)}`}
          icon={<Users className="h-5 w-5 text-accent" />}
        />
        <StatCard
          title="Comissão (2%)"
          value={`R$ ${salesSummary.today.commission.toFixed(2)}`}
          icon={<Percent className="h-5 w-5 text-accent" />}
        />
      </StatCardGrid>

      {/* Sales Chart */}
      <BarChartComponent
        title="Vendas da Semana"
        data={weekSalesData}
        bars={[{ dataKey: "value", name: "Vendas Diárias (R$)" }]}
        xAxisDataKey="day"
        className="mb-6"
      />

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vendas Recentes</CardTitle>
              <CardDescription>As últimas transações realizadas</CardDescription>
            </div>
            <Link href="/merchant/sales">
              <Button variant="ghost" className="text-accent">Ver todas</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{sale.customer}</span>
                    <span className="font-medium">R$ {sale.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{sale.date}</span>
                    <span>{sale.items}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Os itens mais populares do seu estabelecimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center">
                  <div className="text-accent font-bold w-6">{index + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.sales} vendas · R$ {product.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{ width: `${Math.round((product.sales / topProducts[0].sales) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse as principais funcionalidades do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/merchant/sales">
              <Button className="w-full bg-accent">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Registrar Venda
              </Button>
            </Link>
            <Link href="/merchant/scanner">
              <Button className="w-full bg-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scanner QR Code
              </Button>
            </Link>
            <Link href="/merchant/products">
              <Button className="w-full bg-accent">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Gerenciar Produtos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
