import { useState } from "react";
import { Header } from "@/components/Header";
import { EquipmentCard, EquipmentType } from "@/components/EquipmentCard";
import { SpaceCard, SpaceType } from "@/components/SpaceCard";
import { QuickStats } from "@/components/QuickStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, History, PlusCircle } from "lucide-react";
import heroImage from "@/assets/library-hero.jpg";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  
  // Mock data - in a real app this would come from an API
  const [equipmentData] = useState({
    tablet: { total: 30, available: 18 },
    notebook: { total: 19, available: 7 },
    vr: { total: 15, available: 12 }
  });

  const [spaceData] = useState({
    'study-room': true,
    'main-space': false
  });

  const statsData = {
    totalReservations: 47,
    activeReservations: 12,
    hoursReserved: 156,
    equipmentInUse: 23
  };

  const handleEquipmentReserve = (type: EquipmentType) => {
    toast({
      title: "Reserva iniciada",
      description: `Iniciando processo de reserva para ${type === 'tablet' ? 'Tablet' : type === 'notebook' ? 'Notebook' : 'Óculos VR'}`,
    });
  };

  const handleSpaceReserve = (type: SpaceType) => {
    toast({
      title: "Reserva de espaço",
      description: `Iniciando reserva para ${type === 'study-room' ? 'Sala de Estudo' : 'Espaço Geral'}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl font-bold mb-4">
              Bem-vindo à Biblioteca SENAC
            </h1>
            <p className="text-lg opacity-90 mb-6">
              Reserve equipamentos e espaços de estudo de forma rápida e fácil. 
              Gerencie suas reservas e aproveite ao máximo os recursos da biblioteca.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="lg" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                <PlusCircle className="mr-2 h-5 w-5" />
                Nova Reserva
              </Button>
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <History className="mr-2 h-5 w-5" />
                Minhas Reservas
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <QuickStats data={statsData} />

        {/* Main Content */}
        <Tabs defaultValue="equipment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
            <TabsTrigger value="spaces">Espaços</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Equipamentos Disponíveis</h2>
                <p className="text-muted-foreground">
                  Reserve tablets, notebooks e óculos VR por turno
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EquipmentCard
                type="tablet"
                totalUnits={equipmentData.tablet.total}
                availableUnits={equipmentData.tablet.available}
                onReserve={() => handleEquipmentReserve('tablet')}
              />
              <EquipmentCard
                type="notebook"
                totalUnits={equipmentData.notebook.total}
                availableUnits={equipmentData.notebook.available}
                onReserve={() => handleEquipmentReserve('notebook')}
              />
              <EquipmentCard
                type="vr"
                totalUnits={equipmentData.vr.total}
                availableUnits={equipmentData.vr.available}
                onReserve={() => handleEquipmentReserve('vr')}
              />
            </div>

            <Card className="booking-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5" />
                  <span>Horários de Retirada</span>
                </CardTitle>
                <CardDescription>
                  Equipamentos devem ser retirados nos horários especificados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-lg font-semibold text-primary">Manhã</div>
                    <div className="text-sm text-muted-foreground">08:00</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-lg font-semibold text-primary">Tarde</div>
                    <div className="text-sm text-muted-foreground">13:30</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-lg font-semibold text-primary">Noite</div>
                    <div className="text-sm text-muted-foreground">18:30</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spaces" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Espaços da Biblioteca</h2>
                <p className="text-muted-foreground">
                  Reserve sala de estudo ou espaço geral para atividades
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SpaceCard
                type="study-room"
                isAvailable={spaceData['study-room']}
                onReserve={() => handleSpaceReserve('study-room')}
              />
              <SpaceCard
                type="main-space"
                isAvailable={spaceData['main-space']}
                onReserve={() => handleSpaceReserve('main-space')}
              />
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendário de Reservas</CardTitle>
                <CardDescription>
                  Visualize todas as reservas em um calendário interativo
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Calendário em desenvolvimento</p>
                  <p className="text-sm">Em breve você poderá visualizar todas as reservas aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}