import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Directory from "./pages/Directory";
import BusinessProfile from "./pages/BusinessProfile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import GrantPilot from "./pages/GrantPilot";
import GrantDetail from "./pages/GrantDetail";
import Deals from "./pages/Deals";
import Membership from "./pages/Membership";
import Affiliate from "./pages/Affiliate";
import ContentPage from "./pages/ContentPage";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBusinesses from "./pages/admin/AdminBusinesses";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminGrants from "./pages/admin/AdminGrants";
import AdminMembership from "./pages/admin/AdminMembership";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminListings from "./pages/admin/AdminListings";
import AdminOps from "./pages/admin/AdminOps";
import ClaimBusiness from "./pages/ClaimBusiness";
import ListingOptOut from "./pages/ListingOptOut";
import GrowRedirect from "./pages/GrowRedirect";
import AdminGrowth from "./pages/admin/AdminGrowth";
import WorldCupRedirect from "./pages/WorldCupRedirect";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/grants" element={<GrantPilot />} />
            <Route path="/grants/:id" element={<GrantDetail />} />
            <Route path="/grantpilot" element={<Navigate to="/grants" replace />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/grow" element={<GrowRedirect />} />
            <Route path="/grow/*" element={<GrowRedirect />} />
            <Route path="/business-support" element={<Navigate to="/grow" replace />} />
            <Route path="/ai-search" element={<ContentPage />} />
            <Route path="/world-cup-hub" element={<WorldCupRedirect />} />
            <Route path="/marketplace" element={<ContentPage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<ContentPage />} />
            <Route path="/careers" element={<ContentPage />} />
            <Route path="/blog" element={<ContentPage />} />
            <Route path="/press-kit" element={<ContentPage />} />
            <Route path="/partners" element={<ContentPage />} />
            <Route path="/contact" element={<ContentPage />} />
            <Route path="/terms" element={<ContentPage />} />
            <Route path="/privacy" element={<ContentPage />} />
            <Route path="/cookies" element={<ContentPage />} />
            <Route path="/accessibility" element={<ContentPage />} />
            <Route path="/content/:slug" element={<ContentPage />} />
            <Route path="/directory/:category/:city/:slug" element={<BusinessProfile />} />
            <Route path="/claim" element={<ClaimBusiness />} />
            <Route path="/listing-opt-out" element={<ListingOptOut />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/businesses" element={<AdminBusinesses />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/grants" element={<AdminGrants />} />
            <Route path="/admin/listings" element={<AdminListings />} />
            <Route path="/admin/ops" element={<AdminOps />} />
            <Route path="/admin/growth" element={<AdminGrowth />} />
            <Route path="/admin/membership" element={<AdminMembership />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
