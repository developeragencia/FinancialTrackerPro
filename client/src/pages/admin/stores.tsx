import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Store, 
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Settings,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  BarChart,
  PieChart,
  Loader2
} from "lucide-react";
import { LineChartComponent, BarChartComponent, PieChartComponent } from "@/components/ui/charts";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Mock stores data - would be replaced with real data from API
const stores = [
  { 
    id: 1, 
    name: "Mercado Central", 
    cnpj: "12.345.678/0001-90", 
    owner: "Carlos Mendes", 
    category: "Supermercado", 
    status: "active", 
    transactions: 250, 
    volume: 22500.00,
    commissionRate: 2.0,
    address: "Av. Brasil, 1234",
    city: "São Paulo",
    state: "SP",
    phone: "(11) 3456-7890",
    email: "contato@mercadocentral.com",
    website: "www.mercadocentral.com.br",
    createdAt: "15/02/2023",
    logo: "",
    salesData: [
      { month: "Jan", value: 3200 },
      { month: "Fev", value: 3500 },
      { month: "Mar", value: 3800 },
      { month: "Abr", value: 4100 },
      { month: "Mai", value: 4500 },
      { month: "Jun", value: 4800 },
      { month: "Jul", value: 5100 }
    ],
    categoryData: [
      { name: "Alimentos", value: 60 },
      { name: "Bebidas", value: 20 },
      { name: "Limpeza", value: 10 },
      { name: "Higiene", value: 10 }
    ]
  },
  { 
    id: 2, 
    name: "Farmácia Popular", 
    cnpj: "23.456.789/0001-01", 
    owner: "Ana Oliveira", 
    category: "Farmácia", 
    status: "active", 
    transactions: 180, 
    volume: 15750.50,
    commissionRate: 2.0,
    email: "contato@farmaciapopular.com"
  },
  { 
    id: 3, 
    name: "Posto Shell", 
    cnpj: "34.567.890/0001-12", 
    owner: "Roberto Santos", 
    category: "Posto de Combustível", 
    status: "active", 
    transactions: 120, 
    volume: 18000.00,
    commissionRate: 2.0,
    email: "contato@postoshell.com"
  },
  { 
    id: 4, 
    name: "Livraria Cultura", 
    cnpj: "45.678.901/0001-23", 
    owner: "Juliana Lima", 
    category: "Livraria", 
    status: "active", 
    transactions: 90, 
    volume: 9500.75,
    commissionRate: 2.0,
    email: "contato@livraricultura.com"
  },
  { 
    id: 5, 
    name: "Shopping Center Norte", 
    cnpj: "56.789.012/0001-34", 
    owner: "Fernando Costa", 
    category: "Shopping Center", 
    status: "inactive", 
    transactions: 0, 
    volume: 0.00,
    commissionRate: 2.0,
    email: "contato@shoppingnorte.com"
  },
  { 
    id: 6, 
    name: "Restaurante Sabor Brasil", 
    cnpj: "67.890.123/0001-45", 
    owner: "Paulo Mendes", 
    category: "Alimentação", 
    status: "pending", 
    transactions: 0, 
    volume: 0.00,
    commissionRate: 2.0,
    email: "contato@saborbrasil.com"
  },
  { 
    id: 7, 
    name: "Auto Peças Expresso", 
    cnpj: "78.901.234/0001-56", 
    owner: "Sandra Lima", 
    category: "Automotivo", 
    status: "pending", 
    transactions: 0, 
    volume: 0.00,
    commissionRate: 2.0,
    email: "contato@autopecas.com"
  }
];

