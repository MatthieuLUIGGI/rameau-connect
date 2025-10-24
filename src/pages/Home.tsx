import heroImage from "@/assets/hero-residence.jpg";

const Home = () => {

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
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 md:mb-6">
            Bienvenue à la copropriété<br />Le Rameau
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-primary-foreground/90 leading-relaxed max-w-2xl mx-auto">
            Un lieu de vie agréable et convivial. Ce site vous permet de suivre les actualités, 
            découvrir nos partenaires et participer à la vie de la résidence.
          </p>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-secondary py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-foreground">Une résidence à votre écoute</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
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
