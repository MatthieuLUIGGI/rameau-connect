import { Wrench, Users, Newspaper, BarChart3 } from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import heroImage from "@/assets/hero-residence.jpg";

const Home = () => {
  const features = [
    {
      icon: Wrench,
      title: "Trouver un artisan partenaire",
      description: "Accédez à notre liste d'artisans et prestataires de confiance pour vos travaux et réparations."
    },
    {
      icon: Users,
      title: "Découvrir les membres de l'assemblée",
      description: "Consultez la composition du conseil syndical et les membres de l'assemblée générale."
    },
    {
      icon: Newspaper,
      title: "Lire les dernières nouvelles",
      description: "Restez informé des actualités, travaux et décisions importantes de la copropriété."
    },
    {
      icon: BarChart3,
      title: "Participer à des sondages",
      description: "Exprimez votre opinion sur les questions importantes de la vie de la résidence."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${heroImage})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
            Bienvenue à la copropriété<br />Le Rameau
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
            Un lieu de vie agréable et convivial. Ce site vous permet de suivre les actualités, 
            découvrir nos partenaires et participer à la vie de la résidence.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Ce que vous pouvez faire sur le site
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Découvrez tous les services et informations à votre disposition
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {features.map((feature, index) => (
            <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Une résidence à votre écoute</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            Le conseil syndical et la gestion de la copropriété Le Rameau sont à votre disposition 
            pour garantir le bon fonctionnement de notre résidence. N'hésitez pas à consulter 
            régulièrement ce site pour rester informé.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
