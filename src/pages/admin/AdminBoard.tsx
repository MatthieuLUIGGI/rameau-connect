import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Lock, Eye, EyeOff, Shield, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import MemberStats from "@/components/admin/board/MemberStats";
import MemberFilters from "@/components/admin/board/MemberFilters";
import MemberTable, { type ProfileWithRoles } from "@/components/admin/board/MemberTable";
import MemberPagination from "@/components/admin/board/MemberPagination";

const ITEMS_PER_PAGE = 15;

const AdminBoard = () => {
  const [profiles, setProfiles] = useState<ProfileWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isTogglingRole, setIsTogglingRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { session } = useAuth();

  useEffect(() => {
    const unlocked = sessionStorage.getItem('admin_board_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
      fetchProfiles();
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
  };

  const fetchProfiles = async () => {
    setIsLoading(true);

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, apartment_number, created_at')
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

  // --- Filtering & Pagination ---
  const filteredProfiles = useMemo(() => {
    let result = profiles;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.first_name || '').toLowerCase().includes(q) ||
          (p.last_name || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          String(p.apartment_number ?? '').includes(q)
      );
    }

    if (roleFilter === 'ag') {
      result = result.filter((p) => p.roles.includes('ag'));
    } else if (roleFilter === 'user') {
      result = result.filter((p) => !p.roles.includes('ag'));
    }

    return result;
  }, [profiles, searchQuery, roleFilter]);

  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // --- Stats ---
  const agCount = profiles.filter((p) => p.roles.includes('ag')).length;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = profiles.filter(
    (p) => p.created_at && new Date(p.created_at) >= thirtyDaysAgo
  ).length;

  // --- CSV Export ---
  const handleExportCSV = () => {
    const headers = ['Nom', 'Prénom', 'Email', 'Appartement', 'Rôle', 'Date inscription'];
    const rows = filteredProfiles.map((p) => [
      p.last_name || '',
      p.first_name || '',
      p.email || '',
      p.apartment_number ?? '',
      p.roles.includes('ag') ? 'AG' : 'Utilisateur',
      p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `membres_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export CSV téléchargé' });
  };

  // --- Role Management ---
  const handleToggleRole = async (userId: string, hasAg: boolean) => {
    setIsTogglingRole(userId);
    try {
      if (hasAg) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'ag');
        if (error) throw error;
        toast({ title: 'Rôle AG retiré' });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'ag' });
        if (error) throw error;
        toast({ title: 'Rôle AG attribué' });
      }
      await fetchProfiles();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsTogglingRole(null);
  };

  // --- Password handlers ---
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

  // --- Initial setup screen ---
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

  // --- Password screen ---
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
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

      <MemberStats
        totalMembers={profiles.length}
        agMembers={agCount}
        recentMembers={recentCount}
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Liste des membres</CardTitle>
          <CardDescription>Recherchez, filtrez et gérez les membres inscrits</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            onExportCSV={handleExportCSV}
          />
          <MemberTable
            profiles={paginatedProfiles}
            onToggleRole={handleToggleRole}
            isTogglingRole={isTogglingRole}
          />
          <MemberPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredProfiles.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </CardContent>
      </Card>

      <Separator className="my-8" />

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
              disabled={isSavingPassword || newPassword.length < 8 || !confirmPassword}
            >
              {isSavingPassword ? "Enregistrement..." : "Définir le mot de passe"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBoard;
