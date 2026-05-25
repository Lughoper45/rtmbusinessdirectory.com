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

const Index = () => {
  return (
    <>
      <Helmet>
        <title>RTM Business Directory - Discover & List Businesses</title>
        <meta 
          name="description" 
          content="RTM Global Canada — private business directory, membership, and grant advisory for Canadian SMEs." 
        />
        <meta name="keywords" content="business directory, find businesses, list business, verified listings, business support, Canadian grants" />
        <link rel="canonical" href="https://rtmbusinessdirectory.com" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfessionalService',
            name: 'RTM Global Canada',
            description:
              'Private Canadian business advisory platform for grant guidance, business directory, and membership services.',
            url: 'https://www.rtmbusinessdirectory.com',
            telephone: '+1-416-900-8728',
            address: {
              '@type': 'PostalAddress',
              streetAddress: '640 Sentinel Road',
              addressLocality: 'North York',
              addressRegion: 'ON',
              postalCode: 'M3J 0B2',
              addressCountry: 'CA',
            },
            areaServed: 'CA',
            knowsAbout: ['Canadian business grants', 'SME funding', 'grant advisory', 'business directory'],
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <TrustBar />
          <ThreePathSection />
          <CanadaMap />
          <ProgressVisualization />
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
