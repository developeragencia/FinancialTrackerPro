import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

// Mock transfer data - would be replaced with real data from API
const transferHistory = [
  { id: 1, type: "sent", user: "maria@email.com", amount: 5.00, date: "10/07/2023", time: "14:30", description: "Ajuda com o almoço", status: "completed" },
  { id: 2, type: "received", user: "carlos@email.com", amount: 10.00, date: "05/07/2023", time: "09:15", description: "Divisão de conta", status: "completed" },
  { id: 3, type: "sent", user: "pedro@email.com", amount: 15.00, date: "01/07/2023", time: "18:22", description: "Pagamento", status: "completed" },
  { id: 4, type: "received", user: "ana@email.com", amount: 7.50, date: "28/06/2023", time: "11:05", description: "Presente", status: "completed" },
];

export default function ClientTransfers() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Query to get transfer history
  const { data, isLoading } = useQuery({
    queryKey: ['/api/client/transfers'],
  });

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient || !amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await apiRequest("POST", "/api/client/transfers", {
        recipient,
        amount: parseFloat(amount),
        description,
      });

      // Reset form
      setRecipient("");
      setAmount("");
      setDescription("");

      // Invalidate transfers query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/client/transfers'] });

      toast({
        title: "Transferência realizada",
        description: `Você transferiu R$ ${parseFloat(amount).toFixed(2)} para ${recipient}`,
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Erro na transferência",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Transferências" type="client">
      <div className="grid md:grid-cols-2 gap-6">
        {/* New Transfer Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Transferência</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">E-mail do Destinatário</Label>
                <Input
                  id="recipient"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Motivo da transferência"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full bg-secondary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Transferir
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transfer History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transferências</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.transfers || transferHistory).map((transfer) => (
                  <div key={transfer.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">
                        {transfer.type === "sent" ? "Enviado para: " : "Recebido de: "}
                        {transfer.user}
                      </span>
                      <span className={transfer.type === "sent" ? "text-red-600" : "text-green-600"}>
                        {transfer.type === "sent" ? "-" : "+"}R$ {transfer.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>{transfer.date} às {transfer.time}</span>
                      </div>
                      <span className="truncate max-w-[150px]">{transfer.description}</span>
                    </div>
                    {transfer.status && (
                      <div className="mt-2 flex justify-end">
                        <Badge variant={transfer.status === "completed" ? "success" : "pending"}>
                          {transfer.status === "completed" ? "Concluída" : "Pendente"}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}

                {(data?.transfers || transferHistory).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhuma transferência encontrada.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
