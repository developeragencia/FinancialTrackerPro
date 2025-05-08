import { useState } from "react";
import { Link } from "wouter";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const clientFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  username: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(10, { message: "Telefone inválido" }).optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  invitationCode: z.string().optional(),
  securityQuestion: z.string().min(1, { message: "Selecione uma pergunta de segurança" }),
  securityAnswer: z.string().min(2, { message: "Forneça uma resposta para a pergunta de segurança" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const merchantFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  username: z.string().min(3, { message: "Nome de usuário deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(10, { message: "Telefone inválido" }).optional(),
  storeName: z.string().min(3, { message: "Nome da loja deve ter pelo menos 3 caracteres" }),
  category: z.string().min(1, { message: "Selecione uma categoria" }),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  companyLogo: z.any().optional(),
  invitationCode: z.string().optional(),
  securityQuestion: z.string().min(1, { message: "Selecione uma pergunta de segurança" }),
  securityAnswer: z.string().min(2, { message: "Forneça uma resposta para a pergunta de segurança" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ClientFormValues = z.infer<typeof clientFormSchema>;
type MerchantFormValues = z.infer<typeof merchantFormSchema>;

export default function Register() {
  const [type, setType] = useState<"client" | "merchant">("client");
  const { register, loading } = useAuth();

  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      password: "",
      confirmPassword: "",
    },
  });

  const merchantForm = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      storeName: "",
      cnpj: "",
      category: "",
      address: "",
      city: "",
      state: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onClientSubmit = async (values: ClientFormValues) => {
    try {
      await register({
        ...values,
        type: "client",
      });
    } catch (error) {
      console.error("Register error:", error);
    }
  };

  const onMerchantSubmit = async (values: MerchantFormValues) => {
    try {
      await register({
        ...values,
        type: "merchant",
      });
    } catch (error) {
      console.error("Register error:", error);
    }
  };

  return (
    <AuthLayout title="Cadastro" description="Crie sua conta no Vale Cashback">
      <Tabs defaultValue="client" onValueChange={(value) => setType(value as "client" | "merchant")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="client">Cliente</TabsTrigger>
          <TabsTrigger value="merchant">Lojista</TabsTrigger>
        </TabsList>

        <TabsContent value="client">
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
              <FormField
                control={clientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} disabled={loading} />
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={clientForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input placeholder="123.456.789-00" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={clientForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} disabled={loading} />
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
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="merchant">
          <Form {...merchantForm}>
            <form onSubmit={merchantForm.handleSubmit(onMerchantSubmit)} className="space-y-4">
              <FormField
                control={merchantForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} disabled={loading} />
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
                    <FormLabel>Nome da loja</FormLabel>
                    <FormControl>
                      <Input placeholder="Minha Loja" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={merchantForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="loja@email.com" {...field} disabled={loading} />
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
                        <Input placeholder="(11) 99999-9999" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={merchantForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="12.345.678/0001-90" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={merchantForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          disabled={loading}
                        >
                          <option value="">Selecione uma categoria</option>
                          <option value="restaurant">Restaurante</option>
                          <option value="market">Supermercado</option>
                          <option value="pharmacy">Farmácia</option>
                          <option value="clothing">Vestuário</option>
                          <option value="gas_station">Posto de Combustível</option>
                          <option value="other">Outros</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={merchantForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={merchantForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={merchantForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={merchantForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} disabled={loading} />
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
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" variant="default" className="w-full bg-accent" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <div className="mt-4 text-center">
        <p className="text-sm">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-secondary font-medium hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
