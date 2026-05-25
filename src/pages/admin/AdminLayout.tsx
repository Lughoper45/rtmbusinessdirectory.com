import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  BarChart3,
  CreditCard,
  FileText,
  Megaphone,
  TrendingUp,
  Inbox,
  Loader2,
  ShieldAlert,
  X,
  Menu
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/grants", label: "Grants", icon: FileText },
  { href: "/admin/listings", label: "Listings", icon: Megaphone },
  { href: "/admin/growth", label: "Growth", icon: TrendingUp },
  { href: "/admin/ops", label: "Ops CRM", icon: Inbox },
  { href: "/admin/membership", label: "Membership", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminSidebar = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/admin" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">RTM</span>
          </div>
          Admin
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/admin" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Website
        </Link>
      </div>
    </div>
  );
};

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setIsAdmin(data?.role === "admin");
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-lg rounded-2xl border bg-white p-8 text-center shadow-lg dark:bg-gray-950">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="text-2xl font-bold">
            {isAuthenticated ? "Admin Access Required" : "Sign In Required"}
          </h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {isAuthenticated
              ? "Your account does not currently have the `admin` role in `profiles.role`, so the admin workspace is blocked."
              : "Please sign in to access the admin workspace."}
          </p>
          <div className="mt-6">
            {isAuthenticated ? (
              <Link to="/" className="text-primary hover:underline">
                Return to website
              </Link>
            ) : (
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white dark:lg:bg-gray-950">
        <AdminSidebar />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden h-14" /> {/* Spacer for mobile header */}
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
