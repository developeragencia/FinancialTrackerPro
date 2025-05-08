import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Users, Gift, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock referral data - would be replaced with real data from API
const referrals = [
  { id: 1, name: "Maria Silva", email: "maria@email.com", date: "15/07/2023", status: "completed", bonus: 5.00 },
  { id: 2, name: "João Santos", email: "joao@email.com", date: "10/07/2023", status: "pending", bonus: 5.00 },
  { id: 3, name: "Ana Oliveira", email: "ana@email.com", date: "05/07/2023", status: "completed", bonus: 5.00 },
];

export default function ClientReferrals() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Query to get referral data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/client/referrals'],
  });

  const referralCode = "ABC123XYZ"; // This would come from the API
  const referralLink = `https://valecashback.com/register?ref=${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado!",
        description: "Link de indicação copiado para a área de transferência.",
      });
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vale Cashback - Indicação",
          text: "Use meu código de indicação para ganhar bônus no Vale Cashback!",
          url: referralLink,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // This would be an API call in a real implementation
    setTimeout(() => {
      toast({
        title: "Convite enviado",
        description: `Um convite foi enviado para ${email}`,
      });
      setEmail("");
      setLoading(false);
    }, 1000);
  };

  return (
    <DashboardLayout title="Indicar Amigos" type="client">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Referral Program */}
        <Card>
          <CardHeader>
            <CardTitle>Programa de Indicação</CardTitle>
            <CardDescription>
              Indique amigos e ganhe R$ 5,00 de cashback para cada pessoa que se cadastrar e fizer uma compra.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-secondary/10 rounded-lg">
              <Label className="text-sm text-muted-foreground mb-2 block">Seu código de indicação</Label>
              <div className="flex">
                <Input 
                  value={referralCode} 
                  readOnly 
                  className="font-mono bg-background"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2" 
                  onClick={() => copyToClipboard(referralCode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-secondary/10 rounded-lg">
              <Label className="text-sm text-muted-foreground mb-2 block">Link de indicação</Label>
              <div className="flex">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="font-mono text-xs bg-background"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2" 
                  onClick={() => copyToClipboard(referralLink)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1 bg-secondary" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> Compartilhar
              </Button>
              <Button className="flex-1" variant="outline">
                <Gift className="mr-2 h-4 w-4" /> Como funciona
              </Button>
            </div>

            <div className="border-t pt-4 mt-4">
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Email do amigo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                  disabled={loading}
                />
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                  Convidar
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card>
          <CardHeader>
            <CardTitle>Amigos Indicados</CardTitle>
            <CardDescription>
              Acompanhe o status das suas indicações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Bônus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.referrals || referrals).map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">
                        {referral.name}
                        <div className="text-xs text-muted-foreground">{referral.email}</div>
                      </TableCell>
                      <TableCell>{referral.date}</TableCell>
                      <TableCell>
                        <Badge variant={referral.status === "completed" ? "success" : "warning"}>
                          {referral.status === "completed" ? "Concluída" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {referral.bonus.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {(data?.referrals || referrals).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Você ainda não indicou nenhum amigo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            <div className="mt-4 p-4 bg-accent/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Total acumulado em bônus</h3>
                  <p className="text-sm text-muted-foreground">Bônus recebidos por indicações</p>
                </div>
                <div className="text-xl font-bold">R$ 10,00</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
