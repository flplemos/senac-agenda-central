import { useEffect, useState, useCallback } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums, Database } from "@/integrations/supabase/types"; // Adicione 'Database' se não estiver lá
import { format } from "date-fns";
import { EquipmentReservationModal } from "@/components/EquipmentReservationModal";


export default function Dashboard() {
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType | null>(null);
  const [selectedEquipmentInstanceId, setSelectedEquipmentInstanceId] = useState<string | null>(null);
  const { toast } = useToast();

  const [equipments, setEquipments] = useState<Tables<'equipment'>[]>([]);
  const [equipmentAvailability, setEquipmentAvailability] = useState<Record<EquipmentType, { total: number; available: number }>>({
    tablet: { total: 0, available: 0 },
    notebook: { total: 0, available: 0 },
    vr_glasses: { total: 0, available: 0 },
  });
  const [loadingEquipment, setLoadingEquipment] = useState(true);

  const [spaces, setSpaces] = useState<Tables<'space_reservations'>[]>([]);
  const [spaceAvailability, setSpaceAvailability] = useState<Record<SpaceType, boolean>>({
    study_room: true,
    general_space: true,
  });
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  const [statsData, setStatsData] = useState({
    totalReservations: 0,
    activeReservations: 0,
    hoursReserved: 0,
    equipmentInUse: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const [reservedEquipmentIds, setReservedEquipmentIds] = useState<Set<string>>(new Set());


  const fetchDashboardData = useCallback(async () => {
    setLoadingEquipment(true);
    setLoadingSpaces(true);
    setLoadingStats(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // --- Busca de Equipamentos e suas Reservas Ativas ---
      // Selecionando TODAS as colunas para corresponder ao tipo Tables<'equipment'>[]
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*'); // CORRIGIDO: Selecionar todas as colunas
      if (equipmentError) throw equipmentError;

      // Buscar TODAS as reservas ativas (pendentes ou confirmadas) para o dia atual e todos os turnos
      const { data: activeEquipmentReservations, error: activeEqResError } = await supabase
        .from('equipment_reservations')
        .select('equipment_id, shift, status')
        .eq('reservation_date', today)
        .in('status', ['pending', 'confirmed']);
      if (activeEqResError) throw activeEqResError;

      const currentEquipmentAvailability: Record<EquipmentType, { total: number; available: number }> = {
        tablet: { total: 0, available: 0 },
        notebook: { total: 0, available: 0 },
        vr_glasses: { total: 0, available: 0 },
      };

      equipmentData.forEach(eq => {
        const typeKey: EquipmentType = eq.type;
        if (currentEquipmentAvailability[typeKey]) {
          currentEquipmentAvailability[typeKey].total++;
        }
      });

      const newReservedEquipmentIds = new Set(
        activeEquipmentReservations
          .filter(res => res.status === 'pending' || res.status === 'confirmed')
          .map(res => res.equipment_id)
      );
      setReservedEquipmentIds(newReservedEquipmentIds); // ATUALIZA O NOVO ESTADO

      equipmentData.forEach(eq => {
        const typeKey: EquipmentType = eq.type;
        if (currentEquipmentAvailability[typeKey]) {
          if (!newReservedEquipmentIds.has(eq.id)) {
            currentEquipmentAvailability[typeKey].available++;
          }
        }
      });
      
      setEquipmentAvailability(currentEquipmentAvailability);
      setEquipments(equipmentData);


      // --- Busca de Espaços e suas Reservas Ativas ---
      const { data: spaceReservationsData, error: spaceReservationsError } = await supabase
        .from('space_reservations')
        .select('space_type, status')
        .eq('reservation_date', today)
        .in('status', ['pending', 'confirmed']);
      if (spaceReservationsError) throw spaceReservationsError;
      
      const currentSpaceAvailability: Record<SpaceType, boolean> = {
        study_room: true,
        general_space: true,
      };

      spaceReservationsData.forEach(res => {
        if (res.status === 'pending' || res.status === 'confirmed') {
          currentSpaceAvailability[res.space_type] = false;
        }
      });
      setSpaceAvailability(currentSpaceAvailability);


      // --- Busca de Estatísticas ---
      // Variáveis renomeadas para evitar conflito com as de cima
      const { count: totalEqResCountStats, error: totalEqResErrorStats } = await supabase
        .from('equipment_reservations')
        .select('*', { count: 'exact', head: true });
      if (totalEqResErrorStats) console.error("Erro ao buscar total de reservas de equipamentos (stats):", totalEqResErrorStats);

      const { count: totalSpaceResCountStats, error: totalSpaceResErrorStats } = await supabase
          .from('space_reservations')
          .select('*', { count: 'exact', head: true });
      if (totalSpaceResCountStats) console.error("Erro ao buscar total de reservas de espaços (stats):", totalSpaceResCountStats);


      const { count: activeEqResCountStats, error: activeEqResErrorStats } = await supabase
        .from('equipment_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('reservation_date', today)
        .in('status', ['pending', 'confirmed']);
      if (activeEqResErrorStats) console.error("Erro ao buscar reservas ativas de equipamentos (stats):", activeEqResErrorStats);
      
      const { count: activeSpaceResCountStats, error: activeSpaceResErrorStats } = await supabase
          .from('space_reservations')
          .select('*', { count: 'exact', head: true })
          .eq('reservation_date', today)
          .in('status', ['pending', 'confirmed']);
      if (activeSpaceResCountStats) console.error("Erro ao buscar reservas ativas de espaços (stats):", activeSpaceResCountStats);


      const sumReservedHours = (activeEquipmentReservations || []).reduce((sum, res) => {
        const shiftDuration = {
          morning: 4,
          afternoon: 4,
          night: 4,
        }[res.shift] || 0;
        return sum + shiftDuration;
      }, 0);

      const estimatedSpaceHours = (spaceReservationsData || []).filter(res => res.status === 'pending' || res.status === 'confirmed').length * 3;
      
      setStatsData({
        totalReservations: (totalEqResCountStats || 0) + (totalSpaceResCountStats || 0),
        activeReservations: (activeEqResCountStats || 0) + (activeSpaceResCountStats || 0),
        hoursReserved: sumReservedHours + estimatedSpaceHours,
        equipmentInUse: (activeEqResCountStats || 0),
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
  }, [toast]); // `equipments` removido das dependências para evitar loop com `setEquipments`

  // O useEffect agora apenas CHAMA a função, sem defini-la
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  const handleEquipmentReserve = (type: EquipmentType) => {
      // Usa o estado `reservedEquipmentIds` aqui
      const availableEquipment = equipments.find(eq => eq.type === type && !reservedEquipmentIds.has(eq.id));

      if (!availableEquipment) {
          toast({
              title: "Nenhum equipamento disponível",
              description: `Não há ${type === 'tablet' ? 'Tablets' : type === 'notebook' ? 'Notebooks' : 'Óculos VR'} disponíveis no momento.`,
              variant: "destructive",
          });
          return;
      }

      setSelectedEquipmentType(type);
      setSelectedEquipmentInstanceId(availableEquipment.id);
      setIsEquipmentModalOpen(true);
  };

  const handleSpaceReserve = (type: SpaceType) => {
    toast({
      title: "Funcionalidade em Construção",
      description: `Formulário de reserva para ${type === 'study_room' ? 'Sala de Estudo' : 'Espaço Geral'} será implementado aqui.`,
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
                    type="vr_glasses"
                    totalUnits={equipmentAvailability.vr_glasses.total}
                    availableUnits={equipmentAvailability.vr_glasses.available}
                    onReserve={() => handleEquipmentReserve('vr_glasses')}
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
                    type="study_room"
                    isAvailable={spaceAvailability.study_room}
                    onReserve={() => handleSpaceReserve('study_room')}
                  />
                  <SpaceCard
                    type="general_space"
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
        {/* Adicione o modal de reserva de equipamentos aqui, no final do componente */}
        {selectedEquipmentType && selectedEquipmentInstanceId && (
          <EquipmentReservationModal
            isOpen={isEquipmentModalOpen}
            onClose={() => {
              setIsEquipmentModalOpen(false);
              setSelectedEquipmentType(null);
              setSelectedEquipmentInstanceId(null);
            }}
            equipmentType={selectedEquipmentType}
            selectedEquipmentId={selectedEquipmentInstanceId}
            onReservationSuccess={fetchDashboardData}
          />
        )}
      </main>
    </div>
  );
}