import { DomainSearchSection } from "@/modules/domains/components/domain-search-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domain Search | InfraBoxes",
  description: "Search and register custom domains for your infrastructure.",
};

export default function DomainsPage() {
  return (
    <div className="relative min-h-screen bg-background pt-12">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <main className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col space-y-12">
          {/* Breadcrumbs or Back button could go here */}
          
          <DomainSearchSection />
          
          {/* Additional Info Cards or FAQs could go here */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 pb-12">
            <FeatureCard 
              title="Static IP Egress"
              description="Reliable connections to registrar APIs through our dedicated Fly.io proxy."
              icon="🔒"
            />
            <FeatureCard 
              title="Instant Suggestions"
              description="Smart domain suggestions powered by AI and industry standards."
              icon="💡"
            />
            <FeatureCard 
              title="Global TLDs"
              description="Register .com, .io, .dev and 100+ other global extensions instantly."
              icon="🌍"
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm space-y-3 hover:shadow-lg transition-all duration-300">
      <div className="text-2xl">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
