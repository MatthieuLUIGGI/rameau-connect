import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Sondage {
  id: string;
  question: string;
  options: string[];
  active: boolean;
}

interface Vote {
  sondage_id: string;
  option_index: number;
}

const Sondages = () => {
  const [sondages, setSondages] = useState<Sondage[]>([]);
  const [userVotes, setUserVotes] = useState<Vote[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: number }>({});
  const [results, setResults] = useState<{ [key: string]: number[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAG } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSondages();
      fetchUserVotes();
    }
  }, [user]);

  const fetchSondages = async () => {
    const { data, error } = await supabase
      .from('sondages')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      const formatted = (data || []).map(s => ({
        ...s,
        options: s.options as string[]
      }));
      setSondages(formatted);
      
      // Fetch results for all polls
      formatted.forEach(sondage => {
        fetchResults(sondage.id);
      });
    }
    setIsLoading(false);
  };

  const fetchUserVotes = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('votes')
      .select('sondage_id, option_index')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setUserVotes(data);
    }
  };

  const fetchResults = async (sondageId: string) => {
    // Use server-side aggregation function to get poll results
    // This prevents exposing individual voting patterns
    const { data, error } = await supabase
      .rpc('get_poll_results', { poll_id: sondageId });
    
    if (!error && data) {
      const sondage = sondages.find(s => s.id === sondageId);
      if (!sondage) return;
      
      // Initialize all options with 0%
      const percentages = new Array(sondage.options.length).fill(0);
      
      // Update with actual results
      data.forEach((result: { option_index: number; percentage: number }) => {
        percentages[result.option_index] = result.percentage;
      });
      
      setResults(prev => ({ ...prev, [sondageId]: percentages }));
    }
  };

  const handleVote = async (sondageId: string) => {
    if (!user || selectedOptions[sondageId] === undefined) return;

    const { error } = await supabase
      .from('votes')
      .insert([{
        sondage_id: sondageId,
        user_id: user.id,
        option_index: selectedOptions[sondageId]
      }]);
    
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Votre vote a été enregistré' });
      fetchUserVotes();
      fetchResults(sondageId);
    }
  };

  const hasVoted = (sondageId: string) => {
    return userVotes.some(v => v.sondage_id === sondageId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Sondages
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto px-4">
            Participez aux sondages et exprimez votre opinion sur les décisions de la copropriété
          </p>
        </div>

        {sondages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Aucun sondage actif pour le moment.
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8">
            {sondages.map((sondage, index) => {
              const voted = hasVoted(sondage.id);
              const pollResults = results[sondage.id] || [];
              const showResults = voted || isAG;
              
              return (
                <Card 
                  key={sondage.id} 
                  className="border-border animate-slide-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">{sondage.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!showResults ? (
                      <div className="space-y-4">
                        <RadioGroup
                          value={selectedOptions[sondage.id]?.toString()}
                          onValueChange={(value) => setSelectedOptions({ ...selectedOptions, [sondage.id]: parseInt(value) })}
                        >
                          {sondage.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <RadioGroupItem value={optIndex.toString()} id={`${sondage.id}-${optIndex}`} />
                              <Label 
                                htmlFor={`${sondage.id}-${optIndex}`}
                                className="cursor-pointer text-foreground"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        <Button 
                          onClick={() => handleVote(sondage.id)}
                          disabled={selectedOptions[sondage.id] === undefined}
                          className="w-full"
                        >
                          Envoyer ma réponse
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {voted && (
                          <div className="flex items-center gap-2 text-accent mb-4">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Merci pour votre participation !</span>
                          </div>
                        )}
                        {isAG && !voted && (
                          <div className="flex items-center gap-2 text-primary mb-4">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Résultats (vue AG)</span>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          {sondage.options.map((option, optIndex) => (
                            <div key={optIndex} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-foreground">{option}</span>
                                <span className="font-semibold text-muted-foreground">
                                  {pollResults[optIndex] || 0}%
                                </span>
                              </div>
                              <Progress 
                                value={pollResults[optIndex] || 0} 
                                className="h-2"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sondages;
