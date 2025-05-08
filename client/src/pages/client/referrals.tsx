import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QRCodeDisplay } from "@/components/ui/qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Copy, UserPlus, Users, Percent, Share2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useAuth } from "@/hooks/use-auth";
import { SystemInfo } from "@/components/ui/system-info";

export default function ClientReferrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Query para buscar informações sobre indicações do usuário
  const { data: referralsData, isLoading: isReferralsLoading } = useQuery({
    queryKey: ['/api/client/referrals'],
    placeholderData: {
      referralCode: user?.referralCode || "ABC123",
      referralUrl: `https://valecashback.com/convite/${user?.referralCode || "ABC123"}`,
      referralsCount: 0,
      pendingReferrals: 0,
      totalEarned: "0.00",
      commission: "1.0", // Taxa de comissão - será substituída pelos dados do banco
      referrals: []
    }
  });
  
  // Query para buscar informações sobre as taxas do sistema
  const { data: ratesSettings } = useQuery({
    queryKey: ['/api/admin/settings/rates'],
  });
  
  // Função para copiar o link de indicação
  const copyReferralLink = async () => {
    try {
      // Use a API de clipboard mais recente que funciona melhor em navegadores modernos
      if (referralsData?.referralUrl) {
        // Adiciona texto temporário à página para contornar problemas de permissão
        const textArea = document.createElement('textarea');
        textArea.value = referralsData.referralUrl;
        textArea.style.position = 'fixed';  // Fora da tela
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Tenta o método moderno e depois o método de fallback
        try {
          await navigator.clipboard.writeText(referralsData.referralUrl);
        } catch (err) {
          // Fallback para o método de execCommand que funciona em mais navegadores
          document.execCommand('copy');
        }
        
        // Remove o elemento temporário
        document.body.removeChild(textArea);
        
        toast({
          title: "Link copiado!",
          description: "O link de indicação foi copiado para a área de transferência.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente ou copie manualmente.",
        variant: "destructive",
      });
    }
  };
  
  // Função para compartilhar no WhatsApp
  const shareOnWhatsApp = () => {
    const text = `Olá! Use meu código de indicação ${referralsData?.referralCode} e ganhe cashback no Vale Cashback: ${referralsData?.referralUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // Mutation para enviar convite por email
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const res = await apiRequest("POST", "/api/client/referrals/invite", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Convite enviado!",
        description: "O convite foi enviado com sucesso para o email informado.",
        variant: "default",
      });
      setEmail("");
      setName("");
      queryClient.invalidateQueries({ queryKey: ['/api/client/referrals'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message || "Ocorreu um erro ao enviar o convite. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Estado para o formulário de convite
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  
  // Função para enviar convite
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    inviteMutation.mutate({ email, name });
  };
  
  // Colunas para a tabela de indicados
  const referralsColumns = [
    { header: "Nome", accessorKey: "name" },
    { header: "Data", accessorKey: "date" },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (row: any) => (
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === "completed" 
              ? "bg-green-100 text-green-800" 
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {row.status === "completed" ? "Concluído" : "Pendente"}
          </span>
        </div>
      )
    },
    { 
      header: "Comissão", 
      accessorKey: "commission",
      cell: (row: any) => (
        <div className="flex items-center">
          <span className="font-medium">$ {row.commission}</span>
        </div>
      )
    },
  ];
  
  return (
    <DashboardLayout title="Programa de Indicações" type="client">
      <div className="flex flex-col space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Users className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="invite">
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Amigos
            </TabsTrigger>
            <TabsTrigger value="list">
              <Percent className="h-4 w-4 mr-2" />
              Meus Indicados
            </TabsTrigger>
          </TabsList>
          
          {/* Aba de Visão Geral */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Seu Código de Indicação</CardTitle>
                  <CardDescription>
                    Compartilhe seu código e ganhe comissões por cada novo usuário
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-4xl font-bold border-2 border-primary px-8 py-4 rounded-lg text-primary">
                      {referralsData?.referralCode || "..."}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyReferralLink}
                        className="flex items-center"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={shareOnWhatsApp}
                        className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <WhatsAppIcon className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Taxa de comissão: <span className="font-medium">{ratesSettings?.referralCommission || referralsData?.commission}%</span> por indicação
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Compartilhe seu código ou link de indicação com amigos e conhecidos. Quando eles se cadastrarem e realizarem compras, você receberá uma comissão sobre todas as transações deles.
                  </p>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                  <CardDescription>
                    Acompanhe seus ganhos e indicações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <span className="text-3xl font-bold">{referralsData?.referralsCount || 0}</span>
                      <span className="text-sm text-muted-foreground">Total de Indicados</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <span className="text-3xl font-bold">{referralsData?.pendingReferrals || 0}</span>
                      <span className="text-sm text-muted-foreground">Indicações Pendentes</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-lg col-span-2">
                      <span className="text-3xl font-bold text-primary">$ {referralsData?.totalEarned || "0.00"}</span>
                      <span className="text-sm text-muted-foreground">Total Ganho</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Alert variant="default" className="w-full">
                    <UserPlus className="h-4 w-4" />
                    <AlertTitle>Ganhe mais indicando</AlertTitle>
                    <AlertDescription>
                      Quanto mais amigos você indicar, maiores serão seus ganhos!
                    </AlertDescription>
                  </Alert>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Aba de Convidar Amigos */}
          <TabsContent value="invite">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Convidar por E-mail</CardTitle>
                  <CardDescription>
                    Envie um convite diretamente para seus amigos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Amigo</Label>
                      <Input 
                        id="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Digite o nome do seu amigo" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="Digite o e-mail do seu amigo" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={inviteMutation.isPending}
                    >
                      {inviteMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Enviar Convite
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Compartilhar Convite</CardTitle>
                  <CardDescription>
                    Compartilhe seu link de indicação nas redes sociais
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <div className="py-4">
                    <QRCodeDisplay 
                      value={referralsData?.referralUrl || ""}
                      title="Escaneie para se cadastrar"
                      description="Aponte a câmera do celular para o QR Code"
                      downloadable
                      shareable
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button 
                      onClick={copyReferralLink}
                      className="flex items-center"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={shareOnWhatsApp}
                      className="flex items-center text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <WhatsAppIcon className="h-4 w-4 mr-2" />
                      Compartilhar no WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Outras Redes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Aba de Indicados */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Meus Indicados</CardTitle>
                <CardDescription>
                  Lista de todas as suas indicações e comissões
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isReferralsLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : referralsData?.referrals?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <Users className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhuma indicação ainda</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      Convide seus amigos para usar o Vale Cashback e comece a ganhar comissões em todas as compras deles!
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("invite")}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Convidar Amigos
                    </Button>
                  </div>
                ) : (
                  <DataTable 
                    data={referralsData?.referrals || []}
                    columns={referralsColumns}
                    searchable
                    onSearch={() => {}}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <SystemInfo className="mt-6" />
      </div>
    </DashboardLayout>
  );
}