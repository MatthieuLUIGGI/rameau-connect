const Contact = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 pt-20">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-foreground">Contactez-nous</h1>
        <a 
          href="mailto:residence.lerameau@laposte.net" 
          className="text-lg md:text-2xl text-primary hover:text-primary/80 transition-colors underline break-all"
        >
          residence.lerameau@laposte.net
        </a>
      </div>
    </div>
  );
};

export default Contact;
