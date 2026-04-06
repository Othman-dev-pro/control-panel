import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOwners from "./pages/AdminOwners";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminPlans from "./pages/AdminPlans";
import AdminTrials from "./pages/AdminTrials";
import AdminSettings from "./pages/AdminSettings";
import AdminAds from "./pages/AdminAds";
import AdminBranding from "./pages/AdminBranding";
import AdminContact from "./pages/AdminContact";
import AdminPaymentAccounts from "./pages/AdminPaymentAccounts";
import AdminTexts from "./pages/AdminTexts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Redirection */}
              <Route path="/" element={<Index />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/owners" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminOwners /></ProtectedRoute>} />
              <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminSubscriptions /></ProtectedRoute>} />
              <Route path="/admin/plans" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminPlans /></ProtectedRoute>} />
              <Route path="/admin/trials" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminTrials /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/ads" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminAds /></ProtectedRoute>} />
              <Route path="/admin/branding" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminBranding /></ProtectedRoute>} />
              <Route path="/admin/contact" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminContact /></ProtectedRoute>} />
              <Route path="/admin/payment-accounts" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminPaymentAccounts /></ProtectedRoute>} />
              <Route path="/admin/texts" element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminTexts /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
