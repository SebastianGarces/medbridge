import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import FeatureCards from "@/components/landing/FeatureCards";
import ArchitectureDiagrams from "@/components/landing/ArchitectureDiagrams";
import TechStackSection from "@/components/landing/TechStackSection";
import ConstraintsSection from "@/components/landing/ConstraintsSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <main className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <FeatureCards />
      <ArchitectureDiagrams />
      <TechStackSection />
      <ConstraintsSection />
      <LandingFooter />
    </main>
  );
}
