import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import MemberFilters from "@/components/admin/board/MemberFilters";
import MemberTable, { type ProfileWithRoles } from "@/components/admin/board/MemberTable";
import MemberPagination from "@/components/admin/board/MemberPagination";

const ITEMS_PER_PAGE = 15;

const BoardMembers = () => {
  const [profiles, setProfiles] = useState<ProfileWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isTogglingRole, setIsTogglingRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, apartment_number, created_at, last_sign_in_at')
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

    const combined = (profilesData || []).map((p: any) => ({
      ...p,
      roles: rolesMap[p.id] || [],
    }));

    setProfiles(combined);
    setIsLoading(false);
  };

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  const handleExportCSV = () => {
    const headers = ['Nom', 'Prénom', 'Email', 'Appartement', 'Rôle', 'Dernière connexion'];
    const rows = filteredProfiles.map((p) => [
      p.last_name || '',
      p.first_name || '',
      p.email || '',
      p.apartment_number ?? '',
      p.roles.includes('ag') ? 'AG' : 'Utilisateur',
      p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleString('fr-FR') : 'Jamais',
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

  const handleToggleRole = async (userId: string, hasAg: boolean) => {
    setIsTogglingRole(userId);
    try {
      if (hasAg) {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'ag');
        if (error) throw error;
        toast({ title: 'Rôle AG retiré' });
      } else {
        const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'ag' });
        if (error) throw error;
        toast({ title: 'Rôle AG attribué' });
      }
      await fetchProfiles();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
    setIsTogglingRole(null);
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Card>
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
  );
};

export default BoardMembers;
