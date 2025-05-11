import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Edit, Check, X, RefreshCw, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Cores para os diferentes status de transação
const statusColors: Record<string, string> = {
  completed: "bg-green-500",
  pending: "bg-orange-500",
  cancelled: "bg-red-500",
  refunded: "bg-blue-500"
};

// Mapeamento de métodos de pagamento
const PaymentMethod: Record<string, string> = {
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
  PIX: "PIX",
  CASHBACK: "Cashback",
  OTHER: "Outro"
};

export default function DemoMerchantTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Carregar dados de exemplo
  useEffect(() => {
    console.log("Carregando dados de transações do lojista (modo demonstração)");
    
    // Simular tempo de carregamento
    const timer = setTimeout(() => {
      // Dados de exemplo para a demonstração
      setTransactions([
        {
          id: 1,
          userName: "Maria Silva",
          amount: 270.50,
          cashback_amount: 5.41,
          payment_method: "CREDIT_CARD",
          status: "completed",
          created_at: new Date().toISOString(),
          description: "Compra de produtos"
        },
        {
          id: 2,
          userName: "João Santos",
          amount: 150.25,
          cashback_amount: 3.00,
          payment_method: "PIX",
          status: "completed",
          created_at: new Date().toISOString(),
          description: "Serviços prestados"
        },
        {
          id: 3,
          userName: "Ana Oliveira",
          amount: 320.00,
          cashback_amount: 6.40,
          payment_method: "CASH",
          status: "pending",
          created_at: new Date().toISOString(),
          description: "Venda em processamento"
        },
        {
          id: 4,
          userName: "Carlos Mendes",
          amount: 95.75,
          cashback_amount: 1.92,
          payment_method: "DEBIT_CARD",
          status: "completed",
          created_at: new Date(Date.now() - 86400000).toISOString(), // Ontem
          description: "Compra na loja"
        },
        {
          id: 5,
          userName: "Fernanda Costa",
          amount: 180.00,
          cashback_amount: 3.60,
          payment_method: "CREDIT_CARD",
          status: "cancelled",
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
          description: "Cancelado pelo cliente"
        }
      ]);
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Filtrar transações com base no termo de busca
  const filteredTransactions = transactions?.filter((transaction) => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Busca em múltiplos campos
    return (
      transaction.id.toString().includes(searchTermLower) ||
      transaction.userName?.toLowerCase().includes(searchTermLower) ||
      transaction.amount?.toString().includes(searchTermLower) ||
      transaction.payment_method?.toLowerCase().includes(searchTermLower) ||
      transaction.status?.toLowerCase().includes(searchTermLower)
    );
  });
  
  // Funções de demonstração (não fazem nada)
  const handleAction = (action: string, transaction: any) => {
    console.log(`Ação: ${action}`, transaction);
    alert(`Ação: ${action} para transação ID ${transaction.id}`);
  };
  
  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gerenciamento de Transações (Demonstração)</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            Visualize, edite, cancele ou reembolse suas transações (Versão de demonstração)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Cashback</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions?.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{transaction.userName || 'N/A'}</TableCell>
                        <TableCell>{transaction.created_at ? format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{formatCurrency(transaction.cashback_amount)}</TableCell>
                        <TableCell>{PaymentMethod[transaction.payment_method] || transaction.payment_method}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[transaction.status] || 'bg-gray-500'} text-white`}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* Botão de editar - disponível para transações completed ou pending */}
                            {['completed', 'pending'].includes(transaction.status) && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleAction('editar', transaction)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Botão de completar - disponível apenas para transações pending */}
                            {transaction.status === 'pending' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleAction('completar', transaction)}
                                title="Completar"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            
                            {/* Botão de cancelar - disponível para transações completed ou pending */}
                            {['completed', 'pending'].includes(transaction.status) && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleAction('cancelar', transaction)}
                                title="Cancelar"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                            
                            {/* Botão de reembolsar - disponível apenas para transações completed */}
                            {transaction.status === 'completed' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleAction('reembolsar', transaction)}
                                title="Reembolsar"
                              >
                                <RefreshCw className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            
                            {/* Botão de excluir - disponível apenas para transações cancelled ou refunded */}
                            {['cancelled', 'refunded'].includes(transaction.status) && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleAction('excluir', transaction)}
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}