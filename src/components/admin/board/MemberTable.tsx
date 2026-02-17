import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export interface ProfileWithRoles {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  apartment_number: number | null;
  roles: string[];
  created_at: string | null;
  last_sign_in_at: string | null;
}

interface MemberTableProps {
  profiles: ProfileWithRoles[];
  onDeleteUser: (userId: string) => void;
  isDeletingUser: string | null;
}

const MemberTable = ({ profiles, onDeleteUser, isDeletingUser }: MemberTableProps) => {
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
            <TableHead>Dernière connexion</TableHead>
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
                  {profile.last_sign_in_at
                    ? new Date(profile.last_sign_in_at).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Jamais'}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeletingUser === profile.id}
                        className="gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Vous êtes sur le point de supprimer le compte de{' '}
                          <strong>{profile.first_name} {profile.last_name}</strong>
                          {profile.email ? ` (${profile.email})` : ''}.
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteUser(profile.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
