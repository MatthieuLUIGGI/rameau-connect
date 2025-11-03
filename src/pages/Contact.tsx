import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Contact = () => {
  const { user, isAG } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRequest, setHasRequest] = useState(false);

  const checkExistingRequest = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('role_requests')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    
    setHasRequest(!!data);
  };

  useState(() => {
    checkExistingRequest();
  });

  const handleRequestRole = async () => {
    if (!user) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour faire une demande.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('role_requests')
        .insert({
          user_id: user.id,
          message: message || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Demande envoyée",
        description: "Votre demande de rôle AG a été envoyée aux administrateurs.",
      });

      setHasRequest(true);
      setMessage('');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'envoi de la demande.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 pt-20">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-foreground">Contact</h1>
          <a 
            href="mailto:residence.lerameau@laposte.net" 
            className="text-lg md:text-2xl text-primary hover:text-primary/80 transition-colors underline break-all"
          >
            residence.lerameau@laposte.net
          </a>
        </div>

        {user && !isAG && (
          <Card>
            <CardHeader>
              <CardTitle>Demande d'accès AG</CardTitle>
              <CardDescription>
                Vous êtes membre de l'assemblée générale ? Demandez l'accès administrateur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasRequest ? (
                <p className="text-sm text-muted-foreground">
                  Vous avez déjà une demande en cours. Les administrateurs la traiteront prochainement.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (optionnel)</Label>
                    <Textarea
                      id="message"
                      placeholder="Expliquez pourquoi vous souhaitez avoir accès..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={handleRequestRole}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Envoi en cours...' : 'Demander le rôle AG'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Contact;
