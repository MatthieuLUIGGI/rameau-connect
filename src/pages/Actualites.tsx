import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
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
  const [selectedArticle, setSelectedArticle] = useState<Actualite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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

  if (selectedArticle) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedArticle(null)}
            className="mb-6"
          >
            ← Retour aux actualités
          </Button>
          
          <article className="animate-fade-in">
            {selectedArticle.image_url && (
              <img 
                src={selectedArticle.image_url} 
                alt={selectedArticle.title}
                className="w-full h-96 object-cover rounded-lg mb-6"
              />
            )}
            
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-4 text-foreground">{selectedArticle.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(selectedArticle.published_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selectedArticle.content}</p>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Actualités
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Restez informé des dernières nouvelles et événements de la copropriété
          </p>
        </div>

        {actualites.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Aucune actualité pour le moment.
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {actualites.map((article, index) => (
              <Card 
                key={article.id} 
                className="hover-lift cursor-pointer border-border"
                onClick={() => setSelectedArticle(article)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {article.image_url && (
                  <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={article.image_url} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(article.published_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <CardTitle className="text-2xl mb-2 text-foreground">{article.title}</CardTitle>
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardHeader>
                {article.excerpt && (
                  <CardContent>
                    <p className="text-muted-foreground">{article.excerpt}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Actualites;
