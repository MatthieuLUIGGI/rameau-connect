import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StockRow {
  id: string;
  info_text: string | null;
  price: string | null;
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

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const priceNumber = stock?.price != null ? parseFloat(stock.price) : null;
  const priceText =
    priceNumber != null && !Number.isNaN(priceNumber)
      ? new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(priceNumber)
      : null;

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12 animate-fade-in px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Badges Vigik
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Consultez les informations sur les badges Vigik.
          </p>
        </div>

        <div className="max-w-xl mx-auto animate-slide-up">
          <Card className="border-border">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <KeyRound className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Informations</h2>
                  {priceText && (
                    <p className="text-muted-foreground">
                      Tarif : <span className="font-medium text-foreground">{priceText}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-foreground whitespace-pre-wrap">
                  {stock?.info_text || "Aucune information disponible pour le moment."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BadgesVigik;
