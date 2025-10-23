import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface CompteRendu {
  id: string;
  title: string;
  file_url: string;
  date: string;
  created_at: string;
}

const AG = () => {
  const [comptesRendus, setComptesRendus] = useState<CompteRendu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAG } = useAuth();

  useEffect(() => {
    fetchComptesRendus();
  }, []);

  const fetchComptesRendus = async () => {
    const { data, error } = await supabase
      .from('comptes_rendus_ag')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setComptesRendus(data || []);
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
        <div className="flex justify-between items-center mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Assemblées Générales
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Consultez les comptes rendus des assemblées générales de la copropriété
            </p>
          </div>
          {isAG && (
            <Link to="/admin/ag">
              <Button>
                Gérer les comptes rendus
              </Button>
            </Link>
          )}
        </div>

        {comptesRendus.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Aucun compte rendu disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comptesRendus.map((cr, index) => (
              <Card 
                key={cr.id} 
                className="hover-lift border-border"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1 text-foreground line-clamp-2">
                        {cr.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(cr.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <a 
                    href={cr.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le PDF
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AG;
