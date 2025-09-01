import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create appointment
  app.post("/api/appointments", async (req, res) => {
    try {
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
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get available time slots for a date
  app.get("/api/available-slots/:date", async (req, res) => {
    try {
      const { date } = req.params;
      
      // Get all active time slots
      const allSlots = await storage.getActiveTimeSlots();
      
      // Get booked appointments for this date
      const bookedAppointments = await storage.getAppointmentsByDate(date);
      const bookedTimes = bookedAppointments.map(apt => apt.time);
      
      // Filter out booked slots
      const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot.time));
      
      res.json(availableSlots);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Manager login
  app.post("/api/auth/login", async (req, res) => {
    try {
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
      const allAppointments = await storage.getAllAppointments();
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate stats
      const todayAppointments = allAppointments.filter(apt => apt.date === today);
      
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekAppointments = allAppointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= weekStart && aptDate <= weekEnd;
      });
      
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      monthEnd.setDate(0);
      
      const monthAppointments = allAppointments.filter(apt => {
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

  const httpServer = createServer(app);
  return httpServer;
}
