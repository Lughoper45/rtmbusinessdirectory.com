import { Business } from "@/types/directory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, Phone, Globe, Clock, CreditCard, Accessibility, 
  Languages, Tag, Trophy, Sparkles, CheckCircle2, Mail, 
  MessageSquare, Building2, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProfileSidebarProps {
  business: Business;
}

const ProfileSidebar = ({ business }: ProfileSidebarProps) => {
  const navigate = useNavigate();
  const [claimLoading, setClaimLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! The business will contact you soon.");
    setContactForm({ name: "", email: "", message: "" });
  };

  const handleClaim = async () => {
    setClaimLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const returnPath = `/claim?businessId=${encodeURIComponent(business.id)}`;
      if (!session?.user) {
        navigate(`/auth?redirectTo=${encodeURIComponent(returnPath)}`);
        return;
      }
      navigate(returnPath);
    } finally {
      setClaimLoading(false);
    }
  };

  // Mock business hours
  const hours = [
    { day: "Monday", open: "9:00 AM", close: "9:00 PM", isToday: false },
    { day: "Tuesday", open: "9:00 AM", close: "9:00 PM", isToday: false },
    { day: "Wednesday", open: "9:00 AM", close: "9:00 PM", isToday: true },
    { day: "Thursday", open: "9:00 AM", close: "9:00 PM", isToday: false },
    { day: "Friday", open: "9:00 AM", close: "11:00 PM", isToday: false },
    { day: "Saturday", open: "10:00 AM", close: "11:00 PM", isToday: false },
    { day: "Sunday", open: "10:00 AM", close: "8:00 PM", isToday: false },
  ];

  return (
    <div className="space-y-6 lg:sticky lg:top-28">
      {/* Quick Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Quick Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">{business.address}</p>
              <p className="text-sm text-muted-foreground">{business.city}, {business.province}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <a href={`tel:${business.phone || '416-555-0123'}`} className="text-foreground hover:text-primary transition-colors">
              {business.phone || '(416) 555-0123'}
            </a>
          </div>

          {/* Website */}
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            {business.website ? (
              <a 
                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {business.website}
              </a>
            ) : (
              <span className="text-muted-foreground">Not provided</span>
            )}
          </div>

          <Separator />

          {/* Hours */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Hours</span>
              <Badge 
                variant="secondary" 
                className={business.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}
              >
                {business.isOpen ? 'Open' : 'Closed'}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              {hours.map((day) => (
                <div 
                  key={day.day} 
                  className={`flex justify-between ${day.isToday ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  <span>{day.day}</span>
                  <span>{day.open} - {day.close}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Methods */}
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              Cash, Credit, Debit, Apple Pay, Google Pay
            </div>
          </div>

          {/* Accessibility */}
          <div className="flex items-start gap-3">
            <Accessibility className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              Wheelchair accessible
            </div>
          </div>

          {/* Languages */}
          <div className="flex items-start gap-3">
            <Languages className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              English, French, Spanish
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{business.category}</Badge>
            {business.subcategory && (
              <Badge variant="secondary">{business.subcategory}</Badge>
            )}
            {business.cuisine && (
              <Badge variant="secondary">{business.cuisine}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Badges Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Badges & Awards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {business.isWorldCupReady && (
              <Badge className="w-full justify-start gap-2 py-2 bg-gradient-to-r from-amber-500 to-orange-500">
                <Trophy className="w-4 h-4" />
                World Cup 2026 Ready
              </Badge>
            )}
            {business.isVerified && (
              <Badge variant="secondary" className="w-full justify-start gap-2 py-2 bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                Verified Business
              </Badge>
            )}
            {business.isAwardWinner && (
              <Badge variant="secondary" className="w-full justify-start gap-2 py-2 bg-purple-100 text-purple-700">
                <Trophy className="w-4 h-4" />
                Award Winner
              </Badge>
            )}
            {business.isNew && (
              <Badge variant="secondary" className="w-full justify-start gap-2 py-2 bg-blue-100 text-blue-700">
                <Sparkles className="w-4 h-4" />
                New Business
              </Badge>
            )}
            <Badge variant="secondary" className="w-full justify-start gap-2 py-2">
              🏆 Top Rated {new Date().getFullYear()}
            </Badge>
            <Badge variant="secondary" className="w-full justify-start gap-2 py-2">
              ❤️ Local Favorite
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contact Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Contact Business
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleContact} className="space-y-4">
            <Input 
              placeholder="Your name"
              value={contactForm.name}
              onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
              required
            />
            <Input 
              type="email"
              placeholder="Your email"
              value={contactForm.email}
              onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
              required
            />
            <Textarea 
              placeholder="Your message..."
              rows={3}
              value={contactForm.message}
              onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
              required
            />
            <Button type="submit" className="w-full gap-2">
              <Mail className="w-4 h-4" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Claim Profile Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">📢 Claim This Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Is this your business? Claim your premium profile to update your information, 
            respond to reviews, and access business insights.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Update business information
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Respond to customer reviews
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Access analytics & insights
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Add photos & videos
            </div>
          </div>
          <Button
            onClick={() => void handleClaim()}
            disabled={claimLoading}
            className="w-full gap-2 shadow-lg shadow-primary/20"
          >
            Claim Now - Free
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Free for World Cup 2026 early adopters
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
