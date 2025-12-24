import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustBar from "@/components/TrustBar";
import ThreePathSection from "@/components/ThreePathSection";
import AIDiscoverySection from "@/components/AIDiscoverySection";
import BusinessSupportHub from "@/components/BusinessSupportHub";
import WorldCupSection from "@/components/WorldCupSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import SuccessStoriesSection from "@/components/SuccessStoriesSection";
import FeaturedBusinesses from "@/components/FeaturedBusinesses";
import ImmigrantHubSection from "@/components/ImmigrantHubSection";
import StatsSection from "@/components/StatsSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>LaunchPad Canada - Where Canadian Businesses Take Off</title>
        <meta 
          name="description" 
          content="Discover 50,000+ verified Canadian businesses, access $2.3B+ in grants, and get AI-powered support to grow your business faster. Your launchpad to success." 
        />
        <meta name="keywords" content="Canadian businesses, grants, funding, business support, AI search, World Cup 2026" />
        <link rel="canonical" href="https://launchpadcanada.com" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <TrustBar />
          <ThreePathSection />
          <AIDiscoverySection />
          <BusinessSupportHub />
          <WorldCupSection />
          <HowItWorksSection />
          <SuccessStoriesSection />
          <FeaturedBusinesses />
          <ImmigrantHubSection />
          <StatsSection />
          <FinalCTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
