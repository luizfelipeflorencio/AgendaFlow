import { useState } from "react";
import { CalendarCheck, UserCog, Sparkles, Clock, Star } from "lucide-react";
import { useLocation } from "wouter";
import BookingForm from "@/components/booking-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
        setShowLoginModal(false);
        setLocation("/manager");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Beauty Studio
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">Agendamento Online</p>
              </div>
            </div>
            <Button
              onClick={() => setShowLoginModal(true)}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-pink-600 text-xs sm:text-sm"
            >
              <UserCog className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Acesso </span>Gerente
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 via-transparent to-rose-100/50"></div>
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-8 sm:pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                  <CalendarCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-800" />
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Agende seu{" "}
              <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Horário
              </span>
            </h1>
            
            <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-2">
              Reserve seu atendimento de beleza de forma rápida e fácil. 
              <br className="hidden sm:block" />
              Profissionais qualificados, horários flexíveis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-xs sm:text-sm text-gray-500 mb-8 sm:mb-12">
              <div className="flex items-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-pink-500" />
                Agendamento Rápido
              </div>
              <div className="flex items-center">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-pink-500" />
                Profissionais Qualificados
              </div>
              <div className="flex items-center">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-pink-500" />
                Experiência Premium
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Section */}
      <div className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 sm:px-8 py-4 sm:py-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center">
              Reserve Seu Horário
            </h2>
            <p className="text-pink-100 text-center mt-1 sm:mt-2 text-sm sm:text-base">
              Preencha os dados abaixo para agendar
            </p>
          </div>
          
          <div className="p-4 sm:p-8">
            <BookingForm />
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="w-full max-w-md mx-4">
          <DialogHeader>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCog className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Acesso do Gerente
              </DialogTitle>
              <p className="text-gray-600 mt-2">
                Digite suas credenciais para continuar
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-gray-700">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="mt-1"
                required
                data-testid="input-username"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-gray-700">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="mt-1"
                required
                data-testid="input-password"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              {isLoggingIn ? "Entrando..." : "Entrar"}
            </Button>
            
            <Button 
              type="button"
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-800"
              onClick={() => setShowLoginModal(false)}
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-center text-xs text-gray-500">
              Para testar: usuário <strong className="text-pink-600">admin</strong>, senha <strong className="text-pink-600">admin</strong>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
