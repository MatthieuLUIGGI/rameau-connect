import { useEffect } from "react";
import { MapPin, Mail } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const POSITION: [number, number] = [47.3135, 5.0341];

const Contact = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] px-4 pt-24 pb-16">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-foreground text-center">
          Contactez-nous
        </h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-4 justify-center">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Adresse</p>
                <p className="text-muted-foreground">5 Rue André Malraux</p>
                <p className="text-muted-foreground">21000 Dijon</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Email</p>
                <a
                  href="mailto:residence.lerameau@laposte.net"
                  className="text-primary hover:text-primary/80 transition-colors underline"
                >
                  residence.lerameau@laposte.net
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden border h-[300px] md:h-[350px]">
            <MapContainer
              center={POSITION}
              zoom={16}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={POSITION}>
                <Popup>
                  Résidence Le Rameau<br />
                  5 Rue André Malraux, 21000 Dijon
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
