import { useState } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

export default function CookieBanner() {
  const { hasConsent, consent, setConsent, acceptAll, rejectAll } = useCookieConsent();
  const [openPrefs, setOpenPrefs] = useState(false);
  const [temp, setTemp] = useState({ analytics: consent.analytics, marketing: consent.marketing });

  if (hasConsent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <Card className="mx-auto max-w-3xl border border-border shadow-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            Nous utilisons des cookies pour assurer le bon fonctionnement du site et, avec votre accord, pour mesurer l’audience.
            Consultez notre <Link to="/cookies" className="underline">politique de cookies</Link> et notre <Link to="/confidentialite" className="underline">politique de confidentialité</Link>.
          </div>

          {openPrefs && (
            <div className="rounded-md border p-3 sm:p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox checked disabled className="mt-1" />
                  <div className="text-sm">
                    <div className="font-medium">Cookies nécessaires</div>
                    <div className="text-muted-foreground">Indispensables au fonctionnement du site (ex: sécurité, session, préférences d’interface). Toujours actifs.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={!!temp.analytics}
                    onCheckedChange={(v) => setTemp((t) => ({ ...t, analytics: Boolean(v) }))}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium">Mesure d’audience</div>
                    <div className="text-muted-foreground">Nous aider à comprendre l’usage du site pour l’améliorer (ex: Vercel Analytics).</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={!!temp.marketing}
                    onCheckedChange={(v) => setTemp((t) => ({ ...t, marketing: Boolean(v) }))}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium">Marketing</div>
                    <div className="text-muted-foreground">Personnalisation et publicité (non utilisé actuellement).</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            {!openPrefs && (
              <Button variant="outline" onClick={() => setOpenPrefs(true)}>
                Personnaliser
              </Button>
            )}
            {openPrefs ? (
              <Button
                onClick={() => setConsent({ necessary: true, analytics: temp.analytics, marketing: temp.marketing })}
              >
                Enregistrer
              </Button>
            ) : (
              <Button onClick={acceptAll}>Tout accepter</Button>
            )}
            <Button variant="secondary" onClick={rejectAll}>Tout refuser</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
