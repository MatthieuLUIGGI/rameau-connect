import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Membre {
  id: string;
  name: string;
  position: string;
  level: number;
  photo_url: string | null;
}

const Assemblee = () => {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMembres();
  }, []);

  const fetchMembres = async () => {
    const { data, error } = await supabase
      .from('membres_assemblee')
      .select('*')
      .order('level')
      .order('name');
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setMembres(data || []);
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

  const bureau = membres.filter(m => m.level === 1);
  const conseil = membres.filter(m => m.level === 2);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Assemblée Générale
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Découvrez les membres du bureau et du conseil syndical de la copropriété Le Rameau
          </p>
        </div>

        {/* Bureau Section */}
        {bureau.length > 0 && (
          <div className="mb-16 animate-slide-up">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Bureau de l'Assemblée</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {bureau.map((member, index) => (
                <Card 
                  key={member.id} 
                  className="hover-lift border-border"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center overflow-hidden">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-primary-foreground" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-1 text-foreground">{member.name}</h3>
                    <p className="text-muted-foreground font-medium">{member.position}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Conseil Syndical Section */}
        {conseil.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Conseil Syndical</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {conseil.map((member, index) => (
                <Card 
                  key={member.id} 
                  className="hover-lift border-border"
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-secondary-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-foreground">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.position}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {membres.length === 0 && (
          <div className="text-center text-muted-foreground">
            Aucun membre de l'assemblée pour le moment.
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 p-8 bg-secondary rounded-lg animate-fade-in" style={{ animationDelay: "600ms" }}>
          <h3 className="text-2xl font-bold mb-4 text-center text-foreground">
            Rôle de l'Assemblée Générale
          </h3>
          <div className="max-w-3xl mx-auto text-muted-foreground space-y-3">
            <p>
              L'assemblée générale est l'organe décisionnel de la copropriété. Elle se réunit au moins 
              une fois par an pour prendre les décisions importantes concernant la gestion de l'immeuble.
            </p>
            <p>
              Le conseil syndical, élu par l'assemblée générale, assiste et contrôle le syndic dans 
              sa gestion courante de la copropriété.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assemblee;
