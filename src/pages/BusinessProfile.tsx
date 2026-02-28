import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { fetchBusinessBySlug, fetchSimilarBusinesses, fetchCompetitors } from "@/data/database";
import { Business } from "@/types/directory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Phone, Globe, MapPin, Clock, Star, Share2, Heart, 
  Navigation, CheckCircle2, Trophy, Sparkles, Users, TrendingUp,
  Camera, Play, MessageSquare, Shield, ExternalLink, Copy, Mail
} from "lucide-react";
import ProfileHero from "@/components/profile/ProfileHero";
import ProfileAbout from "@/components/profile/ProfileAbout";
import ProfileGallery from "@/components/profile/ProfileGallery";
import ProfileReviews from "@/components/profile/ProfileReviews";
import ProfileReputation from "@/components/profile/ProfileReputation";
import ProfileCompetitors from "@/components/profile/ProfileCompetitors";
import ProfileMap from "@/components/profile/ProfileMap";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ProfileSimilar from "@/components/profile/ProfileSimilar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const BusinessProfile = () => {
  const { category, city, slug } = useParams();
  const navigate = useNavigate();
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [similarBusinesses, setSimilarBusinesses] = useState<Business[]>([]);
  const [competitors, setCompetitors] = useState<Business[]>([]);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);

  // Fetch business from database
  useEffect(() => {
    const loadBusiness = async () => {
      setIsLoadingBusiness(true);
      const biz = await fetchBusinessBySlug(slug || "");
      setBusiness(biz);
      if (biz) {
        const [similar, comps] = await Promise.all([
          fetchSimilarBusinesses(biz.id, biz.category, 4),
          fetchCompetitors(biz.id, biz.category, biz.city, 5),
        ]);
        setSimilarBusinesses(similar);
        setCompetitors(comps);
      }
      setIsLoadingBusiness(false);
    };
    loadBusiness();
  }, [slug]);

  // Load user and check if saved
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if business is saved
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !business) return;
      
      const { data } = await supabase
        .from("saved_businesses")
        .select("id")
        .eq("user_id", user.id)
        .eq("business_id", business.id)
        .maybeSingle();
      
      setIsSaved(!!data);
    };

    checkIfSaved();
  }, [user, business?.id]);

  // Fetch AI-generated description on mount
  useEffect(() => {
    const fetchAiDescription = async () => {
      if (!business) return;
      
      setIsLoadingDescription(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-business-description', {
          body: { 
            business: {
              name: business.name,
              category: business.category,
              city: business.city,
              province: business.province,
              rating: business.rating,
              reviewCount: business.reviewCount,
              priceRange: business.priceRange,
              features: business.features,
              ownership: business.ownership,
              isWorldCupReady: business.isWorldCupReady,
              isVerified: business.isVerified,
            }
          }
        });

        if (error) {
          console.error('Error fetching AI description:', error);
          return;
        }

        if (data?.description) {
          setAiDescription(data.description);
        }
      } catch (err) {
        console.error('Failed to fetch AI description:', err);
      } finally {
        setIsLoadingDescription(false);
      }
    };

    fetchAiDescription();
  }, [business?.id]);

  const generateSlug = (name: string) => 
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const breadcrumbCategory = category?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || business?.category || '';
  const breadcrumbCity = city?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || business?.city || '';

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: business.name,
        text: aiDescription || business.description,
        url: window.location.href
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save businesses", {
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }

    if (isSaved) {
      // Remove from saved
      const { error } = await supabase
        .from("saved_businesses")
        .delete()
        .eq("user_id", user.id)
        .eq("business_id", business.id);

      if (error) {
        toast.error("Failed to remove business");
      } else {
        setIsSaved(false);
        toast.success("Removed from saved");
      }
    } else {
      // Add to saved
      const { error } = await supabase
        .from("saved_businesses")
        .insert({
          user_id: user.id,
          business_id: business.id,
          business_name: business.name,
          business_category: business.category,
          business_city: business.city,
        });

      if (error) {
        toast.error("Failed to save business");
      } else {
        setIsSaved(true);
        toast.success("Business saved!");
      }
    }
  };

  if (isLoadingBusiness || !business) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <p className="text-muted-foreground">{isLoadingBusiness ? "Loading..." : "Business not found"}</p>
        </main>
      </>
    );
  }

  // Create enhanced business object with AI description
  const enhancedBusiness: Business = {
    ...business,
    description: aiDescription || business.description,
  };

  return (
    <>
      <Helmet>
        <title>{business.name} | {business.category} in {business.city} | LaunchPad Canada</title>
        <meta name="description" content={aiDescription || business.description} />
        <meta property="og:title" content={`${business.name} - ${business.category} in ${business.city}`} />
        <meta property="og:description" content={aiDescription || business.description} />
        <meta property="og:image" content={business.image} />
        <meta property="og:type" content="business.business" />
        <link rel="canonical" href={`https://launchpad.ca/directory/${category}/${city}/${slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": business.name,
            "image": business.image,
            "description": aiDescription || business.description,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": business.address,
              "addressLocality": business.city,
              "addressRegion": business.province,
              "addressCountry": "CA"
            },
            "geo": business.coordinates ? {
              "@type": "GeoCoordinates",
              "latitude": business.coordinates.lat,
              "longitude": business.coordinates.lng
            } : undefined,
            "telephone": business.phone,
            "url": business.website,
            "priceRange": business.priceRange,
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": business.rating,
              "reviewCount": business.reviewCount
            }
          })}
        </script>
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background pt-20">
        {/* Breadcrumb */}
        <div className="bg-muted/50 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Link 
                to="/directory" 
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Directory
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link 
                to={`/directory?category=${business.category}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {breadcrumbCategory}
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link 
                to={`/directory?location=${business.city}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {breadcrumbCity}
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-medium">{business.name}</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <ProfileHero 
          business={business} 
          onShare={handleShare} 
          onSave={handleSave}
          isSaved={isSaved}
        />

        {/* Badges Bar */}
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {business.isWorldCupReady && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1.5 py-1.5 px-3">
                  <Trophy className="w-4 h-4" />
                  World Cup 2026 Ready
                </Badge>
              )}
              {business.isVerified && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-emerald-100 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified Business
                </Badge>
              )}
              {business.isAwardWinner && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-purple-100 text-purple-700 border-purple-200">
                  <Trophy className="w-4 h-4" />
                  Award Winner
                </Badge>
              )}
              {business.isNew && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-blue-100 text-blue-700 border-blue-200">
                  <Sparkles className="w-4 h-4" />
                  New Business
                </Badge>
              )}
              {business.isTrending && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 bg-pink-100 text-pink-700 border-pink-200">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>1,247 people viewed this week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              {isLoadingDescription ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              ) : (
                <ProfileAbout business={enhancedBusiness} />
              )}
              <ProfileGallery photos={business.photos || [business.image]} />
              <ProfileReviews business={business} />
              <ProfileReputation business={business} />
              <ProfileCompetitors business={business} competitors={competitors} />
              <ProfileMap business={business} />
              <ProfileSimilar businesses={similarBusinesses} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <ProfileSidebar business={business} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default BusinessProfile;
