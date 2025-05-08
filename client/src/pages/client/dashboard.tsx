import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { LineChartComponent } from "@/components/ui/charts";
import { Wallet, ArrowRightLeft, QrCode, History, Tag, Gift } from "lucide-react";
import { Link } from "wouter";

// Mock data - would be replaced with real data from API in production
const balanceData = [
  { month: "Jan", value: 50 },
  { month: "Fev", value: 90 },
  { month: "Mar", value: 150 },
  { month: "Abr", value: 180 },
  { month: "Mai", value: 210 },
  { month: "Jun", value: 235.5 },
];

const recentTransactions = [
  { id: 1, store: "Mercado Central", date: "15/07/2023", amount: 150.00, cashback: 3.00, status: "completed" },
  { id: 2, store: "Farmácia Popular", date: "12/07/2023", amount: 75.20, cashback: 1.50, status: "completed" },
  { id: 3, store: "Posto Shell", date: "10/07/2023", amount: 200.00, cashback: 4.00, status: "completed" },
  { id: 4, store: "Livraria Cultura", date: "05/07/2023", amount: 120.50, cashback: 2.41, status: "completed" },
  { id: 5, store: "Shopping Center Norte", date: "01/07/2023", amount: 350.75, cashback: 7.01, status: "completed" }
];

const monthSummary = {
  earned: 17.92,
  transferred: 5.00,
  received: 10.00
};

export default function ClientDashboard() {
  // Example query to get client data
  const { data: clientData, isLoading } = useQuery({
    queryKey: ['/api/client/dashboard'],
    retry: false,
  });

  return (
    <DashboardLayout title="Dashboard" type="client">
      {/* Balance Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <p className="text-muted-foreground mb-1">Seu saldo de cashback</p>
              <h2 className="text-3xl font-bold text-primary">
                R$ {isLoading ? "..." : (clientData?.balance || 235.50).toFixed(2)}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              <Link href="/client/transfers">
                <Button className="bg-secondary">
                  <ArrowRightLeft className="mr-2 h-4 w-4" /> Transferir
                </Button>
              </Link>
              <Link href="/client/qr-code">
                <Button className="bg-secondary">
                  <QrCode className="mr-2 h-4 w-4" /> Gerar QR Code
                </Button>
              </Link>
              <Link href="/client/transactions">
                <Button variant="outline">
                  <History className="mr-2 h-4 w-4" /> Ver Histórico
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Balance Evolution Chart */}
        <LineChartComponent
          title="Evolução do Saldo"
          data={balanceData}
          lines={[
            { dataKey: "value", name: "Saldo (R$)" }
          ]}
          xAxisDataKey="month"
        />

        {/* Month Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center text-muted-foreground">
                <div className="mr-2 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Total Ganho</span>
              </div>
              <div className="font-medium">R$ {monthSummary.earned.toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center text-muted-foreground">
                <div className="mr-2 text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Total Transferido</span>
              </div>
              <div className="font-medium">R$ {monthSummary.transferred.toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-muted-foreground">
                <div className="mr-2 text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Total Recebido</span>
              </div>
              <div className="font-medium">R$ {monthSummary.received.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="mb-6">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Transações Recentes</CardTitle>
          <Link href="/client/transactions">
            <Button variant="ghost" className="text-secondary">Ver todas</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-muted-foreground text-left border-b">
                  <th className="pb-2 font-medium">Loja</th>
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                  <th className="pb-2 font-medium text-right">Cashback</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="py-3">{transaction.store}</td>
                    <td className="py-3">{transaction.date}</td>
                    <td className="py-3 text-right">R$ {transaction.amount.toFixed(2)}</td>
                    <td className="py-3 text-right">R$ {transaction.cashback.toFixed(2)}</td>
                    <td className="py-3">
                      <span className="status-completed">Concluída</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Promotions and Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Promoções e Notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start p-3 bg-secondary/10 rounded-lg">
            <Tag className="text-secondary mt-1 mr-3 h-5 w-5" />
            <div>
              <h4 className="font-medium">Supermercado Extra - Cashback Duplo!</h4>
              <p className="text-sm text-muted-foreground">
                Ganhe o dobro de cashback em compras acima de R$ 100. Válido até 31/07.
              </p>
            </div>
          </div>
          <div className="flex items-start p-3 bg-accent/10 rounded-lg">
            <Gift className="text-accent mt-1 mr-3 h-5 w-5" />
            <div>
              <h4 className="font-medium">Bônus de Aniversário</h4>
              <p className="text-sm text-muted-foreground">
                Você tem R$ 10,00 em cashback de presente pelo seu aniversário. Válido por 7 dias.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
