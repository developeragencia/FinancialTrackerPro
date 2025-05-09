import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Download } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

// Formatação de valores monetários
const formatCurrency = (value: string | number) => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(numValue);
};

// Componente de formulário de solicitação de saque
const WithdrawalRequestForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    amount: "",
    full_name: user?.name || "",
    store_name: "",
    phone: "",
    email: user?.email || "",
    bank_name: "",
    agency: "",
    account: "",
    payment_method: "bank",
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Tratamento especial para o campo de valor para permitir apenas números e ponto
    if (name === "amount") {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, payment_method: value });
  };
  
  const withdrawalMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/merchant/withdrawal-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de saque foi enviada com sucesso e será processada em breve.",
        variant: "default",
      });
      
      // Limpar formulário
      setFormData({
        amount: "",
        full_name: user?.name || "",
        store_name: "",
        phone: "",
        email: user?.email || "",
        bank_name: "",
        agency: "",
        account: "",
        payment_method: "bank",
      });
      
      // Atualizar a lista de solicitações
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/withdrawal-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido para o saque.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.full_name || !formData.store_name || !formData.phone || !formData.email || 
        !formData.bank_name || !formData.agency || !formData.account) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    withdrawalMutation.mutate(formData);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Solicitar Saque</CardTitle>
        <CardDescription>
          Preencha o formulário abaixo para solicitar um saque dos seus fundos.
          As solicitações são processadas em até 24 horas úteis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Saque ($)*</Label>
              <Input
                id="amount"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento*</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Transferência Bancária</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo*</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Nome completo do titular da conta"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="store_name">Nome da Loja*</Label>
              <Input
                id="store_name"
                name="store_name"
                placeholder="Nome da sua loja"
                value={formData.store_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone para Contato*</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email para Contato*</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bank_name">Nome do Banco*</Label>
              <Input
                id="bank_name"
                name="bank_name"
                placeholder="Nome do banco"
                value={formData.bank_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agency">Agência*</Label>
              <Input
                id="agency"
                name="agency"
                placeholder="Número da agência"
                value={formData.agency}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="account">Conta*</Label>
              <Input
                id="account"
                name="account"
                placeholder="Número da conta"
                value={formData.account}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={withdrawalMutation.isPending}
          >
            {withdrawalMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Solicitar Saque"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-muted-foreground">
        <p>
          * Todas as solicitações serão processadas em até 24 horas úteis.
        </p>
        <p>
          * O valor mínimo para saque é de $50,00.
        </p>
      </CardFooter>
    </Card>
  );
};

// Componente de histórico de saques
const WithdrawalHistory = () => {
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/merchant/withdrawal-requests"],
    queryFn: async () => {
      const res = await fetch("/api/merchant/withdrawal-requests");
      if (!res.ok) {
        throw new Error("Erro ao carregar histórico de saques");
      }
      return res.json();
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Erro ao carregar histórico de saques</p>
        <Button 
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }
  
  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };
  
  // Badge de status
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Recusado</Badge>;
      case "pending":
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de Saques</CardTitle>
        <CardDescription>
          Aqui você pode acompanhar todas as suas solicitações de saque.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data?.withdrawals?.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.withdrawals.map((withdrawal: any) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>{formatDate(withdrawal.created_at)}</TableCell>
                  <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                  <TableCell>
                    {withdrawal.payment_method === "bank" ? "Transferência" : "Zelle"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={withdrawal.status} />
                      {withdrawal.status === "completed" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {withdrawal.status === "rejected" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Você ainda não realizou nenhuma solicitação de saque.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Página principal
export default function MerchantWithdrawals() {
  return (
    <DashboardLayout merchant>
      <div className="flex flex-col space-y-8 p-4 md:p-8">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Solicitação de Saque</h2>
          <p className="text-muted-foreground">
            Solicite saques dos seus fundos e acompanhe o status das suas solicitações.
          </p>
        </div>
        
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Nova Solicitação</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="request" className="mt-6">
            <WithdrawalRequestForm />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <WithdrawalHistory />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}