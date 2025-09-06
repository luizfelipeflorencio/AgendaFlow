import { type Appointment, type InsertAppointment, type Manager, type InsertManager, type TimeSlot, type InsertTimeSlot } from "@shared/schema";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
dotenv.config();

export interface IStorage {
  // Appointments
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getAppointmentByDateTime(date: string, time: string): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  cancelAppointment(id: string): Promise<boolean>;
  
  // Managers
  createManager(manager: InsertManager): Promise<Manager>;
  getManagerByUsername(username: string): Promise<Manager | undefined>;
  
  // Time Slots
  createTimeSlot(timeSlot: InsertTimeSlot): Promise<TimeSlot>;
  getActiveTimeSlots(): Promise<TimeSlot[]>;
  getAllTimeSlots(): Promise<TimeSlot[]>;
  

}

// MemStorage implementation for development fallback
class MemStorage implements IStorage {
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
        slotTime: time,
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
      status: insertAppointment.status || "confirmed",
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

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existing = this.appointments.get(id);
    if (!existing) return undefined;
    
    const updated: Appointment = {
      ...existing,
      ...updates,
    };
    this.appointments.set(id, updated);
    return updated;
  }

  async cancelAppointment(id: string): Promise<boolean> {
    const existing = this.appointments.get(id);
    if (!existing) return false;
    
    const cancelled: Appointment = {
      ...existing,
      status: "cancelled",
    };
    this.appointments.set(id, cancelled);
    return true;
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
    const timeSlot: TimeSlot = { 
      ...insertTimeSlot, 
      id,
      isActive: insertTimeSlot.isActive ?? true 
    };
    this.timeSlots.set(id, timeSlot);
    return timeSlot;
  }

  async getActiveTimeSlots(): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values())
      .filter(slot => slot.isActive)
      .sort((a, b) => a.slotTime.localeCompare(b.slotTime));
  }

  async getAllTimeSlots(): Promise<TimeSlot[]> {
    return Array.from(this.timeSlots.values())
      .sort((a, b) => a.slotTime.localeCompare(b.slotTime));
  }


}

// Create storage instance based on environment
let storageInstance: IStorage | null = null;

async function createStorage(): Promise<IStorage> {
  if (storageInstance) {
    return storageInstance;
  }
  
  console.log('Environment:', process.env.NODE_ENV);
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);
  console.log('SUPABASE_URL and SUPABASE_ANON_KEY:', process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
  
  if (useSupabase) {
    console.log('🔥 Using Supabase storage');
    // Dynamic import to avoid issues if Supabase is not configured
    try {
      const { SupabaseStorage } = await import('./supabase-storage');
      storageInstance = new SupabaseStorage();
      return storageInstance;
    } catch (error) {
      console.warn('⚠️ Failed to load Supabase storage, falling back to memory storage:', error);
      storageInstance = new MemStorage();
      return storageInstance;
    }
  } else {
    console.log('💾 Using in-memory storage (development mode)');
    storageInstance = new MemStorage();
    return storageInstance;
  }
}

export async function getStorage(): Promise<IStorage> {
  return await createStorage();
}
