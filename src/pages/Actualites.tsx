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
  image_url: string | null;
  published_at: string;
  file_url?: string | null;
  priority: 'info' | 'normal' | 'important' | 'urgent';
  expires_at: string | null;
}

const Actualites = () => {
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActualites();
  }, []);

  const fetchActualites = async () => {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('actualites')
      .select('id,title,excerpt,image_url,published_at,file_url,priority,expires_at')
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('published_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      const filteredData = (data || []) as unknown as Actualite[];
      
      // Séparer les actualités épinglées (urgent, important) des autres (normal, info)
      const pinnedNews = filteredData.filter(a => a.priority === 'urgent' || a.priority === 'important');
      const regularNews = filteredData.filter(a => a.priority === 'normal' || a.priority === 'info');
      
      // Trier les épinglées par priorité puis par date
      const sortedPinned = pinnedNews.sort((a, b) => {
        const priorityOrder = { urgent: 0, important: 1, normal: 2, info: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });
      
      // Trier les régulières par date uniquement (plus récentes en haut)
      const sortedRegular = regularNews.sort((a, b) => 
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );
      
      // Combiner : épinglées en haut, régulières en dessous
      const sortedData = [...sortedPinned, ...sortedRegular];
      
      setActualites(sortedData);
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
            {actualites.map((article, index) => {
              const priorityStyles = {
                urgent: 'border-red-600 bg-red-50 dark:bg-red-950/30 shadow-lg shadow-red-500/20',
                important: 'border-red-500 bg-red-50 dark:bg-red-950/20',
                normal: 'border-border bg-card',
                info: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
              };
              
              const priorityBadges = {
                urgent: { icon: '🚨', text: 'URGENT', color: 'bg-red-600 text-white animate-pulse' },
                important: { icon: '⚠️', text: 'Important', color: 'bg-red-500 text-white' },
                info: { icon: 'ℹ️', text: 'Info', color: 'bg-blue-500 text-white' },
                normal: null
              };
              
              const badge = priorityBadges[article.priority];
              
              return (
                <Card 
                  key={article.id} 
                  className={`p-6 hover-lift cursor-pointer transition-all duration-200 hover:shadow-lg ${priorityStyles[article.priority]}`}
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
                      <p className="font-semibold text-foreground">Conseil syndical</p>
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground leading-tight flex-1">
                      {article.title}
                    </h2>
                    {badge && (
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${badge.color}`}>
                        {badge.icon} {badge.text}
                      </span>
                    )}
                  </div>
                  
                  {article.excerpt && (
                    <p className="text-muted-foreground leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <span>Lire la suite</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    {article.file_url && (
                      <a
                        href={article.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📄 Télécharger le PDF
                      </a>
                    )}
                  </div>
                  
                  {article.image_url && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-border">
                      <img 
                        src={article.image_url} 
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
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
                  {article.expires_at && (
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      <span>Expire le {new Date(article.expires_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Actualites;
