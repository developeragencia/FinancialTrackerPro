import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Timer, Store, GanttChart, Clock, MapPin, Phone, Mail, Globe, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function MerchantProfile() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Query to get merchant profile data
  const { data: merchant, isLoading } = useQuery({
    queryKey: ['/api/merchant/profile'],
  });

  // Handle received merchant data and provide fallback values for missing fields
  const merchantData = merchant || {};

  // Ensure cashbackPromotions object exists (this may be null from API)
  const cashbackPromotions = merchantData.cashbackPromotions || {
    enabled: false,
    doubleOnWeekends: false,
    specialCategories: false,
    minimumPurchase: 0
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    // This would be an API call in a real implementation
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Perfil atualizado",
        description: "As informações da loja foram atualizadas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o perfil. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
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

  return (
    <DashboardLayout title="Perfil da Loja" type="merchant">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="general" className="flex items-center">
              <Store className="mr-2 h-4 w-4" />
              <span>Informações Gerais</span>
            </TabsTrigger>
            <TabsTrigger value="cashback" className="flex items-center">
              <GanttChart className="mr-2 h-4 w-4" />
              <span>Cashback</span>
            </TabsTrigger>
          </TabsList>

          {/* General Information */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Loja</CardTitle>
                <CardDescription>
                  Atualize as informações da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center space-y-3">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={merchantData.logo} alt={merchantData.name} />
                        <AvatarFallback className="text-lg bg-accent text-white">
                          {getInitials(merchantData.name)}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">
                        Alterar logo
                      </Button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Loja</Label>
                        <Input id="name" defaultValue={merchantData.name} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <select 
                          id="category" 
                          defaultValue={merchantData.category}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="Supermercado">Supermercado</option>
                          <option value="Restaurante">Restaurante</option>
                          <option value="Farmácia">Farmácia</option>
                          <option value="Posto de Combustível">Posto de Combustível</option>
                          <option value="Vestuário">Vestuário</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea 
                          id="description" 
                          defaultValue={merchantData.description}
                          rows={3} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="owner">Responsável</Label>
                        <Input id="owner" defaultValue={merchantData.owner} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" defaultValue={merchantData.email} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" defaultValue={merchantData.phone} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" defaultValue={merchantData.website} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input id="address" defaultValue={merchantData.address} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="city-state">Cidade/Estado</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="city" 
                            defaultValue={merchantData.city}
                            className="flex-1" 
                          />
                          <Input 
                            id="state" 
                            defaultValue={merchantData.state}
                            className="w-20" 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="business-hours">Horário de Funcionamento</Label>
                        <Input id="business-hours" defaultValue={merchantData.businessHours} />
                      </div>
                      
                      <div className="space-y-2 flex items-center">
                        <Switch 
                          id="active-store"
                          checked={merchantData.active}
                          className="mr-2"
                        />
                        <Label htmlFor="active-store">Loja ativa</Label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="submit" className="bg-accent" disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : "Salvar alterações"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashback Settings */}
          <TabsContent value="cashback">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Cashback</CardTitle>
                <CardDescription>
                  Personalize as regras de cashback para seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Taxa de comissão padrão</Label>
                      <p className="text-sm text-muted-foreground">
                        Esta é a taxa padrão definida pelo sistema
                      </p>
                    </div>
                    <div className="bg-muted p-2 px-3 rounded-lg font-medium">
                      {merchantData.commissionRate}%
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-promotions">Habilitar promoções de cashback</Label>
                      <p className="text-sm text-muted-foreground">
                        Ofereça bônus de cashback em determinadas situações
                      </p>
                    </div>
                    <Switch 
                      id="enable-promotions"
                      checked={cashbackPromotions.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekend-double">Cashback em dobro nos finais de semana</Label>
                      <p className="text-sm text-muted-foreground">
                        O cashback será dobrado em compras realizadas aos sábados e domingos
                      </p>
                    </div>
                    <Switch 
                      id="weekend-double"
                      checked={cashbackPromotions.doubleOnWeekends}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="special-categories">Cashback especial por categorias</Label>
                      <p className="text-sm text-muted-foreground">
                        Defina categorias de produtos com cashback diferenciado
                      </p>
                    </div>
                    <Switch 
                      id="special-categories"
                      checked={cashbackPromotions.specialCategories}
                    />
                  </div>
                  
                  <div className="border-t pt-4">
                    <Label htmlFor="minimum-purchase">Valor mínimo para cashback (R$)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Valor mínimo de compra para que o cliente receba cashback
                    </p>
                    <div className="flex gap-4 items-center">
                      <Input 
                        id="minimum-purchase"
                        type="number"
                        defaultValue={merchantData.cashbackPromotions.minimumPurchase}
                        className="w-32"
                      />
                      <p className="text-sm text-muted-foreground">
                        0 = sem valor mínimo
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button className="bg-accent">
                      Salvar configurações
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Informações Públicas</CardTitle>
                <CardDescription>
                  Assim é como os clientes veem sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={merchantData.logo} alt={merchantData.name} />
                      <AvatarFallback className="text-lg bg-accent text-white">
                        {getInitials(merchantData.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{merchantData.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{merchantData.category}</p>
                      
                      <p className="text-sm mb-4">{merchantData.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.address}, {merchantData.city}/{merchantData.state}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.phone}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.email}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.website}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{merchantData.businessHours}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Responsável: {merchantData.owner}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center">
                        <div className="px-3 py-1 rounded-full bg-accent text-white text-sm">
                          {merchantData.commissionRate}% de cashback
                        </div>
                        
                        {merchantData.cashbackPromotions.doubleOnWeekends && (
                          <div className="ml-2 px-3 py-1 rounded-full bg-blue-500 text-white text-sm">
                            2x aos finais de semana
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}
