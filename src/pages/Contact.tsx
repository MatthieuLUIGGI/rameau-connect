const Contact = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Contact</h1>
        <a 
          href="mailto:contact@residence.fr" 
          className="text-2xl text-primary hover:text-primary/80 transition-colors underline"
        >
          contact@residence.fr
        </a>
      </div>
    </div>
  );
};

export default Contact;
