import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, XCircle } from 'lucide-react';

interface RoleRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

const AdminRoleRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('role_requests')
        .select(`
          *,
          profiles!role_requests_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as any || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('role_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'role_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRequest = async (requestId: string, userId: string, approve: boolean) => {
    try {
      if (approve) {
        // Add AG role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'ag'
          });

        if (roleError) throw roleError;
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('role_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast({
        title: approve ? "Demande approuvée" : "Demande refusée",
        description: approve 
          ? "L'utilisateur a maintenant le rôle AG."
          : "La demande a été refusée.",
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approuvée</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Refusée</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold mb-8">Demandes de rôle AG</h1>

      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Demandes en attente</h2>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        {request.profiles.first_name} {request.profiles.last_name}
                      </CardTitle>
                      <CardDescription>
                        {request.profiles.email}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.message && (
                    <div>
                      <p className="text-sm font-medium mb-1">Message:</p>
                      <p className="text-sm text-muted-foreground">{request.message}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Demandé {formatDistanceToNow(new Date(request.created_at), { 
                      addSuffix: true,
                      locale: fr 
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRequest(request.id, request.user_id, true)}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRequest(request.id, request.user_id, false)}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Refuser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Demandes traitées</h2>
          <div className="space-y-4">
            {processedRequests.map((request) => (
              <Card key={request.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        {request.profiles.first_name} {request.profiles.last_name}
                      </CardTitle>
                      <CardDescription>
                        {request.profiles.email}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {request.message && (
                    <div className="mb-2">
                      <p className="text-sm font-medium mb-1">Message:</p>
                      <p className="text-sm text-muted-foreground">{request.message}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Demandé {formatDistanceToNow(new Date(request.created_at), { 
                      addSuffix: true,
                      locale: fr 
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune demande pour le moment
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminRoleRequests;
