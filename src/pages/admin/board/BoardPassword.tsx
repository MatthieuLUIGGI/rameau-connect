import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BoardPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSetPassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Les mots de passe ne correspondent pas', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('set_admin_board_password', { new_password: newPassword });
      if (error) throw error;
      toast({ title: 'Mot de passe défini avec succès' });
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast({ title: 'Erreur lors de la définition du mot de passe', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Gérer le mot de passe du tableau de bord
        </CardTitle>
        <CardDescription>Définir ou modifier le mot de passe d'accès à cette page (réservé AG)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-w-md">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Nouveau mot de passe (min. 8 caractères)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            onClick={handleSetPassword}
            disabled={isSaving || newPassword.length < 8 || !confirmPassword}
          >
            {isSaving ? "Enregistrement..." : "Définir le mot de passe"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BoardPassword;
