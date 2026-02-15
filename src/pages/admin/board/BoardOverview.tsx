import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import MemberStats from "@/components/admin/board/MemberStats";

interface ProfileBasic {
  id: string;
  created_at: string | null;
  roles: string[];
}

const BoardOverview = () => {
  const [profiles, setProfiles] = useState<ProfileBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: profilesData, error: pErr } = await supabase
      .from('profiles')
      .select('id, created_at');

    if (pErr) {
      toast({ title: 'Erreur', description: pErr.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');
    const rolesMap: Record<string, string[]> = {};
    rolesData?.forEach((r) => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    });

    setProfiles((profilesData || []).map((p) => ({ ...p, roles: rolesMap[p.id] || [] })));
    setIsLoading(false);
  };

  const agCount = profiles.filter((p) => p.roles.includes('ag')).length;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = profiles.filter(
    (p) => p.created_at && new Date(p.created_at) >= thirtyDaysAgo
  ).length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <MemberStats
      totalMembers={profiles.length}
      agMembers={agCount}
      recentMembers={recentCount}
    />
  );
};

export default BoardOverview;
