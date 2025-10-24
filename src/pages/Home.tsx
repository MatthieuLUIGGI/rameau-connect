import { Wrench, Users, Newspaper, FileText, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/hero-residence.jpg";
const Home = () => {
  const quickLinks = [{
    icon: Wrench,
    title: "Artisans",
    description: "Trouvez des professionnels de confiance",
    href: "/artisans",
    color: "from-blue-500/20 to-cyan-500/20"
  }, {
    icon: Users,
    title: "Conseil Syndical",
    description: "Découvrez vos représentants",
    href: "/syndic",
    color: "from-purple-500/20 to-pink-500/20"
  }, {
    icon: Newspaper,
    title: "Actualités",
    description: "Les dernières nouvelles",
    href: "/actualites",
    color: "from-orange-500/20 to-red-500/20"
  }, {
    icon: FileText,
    title: "Assemblées",
    description: "Comptes rendus des AG",
    href: "/ag",
    color: "from-green-500/20 to-emerald-500/20"
  }];
  return <div className="min-h-screen">
      {/* Hero Section with Enhanced Animations */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" style={{
        backgroundImage: `url(${heroImage})`
      }}>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/70 to-background/95"></div>
          
          {/* Animated Overlay Shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl animate-pulse" style={{
            animationDelay: "1s"
          }}></div>
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Main Title with Staggered Animation */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in">
            <span className="block mb-2">La Copropriété</span>
            <span className="block bg-gradient-to-r from-primary-foreground to-primary-foreground/80 bg-clip-text text-transparent">
              Le Rameau
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/90 leading-relaxed max-w-3xl mx-auto mb-8 animate-fade-in" style={{
          animationDelay: "200ms"
        }}>
            Votre plateforme centrale pour suivre l'actualité, découvrir nos partenaires 
            et participer activement à la vie de notre résidence.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{
          animationDelay: "400ms"
        }}>
            <Link to="/actualites">
              <Button size="lg" className="group bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg hover:shadow-xl transition-all duration-300">
                Voir les actualités
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-primary-foreground/50 rounded-full"></div>
          </div>
        </div>
      </section>


      {/* Info Section with Enhanced Design */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-secondary">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          
        </div>
      </section>
    </div>;
};
export default Home;