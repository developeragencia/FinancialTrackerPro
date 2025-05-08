import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, Search, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function MerchantScanner() {
  const [scannerActive, setScannerActive] = useState(false);
  const [transactionCode, setTransactionCode] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Activate scanner
  const activateScanner = async () => {
    setScannerActive(true);
    
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // In a real implementation, this would use a QR code scanning library
        toast({
          title: "Scanner ativo",
          description: "Posicione o QR Code dentro da área de leitura.",
        });
      } else {
        toast({
          title: "Camera não disponível",
          description: "Seu dispositivo não suporta acesso à câmera.",
          variant: "destructive",
        });
        setScannerActive(false);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Erro na câmera",
        description: "Não foi possível acessar a câmera do dispositivo.",
        variant: "destructive",
      });
      setScannerActive(false);
    }
  };

  // Stop scanner
  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerActive(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Handle manual code lookup
  const handleLookupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionCode) {
      toast({
        title: "Código obrigatório",
        description: "Digite o código da transação para consultar.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // This would be an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock payment info
      setPaymentInfo({
        amount: 35.00,
        customer: {
          name: "João Silva",
          email: "joao@email.com",
          balance: 235.50
        },
        code: transactionCode || "QR789012",
        description: "Pagamento de compras"
      });
    } catch (error) {
      toast({
        title: "Código inválido",
        description: "O código informado não é válido ou expirou.",
        variant: "destructive",
      });
      setPaymentInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    if (!paymentInfo) return;
    
    setConfirming(true);
    
    try {
      // This would be an API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Pagamento confirmado",
        description: `Pagamento de R$ ${paymentInfo.amount.toFixed(2)} confirmado com sucesso.`,
      });
      
      // Reset form and payment info
      setTransactionCode("");
      setPaymentInfo(null);
      
      // Refresh merchant sales data
      queryClient.invalidateQueries({ queryKey: ['/api/merchant/sales'] });
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  // Handle payment cancellation
  const handleCancelPayment = () => {
    setPaymentInfo(null);
    setTransactionCode("");
  };

  return (
    <DashboardLayout title="Scanner QR Code" type="merchant">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle>Escaneie o QR Code</CardTitle>
            <CardDescription>
              Use a câmera para escanear o QR Code de pagamento do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {scannerActive ? (
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Clique no botão abaixo para ativar a câmera e escanear um QR Code
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={scannerActive ? stopScanner : activateScanner}
                variant={scannerActive ? "destructive" : "default"}
                className={scannerActive ? "" : "bg-accent"}
              >
                {scannerActive ? "Parar Scanner" : "Ativar Scanner"}
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              {scannerActive ? 
                "Posicione o QR Code do cliente dentro da área de leitura" : 
                "A câmera será usada apenas para leitura do QR Code"
              }
            </div>
          </CardContent>
        </Card>
        
        {/* Manual Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle>Entrada Manual</CardTitle>
            <CardDescription>
              Digite o código da transação manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentInfo ? (
              <div className="p-4 border rounded-lg">
                <div className="text-center mb-4">
                  <div className="text-xl font-bold">R$ {paymentInfo.amount.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Pagamento via Cashback</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">{paymentInfo.customer.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">E-mail:</span>
                    <span className="font-medium">{paymentInfo.customer.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Saldo disponível:</span>
                    <span className="font-medium">R$ {paymentInfo.customer.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Código da transação:</span>
                    <span className="font-medium">{paymentInfo.code}</span>
                  </div>
                  {paymentInfo.description && (
                    <div className="flex justify-between py-1 border-t">
                      <span className="text-muted-foreground">Descrição:</span>
                      <span className="font-medium">{paymentInfo.description}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex gap-2">
                  <Button 
                    className="flex-1 bg-accent"
                    onClick={handleConfirmPayment}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Confirmar
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleCancelPayment}
                    disabled={confirming}
                  >
                    <X className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLookupCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-code">Código da Transação</Label>
                  <Input
                    id="transaction-code"
                    value={transactionCode}
                    onChange={(e) => setTransactionCode(e.target.value)}
                    placeholder="Digite o código do QR Code"
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-accent"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" /> Buscar
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
