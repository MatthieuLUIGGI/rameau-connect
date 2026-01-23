import { KeyRound, Users, Newspaper, FileText, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/hero-rameau.jpg";
const Home = () => {
  const quickLinks = [{
    icon: KeyRound,
    title: "Badges Vigik",
    description: "Disponibilité des badges et prochaines réceptions",
    href: "/badges-vigik",
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
            <span className="block mb-2">Copropriété</span>
            <span className="block bg-gradient-to-r from-primary-foreground to-primary-foreground/80 bg-clip-text text-transparent">
              Le Rameau
            </span>
          </h1>
          
          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 justify-center items-center animate-fade-in" style={{
          animationDelay: "400ms"
        }}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/documents/livret-accueil.pdf" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                  Livret d'accueil
                </Button>
              </a>
              <a href="/documents/reglement-copropriete.pdf" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg">
                  Règlement de copropriété
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-primary-foreground/50 rounded-full"></div>
          </div>
        </div>
      </section>


      {/* Quick Access Section */}
      <section className="relative py-20 overflow-hidden bg-muted/30">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Accès rapides
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Découvrez toutes les fonctionnalités de votre espace copropriété
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[{
            icon: KeyRound,
            title: "Badges Vigik",
            description: "Consultez le stock disponible et les réceptions prévues",
            href: "/badges-vigik",
            color: "from-blue-500/10 to-cyan-500/10"
          }, {
            icon: Users,
            title: "Conseil Syndical",
            description: "Membres du conseil syndical et le syndic",
            href: "/syndic",
            color: "from-purple-500/10 to-pink-500/10"
          }, {
            icon: Newspaper,
            title: "Actualités",
            description: "Restez informé des dernières nouvelles de la copropriété",
            href: "/actualites",
            color: "from-orange-500/10 to-red-500/10"
          }, {
            icon: FileText,
            title: "Assemblées Générales",
            description: "Accédez aux comptes rendus des assemblées générales",
            href: "/ag",
            color: "from-green-500/10 to-emerald-500/10"
          }, {
            icon: Sparkles,
            title: "Consultations",
            description: "Participez aux consultations et exprimez votre opinion",
            href: "/sondages",
            color: "from-indigo-500/10 to-blue-500/10"
          }, {
            icon: Users,
            title: "Contactez-nous",
            description: "Contactez-nous directement",
            href: "/contact",
            color: "from-teal-500/10 to-green-500/10"
          }].map((item, index) => <Link key={index} to={item.href}>
                <Card className="h-full hover-lift border-border transition-all duration-300 hover:border-primary/50 animate-fade-in" style={{
              animationDelay: `${index * 100}ms`
            }}>
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>)}
          </div>
        </div>
      </section>
    </div>;
};
export default Home;