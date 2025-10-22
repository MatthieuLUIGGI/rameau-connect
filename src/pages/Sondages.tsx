import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface Poll {
  id: number;
  question: string;
  options: string[];
  voted: boolean;
  results?: number[];
}

const Sondages = () => {
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: 1,
      question: "Souhaitez-vous l'installation de bornes électriques dans le parking ?",
      options: ["Oui, absolument", "Oui, mais avec participation financière", "Non, pas pour l'instant", "Je ne sais pas"],
      voted: false,
      results: [45, 30, 15, 10]
    },
    {
      id: 2,
      question: "Préférez-vous un système de compostage collectif ?",
      options: ["Oui, je suis intéressé(e)", "Peut-être, selon les modalités", "Non merci"],
      voted: false,
      results: [60, 25, 15]
    },
    {
      id: 3,
      question: "Quelle fréquence souhaitez-vous pour le nettoyage des parties communes ?",
      options: ["Une fois par semaine", "Deux fois par semaine", "Trois fois par semaine"],
      voted: false,
      results: [20, 55, 25]
    }
  ]);

  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: string }>({});

  const handleVote = (pollId: number) => {
    if (!selectedOptions[pollId]) return;

    setPolls(polls.map(poll => 
      poll.id === pollId ? { ...poll, voted: true } : poll
    ));
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      "bg-primary",
      "bg-accent", 
      "bg-secondary",
      "bg-muted"
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Sondages
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Participez aux sondages et exprimez votre opinion sur les décisions de la copropriété
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {polls.map((poll, index) => (
            <Card 
              key={poll.id} 
              className="border-border animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{poll.question}</CardTitle>
              </CardHeader>
              <CardContent>
                {!poll.voted ? (
                  <div className="space-y-4">
                    <RadioGroup
                      value={selectedOptions[poll.id]}
                      onValueChange={(value) => setSelectedOptions({ ...selectedOptions, [poll.id]: value })}
                    >
                      {poll.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`${poll.id}-${optIndex}`} />
                          <Label 
                            htmlFor={`${poll.id}-${optIndex}`}
                            className="cursor-pointer text-foreground"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <Button 
                      onClick={() => handleVote(poll.id)}
                      disabled={!selectedOptions[poll.id]}
                      className="w-full"
                    >
                      Envoyer ma réponse
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-accent mb-4">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Merci pour votre participation !</span>
                    </div>
                    
                    <div className="space-y-3">
                      {poll.options.map((option, optIndex) => (
                        <div key={optIndex} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{option}</span>
                            <span className="font-semibold text-muted-foreground">
                              {poll.results?.[optIndex]}%
                            </span>
                          </div>
                          <Progress 
                            value={poll.results?.[optIndex]} 
                            className="h-2"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sondages;
