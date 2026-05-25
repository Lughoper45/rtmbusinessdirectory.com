import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Eye, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  DollarSign, 
  ClipboardCheck, 
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  BarChart3,
  FileText,
  Users,
  Loader2,
  Star,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { fetchPlatformMembership } from "@/services/membership";
import { openMembershipJoin, GRANTS_APP_URL, getGrantsWorkspaceUrl } from "@/lib/site";
import { fetchRecommendedGrants, formatGrantAmount, grantDetailPath } from "@/lib/grants";
import { loadGrantProfile } from "@/lib/grantProfile";
import type { ScoredGrant } from "@/types/grant";

interface DashboardStats {
  totalViews: number;
  totalSaves: number;
  totalInquiries: number;
  profileViews: number;
  viewsChange: number;
  savesChange: number;
}

interface RecentActivity {
  id: string;
  type: "view" | "save" | "inquiry" | "review";
  businessName?: string;
  description: string;
  timestamp: string;
}

interface ComplianceItem {
  id: string;
  name: string;
  status: "complete" | "pending" | "overdue";
  dueDate: string;
}

interface MembershipSummary {
  active: boolean;
  status: string;
  source: string;
}

interface AffiliateSummary {
  id: string;
  referral_code: string;
  total_earnings: number;
  commission_rate: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [membership, setMembership] = useState<MembershipSummary | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [affiliate, setAffiliate] = useState<AffiliateSummary | null>(null);
  const [referralCount, setReferralCount] = useState(0);

