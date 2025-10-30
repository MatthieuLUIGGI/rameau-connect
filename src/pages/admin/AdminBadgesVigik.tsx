import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface StockRow {
  id: string;
  available_count: number;
  next_reception_date: string | null; // YYYY-MM-DD
  price: string | null; // stored as numeric in DB, returned as string 
}

const AdminBadgesVigik = () => {
  const [row, setRow] = useState<StockRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [available, setAvailable] = useState<number>(0);
  const [date, setDate] = useState<string>("");
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

    if (error && error.code !== "PGRST116") { // ignore not found
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      const r = (data as unknown as StockRow) || null;
      setRow(r);
      setAvailable(r?.available_count ?? 0);
      setDate(r?.next_reception_date ?? "");
      setPrice(r?.price ?? "");
    }
    setIsLoading(false);
  };

  const save = async () => {
    setIsLoading(true);
    const priceValue = price === "" ? null : Number.isNaN(parseFloat(price)) ? null : parseFloat(price);
    const payload = { available_count: available, next_reception_date: date || null, price: priceValue } as any;

    let error;
    if (row?.id) {
      ({ error } = await supabase.from("badges_vigik_stock" as any).update(payload).eq("id", row.id));
    } else {
      ({ error } = await supabase.from("badges_vigik_stock" as any).insert([payload]));
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sauvegardé", description: "Stock mis à jour" });
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
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="available">Badges disponibles</Label>
            <Input
              id="available"
              type="number"
              min={0}
              value={available}
              onChange={(e) => setAvailable(parseInt(e.target.value || "0", 10))}
            />
          </div>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="date">Prochaine réception</Label>
            <Input
              id="date"
              type="date"
              value={date || ""}
              onChange={(e) => setDate(e.target.value)}
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
