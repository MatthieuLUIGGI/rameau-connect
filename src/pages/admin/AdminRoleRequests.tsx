import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RoleRequest {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

const AdminRoleRequests = () => {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('role_requests' as any)
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = data.map((req: any) => req.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        // Combine data
        const requestsWithProfiles = data.map((req: any) => ({
          ...req,
          profiles: profiles?.find((p) => p.id === req.user_id)
        }));
        
        setRequests(requestsWithProfiles as any);
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error('Error fetching role requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (requestId: string, userId: string, approve: boolean) => {
    setProcessingId(requestId);
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('role_requests' as any)
        .update({
          status: approve ? 'approved' : 'rejected',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, add AG role
      if (approve) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'ag'
          });

        if (roleError) throw roleError;
      }

      toast.success(approve ? 'Demande approuvée' : 'Demande refusée');
      fetchRequests();
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast.error('Erreur lors du traitement de la demande');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('role-requests-changes')
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold mb-8">Demandes de rôle AG</h1>

      {requests.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Aucune demande en attente
        </p>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => {
            const profile = request.profiles as any;
            const userName = profile?.first_name && profile?.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile?.email || 'Utilisateur inconnu';

            return (
              <Card key={request.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{userName}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {format(new Date(request.created_at), 'PPP', { locale: fr })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {request.message && (
                    <div className="mb-4 p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground mb-1">Message:</p>
                      <p className="text-sm">{request.message}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRequest(request.id, request.user_id, true)}
                      disabled={processingId === request.id}
                      className="flex-1"
                      variant="default"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Approuver
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleRequest(request.id, request.user_id, false)}
                      disabled={processingId === request.id}
                      className="flex-1"
                      variant="destructive"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Refuser
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminRoleRequests;