  const [stats, setStats] = useState<DashboardStats>({
    totalViews: 1247,
    totalSaves: 89,
    totalInquiries: 23,
    profileViews: 342,
    viewsChange: 12.5,
    savesChange: 8.2,
  });

  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [ownedBusinessCount, setOwnedBusinessCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const [fundingOpportunities, setFundingOpportunities] = useState<ScoredGrant[]>([]);
  const [fundingLoading, setFundingLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      void (async () => {
        const program = await loadProgramData(user.id, user.email);
        await loadDirectoryInsights(user.id, program.membership, program.affiliate);
        setIsLoading(false);
        setMembershipChecked(true);
      })();
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const profile = loadGrantProfile();
        const grants = await fetchRecommendedGrants(profile, 4);
        setFundingOpportunities(grants);
      } catch {
        setFundingOpportunities([]);
      } finally {
        setFundingLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Stripe checkout completed. Membership data will appear after the webhook finalizes.");
    }
  }, []);

  const loadProgramData = async (userId: string, email?: string | null) => {
    const [platformMembership, { data: affiliateData }] = await Promise.all([
      fetchPlatformMembership(userId, email),
      supabase
        .from("affiliates")
        .select("id, referral_code, total_earnings, commission_rate")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    setMembership(platformMembership);
    setAffiliate(affiliateData);

    if (affiliateData?.id) {
      const { count } = await supabase
        .from("affiliate_referrals")
        .select("*", { count: "exact", head: true })
        .eq("affiliate_id", affiliateData.id);

      setReferralCount(count ?? 0);
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        const { fetchMyGrantApplications } = await import("@/lib/stellarApi");
        const apps = await fetchMyGrantApplications(session.access_token);
        setApplicationCount(apps.length);
      }
    } catch {
      setApplicationCount(0);
    }

    return { membership: platformMembership, affiliate: affiliateData };
  };

  const loadDirectoryInsights = async (
    userId: string,
    membershipState: MembershipSummary | null,
    affiliateState: AffiliateSummary | null,
  ) => {
    const [{ data: saves }, { data: claims }, { data: reviews }] = await Promise.all([
      supabase
        .from("saved_businesses")
        .select("id, business_id, saved_at")
        .eq("user_id", userId)
        .order("saved_at", { ascending: false })
        .limit(8),
      supabase
        .from("business_claims")
        .select("id, business_id, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("reviews")
        .select("id, business_id, rating, created_at, comment")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const saveActivities: RecentActivity[] = (saves ?? []).map((s) => ({
      id: `save-${s.id}`,
      type: "save" as const,
      description: "You saved a business listing",
      timestamp: new Date(s.saved_at).toLocaleDateString(),
    }));

    const claimActivities: RecentActivity[] = (claims ?? []).map((c) => ({
      id: `claim-${c.id}`,
      type: "inquiry" as const,
      description: `Business claim ${c.status}`,
      timestamp: new Date(c.created_at).toLocaleDateString(),
    }));

    const reviewActivities: RecentActivity[] = (reviews ?? []).map((r) => ({
      id: `review-${r.id}`,
      type: "review" as const,
      description: `Review posted (${r.rating}★)`,
      timestamp: new Date(r.created_at).toLocaleDateString(),
    }));

    setActivities([...reviewActivities, ...claimActivities, ...saveActivities].slice(0, 10));

    const approvedClaims = (claims ?? []).filter((c) => c.status === "approved").length;
    setOwnedBusinessCount(approvedClaims);

    const ratings = (reviews ?? []).map((r) => Number(r.rating)).filter((n) => !Number.isNaN(n));
    if (ratings.length > 0) {
      setReviewCount(ratings.length);
      setAverageRating(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    } else {
      setReviewCount(0);
      setAverageRating(null);
    }

    setStats({
      totalViews: approvedClaims * 120,
      totalSaves: saves?.length ?? 0,
      totalInquiries: (claims ?? []).filter((c) => c.status === "pending").length,
      profileViews: approvedClaims * 40,
      viewsChange: 0,
      savesChange: 0,
    });

    const compliance: ComplianceItem[] = [
      {
        id: "membership",
        name: "RTM membership",
        status: membershipState?.active ? "complete" : "pending",
        dueDate: "Required for deals & grants",
      },
      {
        id: "affiliate",
        name: "Affiliate program",
        status: affiliateState ? "complete" : "pending",
        dueDate: affiliateState ? "Active" : "Optional — enroll in dashboard",
      },
      ...(claims ?? []).map((c) => ({
        id: c.id,
        name: `Listing claim (${c.business_id})`,
        status: (c.status === "approved"
          ? "complete"
          : c.status === "rejected"
            ? "overdue"
            : "pending") as ComplianceItem["status"],
        dueDate: new Date(c.created_at).toLocaleDateString(),
      })),
    ];
    setComplianceItems(compliance);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "view": return <Eye className="w-4 h-4 text-blue-500" />;
      case "save": return <Heart className="w-4 h-4 text-red-500" />;
      case "inquiry": return <MessageCircle className="w-4 h-4 text-green-500" />;
      case "review": return <Star className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "overdue": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case "complete": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "pending": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "overdue": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasActiveMembership = membership?.active === true;

  if (user && membershipChecked && !hasActiveMembership) {
    return (
      <>
        <Helmet>
          <title>Dashboard | RTM Business Directory</title>
        </Helmet>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
          <Card className="max-w-lg w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <CardTitle>RTM membership required</CardTitle>
              <CardDescription>
                Your dashboard, member deals, and grant applications unlock after membership is active.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Current status: {membership?.status ?? "not active"}
              </p>
              <Button className="w-full" onClick={() => openMembershipJoin({ returnUrl: window.location.href })}>
                Activate membership
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/deals")}>
                View deals preview
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | RTM Business Directory</title>
        <meta name="description" content="Manage your business dashboard, track analytics, and access support tools." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-muted/30 to-background pt-20 pb-12">
        <div className="container mx-auto max-w-7xl px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Business Dashboard</h1>
              <p className="text-muted-foreground">Welcome back. Manage listing performance, memberships, and affiliate revenue from one place.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/directory")}>
                <Eye className="w-4 h-4 mr-2" />
                View Listing
              </Button>
              <Button onClick={() => navigate("/profile")}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Business
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-blue-200 bg-blue-50/60">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Membership</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{membership?.active ? "RTM Member" : "None"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {membership?.active
                    ? `Status: ${membership.status}`
                    : "Join at membership.rtmbusinessdirectory.com"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/60">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Affiliate earnings</p>
                <p className="mt-1 text-2xl font-bold text-foreground">${(affiliate?.total_earnings ?? 0).toFixed(2)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {affiliate ? `${affiliate.commission_rate}% commission on qualified referrals` : "Affiliate account not created yet"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Referral performance</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{referralCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {affiliate?.referral_code ? `Code: ${affiliate.referral_code}` : "Referral code unavailable"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.totalViews.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">+{stats.viewsChange}%</span>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Saves</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.totalSaves}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">+{stats.savesChange}%</span>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inquiries</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stats.totalInquiries}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-muted-foreground">This month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Profile Rating</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {averageRating !== null ? averageRating.toFixed(1) : "—"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-yellow-500">★</span>
                      <span className="text-sm text-muted-foreground">{reviewCount} reviews</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-background border">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="funding" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Funding
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common tasks at your fingertips</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => navigate("/directory")}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Add New Business</div>
                          <div className="text-xs text-muted-foreground">List another business</div>
                        </div>
                      </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      window.location.href = getGrantsWorkspaceUrl(session);
                    }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Unlock your RTM Funding Workspace</div>
                          <div className="text-xs text-muted-foreground">GrantPilot on grants subdomain</div>
                        </div>
                      </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Update Listing</div>
                          <div className="text-xs text-muted-foreground">Edit business details</div>
                        </div>
                      </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">View Analytics</div>
                          <div className="text-xs text-muted-foreground">Detailed performance</div>
                        </div>
                      </div>
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">AI Business Coach</div>
                          <div className="text-xs text-muted-foreground">Get expert advice</div>
                        </div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity Preview */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                    <CardDescription>Latest updates on your business</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activities.length === 0 && (
                        <p className="text-sm text-muted-foreground">No recent directory activity yet.</p>
                      )}
                      {activities.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center shrink-0">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Overview</CardTitle>
                  <CardDescription>Your business listing performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-muted-foreground">Performance chart coming soon</p>
                      <p className="text-sm text-muted-foreground/70">Track views, saves, and inquiries over time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compliance & Licensing</CardTitle>
                  <CardDescription>Track your business compliance status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-4">
                          {getComplianceIcon(item.status)}
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Due: {item.dueDate}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compliance Score</CardTitle>
                  <CardDescription>Your overall compliance health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Compliance Score</span>
                      <span className="font-medium">75%</span>
                    </div>
                    <Progress
                      value={
                        complianceItems.length
                          ? Math.round(
                              (complianceItems.filter((i) => i.status === "complete").length /
                                complianceItems.length) *
                                100,
                            )
                          : 0
                      }
                      className="h-3"
                    />
                    <p className="text-sm text-muted-foreground">
                      {ownedBusinessCount} approved listing{ownedBusinessCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="funding" className="space-y-6">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Unlock your RTM Funding Workspace</CardTitle>
                  <CardDescription>
                    Personalized grant matching, applications, and pipeline tracking live on GrantPilot at{' '}
                    {GRANTS_APP_URL.replace(/^https?:\/\//, '')}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => { window.location.href = `${GRANTS_APP_URL.replace(/\/$/, '')}/grants`; }}>
                    Open grant workspace
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Funding Opportunities</CardTitle>
                  <CardDescription>Grants and funding matched to your business</CardDescription>
                </CardHeader>
                <CardContent>
                  {fundingLoading ? (
                    <p className="text-sm text-muted-foreground">Loading recommended programs…</p>
                  ) : fundingOpportunities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Open your profile on{' '}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => { window.location.href = `${GRANTS_APP_URL.replace(/\/$/, '')}/grants`; }}
                      >
                        GrantPilot
                      </Button>{' '}
                      to see personalized matches.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {fundingOpportunities.map((opportunity) => (
                        <div key={opportunity.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/30 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-foreground">{opportunity.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {opportunity.computedMatch}% Match
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {formatGrantAmount(Number(opportunity.amount))}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {opportunity.deadline_label || `${opportunity.deadline_days} days`}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => navigate(grantDetailPath(opportunity.id))}>
                            View
                            <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-400">Total Funding Available</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-300">$100,000+</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-400">Applications Submitted</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{applicationCount}</p>
                        <Button variant="link" className="p-0 h-auto mt-1 text-blue-700 dark:text-blue-400" onClick={() => { window.location.href = `${GRANTS_APP_URL.replace(/\/$/, '')}/grants`; }}>
                          Open tracker on GrantPilot →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Activity</CardTitle>
                  <CardDescription>Complete history of interactions with your listing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.length === 0 && (
                      <p className="text-sm text-muted-foreground p-4">No activity recorded yet.</p>
                    )}
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{activity.description}</p>
                          {activity.businessName && (
                            <p className="text-sm text-primary">{activity.businessName}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