export default function AdminStores() {
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commissionRate, setCommissionRate] = useState<string>("2.0");
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();

  // Query to get stores data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/stores'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const handleViewStore = (store: any) => {
    setSelectedStore(store);
    setIsDialogOpen(true);
  };

  const handleEditStore = (store: any) => {
    // This would navigate to an edit form in a real implementation
    toast({
      title: "Editar loja",
      description: `Editando ${store.name}`,
    });
  };

  const handleApprovalDialog = (store: any) => {
    setSelectedStore(store);
    setIsApprovalDialogOpen(true);
  };

  const handleRejectDialog = (store: any) => {
    setSelectedStore(store);
    setIsRejectDialogOpen(true);
  };

  const handleBlockDialog = (store: any) => {
    setSelectedStore(store);
    setIsBlockDialogOpen(true);
  };

  const handleCommissionDialog = (store: any) => {
    setSelectedStore(store);
    setCommissionRate(store.commissionRate?.toString() || "2.0");
    setIsCommissionDialogOpen(true);
  };

  const handleApproveStore = async () => {
    if (!selectedStore) return;
    
    setIsProcessing(true);
    
    try {
      // This would be an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Loja aprovada",
        description: `${selectedStore.name} foi aprovada com sucesso.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      setIsApprovalDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao aprovar a loja.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectStore = async () => {
    if (!selectedStore) return;
    
    if (!rejectReason) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // This would be an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Loja rejeitada",
        description: `${selectedStore.name} foi rejeitada.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      setIsRejectDialogOpen(false);
      setRejectReason("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao rejeitar a loja.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBlockStore = async () => {
    if (!selectedStore) return;
    
    setIsProcessing(true);
    
    try {
      // This would be an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const action = selectedStore.status === "inactive" ? "ativada" : "desativada";
      
      toast({
        title: `Loja ${action}`,
        description: `${selectedStore.name} foi ${action} com sucesso.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      setIsBlockDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao alterar o status da loja.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCommission = async () => {
    if (!selectedStore) return;
    
    setIsProcessing(true);
    
    try {
      // This would be an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Comissão atualizada",
        description: `Taxa de comissão para ${selectedStore.name} alterada para ${commissionRate}%.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stores'] });
      setIsCommissionDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a taxa de comissão.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativa";
      case "inactive": return "Inativa";
      case "pending": return "Pendente";
      default: return status;
    }
  };

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Column configuration
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Nome",
      accessorKey: "name",
    },
    {
      header: "CNPJ",
      accessorKey: "cnpj",
    },
    {
      header: "Responsável",
      accessorKey: "owner",
    },
    {
      header: "Categoria",
      accessorKey: "category",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: any) => (
        <Badge 
          variant="outline"
          className={
            row.status === "active" 
              ? "bg-green-100 text-green-800 border-green-200" 
              : row.status === "inactive"
              ? "bg-gray-100 text-gray-800 border-gray-200"
              : "bg-yellow-100 text-yellow-800 border-yellow-200"
          }
        >
          {getStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      header: "Transações",
      accessorKey: "transactions",
      cell: (row: any) => row.transactions.toLocaleString(),
    },
    {
      header: "Volume (R$)",
      accessorKey: "volume",
      cell: (row: any) => row.volume.toFixed(2),
    },
  ];

  // Actions configuration
  const actions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewStore,
    },
    {
      label: "Editar",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditStore,
    },
    {
      label: "Taxa de comissão",
      icon: <Settings className="h-4 w-4" />,
      onClick: handleCommissionDialog,
    },
    {
      label: "Ativar/Desativar",
      icon: <Ban className="h-4 w-4" />,
      onClick: handleBlockDialog,
    },
  ];

  // Filter options
  const categoryOptions = [
    { label: "Todas", value: "all" },
    { label: "Supermercado", value: "Supermercado" },
    { label: "Farmácia", value: "Farmácia" },
    { label: "Restaurante", value: "Alimentação" },
    { label: "Posto", value: "Posto de Combustível" },
    { label: "Livraria", value: "Livraria" },
    { label: "Shopping", value: "Shopping Center" },
    { label: "Automotivo", value: "Automotivo" },
  ];

  const statusOptions = [
    { label: "Todos", value: "all" },
    { label: "Ativa", value: "active" },
    { label: "Inativa", value: "inactive" },
    { label: "Pendente", value: "pending" },
  ];

  const filters = [
    {
      name: "Categoria",
      options: categoryOptions,
      onChange: (value: string) => console.log("Category filter:", value),
    },
    {
      name: "Status",
      options: statusOptions,
      onChange: (value: string) => console.log("Status filter:", value),
    },
  ];

  return (
    <DashboardLayout title="Gestão de Lojas" type="admin">
      <Card>
        <CardHeader>
          <CardTitle>Lojas Cadastradas</CardTitle>
          <CardDescription>
            Gerencie todas as lojas do Vale Cashback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data?.stores || stores}
            columns={columns}
            actions={actions}
            filters={filters}
            searchable={true}
            onSearch={(value) => console.log("Searching:", value)}
            pagination={{
              pageIndex: 0,
              pageSize: 10,
              pageCount: Math.ceil((data?.stores || stores).length / 10),
              onPageChange: (page) => console.log("Page:", page),
            }}
            exportable={true}
            onExport={() => console.log("Exporting stores")}
          />
        </CardContent>
      </Card>

      {/* Store Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Loja</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a loja
            </DialogDescription>
          </DialogHeader>
          
          {selectedStore && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">
                  <Store className="mr-2 h-4 w-4" />
                  <span>Informações</span>
                </TabsTrigger>
                <TabsTrigger value="sales">
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Vendas</span>
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <PieChart className="mr-2 h-4 w-4" />
                  <span>Análise</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage 
                        src={selectedStore.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStore.name)}&background=random&color=fff&size=128`}
                        alt={selectedStore.name} 
                      />
                      <AvatarFallback className="text-lg bg-accent text-white">
                        {getInitials(selectedStore.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold">{selectedStore.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedStore.category}</p>
                      
                      <Badge 
                        variant="outline"
                        className={
                          selectedStore.status === "active" 
                            ? "bg-green-100 text-green-800 border-green-200 mt-2" 
                            : selectedStore.status === "inactive"
                            ? "bg-gray-100 text-gray-800 border-gray-200 mt-2"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200 mt-2"
                        }
                      >
                        {getStatusLabel(selectedStore.status)}
                      </Badge>
                    </div>
                    
                    <div className="w-full space-y-2">
                      {selectedStore.address && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">
                            {selectedStore.address}, {selectedStore.city}/{selectedStore.state}
                          </span>
                        </div>
                      )}
                      
                      {selectedStore.phone && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{selectedStore.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center p-2 bg-muted rounded">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{selectedStore.email}</span>
                      </div>
                      
                      <div className="flex items-center p-2 bg-muted rounded">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Responsável: {selectedStore.owner}</span>
                      </div>
                      
                      {selectedStore.createdAt && (
                        <div className="flex items-center p-2 bg-muted rounded">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Cadastro: {selectedStore.createdAt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:w-2/3">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/20 rounded-lg">
                          <h4 className="text-sm text-muted-foreground mb-1">Volume de Vendas</h4>
                          <div className="text-2xl font-bold text-accent">
                            R$ {selectedStore.volume.toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted/20 rounded-lg">
                          <h4 className="text-sm text-muted-foreground mb-1">Transações</h4>
                          <div className="text-2xl font-bold text-accent">
                            {selectedStore.transactions}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Detalhes da Loja</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">CNPJ:</span>
                            <span>{selectedStore.cnpj}</span>
                          </div>
                          
                          <div className="flex justify-between border-b py-2">
                            <span className="text-muted-foreground">Taxa de Comissão:</span>
                            <span>{selectedStore.commissionRate}%</span>
                          </div>
                          
                          {selectedStore.website && (
                            <div className="flex justify-between border-b py-2">
                              <span className="text-muted-foreground">Website:</span>
                              <span>{selectedStore.website}</span>
                            </div>
                          )}
                          
                          {/* Add more store details here */}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-end mt-4 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleEditStore(selectedStore)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsDialogOpen(false);
                          handleCommissionDialog(selectedStore);
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" /> Taxa de Comissão
                      </Button>
                      
                      {selectedStore.status === "pending" ? (
                        <>
                          <Button 
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setIsDialogOpen(false);
                              handleApprovalDialog(selectedStore);
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => {
                              setIsDialogOpen(false);
                              handleRejectDialog(selectedStore);
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant={selectedStore.status === "inactive" ? "default" : "destructive"}
                          onClick={() => {
                            setIsDialogOpen(false);
                            handleBlockDialog(selectedStore);
                          }}
                        >
                          {selectedStore.status === "inactive" ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" /> Ativar
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" /> Desativar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sales" className="mt-4">
                <div className="space-y-6">
                  {selectedStore.salesData ? (
                    <LineChartComponent
                      title="Histórico de Vendas"
                      data={selectedStore.salesData}
                      lines={[
                        { dataKey: "value", name: "Vendas (R$)" }
                      ]}
                      xAxisDataKey="month"
                      height={300}
                    />
                  ) : (
                    <div className="p-6 text-center border rounded-lg">
                      <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="font-medium text-lg mb-2">Sem dados de vendas</h3>
                      <p className="text-muted-foreground">
                        Esta loja ainda não possui dados de vendas disponíveis.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="text-muted-foreground text-sm">Ticket Médio</h3>
                          <div className="text-2xl font-bold">
                            R$ {selectedStore.transactions > 0 
                              ? (selectedStore.volume / selectedStore.transactions).toFixed(2) 
                              : "0.00"}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="text-muted-foreground text-sm">Comissão Total</h3>
                          <div className="text-2xl font-bold">
                            R$ {(selectedStore.volume * (selectedStore.commissionRate / 100)).toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h3 className="text-muted-foreground text-sm">Transações/Dia</h3>
                          <div className="text-2xl font-bold">
                            {(selectedStore.transactions / 30).toFixed(1)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-4">
                <div className="space-y-6">
                  {selectedStore.categoryData ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <PieChartComponent
                        title="Distribuição por Categoria"
                        data={selectedStore.categoryData}
                        donut={true}
                        innerRadius={60}
                        height={300}
                      />
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Análise de Desempenho</CardTitle>
                          <CardDescription>
                            Comparativo com outras lojas da mesma categoria
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Volume de Vendas</span>
                              <div className="w-48 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-accent h-2 rounded-full" 
                                  style={{ width: '65%' }}
                                ></div>
                              </div>
                              <span className="text-sm">65%</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Número de Transações</span>
                              <div className="w-48 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-accent h-2 rounded-full" 
                                  style={{ width: '78%' }}
                                ></div>
                              </div>
                              <span className="text-sm">78%</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Ticket Médio</span>
                              <div className="w-48 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-accent h-2 rounded-full" 
                                  style={{ width: '45%' }}
                                ></div>
                              </div>
                              <span className="text-sm">45%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="p-6 text-center border rounded-lg">
                      <PieChart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="font-medium text-lg mb-2">Sem dados analíticos</h3>
                      <p className="text-muted-foreground">
                        Esta loja ainda não possui dados analíticos disponíveis.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Store Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Loja</DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar a loja {selectedStore?.name}.
              Após a aprovação, a loja poderá iniciar as operações no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 my-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Informações verificadas</h4>
                <p className="text-sm text-green-700">
                  Certifique-se de que todos os dados da loja foram verificados e estão corretos.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApproveStore}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : "Confirmar Aprovação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Store Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Loja</DialogTitle>
            <DialogDescription>
              Você está prestes a rejeitar a loja {selectedStore?.name}.
              Por favor, informe o motivo da rejeição.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Motivo da Rejeição</Label>
              <Textarea
                id="reject-reason"
                placeholder="Informe o motivo da rejeição..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
                disabled={isProcessing}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectStore}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block/Unblock Store Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStore?.status === "inactive" ? "Ativar Loja" : "Desativar Loja"}
            </DialogTitle>
            <DialogDescription>
              {selectedStore?.status === "inactive" 
                ? `Você está prestes a ativar a loja ${selectedStore?.name}. Isso permitirá que a loja opere no sistema.`
                : `Você está prestes a desativar a loja ${selectedStore?.name}. Isso impedirá que a loja opere no sistema.`
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedStore?.status !== "inactive" && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 my-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Atenção</h4>
                  <p className="text-sm text-yellow-700">
                    A desativação da loja impedirá o processamento de novas transações.
                    Transações existentes não serão afetadas.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBlockDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant={selectedStore?.status === "inactive" ? "default" : "destructive"}
              onClick={handleBlockStore}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : selectedStore?.status === "inactive" ? "Confirmar Ativação" : "Confirmar Desativação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Rate Dialog */}
      <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Taxa de Comissão</DialogTitle>
            <DialogDescription>
              Ajuste a taxa de comissão para {selectedStore?.name}.
              A taxa padrão do sistema é de 2%.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Taxa de Comissão (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                min="0"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <BarChart className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  {parseFloat(commissionRate) > 2 
                    ? "Esta taxa é maior que a taxa padrão do sistema (2%)." 
                    : parseFloat(commissionRate) < 2
                    ? "Esta taxa é menor que a taxa padrão do sistema (2%)."
                    : "Esta é a taxa padrão do sistema."}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCommissionDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateCommission}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : "Atualizar Taxa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
