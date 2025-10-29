import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { KeyRound, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StockRow {
  id: string;
  available_count: number;
  next_reception_date: string | null; // ISO date string (YYYY-MM-DD)
}

const BadgesVigik = () => {
  const [stock, setStock] = useState<StockRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    const { data, error } = await supabase
      .from("badges_vigik_stock" as any)
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
  setStock((data as unknown as StockRow) ?? null);
    }
    setIsLoading(false);
  };

  const formatDate = (d?: string | null) => {
    if (!d) return null;
    try {
      const date = new Date(d);
      return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return d;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const available = stock?.available_count ?? 0;
  const nextDateText = formatDate(stock?.next_reception_date);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12 animate-fade-in px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Badges Vigik
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Consultez la disponibilité des badges Vigik et la date de la prochaine réception.
          </p>
        </div>

        <div className="max-w-xl mx-auto animate-slide-up">
          <Card className="border-border">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <KeyRound className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-muted-foreground">Badges disponibles</p>
                  <p className="text-3xl font-bold text-foreground">{available}</p>
                </div>
              </div>

              {available <= 0 && (
                <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-300">
                    <Calendar className="h-5 w-5" />
                    <p>
                      Rupture de stock. {nextDateText ? (
                        <>
                          Prochaine réception prévue le <span className="font-medium">{nextDateText}</span>.
                        </>
                      ) : (
                        <>Date de prochaine réception à venir.</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {available > 0 && nextDateText && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Prochaine réception prévue le {nextDateText}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BadgesVigik;
