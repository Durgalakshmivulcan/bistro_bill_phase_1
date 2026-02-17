import PublicHeader from "../components/publicHeader";
import Footer from "../components/footer";
import FeaturesGrid from "../components/website/featuresgrid";
import HeroSection from "../components/website/herosection";
import WhyChoose from "../components/website/whychoose";
import TrustSection from "../components/website/trustsection";
import FinalCTA from "../components/website/finalCTA";

const WebsiteLayout = () => {
  return (
    <><PublicHeader />
    <HeroSection />
      <FeaturesGrid />
      <WhyChoose />
      <TrustSection />
      <FinalCTA />
      <Footer /></>
  );
};

export default WebsiteLayout;
