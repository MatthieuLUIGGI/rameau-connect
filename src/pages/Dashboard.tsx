import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Newspaper, BarChart3, Shield, MessageSquare, UserCog, LayoutDashboard } from "lucide-react";

const adminPages = [
  {
    path: "/admin/badges-vigik",
    label: "Badges Vigik",
    description: "Gérer les badges Vigik de la résidence",
    icon: KeyRound,
  },
  {
    path: "/admin/syndic",
    label: "Syndic",
    description: "Gérer les informations du syndic",
    icon: UserCog,
  },
  {
    path: "/admin/actualites",
    label: "Actualités",
    description: "Gérer les actualités de la résidence",
    icon: Newspaper,
  },
  {
    path: "/admin/ag",
    label: "Assemblées Générales",
    description: "Gérer les comptes rendus d'AG",
    icon: BarChart3,
  },
  {
    path: "/admin/conseil-syndical",
    label: "Conseil Syndical",
    description: "Gérer les comptes rendus du conseil syndical",
    icon: Shield,
  },
  {
    path: "/admin/sondages",
    label: "Consultations",
    description: "Gérer les sondages et consultations",
    icon: MessageSquare,
  },
];

const Dashboard = () => {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Gestion de la résidence Le Rameau</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminPages.map((page) => {
          const Icon = page.icon;
          return (
            <Link key={page.path} to={page.path}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{page.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{page.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
