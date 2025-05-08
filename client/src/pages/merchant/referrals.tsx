import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Share2, 
  Users, 
  Store, 
  ChevronRight, 
  RefreshCw, 
  QrCode, 
  Facebook,
  Twitter,
  Mail,
  Smartphone,
  Link as LinkIcon,
  CheckIcon,
  AlertCircle
} from "lucide-react";
import { ShareIcon } from "@/components/ui/icons";
import { QRCodeDisplay } from "@/components/ui/qr-code";

// Mock data - this would be replaced by API data
const referredStores = [
  { id: 1, name: "Supermercado Mais", date: "10/07/2023", status: "active", commission: 150.25 },
  { id: 2, name: "Padaria do João", date: "15/08/2023", status: "active", commission: 75.50 },
  { id: 3, name: "Farmácia Saúde", date: "01/09/2023", status: "pending", commission: 0 },
];

const commissionHistory = [
  { id: 1, store: "Supermercado Mais", date: "10/08/2023", amount: 25.35, type: "sale" },
  { id: 2, store: "Supermercado Mais", date: "15/08/2023", amount: 18.75, type: "sale" },
  { id: 3, store: "Padaria do João", date: "20/08/2023", amount: 12.80, type: "sale" },
  { id: 4, store: "Supermercado Mais", date: "25/08/2023", amount: 100.00, type: "monthly" },
  { id: 5, store: "Padaria do João", date: "01/09/2023", amount: 55.60, type: "monthly" },
];

// Commission rates
const COMMISSION_RATES = {
  salePercent: 0.5, // 0.5% commission on sales
  monthlyFixed: 50, // R$50 fixed monthly commission 
};

