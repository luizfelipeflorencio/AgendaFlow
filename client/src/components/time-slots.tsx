import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarX } from "lucide-react";
import type { TimeSlot } from "@shared/schema";

interface TimeSlotsProps {
  selectedDate: string;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

export default function TimeSlots({ selectedDate, selectedTime, onTimeSelect }: TimeSlotsProps) {
  const { data: availableSlots = [], isLoading } = useQuery<TimeSlot[]>({
    queryKey: ["/api/available-slots", selectedDate],
    enabled: !!selectedDate,
  });

  // Check if date is closed
  const { data: closureCheck } = useQuery<{ isClosed: boolean }>({
    queryKey: ["/api/schedule-closures/check", selectedDate],
    enabled: !!selectedDate,
  });

  const isToday = (dateStr: string) => {
    const today = new Date();
    const selectedDateObj = new Date(dateStr + 'T00:00:00');
    return today.toDateString() === selectedDateObj.toDateString();
  };

  const isTimeSlotPassed = (slotTime: string) => {
    if (!isToday(selectedDate)) {
      return false; // If it's not today, no time slot has passed
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const [slotHour, slotMinute] = slotTime.split(':').map(num => parseInt(num));
    
    // If slot hour is less than current hour, it has passed
    if (slotHour < currentHour) {
      return true;
    }
    
    // If slot hour is the same as current hour, check minutes
    if (slotHour === currentHour && slotMinute <= currentMinute) {
      return true;
    }
    
    return false;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Carregando horários...</h4>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // If date is closed, show closure message
  if (closureCheck?.isClosed) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarX className="w-8 h-8 text-red-600" />
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          Agenda Fechada
        </h4>
        <p className="text-gray-500">
          A agenda não está disponível para agendamentos nesta data.
        </p>
      </div>
    );
  }

  if (!availableSlots || availableSlots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum horário disponível para esta data.</p>
      </div>
    );
  }

  // Group slots by period and filter out passed slots for today
  const filterAvailableSlots = (slots: TimeSlot[]) => {
    return slots.filter(slot => !isTimeSlotPassed(slot.slotTime));
  };

  const filteredSlots = filterAvailableSlots(availableSlots);

  const morningSlots = filteredSlots.filter((slot: TimeSlot) => {
    const hour = parseInt(slot.slotTime.split(':')[0]);
    return hour < 12;
  });

  const afternoonSlots = filteredSlots.filter((slot: TimeSlot) => {
    const hour = parseInt(slot.slotTime.split(':')[0]);
    return hour >= 12;
  });

  const renderTimeSlot = (slot: TimeSlot) => {
    const isPassed = isTimeSlotPassed(slot.slotTime);
    
    return (
      <Button
        key={slot.id}
        variant={selectedTime === slot.slotTime ? "default" : "outline"}
        className={`
          p-2 sm:p-3 lg:p-4 h-12 sm:h-14 lg:h-auto flex flex-col justify-center transition-all duration-300 relative overflow-hidden
          ${selectedTime === slot.slotTime 
            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white border-pink-500 shadow-lg scale-105' 
            : isPassed
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-pink-200 hover:border-pink-400 hover:bg-pink-50 text-gray-700 hover:scale-105'
          }
        `}
        onClick={() => !isPassed && onTimeSelect(slot.slotTime)}
        disabled={isPassed}
        data-testid={`time-slot-${slot.slotTime}`}
      >
        <div className="text-sm sm:text-base lg:text-lg font-semibold">{slot.slotTime}</div>
        {isPassed && (
          <div className="text-xs opacity-70 mt-1">Indisponível</div>
        )}
        {selectedTime === slot.slotTime && !isPassed && (
          <>
            <div className="text-xs opacity-90 mt-1">Selecionado</div>
            <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {morningSlots.length > 0 && (
        <div>
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mr-2 sm:mr-3">
              <span className="text-white text-xs sm:text-sm font-bold">☀</span>
            </div>
            <h4 className="text-base sm:text-lg font-semibold text-gray-800">Manhã</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            {morningSlots.map(renderTimeSlot)}
          </div>
        </div>
      )}

      {afternoonSlots.length > 0 && (
        <div>
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center mr-2 sm:mr-3">
              <span className="text-white text-xs sm:text-sm font-bold">☾</span>
            </div>
            <h4 className="text-base sm:text-lg font-semibold text-gray-800">Tarde</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            {afternoonSlots.map(renderTimeSlot)}
          </div>
        </div>
      )}

      {(!morningSlots.length && !afternoonSlots.length) && (
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-lg sm:text-2xl">😞</span>
          </div>
          <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2">
            {isToday(selectedDate) ? 'Nenhum horário disponível hoje' : 'Nenhum horário disponível'}
          </h4>
          <p className="text-gray-500 text-sm">
            {isToday(selectedDate) 
              ? 'Os horários de hoje já passaram. Tente selecionar outra data.' 
              : 'Tente selecionar outra data'
            }
          </p>
        </div>
      )}
    </div>
  );
}
