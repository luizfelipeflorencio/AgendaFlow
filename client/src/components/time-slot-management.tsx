import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Trash2, CalendarClock, Timer, Eye, EyeOff, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TimeSlot, InsertTimeSlot, TimeSlotBlock } from "@shared/schema";

export default function TimeSlotManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteTimeSlotModal, setShowDeleteTimeSlotModal] = useState(false);
  const [showDeleteBlockModal, setShowDeleteBlockModal] = useState(false);
  const [timeSlotToDelete, setTimeSlotToDelete] = useState<TimeSlot | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<TimeSlotBlock | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [blockForm, setBlockForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: "",
    reason: ""
  });
  
  // Collapsible states
  const [showAllTimeSlots, setShowAllTimeSlots] = useState(true);
  const [showAvailableSlots, setShowAvailableSlots] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all time slots
  const { data: allTimeSlots = [] } = useQuery<TimeSlot[]>({
    queryKey: ["/api/time-slots"],
  });

  // Fetch available slots for selected date
  const { data: availableSlots = [] } = useQuery<TimeSlot[]>({
    queryKey: ["/api/available-slots", selectedDate],
    enabled: !!selectedDate,
  });

  // Fetch time slot blocks for selected date
  const { data: timeSlotBlocks = [] } = useQuery<TimeSlotBlock[]>({
    queryKey: ["/api/time-slot-blocks", selectedDate],
    enabled: !!selectedDate,
  });

  // Create time slot mutation
  const createTimeSlotMutation = useMutation({
    mutationFn: async (data: InsertTimeSlot) => {
      const response = await apiRequest("POST", "/api/time-slots", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Horário adicionado",
        description: "O novo horário foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
      setShowAddModal(false);
      setNewTimeSlot("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar horário",
        description: error.message || "Não foi possível adicionar o horário.",
        variant: "destructive",
      });
    },
  });

  // Update time slot (toggle active status)
  const toggleTimeSlotMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/time-slots/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Horário atualizado",
        description: "O status do horário foi alterado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar horário",
        description: error.message || "Não foi possível atualizar o horário.",
        variant: "destructive",
      });
    },
  });

  // Delete time slot mutation
  const deleteTimeSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/time-slots/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Horário removido",
        description: "O horário foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover horário",
        description: error.message || "Não foi possível remover o horário.",
        variant: "destructive",
      });
    },
  });

  // Create time slot block mutation
  const createBlockMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/time-slot-blocks", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bloqueio criado",
        description: "O bloqueio de horário foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-slot-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
      setShowBlockModal(false);
      setBlockForm({
        date: new Date().toISOString().split('T')[0],
        time: "",
        reason: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar bloqueio",
        description: error.message || "Não foi possível criar o bloqueio.",
        variant: "destructive",
      });
    },
  });

  // Delete time slot block mutation
  const deleteBlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/time-slot-blocks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bloqueio removido",
        description: "O bloqueio de horário foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-slot-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover bloqueio",
        description: error.message || "Não foi possível remover o bloqueio.",
        variant: "destructive",
      });
    },
  });

  const handleAddTimeSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeSlot) return;
    
    createTimeSlotMutation.mutate({
      slotTime: newTimeSlot,
      isActive: true,
    });
  };

  const handleToggleTimeSlot = (timeSlot: TimeSlot) => {
    toggleTimeSlotMutation.mutate({
      id: timeSlot.id,
      isActive: !timeSlot.isActive,
    });
  };

  const handleDeleteTimeSlot = (timeSlot: TimeSlot) => {
    setTimeSlotToDelete(timeSlot);
    setShowDeleteTimeSlotModal(true);
  };

  const confirmDeleteTimeSlot = () => {
    if (timeSlotToDelete) {
      deleteTimeSlotMutation.mutate(timeSlotToDelete.id);
      setShowDeleteTimeSlotModal(false);
      setTimeSlotToDelete(null);
    }
  };

  const handleBlockTimeSlot = (time: string) => {
    setBlockForm({
      ...blockForm,
      date: selectedDate,
      time: time
    });
    setShowBlockModal(true);
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate end time by adding 30 minutes to the start time
    const [hours, minutes] = blockForm.time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + 30 * 60000); // Add 30 minutes
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    
    createBlockMutation.mutate({
      specificDate: blockForm.date,
      startTime: blockForm.time,
      endTime: endTime,
      reason: blockForm.reason || undefined
    });
  };

  const handleDeleteBlock = (block: TimeSlotBlock) => {
    setBlockToDelete(block);
    setShowDeleteBlockModal(true);
  };

  const confirmDeleteBlock = () => {
    if (blockToDelete) {
      deleteBlockMutation.mutate(blockToDelete.id);
      setShowDeleteBlockModal(false);
      setBlockToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Gestão de Horários
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            Gerencie seus horários de atendimento e bloqueios temporários
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 w-full sm:w-auto"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Horário
        </Button>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
              Visualizar Horários por Data
            </CardTitle>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-auto border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Time Slot Blocks for Selected Date */}
      {timeSlotBlocks.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center text-sm sm:text-base">
              <Timer className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" />
              Bloqueios Temporários em {selectedDate.split('-').reverse().join('/')}
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                {timeSlotBlocks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-2">
              {timeSlotBlocks
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <Timer className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">
                          {block.startTime}
                        </span>
                        {block.reason && (
                          <p className="text-xs text-gray-600 truncate max-w-[200px]">
                            {block.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBlock(block)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Time Slots */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle 
              className="flex items-center justify-between text-sm sm:text-base cursor-pointer"
              onClick={() => setShowAllTimeSlots(!showAllTimeSlots)}
            >
              <div className="flex items-center">
                <Timer className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                Todos os Horários
                <Badge variant="secondary" className="ml-2">
                  {allTimeSlots.length}
                </Badge>
              </div>
              {showAllTimeSlots ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </CardTitle>
          </CardHeader>
          {showAllTimeSlots && (
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="space-y-2">
                {allTimeSlots
                  .sort((a, b) => a.slotTime.localeCompare(b.slotTime))
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        slot.isActive
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            slot.isActive
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {slot.isActive ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {slot.slotTime}
                        </span>
                        <Badge
                          variant={slot.isActive ? "default" : "secondary"}
                          className={`text-xs ${
                            slot.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {slot.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTimeSlot(slot)}
                          className={`text-xs ${
                            slot.isActive
                              ? "text-red-600 hover:text-red-700 hover:bg-red-100"
                              : "text-green-600 hover:text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {slot.isActive ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTimeSlot(slot)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Available Slots for Selected Date */}
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle 
              className="flex items-center justify-between text-sm sm:text-base cursor-pointer"
              onClick={() => setShowAvailableSlots(!showAvailableSlots)}
            >
              <div className="flex items-center">
                <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                Disponíveis em {selectedDate.split('-').reverse().join('/')}
                <Badge variant="secondary" className="ml-2">
                  {availableSlots.length}
                </Badge>
              </div>
              {showAvailableSlots ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </CardTitle>
          </CardHeader>
          {showAvailableSlots && (
            <CardContent className="p-3 sm:p-6 pt-0">
              {availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum horário disponível para esta data
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableSlots
                    .sort((a, b) => a.slotTime.localeCompare(b.slotTime))
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Timer className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {slot.slotTime}
                          </span>
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            Disponível
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBlockTimeSlot(slot.slotTime)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 text-xs"
                        >
                          Bloquear
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Add Time Slot Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Adicionar Novo Horário
            </DialogTitle>
            <p className="text-gray-600 text-sm">
              Adicione um novo horário à sua agenda de atendimento
            </p>
          </DialogHeader>

          <form onSubmit={handleAddTimeSlot} className="space-y-4">
            <div>
              <Label htmlFor="newTimeSlot" className="text-gray-700 font-medium text-sm">
                Horário
              </Label>
              <Input
                id="newTimeSlot"
                type="time"
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                className="mt-1 text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setNewTimeSlot("");
                }}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-sm"
                disabled={createTimeSlotMutation.isPending}
              >
                {createTimeSlotMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Block Time Slot Confirmation Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Confirmar Bloqueio de Horário
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Você tem certeza que deseja bloquear o horário {blockForm.time} na data {blockForm.date.split('-').reverse().join('/')}?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBlockModal(false);
                setBlockForm({
                  date: new Date().toISOString().split('T')[0],
                  time: "",
                  reason: ""
                });
              }}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateBlock}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm"
              disabled={createBlockMutation.isPending}
            >
              {createBlockMutation.isPending ? "Bloqueando..." : "Confirmar Bloqueio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Time Slot Confirmation Modal */}
      <Dialog open={showDeleteTimeSlotModal} onOpenChange={setShowDeleteTimeSlotModal}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Confirmar Exclusão de Horário
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              {timeSlotToDelete && `Você tem certeza que deseja remover o horário ${timeSlotToDelete.slotTime}?`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteTimeSlotModal(false);
                setTimeSlotToDelete(null);
              }}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteTimeSlot}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm"
              disabled={deleteTimeSlotMutation.isPending}
            >
              {deleteTimeSlotMutation.isPending ? "Removendo..." : "Confirmar Exclusão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Block Confirmation Modal */}
      <Dialog open={showDeleteBlockModal} onOpenChange={setShowDeleteBlockModal}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Confirmar Remoção de Bloqueio
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              {blockToDelete && `Você tem certeza que deseja remover o bloqueio de horário ${blockToDelete.startTime}?`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteBlockModal(false);
                setBlockToDelete(null);
              }}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteBlock}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm"
              disabled={deleteBlockMutation.isPending}
            >
              {deleteBlockMutation.isPending ? "Removendo..." : "Confirmar Remoção"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}