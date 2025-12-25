import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { mockBusinesses } from "@/data/mockBusinesses";
import { Business } from "@/types/directory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

const BusinessProfile = () => {
  const { category, city, slug } = useParams();
  
  // Find business by slug (in real app, fetch from API)
  const business = mockBusinesses.find(b => 
    b.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === slug
  ) || mockBusinesses[0];

  const generateSlug = (name: string) => 
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const breadcrumbCategory = category?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || business.category;
  const breadcrumbCity = city?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || business.city;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: business.name,
        text: business.description,
        url: window.location.href
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleSave = () => {
    toast.success(`${business.name} saved to your list!`);
  };

  // Find similar businesses
  const similarBusinesses = mockBusinesses
    .filter(b => b.id !== business.id && b.category === business.category)
    .slice(0, 4);

  // Find competitors (same category, same city)
  const competitors = mockBusinesses
    .filter(b => b.id !== business.id && b.category === business.category && b.city === business.city)
    .slice(0, 5);

  return (
    <>
      <Helmet>
        <title>{business.name} | {business.category} in {business.city} | LaunchPad Canada</title>
        <meta name="description" content={business.description} />
        <meta property="og:title" content={`${business.name} - ${business.category} in ${business.city}`} />
        <meta property="og:description" content={business.description} />
        <meta property="og:image" content={business.image} />
        <meta property="og:type" content="business.business" />
        <link rel="canonical" href={`https://launchpad.ca/directory/${category}/${city}/${slug}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": business.name,
            "image": business.image,
            "description": business.description,
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
              <ProfileAbout business={business} />
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
