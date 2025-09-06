import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarX, X, Plus, Trash2, Calendar, Clock, Clock10 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ScheduleClosure, InsertScheduleClosure } from "@shared/schema";

const weekDays = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getDayName = (dayValue: string) => {
  return weekDays.find(day => day.value === dayValue)?.label || dayValue;
};

export default function ScheduleClosures() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [closureType, setClosureType] = useState<"weekly" | "specific_date">("weekly");
  const [formData, setFormData] = useState({
    dayOfWeek: "",
    specificDate: "",
    reason: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schedule closures
  const { data: closures = [], refetch: refetchClosures } = useQuery<ScheduleClosure[]>({
    queryKey: ["/api/schedule-closures"],
  });

  // Create closure mutation
  const createClosureMutation = useMutation({
    mutationFn: async (data: InsertScheduleClosure) => {
      const response = await apiRequest("POST", "/api/schedule-closures", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fechamento criado",
        description: "O fechamento da agenda foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-closures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar fechamento",
        description: error.message || "Não foi possível criar o fechamento.",
        variant: "destructive",
      });
    },
  });

  // Delete closure mutation
  const deleteClosureMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/schedule-closures/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Fechamento removido",
        description: "O fechamento da agenda foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule-closures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover fechamento",
        description: error.message || "Não foi possível remover o fechamento.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      dayOfWeek: "",
      specificDate: "",
      reason: "",
    });
    setClosureType("weekly");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: InsertScheduleClosure = {
      closureType,
      ...(closureType === "weekly" && { dayOfWeek: formData.dayOfWeek as any }),
      ...(closureType === "specific_date" && { specificDate: formData.specificDate }),
      reason: formData.reason || undefined,
    };

    createClosureMutation.mutate(data);
  };

  const handleDelete = (closure: ScheduleClosure) => {
    if (window.confirm("Tem certeza que deseja remover este fechamento?")) {
      deleteClosureMutation.mutate(closure.id);
    }
  };

  // Separate closures by type
  const weeklyClosures = closures.filter(c => c.closureType === "weekly");
  const specificDateClosures = closures.filter(c => c.closureType === "specific_date");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            Gestão de Fechamentos
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">Gerencie os dias e datas que sua agenda estará fechada</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 w-full sm:w-auto"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Fechar Agenda
        </Button>
      </div>

      {/* Weekly Closures */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center text-sm sm:text-base">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" />
            Fechamentos Semanais
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {weeklyClosures.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-xs sm:text-sm">Nenhum fechamento semanal configurado</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {weeklyClosures.map((closure) => (
                <div
                  key={closure.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg gap-2 sm:gap-0"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CalendarX className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {getDayName(closure.dayOfWeek!)}
                      </p>
                      {closure.reason && (
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{closure.reason}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(closure)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100 self-end sm:self-center"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specific Date Closures */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center text-sm sm:text-base">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" />
            Fechamentos Específicos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {specificDateClosures.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-xs sm:text-sm">Nenhum fechamento específico configurado</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {specificDateClosures.map((closure) => (
                <div
                  key={closure.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg gap-2 sm:gap-0"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock10 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {formatDate(closure.specificDate!)}
                      </p>
                      {closure.reason && (
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{closure.reason}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(closure)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100 self-end sm:self-center"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Closure Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Fechar Agenda
            </DialogTitle>
            <p className="text-gray-600 text-sm">
              Configure quando sua agenda estará fechada para agendamentos
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Closure Type Selection */}
            <div>
              <Label className="text-gray-700 font-medium text-sm">Tipo de Fechamento</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                <Button
                  type="button"
                  variant={closureType === "weekly" ? "default" : "outline"}
                  className={`flex-1 text-sm ${
                    closureType === "weekly"
                      ? "bg-gradient-to-r from-red-500 to-rose-500"
                      : "border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                  onClick={() => setClosureType("weekly")}
                >
                  Semanal
                </Button>
                <Button
                  type="button"
                  variant={closureType === "specific_date" ? "default" : "outline"}
                  className={`flex-1 text-sm ${
                    closureType === "specific_date"
                      ? "bg-gradient-to-r from-red-500 to-rose-500"
                      : "border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                  onClick={() => setClosureType("specific_date")}
                >
                  Data Específica
                </Button>
              </div>
            </div>

            {/* Weekly Selection */}
            {closureType === "weekly" && (
              <div>
                <Label htmlFor="dayOfWeek" className="text-gray-700 font-medium text-sm">
                  Dia da Semana
                </Label>
                <select
                  id="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  className="w-full mt-1 p-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-red-400"
                  required
                >
                  <option value="">Selecione o dia</option>
                  {weekDays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Specific Date Selection */}
            {closureType === "specific_date" && (
              <div>
                <Label htmlFor="specificDate" className="text-gray-700 font-medium text-sm">
                  Data
                </Label>
                <Input
                  id="specificDate"
                  type="date"
                  value={formData.specificDate}
                  onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
                  required
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <Label htmlFor="reason" className="text-gray-700 font-medium text-sm">
                Motivo (opcional)
              </Label>
              <Input
                id="reason"
                type="text"
                placeholder="Ex: Feriado, Férias, Compromisso pessoal"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="mt-1 text-sm border-gray-200 focus:border-red-400 focus:ring-red-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-sm"
                disabled={createClosureMutation.isPending}
              >
                {createClosureMutation.isPending ? "Criando..." : "Criar Fechamento"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}