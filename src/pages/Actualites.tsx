import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";

interface Article {
  id: number;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  content: string;
}

const Actualites = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const articles: Article[] = [
    {
      id: 1,
      title: "Travaux de réfection de la façade",
      date: "15 Mars 2025",
      category: "Travaux",
      excerpt: "Les travaux de réfection de la façade débuteront le 1er avril prochain.",
      content: "Les travaux de réfection de la façade débuteront le 1er avril prochain. La durée estimée est de 3 mois. Un échafaudage sera installé sur toute la hauteur du bâtiment. Les résidents seront informés des éventuelles nuisances."
    },
    {
      id: 2,
      title: "Prochaine Assemblée Générale",
      date: "10 Mars 2025",
      category: "Réunion",
      excerpt: "L'assemblée générale ordinaire se tiendra le 20 avril à 18h30.",
      content: "L'assemblée générale ordinaire se tiendra le 20 avril à 18h30 dans la salle des fêtes municipale. L'ordre du jour sera envoyé par courrier recommandé. Votre présence est importante pour les décisions concernant notre copropriété."
    },
    {
      id: 3,
      title: "Nouveau système d'accès au parking",
      date: "5 Mars 2025",
      category: "Information",
      excerpt: "Un nouveau système de badges remplacera les anciennes télécommandes.",
      content: "Un nouveau système de badges remplacera les anciennes télécommandes à partir du 1er mai. Les badges seront distribués gratuitement. Les anciennes télécommandes resteront fonctionnelles jusqu'au 31 mai pour faciliter la transition."
    },
    {
      id: 4,
      title: "Entretien des espaces verts",
      date: "1 Mars 2025",
      category: "Entretien",
      excerpt: "Le printemps approche, les jardiniers interviendront pour l'entretien.",
      content: "Le printemps approche, les jardiniers interviendront pour l'entretien des espaces verts tous les mercredis matins. Des plantations de fleurs saisonnières sont prévues pour embellir notre résidence."
    },
    {
      id: 5,
      title: "Rappel : Tri sélectif",
      date: "25 Février 2025",
      category: "Information",
      excerpt: "Merci de respecter les consignes de tri dans les locaux poubelles.",
      content: "Merci de respecter les consignes de tri dans les locaux poubelles. Des affichettes ont été installées pour faciliter le tri. Le respect de ces consignes permet de réduire les coûts de traitement des déchets pour la copropriété."
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Travaux": "bg-orange-500/10 text-orange-700",
      "Réunion": "bg-blue-500/10 text-blue-700",
      "Information": "bg-green-500/10 text-green-700",
      "Entretien": "bg-purple-500/10 text-purple-700"
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  if (selectedArticle) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedArticle(null)}
            className="mb-6"
          >
            ← Retour aux actualités
          </Button>
          
          <article className="animate-fade-in">
            <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getCategoryColor(selectedArticle.category)}`}>
                {selectedArticle.category}
              </span>
              <h1 className="text-4xl font-bold mb-4 text-foreground">{selectedArticle.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{selectedArticle.date}</span>
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-foreground leading-relaxed">{selectedArticle.content}</p>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Actualités
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Restez informé des dernières nouvelles et événements de la copropriété
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {articles.map((article, index) => (
            <Card 
              key={article.id} 
              className="hover-lift cursor-pointer border-border"
              onClick={() => setSelectedArticle(article)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{article.date}</span>
                      </div>
                    </div>
                    <CardTitle className="text-2xl mb-2 text-foreground">{article.title}</CardTitle>
                  </div>
                  <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{article.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Actualites;
