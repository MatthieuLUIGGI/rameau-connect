import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminBoardLayout from "./AdminBoardLayout";

const AdminBoard = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordExists, setPasswordExists] = useState<boolean | null>(null);
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false);
  const [isCheckingPassword, setIsCheckingPassword] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unlocked = sessionStorage.getItem('admin_board_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
    checkPasswordExists();
  }, []);

  const checkPasswordExists = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_board_password_exists' as any);
      if (error) throw error;
      setPasswordExists(!!data);
      setNeedsInitialSetup(!data);
    } catch {
      setPasswordExists(true);
      setNeedsInitialSetup(false);
    }
    setIsCheckingPassword(false);
  };

  const handleVerifyPassword = async () => {
    if (!password.trim()) return;
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.rpc('verify_admin_board_password', { input_password: password });
      if (error) throw error;
      if (data) {
        setIsUnlocked(true);
        sessionStorage.setItem('admin_board_unlocked', 'true');
        toast({ title: 'Accès autorisé', description: 'Bienvenue sur le tableau de bord.' });
      } else {
        toast({ title: 'Mot de passe incorrect', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erreur de vérification', variant: 'destructive' });
    }
    setIsVerifying(false);
    setPassword("");
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Les mots de passe ne correspondent pas', variant: 'destructive' });
      return;
    }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.rpc('set_admin_board_password', { new_password: newPassword });
      if (error) throw error;
      toast({ title: 'Mot de passe défini avec succès' });
      setNewPassword("");
      setConfirmPassword("");
      setNeedsInitialSetup(false);
      setPasswordExists(true);
    } catch {
      toast({ title: 'Erreur lors de la définition du mot de passe', variant: 'destructive' });
    }
    setIsSavingPassword(false);
  };

  if (isCheckingPassword) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8 flex items-center justify-center min-h-[60vh]">
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

  if (needsInitialSetup) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <KeyRound className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Configuration initiale</CardTitle>
            <CardDescription>Créez un mot de passe pour sécuriser l'accès au tableau de bord admin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nouveau mot de passe (min. 8 caractères)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                onClick={handleSetPassword}
                className="w-full"
                disabled={isSavingPassword || newPassword.length < 8 || !confirmPassword}
              >
                {isSavingPassword ? "Création en cours..." : "Créer le mot de passe"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Tableau de bord Admin</CardTitle>
            <CardDescription>Entrez le mot de passe pour accéder au tableau de bord</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); handleVerifyPassword(); }}
              className="space-y-4"
            >
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
              <Button type="submit" className="w-full" disabled={isVerifying || !password.trim()}>
                {isVerifying ? "Vérification..." : "Accéder"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminBoardLayout />;
};

export default AdminBoard;
