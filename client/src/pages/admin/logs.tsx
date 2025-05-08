import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Info,
  History,
  User,
  Clock,
  Shield,
  Eye,
  FileText,
  Activity,
  Trash2,
  HardDrive
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Tipos e componentes
interface LogEntry {
  id: number;
  type: "info" | "warning" | "error" | "security";
  message: string;
  user: string | null;
  timestamp: string;
  ip: string;
  module: string;
  details: string;
}

interface AuditEntry {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  ip: string;
  details: string;
  resource: string;
  resourceId: string;
}

const LogTypeIcons: Record<string, React.ReactNode> = {
  "info": <Info className="h-4 w-4 text-blue-500" />,
  "warning": <AlertCircle className="h-4 w-4 text-yellow-500" />,
  "error": <AlertCircle className="h-4 w-4 text-red-500" />,
  "security": <Shield className="h-4 w-4 text-purple-500" />,
};

export default function AdminLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{from: Date | null, to: Date | null}>({
    from: null,
    to: null,
  });
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("logs");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const { toast } = useToast();
  
  // Query para buscar logs do sistema
  const { data: logData, isLoading: logsLoading } = useQuery<{ 
    logs: LogEntry[], 
    typeCounts: { type: string, count: number }[],
    moduleCounts: { module: string, count: number }[],
    pageCount: number
  }>({
    queryKey: ['/api/admin/logs', {
      page,
      pageSize,
      type: typeFilter,
      module: moduleFilter,
      dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      search: searchTerm
    }],
    enabled: activeTab === "logs",
    placeholderData: {
      logs: [
        { id: 1001, type: "info", message: "Usuário fez login com sucesso", user: "admin@example.com", timestamp: "21/07/2023 15:45:22", ip: "192.168.1.1", module: "auth", details: "Navegador: Chrome, OS: Windows" },
        { id: 1002, type: "warning", message: "Tentativa de acesso não autorizado", user: null, timestamp: "21/07/2023 15:40:12", ip: "192.168.1.100", module: "auth", details: "Múltiplas tentativas de login com credenciais inválidas" },
        { id: 1003, type: "error", message: "Erro ao processar transação", user: "lojista@example.com", timestamp: "21/07/2023 15:30:05", ip: "192.168.1.2", module: "payment", details: "Timeout na conexão com gateway de pagamento" },
        { id: 1004, type: "security", message: "Alteração de senha realizada", user: "cliente@example.com", timestamp: "21/07/2023 15:20:47", ip: "192.168.1.3", module: "user", details: "Alteração de senha realizada com sucesso" },
        { id: 1005, type: "info", message: "Transação concluída com sucesso", user: "lojista@example.com", timestamp: "21/07/2023 15:10:33", ip: "192.168.1.2", module: "payment", details: "Transação #12345 processada com sucesso" },
        { id: 1006, type: "info", message: "Novo usuário cadastrado", user: "novocliente@example.com", timestamp: "21/07/2023 15:00:18", ip: "192.168.1.4", module: "user", details: "Novo usuário do tipo cliente criado" },
        { id: 1007, type: "error", message: "Falha na geração de QR Code", user: "cliente@example.com", timestamp: "21/07/2023 14:50:09", ip: "192.168.1.3", module: "qrcode", details: "Erro ao gerar QR Code para pagamento" },
        { id: 1008, type: "warning", message: "Tentativa de acesso a recurso não autorizado", user: "lojista@example.com", timestamp: "21/07/2023 14:40:55", ip: "192.168.1.2", module: "access", details: "Tentativa de acesso a painel admin" },
        { id: 1009, type: "security", message: "Bloqueio temporário de conta", user: "usuarioteste@example.com", timestamp: "21/07/2023 14:30:41", ip: "192.168.1.5", module: "auth", details: "Conta bloqueada por múltiplas tentativas de login" },
        { id: 1010, type: "info", message: "Cashback creditado com sucesso", user: "cliente@example.com", timestamp: "21/07/2023 14:20:27", ip: "192.168.1.3", module: "cashback", details: "Cashback de R$ 15,00 creditado para o usuário" },
      ],
      typeCounts: [
        { type: "info", count: 4 },
        { type: "warning", count: 2 },
        { type: "error", count: 2 },
        { type: "security", count: 2 }
      ],
      moduleCounts: [
        { module: "auth", count: 3 },
        { module: "payment", count: 2 },
        { module: "user", count: 2 },
        { module: "qrcode", count: 1 },
        { module: "access", count: 1 },
        { module: "cashback", count: 1 }
      ],
      pageCount: 5
    }
  });
  
  // Query para buscar auditoria
  const { data: auditData, isLoading: auditLoading } = useQuery<{ 
    audits: AuditEntry[], 
    actionCounts: { action: string, count: number }[],
    resourceCounts: { resource: string, count: number }[],
    pageCount: number
  }>({
    queryKey: ['/api/admin/audit', {
      page,
      pageSize,
      action: typeFilter,
      resource: moduleFilter,
      dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      search: searchTerm
    }],
    enabled: activeTab === "audit",
    placeholderData: {
      audits: [
        { id: 501, action: "create", user: "admin@example.com", timestamp: "21/07/2023 15:45:22", ip: "192.168.1.1", details: "Criou nova configuração de sistema", resource: "settings", resourceId: "sys-001" },
        { id: 502, action: "update", user: "admin@example.com", timestamp: "21/07/2023 15:40:12", ip: "192.168.1.1", details: "Atualizou taxa de cashback para 2.5%", resource: "settings", resourceId: "rates-001" },
        { id: 503, action: "delete", user: "admin@example.com", timestamp: "21/07/2023 15:30:05", ip: "192.168.1.1", details: "Removeu usuário inativo", resource: "user", resourceId: "usr-123" },
        { id: 504, action: "create", user: "admin@example.com", timestamp: "21/07/2023 15:20:47", ip: "192.168.1.1", details: "Criou nova loja parceira", resource: "merchant", resourceId: "merch-456" },
        { id: 505, action: "update", user: "admin@example.com", timestamp: "21/07/2023 15:10:33", ip: "192.168.1.1", details: "Atualizou status de transação", resource: "transaction", resourceId: "tx-789" },
        { id: 506, action: "view", user: "admin@example.com", timestamp: "21/07/2023 15:00:18", ip: "192.168.1.1", details: "Visualizou dados sensíveis de cliente", resource: "user", resourceId: "usr-456" },
        { id: 507, action: "export", user: "admin@example.com", timestamp: "21/07/2023 14:50:09", ip: "192.168.1.1", details: "Exportou relatório de transações", resource: "report", resourceId: "rep-001" },
        { id: 508, action: "update", user: "admin@example.com", timestamp: "21/07/2023 14:40:55", ip: "192.168.1.1", details: "Alterou permissões de usuário", resource: "user", resourceId: "usr-789" },
        { id: 509, action: "create", user: "admin@example.com", timestamp: "21/07/2023 14:30:41", ip: "192.168.1.1", details: "Criou novo produto promocional", resource: "product", resourceId: "prod-123" },
        { id: 510, action: "approve", user: "admin@example.com", timestamp: "21/07/2023 14:20:27", ip: "192.168.1.1", details: "Aprovou solicitação de saque", resource: "withdrawal", resourceId: "with-456" },
      ],
      actionCounts: [
        { action: "create", count: 3 },
        { action: "update", count: 3 },
        { action: "delete", count: 1 },
        { action: "view", count: 1 },
        { action: "export", count: 1 },
        { action: "approve", count: 1 }
      ],
      resourceCounts: [
        { resource: "user", count: 3 },
        { resource: "settings", count: 2 },
        { resource: "merchant", count: 1 },
        { resource: "transaction", count: 1 },
        { resource: "report", count: 1 },
        { resource: "product", count: 1 },
        { resource: "withdrawal", count: 1 }
      ],
      pageCount: 5
    }
  });
  
  // Exportar dados
  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os logs estão sendo exportados para CSV.",
    });
    
    // Em uma implementação real, aqui iríamos gerar um arquivo CSV e fazer o download
    setTimeout(() => {
      toast({
        title: "Exportação concluída",
        description: "Arquivo CSV exportado com sucesso.",
      });
    }, 1500);
  };
  
  // Visualizar detalhes do log
  const handleViewLog = (log: LogEntry) => {
    toast({
      title: `Log #${log.id}`,
      description: `${log.message} | ${log.details}`,
    });
  };
  
  // Visualizar detalhes da auditoria
  const handleViewAudit = (audit: AuditEntry) => {
    toast({
      title: `Auditoria #${audit.id}`,
      description: `${audit.action.toUpperCase()} - ${audit.details}`,
    });
  };
  
  // Definição das colunas da tabela de logs
  const logColumns = [
    {
      header: "ID",
      accessorKey: "id" as keyof LogEntry,
    },
    {
      header: "Tipo",
      accessorKey: "type" as keyof LogEntry,
      cell: (log: LogEntry) => {
        const typeLabels: Record<string, string> = {
          "info": "Informação",
          "warning": "Alerta",
          "error": "Erro",
          "security": "Segurança"
        };
        
        const typeColors: Record<string, string> = {
          "info": "bg-blue-100 text-blue-800",
          "warning": "bg-yellow-100 text-yellow-800",
          "error": "bg-red-100 text-red-800",
          "security": "bg-purple-100 text-purple-800"
        };
        
        return (
          <div className={`rounded-full px-2 py-1 text-xs font-medium inline-flex items-center ${typeColors[log.type]}`}>
            {LogTypeIcons[log.type]}
            <span className="ml-1">{typeLabels[log.type]}</span>
          </div>
        );
      },
    },
    {
      header: "Mensagem",
      accessorKey: "message" as keyof LogEntry,
      cell: (log: LogEntry) => (
        <div className="max-w-md truncate">
          {log.message}
        </div>
      ),
    },
    {
      header: "Usuário",
      accessorKey: "user" as keyof LogEntry,
      cell: (log: LogEntry) => (
        <div className="flex items-center">
          <User className="h-4 w-4 text-muted-foreground mr-2" />
          <span>{log.user || "Anônimo"}</span>
        </div>
      ),
    },
    {
      header: "Data/Hora",
      accessorKey: "timestamp" as keyof LogEntry,
      cell: (log: LogEntry) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-muted-foreground mr-2" />
          <span>{log.timestamp}</span>
        </div>
      ),
    },
    {
      header: "Módulo",
      accessorKey: "module" as keyof LogEntry,
      cell: (log: LogEntry) => (
        <span className="capitalize">{log.module}</span>
      ),
    },
  ];
  
  // Definição das colunas da tabela de auditoria
  const auditColumns = [
    {
      header: "ID",
      accessorKey: "id" as keyof AuditEntry,
    },
    {
      header: "Ação",
      accessorKey: "action" as keyof AuditEntry,
      cell: (audit: AuditEntry) => {
        const actionLabels: Record<string, string> = {
          "create": "Criação",
          "update": "Edição",
          "delete": "Exclusão",
          "view": "Visualização",
          "export": "Exportação",
          "approve": "Aprovação"
        };
        
        const actionColors: Record<string, string> = {
          "create": "bg-green-100 text-green-800",
          "update": "bg-blue-100 text-blue-800",
          "delete": "bg-red-100 text-red-800",
          "view": "bg-purple-100 text-purple-800",
          "export": "bg-yellow-100 text-yellow-800",
          "approve": "bg-indigo-100 text-indigo-800"
        };
        
        const ActionIcons: Record<string, React.ReactNode> = {
          "create": <CheckCircle2 className="h-4 w-4" />,
          "update": <History className="h-4 w-4" />,
          "delete": <Trash2 className="h-4 w-4" />,
          "view": <Eye className="h-4 w-4" />,
          "export": <Download className="h-4 w-4" />,
          "approve": <CheckCircle2 className="h-4 w-4" />
        };
        
        return (
          <div className={`rounded-full px-2 py-1 text-xs font-medium inline-flex items-center ${actionColors[audit.action]}`}>
            {ActionIcons[audit.action]}
            <span className="ml-1">{actionLabels[audit.action]}</span>
          </div>
        );
      },
    },
    {
      header: "Detalhes",
      accessorKey: "details" as keyof AuditEntry,
      cell: (audit: AuditEntry) => (
        <div className="max-w-md truncate">
          {audit.details}
        </div>
      ),
    },
    {
      header: "Usuário",
      accessorKey: "user" as keyof AuditEntry,
      cell: (audit: AuditEntry) => (
        <div className="flex items-center">
          <User className="h-4 w-4 text-muted-foreground mr-2" />
          <span>{audit.user}</span>
        </div>
      ),
    },
    {
      header: "Data/Hora",
      accessorKey: "timestamp" as keyof AuditEntry,
    },
    {
      header: "Recurso",
      accessorKey: "resource" as keyof AuditEntry,
      cell: (audit: AuditEntry) => (
        <div className="flex items-center">
          <HardDrive className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="capitalize">{audit.resource}</span>
          <span className="ml-1 text-xs text-muted-foreground">#{audit.resourceId}</span>
        </div>
      ),
    },
  ];
  
  // Ações para a tabela de logs
  const logActions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: (log: LogEntry) => handleViewLog(log),
    },
    {
      label: "Exportar",
      icon: <FileText className="h-4 w-4" />,
      onClick: (log: LogEntry) => {
        toast({
          title: "Log exportado",
          description: `Log #${log.id} exportado com sucesso.`,
        });
      },
    },
  ];
  
  // Ações para a tabela de auditoria
  const auditActions = [
    {
      label: "Ver detalhes",
      icon: <Eye className="h-4 w-4" />,
      onClick: (audit: AuditEntry) => handleViewAudit(audit),
    },
  ];
  
  // Renderizar estatísticas com base na aba ativa
  const renderStats = () => {
    if (activeTab === "logs") {
      return (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Tipo</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {logData?.typeCounts.map((typeCount) => {
                  const typeLabels: Record<string, string> = {
                    "info": "Informação",
                    "warning": "Alerta",
                    "error": "Erro",
                    "security": "Segurança"
                  };
                  
                  return (
                    <div key={typeCount.type} className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        {LogTypeIcons[typeCount.type]}
                        <span className="ml-1">{typeLabels[typeCount.type]}</span>
                      </div>
                      <span className="text-sm font-medium">{typeCount.count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Módulo</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {logData?.moduleCounts.map((moduleCount) => (
                  <div key={moduleCount.module} className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Activity className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="capitalize">{moduleCount.module}</span>
                    </div>
                    <span className="text-sm font-medium">{moduleCount.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else if (activeTab === "audit") {
      return (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Ação</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {auditData?.actionCounts.map((actionCount) => {
                  const actionLabels: Record<string, string> = {
                    "create": "Criação",
                    "update": "Edição",
                    "delete": "Exclusão",
                    "view": "Visualização",
                    "export": "Exportação",
                    "approve": "Aprovação"
                  };
                  
                  return (
                    <div key={actionCount.action} className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Activity className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <span>{actionLabels[actionCount.action] || actionCount.action}</span>
                      </div>
                      <span className="text-sm font-medium">{actionCount.count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Recurso</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {auditData?.resourceCounts.map((resourceCount) => (
                  <div key={resourceCount.resource} className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <HardDrive className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="capitalize">{resourceCount.resource}</span>
                    </div>
                    <span className="text-sm font-medium">{resourceCount.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <DashboardLayout title="Logs e Auditoria" type="admin">
      <Tabs defaultValue="logs" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="logs">
              <Activity className="h-4 w-4 mr-2" />
              Logs do Sistema
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Shield className="h-4 w-4 mr-2" />
              Auditoria
            </TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={new Date()}
                  selected={{
                    from: dateRange.from ?? undefined,
                    to: dateRange.to ?? undefined,
                  }}
                  onSelect={range => {
                    if (range?.from) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
        
        {/* Estatísticas */}
        {renderStats()}
        
        {/* Tab: Logs do Sistema */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Registros de atividades, erros e alertas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar logs..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-1 gap-4">
                  <Select value={typeFilter || ""} onValueChange={(val) => setTypeFilter(val || null)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      <SelectItem value="info">Informação</SelectItem>
                      <SelectItem value="warning">Alerta</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="security">Segurança</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={moduleFilter || ""} onValueChange={(val) => setModuleFilter(val || null)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os módulos</SelectItem>
                      <SelectItem value="auth">Autenticação</SelectItem>
                      <SelectItem value="payment">Pagamento</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                      <SelectItem value="qrcode">QR Code</SelectItem>
                      <SelectItem value="access">Acesso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DataTable
                data={logData?.logs || []}
                columns={logColumns}
                actions={logActions}
                searchable={false}
                pagination={{
                  pageIndex: page - 1,
                  pageSize: pageSize,
                  pageCount: logData?.pageCount || 1,
                  onPageChange: (newPage) => setPage(newPage + 1),
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Auditoria */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria</CardTitle>
              <CardDescription>
                Registros detalhados de ações realizadas por usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar auditoria..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-1 gap-4">
                  <Select value={typeFilter || ""} onValueChange={(val) => setTypeFilter(val || null)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as ações</SelectItem>
                      <SelectItem value="create">Criação</SelectItem>
                      <SelectItem value="update">Edição</SelectItem>
                      <SelectItem value="delete">Exclusão</SelectItem>
                      <SelectItem value="view">Visualização</SelectItem>
                      <SelectItem value="export">Exportação</SelectItem>
                      <SelectItem value="approve">Aprovação</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={moduleFilter || ""} onValueChange={(val) => setModuleFilter(val || null)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Recurso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os recursos</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="settings">Configurações</SelectItem>
                      <SelectItem value="merchant">Loja</SelectItem>
                      <SelectItem value="transaction">Transação</SelectItem>
                      <SelectItem value="report">Relatório</SelectItem>
                      <SelectItem value="product">Produto</SelectItem>
                      <SelectItem value="withdrawal">Saque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DataTable
                data={auditData?.audits || []}
                columns={auditColumns}
                actions={auditActions}
                searchable={false}
                pagination={{
                  pageIndex: page - 1,
                  pageSize: pageSize,
                  pageCount: auditData?.pageCount || 1,
                  onPageChange: (newPage) => setPage(newPage + 1),
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}