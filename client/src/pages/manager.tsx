import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, LogOut, RefreshCw, MessageCircle, User, Clock, Calendar, UserCog, X, Edit, MoreVertical, CalendarX } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ScheduleClosures from "@/components/schedule-closures";
import TimeSlotManagement from "@/components/time-slot-management";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Appointment } from "@shared/schema";

export default function Manager() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState("appointments"); // "appointments" | "closures" | "time-slots"

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false); // Changed default to false
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "", status: "rescheduled" });

  // Cancel confirmation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  // Dropdown state management to fix clicking issues
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [dropdownKeys, setDropdownKeys] = useState<Record<string, number>>({});

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First check localStorage for cached auth status
        const cachedAuth = localStorage.getItem('isManagerAuthenticated');
        if (cachedAuth === 'true') {
          // Validate with server
          const response = await fetch("/api/dashboard/stats", {
            credentials: "include"
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
            setShowLoginModal(false);
            return;
          }
        }
        
        // If no cached auth or validation failed, show login
        setIsAuthenticated(false);
        setShowLoginModal(true);
      } catch (error) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
      }
    };

    checkAuthStatus();
  }, []);

  // Fetch dashboard stats
  const { data: stats = {} } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Fetch appointments for selected date
  const { data: appointments = [], refetch: refetchAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", selectedDate],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Fetch all appointments
  const { data: allAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiRequest("DELETE", `/api/appointments/${appointmentId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o agendamento.",
        variant: "destructive",
      });
    },
  });

  // Reschedule appointment mutation
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { date: string; time: string; status?: string } }) => {
      const response = await apiRequest("PUT", `/api/appointments/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agendamento remarcado",
        description: "O agendamento foi remarcado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setRescheduleForm({ date: "", time: "", status: "rescheduled" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remarcar",
        description: error.message || "Não foi possível remarcar o agendamento.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", loginForm);
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.manager.username}`,
        });
        setIsAuthenticated(true);
        setShowLoginModal(false);
        
        // Store auth status in localStorage for persistence
        localStorage.setItem('isManagerAuthenticated', 'true');
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Credenciais inválidas. Tente: admin/admin",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLoginModal(true);
    setLoginForm({ username: "", password: "" });
    setLocation("/manager");
    
    // Remove auth status from localStorage
    localStorage.removeItem('isManagerAuthenticated');
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove formatting and add country code
    const cleaned = phone.replace(/\D/g, "");
    return `55${cleaned}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
    return format(date, "d 'de' MMMM, yyyy", { locale: ptBR });
  };

  const filterToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
  };

  const filterTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(format(tomorrow, "yyyy-MM-dd"));
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    // Force close dropdown and reset state
    setOpenDropdowns(prev => ({ ...prev, [appointment.id]: false, [`mobile-${appointment.id}`]: false }));

    // Force re-render by updating dropdown key
    setDropdownKeys(prev => ({
      ...prev,
      [appointment.id]: (prev[appointment.id] || 0) + 1,
      [`mobile-${appointment.id}`]: (prev[`mobile-${appointment.id}`] || 0) + 1
    }));

    // Add small delay to ensure dropdown closes properly before showing confirmation modal
    setTimeout(() => {
      setAppointmentToCancel(appointment);
      setShowCancelModal(true);
    }, 100);
  };

  const confirmCancelAppointment = () => {
    if (appointmentToCancel) {
      // Instead of mutation, we'll update the status to cancelled which will hide it
      cancelAppointmentMutation.mutate(appointmentToCancel.id);
      setShowCancelModal(false);
      setAppointmentToCancel(null);
    }
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    // Force close dropdown and reset state
    setOpenDropdowns(prev => ({ ...prev, [appointment.id]: false, [`mobile-${appointment.id}`]: false }));

    // Force re-render by updating dropdown key
    setDropdownKeys(prev => ({
      ...prev,
      [appointment.id]: (prev[appointment.id] || 0) + 1,
      [`mobile-${appointment.id}`]: (prev[`mobile-${appointment.id}`] || 0) + 1
    }));

    // Add small delay to ensure dropdown closes properly before opening modal
    setTimeout(() => {
      setSelectedAppointment(appointment);
      setRescheduleForm({ date: appointment.date, time: appointment.time, status: "rescheduled" });
      setShowRescheduleModal(true);
    }, 100);
  };

  // Helper function to determine appointment status
  const getAppointmentStatus = (appointment: Appointment) => {
    // If cancelled by owner, don't show in table (filtered out)
    if (appointment.status === 'cancelled') {
      return null; // This will be filtered out
    }

    // If rescheduled
    if (appointment.status === 'rescheduled') {
      return 'rescheduled';
    }

    // Check if appointment is overdue (past date/time)
    try {
      const appointmentDate = new Date(appointment.date + 'T' + appointment.time + ':00');
      const now = new Date();

      // Only show as overdue if the appointment date/time has actually passed
      if (appointmentDate < now) {
        return 'overdue'; // Past date/time - show as Pendente/Atendido
      }
    } catch (error) {
      console.warn('Error parsing appointment date/time:', error, appointment);
    }

    // For confirmed status or any future appointments, show as confirmed
    return 'confirmed';
  };

  // Helper function to get status display text and variant
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'rescheduled':
        return { text: 'Remarcado', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' };
      case 'overdue':
        return { text: 'Pendente/Atendido', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' };
      case 'confirmed':
      default:
        return { text: 'Confirmado', variant: 'default' as const, className: 'bg-green-100 text-green-800' };
    }
  };

  // Filter appointments to hide cancelled ones
  const filteredAppointments = appointments?.filter(appointment =>
    appointment.status !== 'cancelled'
  ) || [];
  const handleDropdownOpenChange = (appointmentId: string, isOpen: boolean) => {
    setOpenDropdowns(prev => ({ ...prev, [appointmentId]: isOpen }));

    // If opening, ensure we have a fresh key for this dropdown
    if (isOpen) {
      setDropdownKeys(prev => ({
        ...prev,
        [appointmentId]: (prev[appointmentId] || 0) + 1
      }));
    }
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    rescheduleAppointmentMutation.mutate({
      id: selectedAppointment.id,
      updates: {
        date: rescheduleForm.date,
        time: rescheduleForm.time,
        status: 'rescheduled'
      },
    });
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {isAuthenticated ? (
        <>
          {/* Header */}
          <header className="bg-white/90 backdrop-blur-md border-b border-pink-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-3 sm:py-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg">
                    <img src="/image.png" alt="Um calendario com uma pessoa dentro representando algo sobre salão" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      Painel Gerencial
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600">AgendaFlow Dashboard</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="hidden md:flex items-center space-x-2 bg-pink-50 px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Administrador</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    title="Sair"
                    className="hover:bg-pink-50 hover:text-pink-600 rounded-full"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-3 sm:pt-4 lg:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Hoje</p>
                      <p className="text-lg sm:text-xl lg:text-3xl font-bold text-blue-700">
                        {stats?.todayBookings || 0}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">agendamentos</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-3 sm:pt-4 lg:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-emerald-600 mb-1">Esta Semana</p>
                      <p className="text-lg sm:text-xl lg:text-3xl font-bold text-emerald-700">
                        {stats?.weekBookings || 0}
                      </p>
                      <p className="text-xs text-emerald-500 mt-1">agendamentos</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-3 sm:pt-4 lg:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600 mb-1">Este Mês</p>
                      <p className="text-lg sm:text-xl lg:text-3xl font-bold text-purple-700">
                        {stats?.monthBookings || 0}
                      </p>
                      <p className="text-xs text-purple-500 mt-1">agendamentos</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-3 sm:pt-4 lg:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">Taxa Ocupação</p>
                      <p className="text-lg sm:text-xl lg:text-3xl font-bold text-orange-700">
                        {stats?.occupancyRate || 0}%
                      </p>
                      <p className="text-xs text-orange-500 mt-1">do dia</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 sm:mb-8 bg-gray-100 p-1 rounded-lg">
              <Button
                variant={activeTab === "appointments" ? "default" : "ghost"}
                className={`flex-1 text-sm sm:text-base ${activeTab === "appointments"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"}`}
                onClick={() => setActiveTab("appointments")}
                size="sm"
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="truncate">Agendamentos</span>
              </Button>
              <Button
                variant={activeTab === "closures" ? "default" : "ghost"}
                className={`flex-1 text-sm sm:text-base ${activeTab === "closures"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"}`}
                onClick={() => setActiveTab("closures")}
                size="sm"
              >
                <CalendarX className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="truncate">Fechamentos</span>
              </Button>
              <Button
                variant={activeTab === "time-slots" ? "default" : "ghost"}
                className={`flex-1 text-sm sm:text-base ${activeTab === "time-slots"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600 hover:text-gray-900"}`}
                onClick={() => setActiveTab("time-slots")}
                size="sm"
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="truncate">Horários</span>
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === "appointments" && (
              <>
                {/* Date Filter */}
                <Card className="mb-6 sm:mb-8 bg-white/70 backdrop-blur-sm border-pink-100 shadow-lg">
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                          Agendamentos
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base">Gerencie os horários do seu salão</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={filterToday}
                            variant={selectedDate === format(new Date(), "yyyy-MM-dd") ? "default" : "outline"}
                            size="sm"
                            className={`text-xs sm:text-sm ${selectedDate === format(new Date(), "yyyy-MM-dd")
                              ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                              : "border-pink-200 text-pink-600 hover:bg-pink-50"
                              }`}
                            data-testid="button-filter-today"
                          >
                            Hoje
                          </Button>
                          <Button
                            onClick={filterTomorrow}
                            variant={selectedDate === format(new Date(new Date().setDate(new Date().getDate() + 1)), "yyyy-MM-dd") ? "default" : "outline"}
                            size="sm"
                            className={`text-xs sm:text-sm ${selectedDate === format(new Date(new Date().setDate(new Date().getDate() + 1)), "yyyy-MM-dd")
                              ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                              : "border-pink-200 text-pink-600 hover:bg-pink-50"
                              }`}
                            data-testid="button-filter-tomorrow"
                          >
                            Amanhã
                          </Button>
                          <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-auto min-w-[120px] sm:min-w-[140px] border-pink-200 focus:border-pink-400 focus:ring-pink-400 text-xs sm:text-sm"
                            data-testid="input-select-date"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Appointments List */}
                <Card>
                  <CardHeader className="bg-gray-50 border-b px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <CardTitle className="text-base sm:text-lg truncate">
                        <span className="hidden sm:inline">Agendamentos - {formatDateDisplay(selectedDate)}</span>
                        <span className="sm:hidden">Agendamentos</span>
                      </CardTitle>
                      <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                        {filteredAppointments?.length || 0} agendamentos
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Horário
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cliente
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contato
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                            <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              WhatsApp
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAppointments?.map((appointment: Appointment) => {
                            const appointmentStatus = getAppointmentStatus(appointment);
                            if (!appointmentStatus) return null; // Skip cancelled appointments

                            const statusDisplay = getStatusDisplay(appointmentStatus);

                            return (
                              <tr key={appointment.id} className="hover:bg-gray-50">
                                <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 mr-1 lg:mr-2" />
                                    <span className="text-xs lg:text-sm font-medium text-gray-900">
                                      {appointment.time}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <User className="w-3 h-3 lg:w-4 lg:h-4 text-gray-400 mr-1 lg:mr-2" />
                                    <span className="text-xs lg:text-sm font-medium text-gray-900 truncate max-w-[120px] lg:max-w-none">
                                      {appointment.clientName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                  <span className="text-xs lg:text-sm text-gray-900">
                                    {appointment.clientPhone}
                                  </span>
                                </td>
                                <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                  <Badge
                                    className={`text-xs ${statusDisplay.className}`}
                                  >
                                    {statusDisplay.text}
                                  </Badge>
                                </td>
                                <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-left">
                                  <DropdownMenu
                                    key={`desktop-${appointment.id}-${dropdownKeys[appointment.id] || 0}`}
                                    open={openDropdowns[appointment.id] || false}
                                    onOpenChange={(isOpen) => handleDropdownOpenChange(appointment.id, isOpen)}
                                  >
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 lg:h-8 lg:w-8 p-0 hover:bg-gray-100"
                                        data-testid={`actions-${appointment.id}`}
                                      >
                                        <MoreVertical className="w-3 h-3 lg:w-4 lg:h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-32 lg:w-40">
                                      <DropdownMenuItem
                                        className="cursor-pointer hover:bg-blue-50"
                                        data-testid={`reschedule-${appointment.id}`}
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          handleRescheduleAppointment(appointment);
                                        }}
                                      >
                                        <Edit className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2 text-blue-600" />
                                        <span className="text-blue-600 text-xs lg:text-sm">Remarcar</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="cursor-pointer hover:bg-red-50"
                                        data-testid={`cancel-${appointment.id}`}
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          handleCancelAppointment(appointment);
                                        }}
                                      >
                                        <X className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2 text-red-600" />
                                        <span className="text-red-600 text-xs lg:text-sm">Cancelar</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                                <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-left">
                                  <Button
                                    asChild
                                    size="sm"
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg transition-all duration-200 text-xs lg:text-sm px-2 lg:px-3"
                                    data-testid={`whatsapp-${appointment.id}`}
                                  >
                                    <a
                                      href={`https://wa.me/${formatPhoneForWhatsApp(appointment.clientPhone)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <MessageCircle className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                      <span className="hidden lg:inline">WhatsApp</span>
                                      <span className="lg:hidden">WA</span>
                                    </a>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Tablet and Mobile Card View */}
                    <div className="lg:hidden divide-y divide-gray-200">
                      {filteredAppointments?.map((appointment: Appointment) => {
                        const appointmentStatus = getAppointmentStatus(appointment);
                        if (!appointmentStatus) return null; // Skip cancelled appointments

                        const statusDisplay = getStatusDisplay(appointmentStatus);

                        return (
                          <div key={appointment.id} className="p-3 sm:p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm sm:text-base font-medium text-gray-900">
                                  {appointment.time}
                                </span>
                              </div>
                              <Badge
                                className={`text-xs ${statusDisplay.className}`}
                              >
                                {statusDisplay.text}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm sm:text-base text-gray-900 truncate">
                                  {appointment.clientName}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <MessageCircle className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600">
                                  {appointment.clientPhone}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center space-x-2">
                                  <DropdownMenu
                                    key={`mobile-${appointment.id}-${dropdownKeys[`mobile-${appointment.id}`] || 0}`}
                                    open={openDropdowns[`mobile-${appointment.id}`] || false}
                                    onOpenChange={(isOpen) => handleDropdownOpenChange(`mobile-${appointment.id}`, isOpen)}
                                  >
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-gray-100"
                                        data-testid={`actions-mobile-${appointment.id}`}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-40">
                                      <DropdownMenuItem
                                        className="cursor-pointer hover:bg-blue-50"
                                        data-testid={`reschedule-mobile-${appointment.id}`}
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          handleRescheduleAppointment(appointment);
                                        }}
                                      >
                                        <Edit className="w-4 h-4 mr-2 text-blue-600" />
                                        <span className="text-blue-600">Remarcar</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="cursor-pointer hover:bg-red-50"
                                        data-testid={`cancel-mobile-${appointment.id}`}
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          handleCancelAppointment(appointment);
                                        }}
                                      >
                                        <X className="w-4 h-4 mr-2 text-red-600" />
                                        <span className="text-red-600">Cancelar</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <span className="text-xs text-gray-500">Ações</span>
                                </div>
                                <Button
                                  asChild
                                  size="sm"
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                                  data-testid={`whatsapp-mobile-${appointment.id}`}
                                >
                                  <a
                                    href={`https://wa.me/${formatPhoneForWhatsApp(appointment.clientPhone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">WhatsApp</span>
                                    <span className="sm:hidden">WA</span>
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Empty State */}
                    {(!filteredAppointments || filteredAppointments.length === 0) && (
                      <div className="p-6 sm:p-8 text-center">
                        <CalendarIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                          Nenhum agendamento encontrado
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500">
                          Não há agendamentos para esta data.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "closures" && (
              <ScheduleClosures />
            )}

            {activeTab === "time-slots" && (
              <TimeSlotManagement />
            )}
          </div>
        </>
      ) : (
        // Show a minimal loading/authentication screen when not authenticated
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCog className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Acesso Restrito</h2>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Remarcar Agendamento
            </DialogTitle>
            <p className="text-sm sm:text-base text-gray-600">
              {selectedAppointment ? `Remarcando agendamento de ${selectedAppointment.clientName}` : ""}
            </p>
          </DialogHeader>

          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reschedule-date" className="text-sm sm:text-base text-gray-700 font-medium">Nova Data</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleForm.date}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                min={format(new Date(), "yyyy-MM-dd")}
                className="mt-1 border-gray-200 focus:border-pink-400 focus:ring-pink-400 text-sm sm:text-base"
                required
                data-testid="input-reschedule-date"
              />
            </div>

            <div>
              <Label htmlFor="reschedule-time" className="text-sm sm:text-base text-gray-700 font-medium">Novo Horário</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleForm.time}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                className="mt-1 border-gray-200 focus:border-pink-400 focus:ring-pink-400 text-sm sm:text-base"
                required
                data-testid="input-reschedule-time"
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base py-2 sm:py-3"
                data-testid="button-cancel-reschedule"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-sm sm:text-base py-2 sm:py-3"
                disabled={rescheduleAppointmentMutation.isPending}
                data-testid="button-confirm-reschedule"
              >
                {rescheduleAppointmentMutation.isPending ? "Remarcando..." : "Confirmar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Confirmar Cancelamento
            </DialogTitle>
            <p className="text-sm sm:text-base text-gray-600">
              {appointmentToCancel ?
                `Tem certeza que deseja cancelar o agendamento de ${appointmentToCancel.clientName} para ${appointmentToCancel.time}?` :
                "Tem certeza que deseja cancelar este agendamento?"
              }
            </p>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setAppointmentToCancel(null);
              }}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base py-2 sm:py-3"
              data-testid="button-cancel-confirmation"
            >
              Não, manter
            </Button>
            <Button
              type="button"
              onClick={confirmCancelAppointment}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm sm:text-base py-2 sm:py-3"
              disabled={cancelAppointmentMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelAppointmentMutation.isPending ? "Cancelando..." : "Sim, cancelar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={() => { }} modal={true}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-md mx-2 sm:mx-4" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="text-center mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <UserCog className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                Acesso do Gerente
              </DialogTitle>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Digite suas credenciais para continuar
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm sm:text-base text-gray-700">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="mt-1 text-sm sm:text-base py-2 sm:py-3"
                required
                data-testid="input-username"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm sm:text-base text-gray-700">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="mt-1 text-sm sm:text-base py-2 sm:py-3"
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-sm sm:text-base py-2 sm:py-3"
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              {isLoggingIn ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
