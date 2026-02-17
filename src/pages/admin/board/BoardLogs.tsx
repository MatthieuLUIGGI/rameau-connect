import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, FileText, Eye, LogIn, LogOut, Plus, Pencil, Trash2, Download, KeyRound, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_email: string | null;
  user_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  page: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  page_view: { label: "Visite", icon: Eye, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  login: { label: "Connexion", icon: LogIn, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  logout: { label: "Déconnexion", icon: LogOut, color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },
  create: { label: "Création", icon: Plus, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300" },
  update: { label: "Modification", icon: Pencil, color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
  delete: { label: "Suppression", icon: Trash2, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  export: { label: "Export", icon: Download, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  password_change: { label: "Mot de passe", icon: KeyRound, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
};

const ENTITY_LABELS: Record<string, string> = {
  actualite: "Actualité",
  sondage: "Sondage",
  compte_rendu_ag: "Compte rendu AG",
  compte_rendu_conseil: "Compte rendu CS",
  membre: "Membre",
  badge_vigik: "Badge Vigik",
  artisan: "Artisan",
  user_role: "Rôle utilisateur",
  profile: "Profil",
  vote: "Vote",
};

const ITEMS_PER_PAGE = 20;

const BoardLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    
    let query = (supabase.from('audit_logs' as any) as any)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }

    const { data, error, count } = await query;

    if (!error) {
      setLogs(data || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  };

  const filteredLogs = searchQuery.trim()
    ? logs.filter(log => {
        const q = searchQuery.toLowerCase();
        return (
          (log.user_name || '').toLowerCase().includes(q) ||
          (log.user_email || '').toLowerCase().includes(q) ||
          (log.page || '').toLowerCase().includes(q) ||
          (log.entity_type || '').toLowerCase().includes(q)
        );
      })
    : logs;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const renderActionBadge = (action: string) => {
    const config = ACTION_LABELS[action] || { label: action, icon: FileText, color: "bg-muted text-muted-foreground" };
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={`${config.color} gap-1 font-medium`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const renderDetails = (log: AuditLog) => {
    const parts: string[] = [];
    
    if (log.entity_type) {
      parts.push(ENTITY_LABELS[log.entity_type] || log.entity_type);
    }
    
    if (log.details) {
      if (log.details.title) parts.push(`"${log.details.title}"`);
      if (log.details.page_title) parts.push(log.details.page_title);
    }

    if (log.page && log.action === 'page_view') {
      parts.push(log.page);
    }

    return parts.join(' · ') || '—';
  };

  if (isLoading && logs.length === 0) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Journal d'activité
        </CardTitle>
        <CardDescription>Historique complet des actions effectuées sur le site</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, page..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrer par action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              <SelectItem value="page_view">Visites</SelectItem>
              <SelectItem value="login">Connexions</SelectItem>
              <SelectItem value="logout">Déconnexions</SelectItem>
              <SelectItem value="create">Créations</SelectItem>
              <SelectItem value="update">Modifications</SelectItem>
              <SelectItem value="delete">Suppressions</SelectItem>
              <SelectItem value="export">Exports</SelectItem>
              <SelectItem value="password_change">Mot de passe</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLogs} title="Rafraîchir">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Aucun log trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{log.user_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{log.user_email}</div>
                    </TableCell>
                    <TableCell>{renderActionBadge(log.action)}</TableCell>
                    <TableCell className="text-sm max-w-[300px] truncate">{renderDetails(log)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              {totalCount} entrée{totalCount > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoardLogs;
