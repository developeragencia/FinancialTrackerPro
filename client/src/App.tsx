import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth.tsx";
import { ThemeProvider } from "next-themes";

// Auth Pages
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

// Client Pages
import ClientDashboard from "@/pages/client/dashboard";
import ClientTransactions from "@/pages/client/transactions";
import ClientTransfers from "@/pages/client/transfers";
import ClientQRCode from "@/pages/client/qr-code";
import ClientReferrals from "@/pages/client/referrals";
import ClientProfile from "@/pages/client/profile";

// Merchant Pages
import MerchantDashboard from "@/pages/merchant/dashboard";
import MerchantSales from "@/pages/merchant/sales";
import MerchantProducts from "@/pages/merchant/products";
import MerchantScanner from "@/pages/merchant/scanner";
import MerchantCustomers from "@/pages/merchant/customers";
import MerchantProfile from "@/pages/merchant/profile";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminStores from "@/pages/admin/stores";

// Other
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Client Routes */}
      <Route path="/client" component={ClientDashboard} />
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/transactions" component={ClientTransactions} />
      <Route path="/client/transfers" component={ClientTransfers} />
      <Route path="/client/qr-code" component={ClientQRCode} />
      <Route path="/client/referrals" component={ClientReferrals} />
      <Route path="/client/profile" component={ClientProfile} />
      
      {/* Merchant Routes */}
      <Route path="/merchant" component={MerchantDashboard} />
      <Route path="/merchant/dashboard" component={MerchantDashboard} />
      <Route path="/merchant/sales" component={MerchantSales} />
      <Route path="/merchant/products" component={MerchantProducts} />
      <Route path="/merchant/scanner" component={MerchantScanner} />
      <Route path="/merchant/customers" component={MerchantCustomers} />
      <Route path="/merchant/profile" component={MerchantProfile} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/stores" component={AdminStores} />
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
