import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Wrench, Paintbrush, Droplets, Zap, Trees, HardHat } from "lucide-react";

const Artisans = () => {
  const artisans = [
    {
      name: "Plomberie Dupont",
      category: "Plomberie",
      icon: Droplets,
      phone: "01 23 45 67 89",
      email: "contact@plomberie-dupont.fr",
      color: "text-blue-600"
    },
    {
      name: "Électricité Martin",
      category: "Électricité",
      icon: Zap,
      phone: "01 23 45 67 90",
      email: "info@electricite-martin.fr",
      color: "text-yellow-600"
    },
    {
      name: "Peinture & Décoration Lefèvre",
      category: "Peinture",
      icon: Paintbrush,
      phone: "01 23 45 67 91",
      email: "lefevre.peinture@email.fr",
      color: "text-purple-600"
    },
    {
      name: "Jardins & Espaces Verts Rousseau",
      category: "Espaces verts",
      icon: Trees,
      phone: "01 23 45 67 92",
      email: "rousseau.jardins@email.fr",
      color: "text-green-600"
    },
    {
      name: "Travaux Généraux Bernard",
      category: "Travaux généraux",
      icon: HardHat,
      phone: "01 23 45 67 93",
      email: "bernard.travaux@email.fr",
      color: "text-orange-600"
    },
    {
      name: "Multi-Services Petit",
      category: "Services divers",
      icon: Wrench,
      phone: "01 23 45 67 94",
      email: "contact@multi-services-petit.fr",
      color: "text-gray-600"
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Artisans Partenaires
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Découvrez nos artisans et prestataires de confiance recommandés par la copropriété
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artisans.map((artisan, index) => {
            const Icon = artisan.icon;
            return (
              <Card 
                key={index} 
                className="hover-lift border-border"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${artisan.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1 text-foreground">{artisan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{artisan.category}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <a 
                      href={`tel:${artisan.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {artisan.phone}
                    </a>
                    <a 
                      href={`mailto:${artisan.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors break-all"
                    >
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      {artisan.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Artisans;
