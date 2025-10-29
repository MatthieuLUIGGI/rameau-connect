import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Confidentialite() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Politique de confidentialité</h1>
      <Card>
        <CardContent className="prose prose-sm sm:prose p-6">
          <p>
            Nous attachons une grande importance à la protection de vos données personnelles. Cette politique explique quelles données sont traitées, à quelles fins et quels sont vos droits conformément au RGPD (UE) 2016/679 et à la loi Informatique et Libertés.
          </p>

          <h2>Données traitées</h2>
          <ul>
            <li>Données de compte et d’authentification via Supabase (adresse email, métadonnées du compte).</li>
            <li>Données de navigation et de mesure d’audience si vous y consentez (via Vercel Analytics).</li>
            <li>Contenus que vous publiez ou consultez dans l’espace copropriété.</li>
          </ul>

          <h2>Bases légales et finalités</h2>
          <ul>
            <li>Exécution du service: accès aux contenus réservés, gestion de compte.</li>
            <li>Intérêt légitime: sécurité, prévention de fraude, maintenance.</li>
            <li>Consentement: mesure d’audience non essentielle (activée uniquement après votre accord).</li>
          </ul>

          <h2>Durées de conservation</h2>
          <p>Les données sont conservées le temps nécessaire aux finalités énoncées, puis supprimées ou anonymisées.</p>

          <h2>Destinataires et sous-traitants</h2>
          <ul>
            <li>Vercel (hébergement et analytics optionnelle).</li>
            <li>Supabase (authentification et base de données).</li>
          </ul>

          <h2>Transferts hors UE</h2>
          <p>
            Certains services (Vercel, Supabase) peuvent impliquer des transferts de données hors UE. Ces transferts sont encadrés par des mécanismes de conformité (clauses contractuelles types, mesures complémentaires).
          </p>

          <h2>Vos droits</h2>
          <ul>
            <li>Droit d’accès, de rectification, d’effacement.</li>
            <li>Droit à la limitation et à l’opposition.</li>
            <li>Droit à la portabilité.</li>
            <li>Droit de retirer votre consentement à tout moment pour les traitements fondés sur celui-ci.</li>
          </ul>
          <p>
            Pour exercer vos droits: contactez <a href="mailto:residence.lerameau@laposte.net">residence.lerameau@laposte.net</a>.
          </p>

          <h2>Cookies et traceurs</h2>
          <p>
            Consultez la <Link to="/cookies">politique de cookies</Link> et gérez vos préférences à tout moment.
          </p>

          <h2>Sécurité</h2>
          <p>
            Des mesures techniques et organisationnelles appropriées sont mises en œuvre pour protéger vos données (chiffrement en transit, contrôle d’accès, journalisation).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
