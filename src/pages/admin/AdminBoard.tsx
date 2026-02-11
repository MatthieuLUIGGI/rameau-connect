import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Eye, EyeOff, Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileWithRoles {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  apartment_number: number | null;
  roles: string[];
}

const AdminBoard = () => {
  const [profiles, setProfiles] = useState<ProfileWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    const unlocked = sessionStorage.getItem('admin_board_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
      fetchProfiles();
    }
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, apartment_number')
      .order('last_name', { ascending: true });

    if (profilesError) {
      toast({ title: 'Erreur', description: profilesError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      toast({ title: 'Erreur', description: rolesError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const rolesMap: Record<string, string[]> = {};
    rolesData?.forEach((r) => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    });

    const combined = (profilesData || []).map((p) => ({
      ...p,
      roles: rolesMap[p.id] || [],
    }));

    setProfiles(combined);
    setIsLoading(false);
  };

  const handleVerifyPassword = async () => {
    if (!password.trim()) return;
    setIsVerifying(true);

    try {
      const { data, error } = await supabase.rpc('verify_admin_board_password', {
        input_password: password,
      });

      if (error) throw error;

      if (data) {
        setIsUnlocked(true);
        sessionStorage.setItem('admin_board_unlocked', 'true');
        toast({ title: 'Accès autorisé', description: 'Bienvenue sur le tableau de bord.' });
        fetchProfiles();
      } else {
        toast({ title: 'Mot de passe incorrect', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erreur de vérification', variant: 'destructive' });
    }

    setIsVerifying(false);
    setPassword("");
  };

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
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyPassword();
              }}
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8" />
        Tableau de bord Admin
      </h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres inscrits
          </CardTitle>
          <CardDescription>Total des personnes inscrites sur le site</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold text-primary">{profiles.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des membres</CardTitle>
          <CardDescription>Informations et rôles des personnes inscrites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Appartement</TableHead>
                  <TableHead>Rôle(s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.last_name || '-'}</TableCell>
                    <TableCell>{profile.first_name || '-'}</TableCell>
                    <TableCell>{profile.email || '-'}</TableCell>
                    <TableCell>{profile.apartment_number ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {profile.roles.length > 0 ? (
                          profile.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === 'ag' ? 'default' : 'secondary'}
                            >
                              {role === 'ag' ? 'AG' : 'Utilisateur'}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary">Utilisateur</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {profiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aucun membre inscrit
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBoard;
