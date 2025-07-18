import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums, Database } from "@/integrations/supabase/types"; // Adicione 'Database' aqui
import { useAuth } from "@/hooks/useAuth";

// Esquema de validação do formulário com Zod
const formSchema = z.object({
  reservationDate: z.date({
    required_error: "Uma data de reserva é obrigatória.",
  }),
  shift: z.enum(["morning", "afternoon", "night"], {
    required_error: "Um turno é obrigatório.",
  }),
  purpose: z.string().min(10, {
    message: "O propósito deve ter pelo menos 10 caracteres.",
  }).max(255, {
    message: "O propósito não pode exceder 255 caracteres."
  }),
});

interface EquipmentReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentType: Database["public"]["Enums"]["equipment_type"];
  selectedEquipmentId: string; // ID do equipamento específico selecionado
  onReservationSuccess: () => void; // ADICIONE ESTA LINHA
}

export function EquipmentReservationModal({
  isOpen,
  onClose,
  equipmentType,
  selectedEquipmentId,
  onReservationSuccess,
}: EquipmentReservationModalProps) {
  const { toast } = useToast();
  const { user } = useAuth(); // Puxa o usuário logado para user_id
  const [loading, setLoading] = useState(false);
  const now = new Date(); // Pega a data e hora atuais
  const today = format(now, 'yyyy-MM-dd'); // Formato de string para comparação de data
  const currentHourMinute = format(now, 'HH:mm'); // Formato HH:mm para comparação de hora

  // Mapeamento de turno para horário de retirada e devolução (simplificado)
  const shiftTimes: Record<Database["public"]["Enums"]["shift_type"], { pickup: string; return: string }> = {
    morning: { pickup: "08:00:00", return: "12:00:00" },
    afternoon: { pickup: "13:30:00", return: "17:30:00" },
    night: { pickup: "18:30:00", return: "22:30:00" }, // Ajustado para 4h de uso
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reservationDate: undefined,
      shift: undefined,
      purpose: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para fazer uma reserva.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { pickup, return: returnTime } = shiftTimes[values.shift];

      const { data, error } = await supabase.rpc('criar_reserva_equipamento_com_regras', {
        p_user_id: user.id,
        p_equipment_id: selectedEquipmentId,
        p_reservation_date: format(values.reservationDate, 'yyyy-MM-dd'),
        p_shift: values.shift,
        p_pickup_time: pickup,
        p_return_time: returnTime,
        p_purpose: values.purpose,
      });

      if (error) throw error;

      toast({
        title: "Reserva de equipamento realizada!",
        description: `Sua reserva para um ${equipmentType} (ID: ${selectedEquipmentId}) foi confirmada.`,
        variant: "success",
      });
      onReservationSuccess();
      form.reset(); // Limpa o formulário
      onClose(); // Fecha o modal
    } catch (error: any) {
      console.error("Erro ao reservar equipamento:", error);
      toast({
        title: "Erro ao reservar",
        description: error.message || "Não foi possível completar a reserva.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Mapeamento para exibir o nome do tipo de equipamento no título
  const equipmentTypeName = {
    tablet: "Tablet",
    notebook: "Notebook",
    vr_glasses: "Óculos VR",
  }[equipmentType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reservar {equipmentTypeName}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para reservar o {equipmentTypeName} (ID: {selectedEquipmentId}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reservationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Reserva</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || date > new Date(2026, 11, 31)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shift"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Manhã */}
                      <SelectItem
                        value="morning"
                        disabled={
                          // Se a data selecionada é hoje E a hora atual já passou do horário de retirada da manhã
                          format(form.watch('reservationDate') || now, 'yyyy-MM-dd') === today &&
                          currentHourMinute > '08:00'
                        }
                      >
                        Manhã (08:00 - 12:00)
                      </SelectItem>
                      {/* Tarde */}
                      <SelectItem
                        value="afternoon"
                        disabled={
                          // Se a data selecionada é hoje E a hora atual já passou do horário de retirada da tarde
                          format(form.watch('reservationDate') || now, 'yyyy-MM-dd') === today &&
                          currentHourMinute > '13:30'
                        }
                      >
                        Tarde (13:30 - 17:30)
                      </SelectItem>
                      {/* Noite */}
                      <SelectItem
                        value="night"
                        disabled={
                          // Se a data selecionada é hoje E a hora atual já passou do horário de retirada da noite
                          format(form.watch('reservationDate') || now, 'yyyy-MM-dd') === today &&
                          currentHourMinute > '18:30'
                        }
                      >
                        Noite (18:30 - 22:30)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propósito da Reserva</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva brevemente o propósito da reserva..."
                      className="resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Reservando..." : "Confirmar Reserva"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}