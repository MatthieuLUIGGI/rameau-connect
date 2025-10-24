import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Artisan {
  id: string;
  name: string;
  domain: string;
  type: string;
  phone: string | null;
  email: string | null;
  description: string | null;
}

const Artisans = () => {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("Tous");
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

  // Get unique domains for filters
  const artisanDomains = ["Tous", ...Array.from(new Set(artisans.map(a => a.domain)))];

  // Filter artisans based on selected domain
  const filteredArtisans = selectedType === "Tous" 
    ? artisans 
    : artisans.filter(a => a.domain === selectedType);

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
        <div className="text-center mb-8 animate-fade-in px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Artisans Intervenants
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Artisans intervenants dans la copropriété Le Rameau
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex justify-center mb-8 px-4">
          <div className="w-full max-w-xs">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrer par domaine" />
              </SelectTrigger>
              <SelectContent>
                {artisanDomains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredArtisans.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Aucun artisan pour ce type.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtisans.map((artisan, index) => (
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
