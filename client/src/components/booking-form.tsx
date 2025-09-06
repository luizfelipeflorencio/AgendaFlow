import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Check, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CalendarWidget from "./calendar-widget";
import TimeSlots from "./time-slots";
import PhoneInput from "./phone-input";
import type { InsertAppointment } from "@shared/schema";

export default function BookingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    date: "",
    time: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if selected date is closed
  const { data: closureCheck } = useQuery<{ isClosed: boolean }>({
    queryKey: ["/api/schedule-closures/check", formData.date],
    enabled: !!formData.date,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: InsertAppointment) => {
      const response = await apiRequest("POST", "/api/appointments", data);
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no agendamento",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const nextStep = (step: number) => {
    if (step === 2 && (!formData.clientName || !formData.clientPhone)) {
      toast({
        title: "Dados obrigatórios",
        description: "Por favor, preencha nome e telefone.",
        variant: "destructive",
      });
      return;
    }

    if (step === 3 && !formData.date) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione uma data.",
        variant: "destructive",
      });
      return;
    }

    if (step === 3 && closureCheck?.isClosed) {
      toast({
        title: "Data indisponível",
        description: "A agenda está fechada para a data selecionada. Por favor, escolha outra data.",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(step);
  };

  const confirmBooking = () => {
    if (!formData.time) {
      toast({
        title: "Horário obrigatório",
        description: "Por favor, selecione um horário.",
        variant: "destructive",
      });
      return;
    }

    if (closureCheck?.isClosed) {
      toast({
        title: "Data indisponível",
        description: "A agenda está fechada para a data selecionada. Por favor, escolha outra data.",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate({
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      date: formData.date,
      time: formData.time,
      status: "confirmed",
    });
  };

  const newBooking = () => {
    setFormData({
      clientName: "",
      clientPhone: "",
      date: "",
      time: "",
    });
    setCurrentStep(1);
    setShowSuccess(false);
  };

  const closeSuccessModal = () => {
    setShowSuccess(false);
    setFormData({
      clientName: "",
      clientPhone: "",
      date: "",
      time: "",
    });
    setCurrentStep(1);
  };

  const formatDateDisplay = (dateStr: string) => {
    // Parse date string as YYYY-MM-DD and create date in local timezone
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
    const date = new Date(year, month - 1, day); // month is 0-indexed

    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8 px-4">
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
          <div className="flex items-center flex-shrink-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${currentStep >= 1 ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'} rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300`}>
              1
            </div>
            <span className={`ml-2 sm:ml-3 text-xs sm:text-sm font-medium ${currentStep >= 1 ? 'text-gray-800' : 'text-gray-500'} transition-colors duration-300 whitespace-nowrap`}>
              Dados
            </span>
          </div>
          <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 2 ? 'bg-gradient-to-r from-pink-400 to-rose-400' : 'bg-gray-300'} transition-all duration-300 flex-shrink-0`}></div>
          <div className="flex items-center flex-shrink-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${currentStep >= 2 ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'} rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300`}>
              2
            </div>
            <span className={`ml-2 sm:ml-3 text-xs sm:text-sm font-medium ${currentStep >= 2 ? 'text-gray-800' : 'text-gray-500'} transition-colors duration-300 whitespace-nowrap`}>
              Data
            </span>
          </div>
          <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 3 ? 'bg-gradient-to-r from-pink-400 to-rose-400' : 'bg-gray-300'} transition-all duration-300 flex-shrink-0`}></div>
          <div className="flex items-center flex-shrink-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${currentStep >= 3 ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'} rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300`}>
              3
            </div>
            <span className={`ml-2 sm:ml-3 text-xs sm:text-sm font-medium ${currentStep >= 3 ? 'text-gray-800' : 'text-gray-500'} transition-colors duration-300 whitespace-nowrap`}>
              Horário
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Contact Information */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Seus Dados</h3>
            <p className="text-gray-600">Para confirmarmos seu agendamento</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName" className="text-gray-700 font-medium">Nome completo</Label>
              <Input
                id="clientName"
                type="text"
                placeholder="Digite seu nome completo"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="mt-1 border-gray-200 focus:border-pink-400 focus:ring-pink-400"
                data-testid="input-client-name"
              />
            </div>

            <div>
              <Label htmlFor="clientPhone" className="text-gray-700 font-medium">WhatsApp</Label>
              <PhoneInput
                value={formData.clientPhone}
                onChange={(value) => setFormData({ ...formData, clientPhone: value })}
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Usado apenas para confirmação do agendamento
              </p>
            </div>
          </div>

          <Button
            onClick={() => nextStep(2)}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 h-12 text-base font-medium"
            data-testid="button-continue-step1"
          >
            Continuar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 2: Date Selection */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => nextStep(1)}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                data-testid="button-back-step2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div className="text-center flex-1 px-2">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Escolha a Data</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Selecione o dia do seu atendimento</p>
              </div>
              <div className="w-16 sm:w-20 flex-shrink-0"></div>
            </div>
          </div>

          <CalendarWidget
            selectedDate={formData.date}
            onDateSelect={(date) => setFormData({ ...formData, date })}
          />

          {formData.date && (
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 p-4 rounded-xl">
              <div className="flex items-center justify-center">
                <Check className="w-5 h-5 text-pink-600 mr-3" />
                <span className="text-gray-800 font-medium">
                  Data selecionada: {formatDateDisplay(formData.date)}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={() => nextStep(3)}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 h-12 text-base font-medium"
            disabled={!formData.date || closureCheck?.isClosed}
            data-testid="button-continue-step2"
          >
            Ver Horários Disponíveis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Step 3: Time Selection */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => nextStep(2)}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                data-testid="button-back-step3"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <div className="text-center flex-1 px-2">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Escolha o Horário</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Selecione o melhor horário para você</p>
              </div>
              <div className="w-16 sm:w-20 flex-shrink-0"></div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 p-4 rounded-xl mb-6">
            <div className="flex items-center justify-center">
              <Check className="w-5 h-5 text-pink-600 mr-3" />
              <span className="text-gray-800 font-medium">
                {formatDateDisplay(formData.date)}
              </span>
            </div>
          </div>

          <TimeSlots
            selectedDate={formData.date}
            selectedTime={formData.time}
            onTimeSelect={(time) => setFormData({ ...formData, time })}
          />

          <Button
            onClick={confirmBooking}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 h-12 text-base font-medium shadow-lg"
            disabled={!formData.time || createAppointmentMutation.isPending}
            data-testid="button-confirm-booking"
          >
            {createAppointmentMutation.isPending ? (
              <>Confirmando...</>
            ) : (
              <>
                Confirmar Agendamento
                <Check className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={closeSuccessModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <div className="text-center mb-3 sm:mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Agendamento Confirmado!
              </DialogTitle>
              <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-4">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                <p className="text-gray-600 text-sm sm:text-base">Seu horário foi reservado com sucesso</p>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 sm:p-6 rounded-xl">
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1 sm:py-2 border-b border-green-200">
                  <span className="font-medium text-gray-700">Nome:</span>
                  <span className="text-gray-900 font-semibold text-right">{formData.clientName}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 border-b border-green-200">
                  <span className="font-medium text-gray-700">Data:</span>
                  <span className="text-gray-900 font-semibold text-right">{formatDateDisplay(formData.date)}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2 border-b border-green-200">
                  <span className="font-medium text-gray-700">Horário:</span>
                  <span className="text-gray-900 font-semibold text-right">{formData.time}</span>
                </div>
                <div className="flex justify-between items-center py-1 sm:py-2">
                  <span className="font-medium text-gray-700">WhatsApp:</span>
                  <span className="text-gray-900 font-semibold text-right">{formData.clientPhone}</span>
                </div>
              </div>
            </div>

            {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 sm:p-4 rounded-xl">
              <p className="text-blue-800 text-xs sm:text-sm flex items-center justify-center font-medium">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                Você receberá uma confirmação em breve!
              </p>
            </div> */}

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={newBooking}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 h-10 sm:h-12 text-sm sm:text-base"
                data-testid="button-new-booking"
              >
                Novo Agendamento
              </Button>
              <Button
                onClick={closeSuccessModal}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-10 sm:h-12 text-sm sm:text-base"
                data-testid="button-close-modal"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
