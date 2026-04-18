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
import ProgressVisualization from "@/components/ProgressVisualization";
import StickyFloatingCTA from "@/components/StickyFloatingCTA";
import LiveActivityFeed from "@/components/LiveActivityFeed";
import AIChatAssistant from "@/components/AIChatAssistant";
import CanadaMap from "@/components/CanadaMap";
import FacebookFeed from "@/components/FacebookFeed";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>RTM Business Directory - Discover & List Businesses</title>
        <meta 
          name="description" 
          content="Discover verified businesses, access exclusive deals, and get AI-powered support to grow your business. Your trusted business directory." 
        />
        <meta name="keywords" content="business directory, find businesses, list business, verified listings, business support" />
        <link rel="canonical" href="https://rtmbusinessdirectory.com" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <TrustBar />
          <ThreePathSection />
          <CanadaMap />
          <ProgressVisualization />
          <FacebookFeed />
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
        
        {/* Floating Elements */}
        <StickyFloatingCTA />
        <LiveActivityFeed />
        <AIChatAssistant />
      </div>
    </>
  );
};

export default Index;
