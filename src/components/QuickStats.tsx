import { Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsData {
  totalReservations: number;
  activeReservations: number;
  hoursReserved: number;
  equipmentInUse: number;
}

interface QuickStatsProps {
  data: StatsData;
}

export function QuickStats({ data }: QuickStatsProps) {
  const stats = [
    {
      title: "Reservas Totais",
      value: data.totalReservations,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Reservas Ativas",
      value: data.activeReservations,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Horas Reservadas",
      value: `${data.hoursReserved}h`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Equipamentos em Uso",
      value: data.equipmentInUse,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}