import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { EquipmentCard, EquipmentType } from "@/components/EquipmentCard"; // EquipmentType foi atualizado
import { SpaceCard, SpaceType } from "@/components/SpaceCard"; // SpaceType foi atualizado
import { QuickStats } from "@/components/QuickStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, History, PlusCircle } from "lucide-react";
import heroImage from "@/assets/library-hero.jpg";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types"; // Importe os tipos do Supabase
import { format } from "date-fns"; // Para formatar datas

export default function Dashboard() {
  const { toast } = useToast();

  const [equipments, setEquipments] = useState<Tables<'equipment'>[]>([]);
  const [equipmentAvailability, setEquipmentAvailability] = useState<Record<EquipmentType, { total: number; available: number }>>({
    tablet: { total: 0, available: 0 },
    notebook: { total: 0, available: 0 },
    vr_glasses: { total: 0, available: 0 }, // Usamos 'vr_glasses' para corresponder ao enum do Supabase
  });
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  
  const [spaces, setSpaces] = useState<Tables<'space_reservations'>[]>([]);
  const [spaceAvailability, setSpaceAvailability] = useState<Record<SpaceType, boolean>>({
    study_room: true, // Chaves agora alinhadas com o enum Supabase
    general_space: true, // Chaves agora alinhadas com o enum Supabase
  });
  const [loadingSpaces, setLoadingSpaces] = useState(true);


  const [statsData, setStatsData] = useState({
    totalReservations: 0,
    activeReservations: 0,
    hoursReserved: 0,
    equipmentInUse: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);


  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingEquipment(true);
      setLoadingSpaces(true);
      setLoadingStats(true);
      try {
        // --- Busca de Equipamentos ---
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('equipment')
          .select('*');

        if (equipmentError) throw equipmentError;
        setEquipments(equipmentData);

        const currentEquipmentAvailability: Record<EquipmentType, { total: number; available: number }> = {
          tablet: { total: 0, available: 0 },
          notebook: { total: 0, available: 0 },
          vr_glasses: { total: 0, available: 0 },
        };

        equipmentData.forEach(eq => {
          currentEquipmentAvailability[eq.type].total++;
          if (eq.is_available) {
            currentEquipmentAvailability[eq.type].available++;
          }
        });
        setEquipmentAvailability(currentEquipmentAvailability);


        // --- Busca de Espaços ---
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: spaceReservationsData, error: spaceReservationsError } = await supabase
          .from('space_reservations')
          .select('*')
          .eq('reservation_date', today)
          .in('status', ['pending', 'confirmed']);

        if (spaceReservationsError) throw spaceReservationsError;
        
        const currentSpaceAvailability: Record<SpaceType, boolean> = {
          study_room: true,
          general_space: true,
        };

        spaceReservationsData.forEach(res => {
          currentSpaceAvailability[res.space_type] = false;
        });
        setSpaceAvailability(currentSpaceAvailability);


        // --- Busca de Estatísticas ---
        const { count: totalEqResCount, error: totalEqResError } = await supabase
          .from('equipment_reservations')
          .select('*', { count: 'exact', head: true });
        if (totalEqResError) console.error("Erro ao buscar total de reservas de equipamentos:", totalEqResError);

        const { count: totalSpaceResCount, error: totalSpaceResError } = await supabase
            .from('space_reservations')
            .select('*', { count: 'exact', head: true });
        if (totalSpaceResCount) console.error("Erro ao buscar total de reservas de espaços:", totalSpaceResCount);


        const { count: activeEqResCount, error: activeEqResError } = await supabase
          .from('equipment_reservations')
          .select('*', { count: 'exact', head: true })
          .eq('reservation_date', today)
          .in('status', ['pending', 'confirmed']);
        if (activeEqResError) console.error("Erro ao buscar reservas ativas de equipamentos:", activeEqResError);
        
        const { count: activeSpaceResCount, error: activeSpaceResError } = await supabase
            .from('space_reservations')
            .select('*', { count: 'exact', head: true })
            .eq('reservation_date', today)
            .in('status', ['pending', 'confirmed']);
        if (activeSpaceResError) console.error("Erro ao buscar reservas ativas de espaços:", activeSpaceResError);


        const estimatedHoursReserved = ((activeEqResCount || 0) * 4) + ((activeSpaceResCount || 0) * 3);
        const estimatedEquipmentInUse = (activeEqResCount || 0);


        setStatsData({
          totalReservations: (totalEqResCount || 0) + (totalSpaceResCount || 0),
          activeReservations: (activeEqResCount || 0) + (activeSpaceResCount || 0),
          hoursReserved: estimatedHoursReserved,
          equipmentInUse: estimatedEquipmentInUse,
        });

      } catch (error: any) {
        console.error("Erro ao carregar dados do Dashboard:", error.message);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as informações da biblioteca. " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingEquipment(false);
        setLoadingSpaces(false);
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [toast]);


  const handleEquipmentReserve = (type: EquipmentType) => { // Type agora é EquipmentType correto
    toast({
      title: "Funcionalidade em Construção",
      description: `Formulário de reserva para ${type === 'tablet' ? 'Tablets' : type === 'notebook' ? 'Notebooks' : 'Óculos VR'} será implementado aqui.`,
    });
  };

  const handleSpaceReserve = (type: SpaceType) => { // Type agora é SpaceType correto
    toast({
      title: "Funcionalidade em Construção",
      description: `Formulário de reserva para ${type === 'study_room' ? 'Sala de Estudo' : 'Espaço Geral'} será implementado aqui.`, // Comparação corrigida
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section (inalterado) */}
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

        {/* Quick Stats - AGORA COM DADOS REAIS OU BASICAMENTE CALCULADOS */}
        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Esqueletos de carregamento para as estatísticas */}
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="relative overflow-hidden h-[120px] animate-pulse bg-muted-foreground/10" />
            ))}
          </div>
        ) : (
          <QuickStats data={statsData} />
        )}

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
              {loadingEquipment ? (
                <>
                  {/* Esqueletos de carregamento para os cards de equipamento */}
                  <Card className="equipment-card h-[280px] animate-pulse bg-muted-foreground/10" />
                  <Card className="equipment-card h-[280px] animate-pulse bg-muted-foreground/10" />
                  <Card className="equipment-card h-[280px] animate-pulse bg-muted-foreground/10" />
                </>
              ) : (
                <>
                  <EquipmentCard
                    type="tablet"
                    totalUnits={equipmentAvailability.tablet.total}
                    availableUnits={equipmentAvailability.tablet.available}
                    onReserve={() => handleEquipmentReserve('tablet')}
                  />
                  <EquipmentCard
                    type="notebook"
                    totalUnits={equipmentAvailability.notebook.total}
                    availableUnits={equipmentAvailability.notebook.available}
                    onReserve={() => handleEquipmentReserve('notebook')}
                  />
                  <EquipmentCard
                    type="vr_glasses" // Agora o tipo passado é o correto do enum
                    totalUnits={equipmentAvailability.vr_glasses.total}
                    availableUnits={equipmentAvailability.vr_glasses.available}
                    onReserve={() => handleEquipmentReserve('vr_glasses')} // Passando o tipo correto para a função
                  />
                </>
              )}
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
              {loadingSpaces ? (
                <>
                  {/* Esqueletos de carregamento para os cards de espaço */}
                  <Card className="equipment-card h-[280px] animate-pulse bg-muted-foreground/10" />
                  <Card className="equipment-card h-[280px] animate-pulse bg-muted-foreground/10" />
                </>
              ) : (
                <>
                  <SpaceCard
                    type="study_room" // Agora o tipo passado é o correto do enum
                    isAvailable={spaceAvailability.study_room}
                    onReserve={() => handleSpaceReserve('study_room')}
                  />
                  <SpaceCard
                    type="general_space" // Agora o tipo passado é o correto do enum
                    isAvailable={spaceAvailability.general_space}
                    onReserve={() => handleSpaceReserve('general_space')}
                  />
                </>
              )}
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