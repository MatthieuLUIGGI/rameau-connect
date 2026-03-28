import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Vitrine = () => {
  const [vitrine, setVitrine] = useState<{ image_url: string | null; description: string | null; credits: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("vitrine").select("image_url, description, credits").limit(1).single().then(({ data }) => {
      if (data) setVitrine(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">Vitrine de la copropriété</h1>

        {vitrine?.image_url ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
            <img
              src={vitrine.image_url}
              alt="Vitrine de la copropriété"
              className="w-full h-auto object-cover"
            />
            {(vitrine.description || vitrine.credits) && (
              <div className="p-6 space-y-2">
                {vitrine.description && (
                  <p className="text-foreground text-base leading-relaxed">{vitrine.description}</p>
                )}
                {vitrine.credits && (
                  <p className="text-muted-foreground text-sm italic">{vitrine.credits}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">Aucune vitrine n'est actuellement affichée.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vitrine;
