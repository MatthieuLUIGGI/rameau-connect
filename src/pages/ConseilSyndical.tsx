import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Calendar, Download, Lock, Eye, EyeOff, ExternalLink, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface CompteRendu {
  id: string;
  title: string;
  file_url: string | null;
  link_url: string | null;
  date: string;
  created_at: string;
  order_index: number;
}

const ConseilSyndical = () => {
  const [comptesRendus, setComptesRendus] = useState<CompteRendu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const { isAG, session } = useAuth();

  useEffect(() => {
    // Check if already unlocked in session
    const unlocked = sessionStorage.getItem('conseil_syndical_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
      fetchComptesRendus();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchComptesRendus = async () => {
    const { data, error } = await supabase
      .from('comptes_rendus_conseil_syndical')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setComptesRendus(data || []);
    }
    setIsLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez entrer le mot de passe', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);

    try {
      // Use RPC function instead of Edge Function
      const { data, error } = await supabase.rpc('verify_conseil_password', {
        input_password: password
      });

      if (error) throw error;

      if (data === true) {
        setIsUnlocked(true);
        sessionStorage.setItem('conseil_syndical_unlocked', 'true');
        toast({ title: 'Accès autorisé', description: 'Bienvenue dans l\'espace Conseil Syndical' });
        fetchComptesRendus();
      } else {
        toast({ title: 'Erreur', description: 'Mot de passe incorrect', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Password verification error:', error);
      toast({ 
        title: 'Erreur', 
        description: error.message || 'Erreur lors de la vérification', 
        variant: 'destructive' 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Calculate grid slots - minimum 6, or match the number of reports (rounded up to even number for 2-column layout)
  const minSlots = Math.max(6, Math.ceil(comptesRendus.length / 2) * 2);
  
  // Create array of slots, filling with reports where they exist
  const slots = Array.from({ length: minSlots }).map((_, index) => {
    return comptesRendus[index] || null;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Password gate
  if (!isUnlocked) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-border">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Conseil Syndical
                </h1>
                <p className="text-muted-foreground">
                  Cette section est protégée. Veuillez entrer le mot de passe pour accéder aux documents.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? 'Vérification...' : 'Accéder'}
                </Button>
              </form>

              {isAG && (
                <div className="mt-6 pt-6 border-t border-border">
                  <Link to="/admin/conseil-syndical">
                    <Button variant="outline" className="w-full">
                      Gérer les comptes rendus (Admin)
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 md:mb-12 animate-fade-in">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 text-foreground">
                Conseil Syndical
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
                Consultez les comptes rendus des réunions du conseil syndical
              </p>
            </div>
            {isAG && (
              <Link to="/admin/conseil-syndical" className="w-full md:w-auto">
                <Button className="w-full md:w-auto">
                  Gérer les comptes rendus
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {slots.map((cr, index) => {
            if (cr) {
              const isLink = !!cr.link_url;
              const displayUrl = cr.link_url || cr.file_url;

              return (
                <Card 
                  key={cr.id} 
                  className="hover-lift border-border"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {isLink ? (
                          <LinkIcon className="h-6 w-6 text-primary" />
                        ) : (
                          <FileText className="h-6 w-6 text-primary" />
                        )}
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
                      href={displayUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="w-full" variant="outline">
                        {isLink ? (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ouvrir le lien
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger le document
                          </>
                        )}
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              );
            }

            // Empty slot
            return (
              <Card 
                key={`empty-${index}`}
                className="border-dashed border-2 border-muted-foreground/20"
              >
                <CardContent className="p-6 flex items-center justify-center min-h-[160px]">
                  <span className="text-muted-foreground/50">Emplacement libre</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ConseilSyndical;
