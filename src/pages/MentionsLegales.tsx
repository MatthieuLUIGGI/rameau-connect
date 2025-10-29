import { Card, CardContent } from "@/components/ui/card";

export default function MentionsLegales() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Mentions légales</h1>
      <Card>
        <CardContent className="prose prose-sm sm:prose base-content p-6">
          <h2>Éditeur du site</h2>
          <p>
            Copropriété Le Rameau – 5 Rue André Malraux, 21000 Dijon, France<br />
            Site à usage d’information pour les copropriétaires.
          </p>

          <h2>Direction de la publication</h2>
          <p>
            Conseil Syndical de la Copropriété Le Rameau.
          </p>

          <h2>Hébergement</h2>
          <p>
            Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
            https://vercel.com
          </p>

          <h2>Services tiers</h2>
          <ul>
            <li>Vercel (hébergement et analyse d’audience optionnelle)</li>
            <li>Supabase (authentification et base de données)</li>
          </ul>

          <h2>Contact</h2>
          <p>
            residence.lerameau@laposte.net
          </p>

          <h2>Propriété intellectuelle</h2>
          <p>
            Les contenus et éléments graphiques de ce site sont la propriété de leurs titulaires respectifs. Toute reproduction non autorisée est interdite.
          </p>

          <h2>Responsabilité</h2>
          <p>
            Les informations fournies le sont à titre indicatif. La copropriété ne saurait être tenue responsable des erreurs ou omissions malgré les soins apportés.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
