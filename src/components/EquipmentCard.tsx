import { Tablet, Laptop, Glasses, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Alinhado com o enum do Supabase: 'tablet', 'notebook', 'vr_glasses'
export type EquipmentType = 'tablet' | 'notebook' | 'vr_glasses';

interface EquipmentCardProps {
  type: EquipmentType; // Agora EquipmentType usa os nomes corretos
  totalUnits: number;
  availableUnits: number;
  onReserve: (type: EquipmentType) => void; // A função onReserve agora passa o EquipmentType correto
}

const equipmentConfig = {
  'tablet': {
    name: 'Tablets',
    icon: Tablet,
    color: 'bg-tablet/10 text-tablet border-tablet/20',
    description: 'Ideais para leitura digital e pesquisa'
  },
  'notebook': {
    name: 'Notebooks',
    icon: Laptop,
    color: 'bg-notebook/10 text-notebook border-notebook/20',
    description: 'Perfeitos para estudos e trabalhos acadêmicos'
  },
  'vr_glasses': { // Alterado de 'vr' para 'vr_glasses'
    name: 'Óculos VR',
    icon: Glasses,
    color: 'bg-vr/10 text-vr border-vr/20', // Mantém a cor 'vr' definida no tailwind.config.ts
    description: 'Experiências imersivas de aprendizado'
  }
};

export function EquipmentCard({ type, totalUnits, availableUnits, onReserve }: EquipmentCardProps) {
  const config = equipmentConfig[type]; // 'type' agora corresponde às chaves
  const Icon = config.icon;
  const availability = (availableUnits / totalUnits) * 100;
  
  const getAvailabilityStatus = () => {
    if (availableUnits === 0) return { label: 'Indisponível', variant: 'destructive' as const };
    if (availability <= 30) return { label: 'Poucos disponíveis', variant: 'warning' as const };
    return { label: 'Disponível', variant: 'success' as const };
  };

  const status = getAvailabilityStatus();

  return (
    <Card className="equipment-card group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-lg ${config.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
        </div>
        <CardTitle className="lg">{config.name}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Disponibilidade</span>
          <span className="font-medium">
            {availableUnits} de {totalUnits} unidades
          </span>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              availability > 50 ? 'bg-success' : 
              availability > 30 ? 'bg-warning' : 'bg-destructive'
            }`}
            style={{ width: `${availability}%` }}
          />
        </div>

        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Por turno</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>Individual</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          variant="hero" 
          className="w-full" 
          disabled={availableUnits === 0}
          onClick={() => onReserve(type)} // Passando o 'type' para a função onReserve
        >
          {availableUnits === 0 ? 'Indisponível' : 'Reservar Agora'}
        </Button>
      </CardFooter>
    </Card>
  );
}