import { useState } from "react";
import { Link } from "wouter";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

export default function Login() {
  const [userType, setUserType] = useState<"client" | "merchant" | "admin">("client");
  const { login, loading } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await login(values.email, values.password, userType);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <AuthLayout title="Login" description="Faça login para continuar">
      <div className="flex justify-center mb-6 bg-gray-100 rounded-lg p-1">
        <Button
          type="button"
          onClick={() => setUserType("client")}
          variant={userType === "client" ? "default" : "ghost"}
          className={userType === "client" ? "bg-secondary" : ""}
        >
          Cliente
        </Button>
        <Button
          type="button"
          onClick={() => setUserType("merchant")}
          variant={userType === "merchant" ? "default" : "ghost"}
          className={userType === "merchant" ? "bg-accent" : ""}
        >
          Lojista
        </Button>
        <Button
          type="button"
          onClick={() => setUserType("admin")}
          variant={userType === "admin" ? "default" : "ghost"}
          className={userType === "admin" ? "bg-primary" : ""}
        >
          Admin
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between text-sm">
            <Link href="/forgot-password" className="text-secondary hover:underline">
              Esqueceu a senha?
            </Link>
            <Link href="/register" className="text-secondary hover:underline">
              Cadastre-se
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            style={{
              backgroundColor:
                userType === "client"
                  ? "var(--secondary)"
                  : userType === "merchant"
                  ? "var(--accent)"
                  : "var(--primary)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
