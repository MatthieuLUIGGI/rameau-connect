import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Contact = () => {
  const { user, isAG } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);

  const checkExistingRequest = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('role_requests' as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    
    setHasExistingRequest(!!data);
  };

  const handleRequestAGRole = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour faire une demande');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('role_requests' as any)
        .insert({
          user_id: user.id,
          message: message.trim() || null
        });

      if (error) throw error;

      toast.success('Votre demande a été envoyée aux membres de l\'AG');
      setMessage('');
      setHasExistingRequest(true);
    } catch (error: any) {
      console.error('Error submitting role request:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for existing request on mount
  useEffect(() => {
    if (user && !isAG) {
      checkExistingRequest();
    }
  }, [user, isAG]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 pt-20">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-foreground">Contact</h1>
          <a 
            href="mailto:residence.lerameau@laposte.net" 
            className="text-lg md:text-2xl text-primary hover:text-primary/80 transition-colors underline break-all"
          >
            residence.lerameau@laposte.net
          </a>
        </div>

        {user && !isAG && (
          <div className="mt-12 p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Demande de rôle AG</h2>
            <p className="text-muted-foreground mb-4">
              Si vous faites partie de l'Assemblée Générale, vous pouvez demander les droits d'administrateur.
            </p>
            
            {hasExistingRequest ? (
              <p className="text-sm text-muted-foreground italic">
                Vous avez déjà une demande en attente de validation.
              </p>
            ) : (
              <>
                <Textarea
                  placeholder="Message optionnel pour justifier votre demande..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mb-4"
                  rows={4}
                />
                <Button 
                  onClick={handleRequestAGRole}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Demander le rôle AG
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
