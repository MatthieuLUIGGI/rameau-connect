import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  apartment_number: number | null;
}

const Membres = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAG } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAG) {
      navigate('/');
      return;
    }

    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, apartment_number')
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        setProfiles(data || []);
      }
      setIsLoading(false);
    };

    fetchProfiles();
  }, [isAG, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <h1 className="text-4xl font-bold mb-8">Membres inscrits</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nombre total de membres
          </CardTitle>
          <CardDescription>
            Nombre de personnes inscrites sur le site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold text-primary">{profiles.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des membres</CardTitle>
          <CardDescription>
            Informations des personnes inscrites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Appartement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    {profile.last_name || '-'}
                  </TableCell>
                  <TableCell>{profile.first_name || '-'}</TableCell>
                  <TableCell>{profile.email || '-'}</TableCell>
                  <TableCell>{profile.apartment_number || '-'}</TableCell>
                </TableRow>
              ))}
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucun membre inscrit
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Membres;
