import { Card, CardContent } from "@/components/ui/card";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function Cookies() {
  const { consent, setConsent, acceptAll, rejectAll } = useCookieConsent();

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Politique de cookies</h1>
      <Card>
        <CardContent className="prose prose-sm sm:prose p-6">
          <p>
            Les cookies sont de petits fichiers déposés sur votre appareil pour assurer le fonctionnement du site et, selon votre choix, mesurer l’audience ou personnaliser le contenu.
          </p>

          <h2>Catégories de cookies</h2>
          <ul>
            <li>
              <strong>Nécessaires</strong>: indispensables au fonctionnement du site (ex: sécurité, session, préférences). Toujours actifs.
            </li>
            <li>
              <strong>Mesure d’audience</strong>: nous aident à comprendre l’usage du site pour l’améliorer (ex: Vercel Analytics). Déposés uniquement avec votre accord.
            </li>
            <li>
              <strong>Marketing</strong>: personnalisation et publicité (non utilisés actuellement). Déposés uniquement avec votre accord.
            </li>
          </ul>

          <h2>Gérer vos préférences</h2>
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox checked disabled className="mt-1" />
              <div>
                <div className="font-medium">Cookies nécessaires</div>
                <div className="text-muted-foreground text-sm">Indispensables au fonctionnement du site. Toujours actifs.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consent.analytics}
                onCheckedChange={(v) => setConsent({ ...consent, analytics: Boolean(v) })}
                className="mt-1"
              />
              <div>
                <div className="font-medium">Mesure d’audience</div>
                <div className="text-muted-foreground text-sm">Active/désactive les cookies d’analyse d’audience.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                checked={consent.marketing}
                onCheckedChange={(v) => setConsent({ ...consent, marketing: Boolean(v) })}
                className="mt-1"
              />
              <div>
                <div className="font-medium">Marketing</div>
                <div className="text-muted-foreground text-sm">Active/désactive les cookies marketing (non utilisés actuellement).</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={rejectAll}>Tout refuser</Button>
              <Button onClick={acceptAll}>Tout accepter</Button>
            </div>
          </div>

          <h2>Durée de vie</h2>
          <p>Votre choix est conservé pendant 6 à 12 mois puis nous vous reposerons la question. Vous pouvez modifier votre choix à tout moment sur cette page.</p>

          <h2>Contact</h2>
          <p>
            Pour toute question: <a href="mailto:residence.lerameau@laposte.net">residence.lerameau@laposte.net</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