export default function MerchantReferrals() {
  const [tabValue, setTabValue] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Get merchant data (would normally be fetched from API)
  const { data: merchant } = useQuery({
    queryKey: ['/api/merchant/profile'],
    placeholderData: {
      id: 1,
      name: "Loja Example",
      email: "lojista@example.com",
      referralCode: "LOJA123",
      balance: 225.75,
      pendingCommission: 135.00,
      totalCommission: 360.75
    }
  });
  
  const { data: referralData } = useQuery({
    queryKey: ['/api/merchant/referrals'],
    placeholderData: {
      referrals: referredStores,
      commissions: commissionHistory,
      stats: {
        totalReferrals: referredStores.length,
        activeReferrals: referredStores.filter(r => r.status === "active").length,
        totalCommission: 360.75,
        lastMonthCommission: 255.50
      }
    }
  });
  
  const referralUrl = `https://valecashback.com/register?referral=${merchant?.referralCode}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    
    toast({
      title: "Link copiado!",
      description: "O link de indicação foi copiado para a área de transferência.",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = (platform: string) => {
    let shareUrl = "";
    
    const text = `Junte-se ao Vale Cashback como lojista parceiro! Use meu código de indicação ${merchant?.referralCode} e ganhe vantagens exclusivas.`;
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(text)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=Junte-se%20ao%20Vale%20Cashback&body=${encodeURIComponent(text + '\n\n' + referralUrl)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + referralUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, "_blank");
  };
  
  const referralsColumns = [
    {
      header: "Loja",
      accessorKey: "name",
    },
    {
      header: "Data de Indicação",
      accessorKey: "date",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item: any) => (
        <div className={`px-2 py-1 rounded-full text-xs inline-flex items-center ${
          item.status === "active" ? "bg-green-100 text-green-800" : 
          item.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
          "bg-gray-100 text-gray-800"
        }`}>
          {item.status === "active" ? (
            <>
              <CheckIcon className="w-3 h-3 mr-1" />
              <span>Ativo</span>
            </>
          ) : item.status === "pending" ? (
            <>
              <RefreshCw className="w-3 h-3 mr-1" />
              <span>Pendente</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>Inativo</span>
            </>
          )}
        </div>
      ),
    },
    {
      header: "Comissão Total",
      accessorKey: "commission",
      cell: (item: any) => `R$ ${item.commission.toFixed(2)}`,
    },
  ];
  
  const commissionsColumns = [
    {
      header: "Loja",
      accessorKey: "store",
    },
    {
      header: "Data",
      accessorKey: "date",
    },
    {
      header: "Tipo",
      accessorKey: "type",
      cell: (item: any) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          item.type === "sale" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
        }`}>
          {item.type === "sale" ? "Venda" : "Mensal"}
        </span>
      ),
    },
    {
      header: "Valor",
      accessorKey: "amount",
      cell: (item: any) => `R$ ${item.amount.toFixed(2)}`,
    },
  ];
  
  return (
    <DashboardLayout title="Programa de Indicações" type="merchant">
      <Tabs defaultValue="overview" value={tabValue} onValueChange={setTabValue}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="invite">Indicar Lojas</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>
      
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total de Indicações</CardTitle>
                <CardDescription>Lojas que você indicou</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  {referralData?.stats.totalReferrals || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  {referralData?.stats.activeReferrals || 0} lojas ativas
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Comissão Total</CardTitle>
                <CardDescription>Valor ganho com indicações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  R$ {referralData?.stats.totalCommission.toFixed(2) || "0.00"}
                </div>
                <div className="text-sm text-muted-foreground">
                  R$ {referralData?.stats.lastMonthCommission.toFixed(2) || "0.00"} no último mês
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Seu Código</CardTitle>
                <CardDescription>Compartilhe com outras lojas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span className="font-mono font-medium">{merchant?.referralCode}</span>
                  <Button variant="ghost" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full" onClick={() => setTabValue("invite")}>
                  <Users className="mr-2 h-4 w-4" />
                  Indicar Agora
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lojas Indicadas</CardTitle>
                <CardDescription>Histórico de todas as suas indicações</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={referralData?.referrals || []}
                  columns={referralsColumns}
                  searchable={false}
                  pagination={{
                    pageIndex: 0,
                    pageSize: 5,
                    pageCount: Math.ceil((referralData?.referrals.length || 0) / 5),
                    onPageChange: () => {},
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Invite Tab */}
        <TabsContent value="invite">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Indique e Ganhe</CardTitle>
                <CardDescription>
                  Convide outras lojas e ganhe comissões sobre as vendas delas no aplicativo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Como funciona:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</div>
                      <div className="flex-1">
                        <p>Compartilhe seu link ou código de indicação com outras lojas</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</div>
                      <div className="flex-1">
                        <p>Quando uma loja se cadastrar usando seu código, ela será vinculada à sua indicação</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</div>
                      <div className="flex-1">
                        <p>Ganhe {COMMISSION_RATES.salePercent * 100}% de comissão sobre as vendas processadas pela loja indicada</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</div>
                      <div className="flex-1">
                        <p>Receba R$ {COMMISSION_RATES.monthlyFixed.toFixed(2)} por mês para cada loja ativa indicada</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="border border-primary/20 rounded-lg p-4">
                  <h4 className="font-medium text-primary flex items-center mb-3">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Seu Link de Convite
                  </h4>
                  <div className="flex items-center">
                    <Input 
                      value={referralUrl}
                      readOnly
                      className="mr-2 font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyLink}
                      className={copied ? "text-green-600 border-green-600" : ""}
                    >
                      {copied ? <CheckIcon className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="border border-primary/20 rounded-lg p-4">
                  <h4 className="font-medium text-primary flex items-center mb-3">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleShare("facebook")}
                      className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-600"
                    >
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleShare("twitter")}
                      className="bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-600"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleShare("email")}
                      className="bg-red-50 border-red-200 hover:bg-red-100 text-red-600"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleShare("whatsapp")}
                      className="bg-green-50 border-green-200 hover:bg-green-100 text-green-600"
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-accent/90 to-accent via-accent/80 text-white">
              <CardHeader>
                <CardTitle className="text-white">Código QR de Indicação</CardTitle>
                <CardDescription className="text-white/80">
                  Escaneie para se cadastrar
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <QRCodeDisplay 
                    value={referralUrl}
                    size={180}
                    downloadable
                    title={`Indicação: ${merchant?.name}`}
                    description="Escaneie para se cadastrar"
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-white/90 text-sm mb-2">Ou use o código:</p>
                  <div className="bg-white text-accent font-mono font-bold px-4 py-2 rounded-md text-center text-lg">
                    {merchant?.referralCode}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Commissions Tab */}
        <TabsContent value="commissions">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Comissões Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  R$ {referralData?.stats.totalCommission.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Comissões Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  R$ {merchant?.pendingCommission.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Lojas Indicadas Ativas</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-3xl font-bold">
                  {referralData?.stats.activeReferrals || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  gerando comissões mensais
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comissões</CardTitle>
              <CardDescription>Registros de todos os ganhos de comissões</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={referralData?.commissions || []}
                columns={commissionsColumns}
                searchable
                pagination={{
                  pageIndex: 0,
                  pageSize: 10,
                  pageCount: Math.ceil((referralData?.commissions.length || 0) / 10),
                  onPageChange: () => {},
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}