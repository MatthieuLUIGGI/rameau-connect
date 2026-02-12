import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, UserCheck } from "lucide-react";

interface MemberStatsProps {
  totalMembers: number;
  agMembers: number;
  recentMembers: number;
}

const MemberStats = ({ totalMembers, agMembers, recentMembers }: MemberStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Total membres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">{totalMembers}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-accent" />
            Membres AG
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-accent">{agMembers}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5 text-muted-foreground" />
            Inscrits (30j)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-muted-foreground">{recentMembers}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberStats;
