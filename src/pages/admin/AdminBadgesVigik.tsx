import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface StockRow {
  id: string;
  info_text: string | null;
  price: string | null;
}

const AdminBadgesVigik = () => {
  const [row, setRow] = useState<StockRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [infoText, setInfoText] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchRow();
  }, []);

  const fetchRow = async () => {
    const { data, error } = await supabase
      .from("badges_vigik_stock" as any)
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      const r = (data as unknown as StockRow) || null;
      setRow(r);
      setInfoText(r?.info_text ?? "");
      setPrice(r?.price ?? "");
    }
    setIsLoading(false);
  };

  const save = async () => {
    setIsLoading(true);
    
    const priceValue = price === "" ? null : parseFloat(price);
    if (price !== "" && (isNaN(priceValue!) || priceValue! < 0)) {
      toast({ 
        title: "Erreur de validation", 
        description: "Le prix doit être un nombre positif", 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }
    
    const payload = { 
      info_text: infoText || null,
      price: priceValue 
    };

    let error;
    if (row?.id) {
      ({ error } = await supabase.from("badges_vigik_stock" as any).update(payload).eq("id", row.id));
    } else {
      ({ error } = await supabase.from("badges_vigik_stock" as any).insert([payload]));
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sauvegardé", description: "Informations mises à jour avec succès" });
      await fetchRow();
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des badges Vigik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="infoText">Informations sur les badges</Label>
            <Textarea
              id="infoText"
              value={infoText}
              onChange={(e) => setInfoText(e.target.value)}
              placeholder="Saisissez les informations concernant les badges Vigik (disponibilité, modalités de commande, etc.)"
              rows={6}
              className="resize-y"
            />
          </div>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="price">Tarif unitaire du badge (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min={0}
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 15.00"
            />
          </div>
          <div>
            <Button onClick={save} disabled={isLoading}>
              {isLoading ? "En cours..." : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBadgesVigik;
