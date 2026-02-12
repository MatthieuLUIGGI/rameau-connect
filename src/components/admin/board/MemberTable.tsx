import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldOff } from "lucide-react";

export interface ProfileWithRoles {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  apartment_number: number | null;
  roles: string[];
  created_at: string | null;
}

interface MemberTableProps {
  profiles: ProfileWithRoles[];
  onToggleRole: (userId: string, hasAg: boolean) => void;
  isTogglingRole: string | null;
}

const MemberTable = ({ profiles, onToggleRole, isTogglingRole }: MemberTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Appt.</TableHead>
            <TableHead>Rôle(s)</TableHead>
            <TableHead>Inscrit le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => {
            const hasAg = profile.roles.includes('ag');
            return (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.last_name || '-'}</TableCell>
                <TableCell>{profile.first_name || '-'}</TableCell>
                <TableCell className="max-w-[200px] truncate">{profile.email || '-'}</TableCell>
                <TableCell>{profile.apartment_number ?? '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {hasAg ? (
                      <Badge variant="default">AG</Badge>
                    ) : (
                      <Badge variant="secondary">Utilisateur</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={hasAg ? "destructive" : "default"}
                    size="sm"
                    disabled={isTogglingRole === profile.id}
                    onClick={() => onToggleRole(profile.id, hasAg)}
                    className="gap-1"
                  >
                    {hasAg ? (
                      <>
                        <ShieldOff className="h-3.5 w-3.5" />
                        Rétrograder
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Promouvoir AG
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {profiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Aucun membre trouvé
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MemberTable;
