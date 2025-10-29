import { MapPin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Copropriété Le Rameau</h3>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="text-primary-foreground/80">
                  5 Rue André Malraux<br />21000 Dijon
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="text-primary-foreground/80">residence.lerameau@laposte.net</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Horaires du syndic</h3>
            <p>Régie Foncière</p>
            <div className="space-y-2 text-sm text-primary-foreground/80">
              <p>Lundi - Vendredi</p>
              <p className="font-medium">10h00 - 12h00 / 14h00 - 17h00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-2">
            <Link to="/mentions-legales" className="hover:underline">Mentions légales</Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/confidentialite" className="hover:underline">Politique de confidentialité</Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/cookies" className="hover:underline">Cookies</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Copropriété Le Rameau. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
