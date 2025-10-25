import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Actualite {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published_at: string;
}

const ActualiteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actualite, setActualite] = useState<Actualite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchActualite();
    }
  }, [id]);

  const fetchActualite = async () => {
    const { data, error } = await supabase
      .from('actualites')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      navigate('/actualites');
    } else {
      setActualite(data);
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

  if (!actualite) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/actualites')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux actualités
        </Button>

        <Card className="max-w-4xl mx-auto p-6 md:p-8 border-border bg-card animate-fade-in">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground">Syndic Le Rameau</p>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(actualite.published_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {actualite.title}
            </h1>
            
            {actualite.excerpt && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {actualite.excerpt}
              </p>
            )}
            
            {actualite.image_url && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img 
                  src={actualite.image_url} 
                  alt={actualite.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
            
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                {actualite.content}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Copropriété Le Rameau
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ActualiteDetail;
