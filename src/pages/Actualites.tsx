import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, User, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Actualite {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published_at: string;
}

const Actualites = () => {
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Transforme le contenu HTML en texte brut pour l'aperçu (liste)
  const toPlainText = (html: string) =>
    html
      .replace(/<[^>]*>/g, " ") // retire les balises
      .replace(/&nbsp;|&amp;|&quot;|&lt;|&gt;/g, (m) => {
        const map: Record<string, string> = {
          "&nbsp;": " ",
          "&amp;": "&",
          "&quot;": '"',
          "&lt;": "<",
          "&gt;": ">",
        };
        return map[m] ?? " ";
      })
      .replace(/\s+/g, " ")
      .trim();

  useEffect(() => {
    fetchActualites();
  }, []);

  const fetchActualites = async () => {
    const { data, error } = await supabase
      .from('actualites')
      .select('*')
      .order('published_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setActualites(data || []);
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
    <div className="min-h-screen pt-24 pb-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Actualités
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto px-4">
            Restez informé des dernières nouvelles de la copropriété
          </p>
        </div>

        {actualites.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Aucune actualité pour le moment.
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {actualites.map((article, index) => (
              <Card 
                key={article.id} 
                className="p-6 hover-lift border-border bg-card cursor-pointer transition-all duration-200 hover:shadow-lg"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => window.location.href = `/actualites/${article.id}`}
              >
                {/* Thread Header */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">Syndic Le Rameau</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(article.published_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thread Content */}
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-foreground leading-tight">
                    {article.title}
                  </h2>
                  
                  {article.excerpt && (
                    <p className="text-muted-foreground leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                  
                  {/* Aperçu du contenu: si pas d'extrait, on affiche le contenu converti en texte */}
                  {!article.excerpt && (
                    <p className="text-foreground leading-relaxed line-clamp-3">
                      {toPlainText(article.content)}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-primary font-medium mt-2">
                    <span>Lire la suite</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  
                  {article.image_url && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-border">
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Thread Footer - Interactions */}
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Copropriété Le Rameau</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Actualites;
