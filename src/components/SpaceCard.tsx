import { Users, Clock, BookOpen, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Alinhado com o enum do Supabase: 'study_room' e 'general_space'
export type SpaceType = 'study_room' | 'general_space';

interface SpaceCardProps {
  type: SpaceType; // Agora SpaceType usa os nomes corretos
  isAvailable: boolean;
  onReserve: (type: SpaceType) => void; // A função onReserve agora passa o SpaceType correto
}

const spaceConfig = {
  'study_room': { // Alterado de 'study-room' para 'study_room'
    name: 'Sala de Estudo',
    icon: Users,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    description: 'Ambiente reservado para estudos em grupo',
    capacity: '2-9 pessoas',
    duration: '30min - 4h',
    schedule: '08h00 - 20h00 (Intervalo: 12h00-13h00)'
  },
  'general_space': { // Alterado de 'main-space' para 'general_space'
    name: 'Espaço Geral',
    icon: BookOpen,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    description: 'Área principal para atividades educacionais',
    capacity: 'Até 18 pessoas',
    duration: '2-4 horas por turno',
    schedule: 'Por turno (manhã/tarde/noite)'
  }
};

export function SpaceCard({ type, isAvailable, onReserve }: SpaceCardProps) {
  const config = spaceConfig[type]; // 'type' agora corresponde às chaves
  const Icon = config.icon;

  return (
    <Card className="equipment-card group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg ${config.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge variant={isAvailable ? 'success' : 'destructive'} className="text-xs">
            {isAvailable ? 'Disponível' : 'Ocupado'}
          </Badge>
        </div>
        <CardTitle className="text-lg">{config.name}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Capacidade</span>
            </div>
            <span className="font-medium">{config.capacity}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Duração</span>
            </div>
            <span className="font-medium">{config.duration}</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5" />
              <span>Horário</span>
            </div>
            <span className="font-medium text-right text-xs leading-relaxed">
              {config.schedule}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          variant="hero" 
          className="w-full" 
          disabled={!isAvailable}
          onClick={() => onReserve(type)} // Passando o 'type' para a função onReserve
        >
          {isAvailable ? 'Reservar Espaço' : 'Indisponível'}
        </Button>
      </CardFooter>
    </Card>
  );
}