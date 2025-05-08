import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LogoIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RefreshCw, UserPlus, Store, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

// Validação dos formulários com Zod
const clientSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Telefone inválido"),
  referralCode: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const merchantSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Telefone inválido"),
  storeName: z.string().min(3, "O nome da loja deve ter pelo menos 3 caracteres"),
  storeType: z.string().min(3, "Selecione o tipo de estabelecimento"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  referralCode: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function InvitePage() {
  const [location] = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuth();
  const { toast } = useToast();
  const [referralType, setReferralType] = useState<"client" | "merchant">("client");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Se já estiver autenticado, redireciona para a página inicial apropriada
  useEffect(() => {
    if (isAuthenticated) {
      if (userType === "client") {
        navigate("/client/dashboard");
      } else if (userType === "merchant") {
        navigate("/merchant/dashboard");
      } else if (userType === "admin") {
        navigate("/admin/dashboard");
      }
    }
  }, [isAuthenticated, userType, navigate]);
  
  // Extrai o código de referência da URL
  useEffect(() => {
    // Exemplo de URL: /convite/ABC123 ou /parceiro/LJ123
    const pathParts = location.split('/');
    
    if (pathParts.length >= 3) {
      const path = pathParts[1];
      const code = pathParts[2];
      
      if (path === "convite") {
        setReferralType("client");
        setReferralCode(code);
      } else if (path === "parceiro") {
        setReferralType("merchant");
        setReferralCode(code);
      }
    }
    
    setLoading(false);
  }, [location]);
  
  // Formulário para cliente
  const clientForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      referralCode: referralCode
    }
  });
  
  // Formulário para lojista
  const merchantForm = useForm<z.infer<typeof merchantSchema>>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      storeName: "",
      storeType: "",
      cnpj: "",
      referralCode: referralCode
    }
  });
  
  // Atualiza o valor do código de referência nos formulários quando ele muda
  useEffect(() => {
    clientForm.setValue("referralCode", referralCode);
    merchantForm.setValue("referralCode", referralCode);
  }, [referralCode]);
  
  // Mutation para cadastro de cliente
  const clientRegisterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof clientSchema>) => {
      const res = await apiRequest("POST", "/api/register/client", {
        ...data,
        type: "client"
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você será redirecionado para a página de login.",
        variant: "default",
      });
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro ao realizar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para cadastro de lojista
  const merchantRegisterMutation = useMutation({
    mutationFn: async (data: z.infer<typeof merchantSchema>) => {
      const res = await apiRequest("POST", "/api/register/merchant", {
        ...data,
        type: "merchant"
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu cadastro será analisado e você receberá um email com as próximas instruções.",
        variant: "default",
      });
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro ao realizar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Tipos de estabelecimento para o select
  const storeTypes = [
    { value: "restaurant", label: "Restaurante" },
    { value: "supermarket", label: "Supermercado" },
    { value: "clothing", label: "Loja de Roupas" },
    { value: "pharmacy", label: "Farmácia" },
    { value: "electronics", label: "Eletrônicos" },
    { value: "furniture", label: "Móveis" },
    { value: "beauty", label: "Salão de Beleza" },
    { value: "other", label: "Outro" }
  ];
  
  // Funções para submissão dos formulários
  const onClientSubmit = (data: z.infer<typeof clientSchema>) => {
    clientRegisterMutation.mutate(data);
  };
  
  const onMerchantSubmit = (data: z.infer<typeof merchantSchema>) => {
    merchantRegisterMutation.mutate(data);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <a href="/" className="flex items-center">
            <LogoIcon className="h-10 w-10" />
            <span className="ml-2 text-xl font-bold">Vale Cashback</span>
          </a>
          <nav className="ml-auto flex gap-4">
            <Button variant="outline" onClick={() => navigate("/auth")}>Entrar</Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container py-10">
        <div className="mx-auto max-w-[800px]">
          <Card className="border-2 border-primary/10 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {referralType === "client" 
                  ? "Cadastre-se usando código de indicação" 
                  : "Torne-se um parceiro Vale Cashback"}
              </CardTitle>
              <CardDescription>
                {referralType === "client"
                  ? `Você foi convidado(a) com o código ${referralCode}. Complete seu cadastro abaixo.`
                  : `Você foi convidado(a) a ser parceiro com o código ${referralCode}. Complete seu cadastro abaixo.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralType === "client" ? (
                // Formulário para cliente
                <Form {...clientForm}>
                  <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={clientForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clientForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu.email@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clientForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 98765-4321" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clientForm.control}
                        name="referralCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Indicação</FormLabel>
                            <FormControl>
                              <Input readOnly {...field} />
                            </FormControl>
                            <FormDescription>
                              Código de quem te convidou
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clientForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={clientForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Alert>
                      <UserPlus className="h-4 w-4" />
                      <AlertTitle>Programa de Indicação</AlertTitle>
                      <AlertDescription>
                        Ao se cadastrar usando um código de indicação, você poderá receber cashback adicional em suas compras.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={clientRegisterMutation.isPending}
                    >
                      {clientRegisterMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : "Criar Conta"}
                    </Button>
                  </form>
                </Form>
              ) : (
                // Formulário para lojista
                <Form {...merchantForm}>
                  <form onSubmit={merchantForm.handleSubmit(onMerchantSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={merchantForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Responsável</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={merchantForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contato@loja.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={merchantForm.control}
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Loja</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do estabelecimento" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={merchantForm.control}
                        name="storeType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Estabelecimento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {storeTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={merchantForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input placeholder="XX.XXX.XXX/0001-XX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={merchantForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 98765-4321" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={merchantForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={merchantForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="******" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={merchantForm.control}
                        name="referralCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Indicação</FormLabel>
                            <FormControl>
                              <Input readOnly {...field} />
                            </FormControl>
                            <FormDescription>
                              Código de quem te convidou
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Alert>
                      <Store className="h-4 w-4" />
                      <AlertTitle>Programa de Parceria</AlertTitle>
                      <AlertDescription>
                        Ao se cadastrar como parceiro, você poderá oferecer cashback aos seus clientes e aumentar suas vendas.
                      </AlertDescription>
                    </Alert>
                    
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Aprovação necessária</AlertTitle>
                      <AlertDescription>
                        Seu cadastro passará por uma análise antes de ser aprovado. Você receberá um email com mais informações em breve.
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={merchantRegisterMutation.isPending}
                    >
                      {merchantRegisterMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : "Solicitar Cadastro"}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta? <a href="/auth" className="text-primary hover:underline">Faça login</a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground md:text-base">
            &copy; {new Date().getFullYear()} Vale Cashback. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}