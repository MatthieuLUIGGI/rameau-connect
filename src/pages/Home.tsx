import { Wrench, Users, Newspaper, FileText, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/hero-residence.jpg";

const Home = () => {
  const quickLinks = [
    {
      icon: Wrench,
      title: "Artisans",
      description: "Trouvez des professionnels de confiance",
      href: "/artisans",
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: Users,
      title: "Conseil Syndical",
      description: "Découvrez vos représentants",
      href: "/syndic",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: Newspaper,
      title: "Actualités",
      description: "Les dernières nouvelles",
      href: "/actualites",
      color: "from-orange-500/20 to-red-500/20"
    },
    {
      icon: FileText,
      title: "Assemblées",
      description: "Comptes rendus des AG",
      href: "/ag",
      color: "from-green-500/20 to-emerald-500/20"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Enhanced Animations */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ 
            backgroundImage: `url(${heroImage})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/70 to-background/95"></div>
          
          {/* Animated Overlay Shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
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
          <p className="text-lg sm:text-xl md:text-2xl text-primary-foreground/90 leading-relaxed max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
            Votre plateforme centrale pour suivre l'actualité, découvrir nos partenaires 
            et participer activement à la vie de notre résidence.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: "400ms" }}>
            <Link to="/actualites">
              <Button size="lg" className="group bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg hover:shadow-xl transition-all duration-300">
                Voir les actualités
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 shadow-lg">
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

      {/* Quick Links Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Accès rapide
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Découvrez tous les services à votre disposition
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link 
                  key={index} 
                  to={link.href}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="h-full border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-gradient-to-br from-card to-card/50 backdrop-blur">
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-7 w-7 text-foreground" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {link.description}
                      </p>
                      <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                        <span>En savoir plus</span>
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 animate-pulse">
              <Users className="h-8 w-8 text-primary" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground animate-fade-in">
              Une résidence à votre écoute
            </h2>
            
            <p className="text-muted-foreground text-lg leading-relaxed mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
              Le conseil syndical et la gestion de la copropriété Le Rameau sont à votre disposition 
              pour garantir le bon fonctionnement de notre résidence. Nous sommes déterminés à maintenir 
              un cadre de vie agréable et convivial pour tous.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {[
                { number: "24/7", label: "Disponibilité" },
                { number: "100%", label: "Engagement" },
                { number: "1", label: "Communauté" }
              ].map((stat, index) => (
                <div 
                  key={index} 
                  className="animate-fade-in p-6 rounded-lg bg-background/50 backdrop-blur border border-border hover:border-primary/50 transition-all hover:scale-105"
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                >
                  <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
