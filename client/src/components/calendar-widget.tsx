import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarWidgetProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export default function CalendarWidget({ selectedDate, onDateSelect }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    while (days.length < 42) { // 6 weeks * 7 days
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only allow future dates (starting from today)
    return date >= today;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isSelected = (date: Date) => {
    return selectedDate === formatDateForInput(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="bg-white border border-pink-100 rounded-xl p-4 sm:p-6 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth('prev')}
          className="hover:bg-pink-50 hover:text-pink-600 rounded-full h-8 w-8 sm:h-10 sm:w-10"
          data-testid="button-prev-month"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 text-center flex-1 px-2">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth('next')}
          className="hover:bg-pink-50 hover:text-pink-600 rounded-full h-8 w-8 sm:h-10 sm:w-10"
          data-testid="button-next-month"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
        {/* Days of week header */}
        {daysOfWeek.map((day) => (
          <div key={day} className="py-2 sm:py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((date, index) => {
          const isAvailable = isDateAvailable(date);
          const isCurrent = isCurrentMonth(date);
          const isSelectedDate = isSelected(date);
          const isTodayDate = isToday(date);
          
          return (
            <button
              key={index}
              onClick={() => isAvailable && isCurrent && onDateSelect(formatDateForInput(date))}
              disabled={!isAvailable || !isCurrent}
              className={`
                aspect-square p-1 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm font-medium relative
                ${isSelectedDate 
                  ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg scale-105' 
                  : isTodayDate && isCurrent
                    ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-300 text-blue-800 font-bold shadow-md hover:from-blue-200 hover:to-indigo-200 hover:scale-105'
                    : isAvailable && isCurrent
                      ? 'hover:bg-gradient-to-br hover:from-pink-100 hover:to-rose-100 hover:text-pink-700 text-gray-700 hover:scale-105'
                      : 'text-gray-300 cursor-not-allowed'
                }
                ${!isCurrent ? 'opacity-30' : ''}
              `}
              data-testid={`calendar-day-${date.getDate()}`}
            >
              {date.getDate()}
              {isTodayDate && isCurrent && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
              {isSelectedDate && (
                <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 sm:mt-4 text-center space-y-2">
        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-600 font-medium">Hoje</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span className="text-pink-600 font-medium">Selecionado</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Selecione uma data disponível para continuar
        </p>
      </div>
    </div>
  );
}
