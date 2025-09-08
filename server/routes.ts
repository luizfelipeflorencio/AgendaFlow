import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertAppointmentSchema, loginSchema, insertScheduleClosureSchema, insertTimeSlotBlockSchema, insertTimeSlotSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const storage = await getStorage();
      const appointmentData = insertAppointmentSchema.parse(req.body);
      
      // Check if time slot is already booked
      const existingAppointment = await storage.getAppointmentByDateTime(
        appointmentData.date,
        appointmentData.time
      );
      
      if (existingAppointment) {
        return res.status(409).json({ 
          message: "Este horário já está ocupado. Por favor, escolha outro horário." 
        });
      }
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get appointments by date
  app.get("/api/appointments/:date", async (req, res) => {
    try {
      const storage = await getStorage();
      const { date } = req.params;
      const appointments = await storage.getAppointmentsByDate(date);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get all appointments (for manager)
  app.get("/api/appointments", async (req, res) => {
    try {
      const storage = await getStorage();
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update appointment
  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const updates = req.body;
      
      // Validate updates if needed
      if (updates.date && updates.time) {
        // Check if new time slot is available (if changing date/time)
        const existingAppointment = await storage.getAppointmentByDateTime(
          updates.date,
          updates.time
        );
        
        if (existingAppointment && existingAppointment.id !== id) {
          return res.status(409).json({ 
            message: "Este horário já está ocupado. Por favor, escolha outro horário." 
          });
        }
      }
      
      const updatedAppointment = await storage.updateAppointment(id, updates);
      
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Cancel appointment
  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      
      const success = await storage.cancelAppointment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      
      res.json({ message: "Agendamento cancelado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get available time slots for a date
  app.get("/api/available-slots/:date", async (req, res) => {
    try {
      const storage = await getStorage();
      const { date } = req.params;
      
      // Check if the date is closed
      const isClosed = await storage.isDateClosed(date);
      if (isClosed) {
        return res.json([]); // Return empty array if date is closed
      }
      
      // Get all active time slots
      const allSlots = await storage.getActiveTimeSlots();
      
      // Get booked appointments for this date
      const bookedAppointments = await storage.getAppointmentsByDate(date);
      const bookedTimes = bookedAppointments.map((apt: any) => apt.time);
      
      // Filter out booked slots and blocked time slots
      const availableSlots = [];
      for (const slot of allSlots) {
        // Skip if slot is already booked
        if (bookedTimes.includes(slot.slotTime)) {
          continue;
        }
        
        // Skip if slot is blocked by time slot blocks
        const isBlocked = await storage.isTimeSlotBlocked(date, slot.slotTime);
        if (isBlocked) {
          continue;
        }
        
        availableSlots.push(slot);
      }
      
      res.json(availableSlots);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Manager login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const storage = await getStorage();
      const loginData = loginSchema.parse(req.body);
      
      const manager = await storage.getManagerByUsername(loginData.username);
      
      if (!manager || manager.password !== loginData.password) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // In a real app, you'd use proper session management
      res.json({ 
        success: true, 
        manager: { id: manager.id, username: manager.username } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const storage = await getStorage();
      const allAppointments = await storage.getAllAppointments();
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate stats
      const todayAppointments = allAppointments.filter((apt: any) => apt.date === today);
      
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekAppointments = allAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.date);
        return aptDate >= weekStart && aptDate <= weekEnd;
      });
      
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      monthEnd.setDate(0);
      
      const monthAppointments = allAppointments.filter((apt: any) => {
        const aptDate = new Date(apt.date);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });
      
      // Calculate occupancy rate (simplified)
      const totalSlots = await storage.getActiveTimeSlots();
      const occupancyRate = todayAppointments.length > 0 
        ? Math.round((todayAppointments.length / totalSlots.length) * 100)
        : 0;
      
      res.json({
        todayBookings: todayAppointments.length,
        weekBookings: weekAppointments.length,
        monthBookings: monthAppointments.length,
        occupancyRate
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Schedule Closures API
  
  // Create schedule closure
  app.post("/api/schedule-closures", async (req, res) => {
    try {
      const storage = await getStorage();
      const closureData = insertScheduleClosureSchema.parse(req.body);
      
      const closure = await storage.createScheduleClosure(closureData);
      res.status(201).json(closure);
    } catch (error) {
      console.error('Error in POST /api/schedule-closures:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get all active schedule closures
  app.get("/api/schedule-closures", async (req, res) => {
    try {
      const storage = await getStorage();
      const closures = await storage.getActiveScheduleClosures();
      res.json(closures);
    } catch (error) {
      console.error('Error in /api/schedule-closures:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Delete schedule closure
  app.delete("/api/schedule-closures/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      
      const success = await storage.deleteScheduleClosure(id);
      
      if (!success) {
        return res.status(404).json({ message: "Fechamento não encontrado" });
      }
      
      res.json({ message: "Fechamento removido com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Check if a specific date is closed
  app.get("/api/schedule-closures/check/:date", async (req, res) => {
    try {
      const storage = await getStorage();
      const { date } = req.params;
      
      const isClosed = await storage.isDateClosed(date);
      res.json({ isClosed });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Time Slot Blocks API
  
  // Create time slot block
  app.post("/api/time-slot-blocks", async (req, res) => {
    try {
      const storage = await getStorage();
      const blockData = insertTimeSlotBlockSchema.parse(req.body);
      
      const block = await storage.createTimeSlotBlock(blockData);
      res.status(201).json(block);
    } catch (error) {
      console.error('Error in POST /api/time-slot-blocks:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get all active time slot blocks
  app.get("/api/time-slot-blocks", async (req, res) => {
    try {
      const storage = await getStorage();
      const blocks = await storage.getActiveTimeSlotBlocks();
      res.json(blocks);
    } catch (error) {
      console.error('Error in /api/time-slot-blocks:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get time slot blocks for a specific date
  app.get("/api/time-slot-blocks/:date", async (req, res) => {
    try {
      const storage = await getStorage();
      const { date } = req.params;
      const blocks = await storage.getTimeSlotBlocksByDate(date);
      res.json(blocks);
    } catch (error) {
      console.error('Error in /api/time-slot-blocks/:date:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Delete time slot block
  app.delete("/api/time-slot-blocks/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      
      const success = await storage.deleteTimeSlotBlock(id);
      
      if (!success) {
        return res.status(404).json({ message: "Bloqueio de horário não encontrado" });
      }
      
      res.json({ message: "Bloqueio de horário removido com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Check if a specific time slot is blocked
  app.get("/api/time-slot-blocks/check/:date/:time", async (req, res) => {
    try {
      const storage = await getStorage();
      const { date, time } = req.params;
      
      const isBlocked = await storage.isTimeSlotBlocked(date, time);
      res.json({ isBlocked });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Time Slots Management API
  
  // Get all time slots
  app.get("/api/time-slots", async (req, res) => {
    try {
      const storage = await getStorage();
      const timeSlots = await storage.getAllTimeSlots();
      res.json(timeSlots);
    } catch (error) {
      console.error('Error in /api/time-slots:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Create new time slot
  app.post("/api/time-slots", async (req, res) => {
    try {
      const storage = await getStorage();
      const timeSlotData = insertTimeSlotSchema.parse(req.body);
      
      // Check if time slot already exists
      const existingSlots = await storage.getAllTimeSlots();
      const duplicate = existingSlots.find(slot => slot.slotTime === timeSlotData.slotTime);
      
      if (duplicate) {
        return res.status(409).json({ 
          message: "Este horário já existe." 
        });
      }
      
      const timeSlot = await storage.createTimeSlot(timeSlotData);
      res.status(201).json(timeSlot);
    } catch (error) {
      console.error('Error in POST /api/time-slots:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update time slot (e.g., toggle active status)
  app.put("/api/time-slots/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      const updates = req.body;
      
      const updatedTimeSlot = await storage.updateTimeSlot(id, updates);
      
      if (!updatedTimeSlot) {
        return res.status(404).json({ message: "Horário não encontrado" });
      }
      
      res.json(updatedTimeSlot);
    } catch (error) {
      console.error('Error in PUT /api/time-slots/:id:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Delete time slot
  app.delete("/api/time-slots/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { id } = req.params;
      
      const success = await storage.deleteTimeSlot(id);
      
      if (!success) {
        return res.status(404).json({ message: "Horário não encontrado" });
      }
      
      res.json({ message: "Horário removido com sucesso" });
    } catch (error) {
      console.error('Error in DELETE /api/time-slots/:id:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
