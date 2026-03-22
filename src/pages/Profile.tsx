import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, BookmarkIcon, Settings, Loader2, Trash2, ArrowLeft, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { businessProfilePath } from "@/lib/slug";
import Navbar from "@/components/Navbar";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface SavedBusiness {
  id: string;
  business_id: string;
  business_name: string;
  business_category: string | null;
  business_city: string | null;
  saved_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedBusinesses, setSavedBusinesses] = useState<SavedBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

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
      fetchProfile();
      fetchSavedBusinesses();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
    }
    setIsLoading(false);
  };

  const fetchSavedBusinesses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("saved_businesses")
      .select("*")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved businesses:", error);
    } else {
      setSavedBusinesses(data || []);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
      fetchProfile();
    }
    setIsSaving(false);
  };

  const handleRemoveSaved = async (businessId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("saved_businesses")
      .delete()
      .eq("user_id", user.id)
      .eq("business_id", businessId);

    if (error) {
      toast.error("Failed to remove saved business");
    } else {
      toast.success("Business removed from saved");
      setSavedBusinesses(prev => prev.filter(b => b.business_id !== businessId));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile | RTM Business Directory</title>
        <meta name="description" content="Manage your RTM Business Directory profile, saved businesses, and account settings." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-gradient-to-br from-muted/50 to-background pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{fullName || "Your Profile"}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Tabs defaultValue="saved" className="w-full">
<TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <BookmarkIcon className="w-4 h-4" />
                Saved Businesses
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Account Settings
              </TabsTrigger>
</TabsList>

            <TabsContent value="dashboard">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Dashboard</CardTitle>
                  <CardDescription>Your business at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-primary">1,247</p>
                      <p className="text-sm text-muted-foreground">Profile Views</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-red-500">89</p>
                      <p className="text-sm text-muted-foreground">Saves</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-green-600">23</p>
                      <p className="text-sm text-muted-foreground">Inquiries</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold text-yellow-500">4.8</p>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/dashboard">
                      Go to Full Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Businesses</CardTitle>
                  <CardDescription>Businesses you've bookmarked for later</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedBusinesses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookmarkIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No saved businesses yet</p>
                      <Button asChild variant="outline" className="mt-4">
                        <Link to="/directory">Explore Directory</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedBusinesses.map((business) => (
                        <div
                          key={business.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <Link
                            to={businessProfilePath({
                              id: business.business_id,
                              name: business.business_name,
                              category: business.business_category || "business",
                              location: { city: business.business_city || "canada" }
                            } as any)}
                            className="flex-1"
                          >
                            <h3 className="font-medium text-foreground hover:text-primary transition-colors">
                              {business.business_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {business.business_category} • {business.business_city}
                            </p>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSaved(business.business_id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Update your profile information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button type="button" variant="destructive" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

export default Profile;
