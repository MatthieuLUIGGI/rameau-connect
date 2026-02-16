import { MapPin, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

const POSITION: [number, number] = [47.327289, 5.050831];

const Contact = () => {
  return (
    <main className="min-h-[calc(100vh-200px)]">
      <section className="pt-24 pb-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
            Contactez-nous
          </h1>
          <p className="text-muted-foreground text-lg">
            Une question ? N'hésitez pas à nous écrire
          </p>
        </div>
      </section>

      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Carte Leaflet */}
            <div className="rounded-lg overflow-hidden border h-[350px] md:h-full md:min-h-[350px]">
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

            {/* Informations pratiques */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-foreground">
                Informations <span className="text-primary">pratiques</span>
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-5 flex items-start gap-4">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Adresse</p>
                      <p className="text-muted-foreground text-sm">
                        5 Rue André Malraux, 21000 Dijon
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5 flex items-start gap-4">
                    <Mail className="h-5 w-5 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Email</p>
                      <a
                        href="mailto:residence.lerameau@laposte.net"
                        className="text-primary hover:text-primary/80 transition-colors underline text-sm"
                      >
                        residence.lerameau@laposte.net
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
