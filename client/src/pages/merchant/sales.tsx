import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Eye, Plus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Mock data - would be replaced with real data from API
const recentSales = [
  { id: 1, customer: "Maria Silva", date: "21/07/2023 15:45", amount: 150.00, cashback: 3.00, items: "5 itens" },
  { id: 2, customer: "José Santos", date: "21/07/2023 14:30", amount: 75.20, cashback: 1.50, items: "3 itens" },
  { id: 3, customer: "Ana Oliveira", date: "21/07/2023 11:15", amount: 200.00, cashback: 4.00, items: "7 itens" },
  { id: 4, customer: "Carlos Souza", date: "21/07/2023 10:20", amount: 120.50, cashback: 2.41, items: "4 itens" },
  { id: 5, customer: "Juliana Lima", date: "21/07/2023 09:00", amount: 350.75, cashback: 7.01, items: "12 itens" }
];

const productItems = [
  { id: 1, name: "Arroz Integral", price: 15.00 },
  { id: 2, name: "Leite Desnatado", price: 5.00 },
];

export default function MerchantSales() {
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState(productItems);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState<number | string>("");
  const [sendReceipt, setSendReceipt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const cashbackAmount = totalAmount * 0.02; // 2% cashback
  const discountValue = discount ? parseFloat(discount.toString()) : 0;
  const finalAmount = Math.max(0, totalAmount - discountValue);

  const handleAddProduct = () => {
    // In a real implementation, this would open a product selection modal
    toast({
      title: "Adicionar produto",
      description: "Funcionalidade de adicionar produto será implementada em breve.",
    });
  };

  const handleRemoveProduct = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || items.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome do cliente e adicione pelo menos um produto.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // This would be an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Venda registrada",
        description: `Venda no valor de R$ ${finalAmount.toFixed(2)} registrada com sucesso.`,
      });
      
      // Reset form
      setCustomerName("");
      setItems([]);
      setSelectedPaymentMethod("cash");
      setDiscount("");
      setSendReceipt(false);
      
      // Refresh sales data
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/sales'] });
    } catch (error) {
      toast({
        title: "Erro ao registrar venda",
        description: "Ocorreu um erro ao registrar a venda. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Column configuration for sales table
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Cliente",
      accessorKey: "customer",
    },
    {
      header: "Data/Hora",
      accessorKey: "date",
    },
    {
      header: "Valor",
      accessorKey: "amount",
      cell: (row: any) => `R$ ${row.amount.toFixed(2)}`,
    },
    {
      header: "Itens",
      accessorKey: "items",
    }
  ];

  // Actions for sales table
  const actions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: (sale: any) => {
        toast({
          title: `Venda #${sale.id}`,
          description: `Cliente: ${sale.customer}, Valor: R$ ${sale.amount.toFixed(2)}`,
        });
      },
    },
  ];

  return (
    <DashboardLayout title="Registro de Vendas" type="merchant">
      <div className="grid md:grid-cols-2 gap-6">
        {/* New Sale Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterSale} className="space-y-4">
              <div>
                <Label htmlFor="customer">Cliente</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente ou e-mail"
                  disabled={isProcessing}
                />
              </div>
              
              <div>
                <Label>Produtos</Label>
                <div className="border rounded-md p-2 mb-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center w-16">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                            Nenhum produto adicionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveProduct(item.id)}
                                disabled={isProcessing}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProduct}
                  disabled={isProcessing}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total">Valor Total (R$)</Label>
                  <Input
                    id="total"
                    value={totalAmount.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="cashback">Cashback (2%)</Label>
                  <Input
                    id="cashback"
                    value={cashbackAmount.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Desconto (R$)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <Label htmlFor="payment-method">Método de Pagamento</Label>
                  <Select
                    defaultValue={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                    disabled={isProcessing}
                  >
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="Selecione um método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-receipt"
                  checked={sendReceipt}
                  onCheckedChange={(checked) => setSendReceipt(checked as boolean)}
                  disabled={isProcessing}
                />
                <Label htmlFor="send-receipt">Enviar comprovante por e-mail</Label>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-accent"
                disabled={isProcessing || items.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Registrar Venda
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={recentSales}
              columns={columns}
              actions={actions}
              pagination={{
                pageIndex: 0,
                pageSize: 5,
                pageCount: Math.ceil(recentSales.length / 5),
                onPageChange: (page) => console.log("Page changed:", page),
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
