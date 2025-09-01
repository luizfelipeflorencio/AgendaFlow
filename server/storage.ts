import { type Appointment, type InsertAppointment, type Manager, type InsertManager, type TimeSlot, type InsertTimeSlot } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getAppointmentByDateTime(date: string, time: string): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;
  
  // Managers
  createManager(manager: InsertManager): Promise<Manager>;
  getManagerByUsername(username: string): Promise<Manager | undefined>;
  
  // Time Slots
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  getActiveTimeSlots(): Promise<TimeSlot[]>;
  getAllTimeSlots(): Promise<TimeSlot[]>;
}

export class MemStorage implements IStorage {
  private appointments: Map<string, Appointment>;
  private managers: Map<string, Manager>;
  private timeSlots: Map<string, TimeSlot>;

  constructor() {
    this.appointments = new Map();
    this.managers = new Map();
    this.timeSlots = new Map();
    
    // Initialize with default manager and time slots
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    // Create default manager (admin/admin)
    const defaultManager: Manager = {
      id: randomUUID(),
      username: "admin",
      password: "admin", // In production, this would be hashed
    };
    this.managers.set(defaultManager.id, defaultManager);

    // Create default time slots
    const defaultTimes = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
    ];

    for (const time of defaultTimes) {
      const timeSlot: TimeSlot = {
        id: randomUUID(),
        time,
        isActive: true,
      };
      this.timeSlots.set(timeSlot.id, timeSlot);
    }
  }

  // Appointments
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      createdAt: new Date(),
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  async getAppointmentByDateTime(date: string, time: string): Promise<Appointment | undefined> {
    return Array.from(this.appointments.values())
      .find(appointment => appointment.date === date && appointment.time === time);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }

  // Managers
  async createManager(insertManager: InsertManager): Promise<Manager> {
    const id = randomUUID();
    const manager: Manager = { ...insertManager, id };
    this.managers.set(id, manager);
    return manager;
  }

  async getManagerByUsername(username: string): Promise<Manager | undefined> {
    return Array.from(this.managers.values()).find(
      (manager) => manager.username === username,
    );
  }

  // Time Slots
  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const id = randomUUID();
    const timeSlot: TimeSlot = { ...insertTimeSlot, id };
    this.timeSlots.set(id, timeSlot);
    return timeSlot;
  }

  async getActiveTimeSlots(): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values())
      .filter(slot => slot.isActive)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  async getAllTimeSlots(): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values())
      .sort((a, b) => a.time.localeCompare(b.time));
  }
}

export const storage = new MemStorage();
