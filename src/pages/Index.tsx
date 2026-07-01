import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import ProblemSolution from "@/components/landing/ProblemSolution";
import Benefits from "@/components/landing/Benefits";
import Testimonials from "@/components/landing/Testimonials";
import Demo from "@/components/landing/Demo";
import HowItWorks from "@/components/landing/HowItWorks";
import VisualDemo from "@/components/landing/VisualDemo";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import SectionTransition from "@/components/landing/SectionTransition";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <SectionTransition>
          <Hero />
          <ProblemSolution />
          <Benefits />
          <Testimonials />
          <Demo />
          <HowItWorks />
          <VisualDemo />
          <Pricing />
          <CTA />
        </SectionTransition>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
