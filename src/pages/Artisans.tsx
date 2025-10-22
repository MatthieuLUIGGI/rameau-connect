import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Artisan {
  id: string;
  name: string;
  domain: string;
  phone: string | null;
  email: string | null;
  description: string | null;
}

const Artisans = () => {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchArtisans();
  }, []);

  const fetchArtisans = async () => {
    const { data, error } = await supabase
      .from('artisans')
      .select('*')
      .order('name');
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setArtisans(data || []);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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

        {artisans.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Aucun artisan partenaire pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artisans.map((artisan, index) => (
              <Card 
                key={artisan.id} 
                className="hover-lift border-border"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-primary">
                      <Wrench className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1 text-foreground">{artisan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{artisan.domain}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {artisan.phone && (
                      <a 
                        href={`tel:${artisan.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        {artisan.phone}
                      </a>
                    )}
                    {artisan.email && (
                      <a 
                        href={`mailto:${artisan.email}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors break-all"
                      >
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        {artisan.email}
                      </a>
                    )}
                    {artisan.description && (
                      <p className="text-sm text-muted-foreground pt-2 border-t">
                        {artisan.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Artisans;
