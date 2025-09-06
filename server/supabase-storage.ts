import { type Appointment, type InsertAppointment, type Manager, type InsertManager, type TimeSlot, type InsertTimeSlot } from "@shared/schema";
import { supabase, type SupabaseAppointment, type SupabaseManager, type SupabaseTimeSlot } from "./supabase";
import { type IStorage } from "./storage";

export class SupabaseStorage implements IStorage {
  
  constructor() {
    // Initialize default data if needed
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    try {
      // Check if default manager exists
      const { data: existingManager } = await supabase
        .from('managers')
        .select('*')
        .eq('username', 'admin')
        .single();

      // Create default manager if it doesn't exist
      if (!existingManager) {
        await supabase
          .from('managers')
          .insert({
            username: 'admin',
            password: 'admin', // In production, this should be hashed
          });
      }

      // Check if time slots exist
      const { data: existingSlots } = await supabase
        .from('time_slots')
        .select('*')
        .limit(1);

      // Create default time slots if none exist
      if (!existingSlots || existingSlots.length === 0) {
        const defaultTimes = [
          "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
          "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
        ];

        const timeSlots = defaultTimes.map(time => ({
          slot_time: time,
          is_active: true,
        }));

        await supabase
          .from('time_slots')
          .insert(timeSlots);
      }
    } catch (error) {
      console.error('Error initializing defaults:', error);
    }
  }

  // Helper functions to convert between Supabase and app types
  private convertSupabaseAppointment(supabaseData: SupabaseAppointment): Appointment {
    return {
      id: supabaseData.id,
      clientName: supabaseData.client_name,
      clientPhone: supabaseData.client_phone,
      date: supabaseData.date,
      time: supabaseData.time,
      status: supabaseData.status,
      createdAt: new Date(supabaseData.created_at),
    };
  }

  private convertSupabaseManager(supabaseData: SupabaseManager): Manager {
    return {
      id: supabaseData.id,
      username: supabaseData.username,
      password: supabaseData.password,
    };
  }

  private convertSupabaseTimeSlot(supabaseData: SupabaseTimeSlot): TimeSlot {
    return {
      id: supabaseData.id,
      slotTime: supabaseData.slot_time,
      isActive: supabaseData.is_active,
    };
  }

  // Appointments
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        client_name: insertAppointment.clientName,
        client_phone: insertAppointment.clientPhone,
        date: insertAppointment.date,
        time: insertAppointment.time,
        status: insertAppointment.status || 'confirmed',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    return this.convertSupabaseAppointment(data);
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .order('time');

    if (error) {
      throw new Error(`Failed to get appointments: ${error.message}`);
    }

    return data?.map(this.convertSupabaseAppointment) || [];
  }

  async getAppointmentByDateTime(date: string, time: string): Promise<Appointment | undefined> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .eq('time', time)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is expected when no appointment exists
        return undefined;
      }
      throw new Error(`Failed to get appointment: ${error.message}`);
    }

    return data ? this.convertSupabaseAppointment(data) : undefined;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date')
      .order('time');

    if (error) {
      throw new Error(`Failed to get all appointments: ${error.message}`);
    }

    return data?.map(this.convertSupabaseAppointment) || [];
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const updateData: any = {};
    
    if (updates.clientName !== undefined) updateData.client_name = updates.clientName;
    if (updates.clientPhone !== undefined) updateData.client_phone = updates.clientPhone;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - appointment not found
        return undefined;
      }
      throw new Error(`Failed to update appointment: ${error.message}`);
    }

    return data ? this.convertSupabaseAppointment(data) : undefined;
  }

  async cancelAppointment(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - appointment not found
        return false;
      }
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }

    return !!data;
  }

  // Managers
  async createManager(insertManager: InsertManager): Promise<Manager> {
    const { data, error } = await supabase
      .from('managers')
      .insert({
        username: insertManager.username,
        password: insertManager.password,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create manager: ${error.message}`);
    }

    return this.convertSupabaseManager(data);
  }

  async getManagerByUsername(username: string): Promise<Manager | undefined> {
    const { data, error } = await supabase
      .from('managers')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return undefined;
      }
      throw new Error(`Failed to get manager: ${error.message}`);
    }

    return data ? this.convertSupabaseManager(data) : undefined;
  }

  // Time Slots
  async createTimeSlot(insertTimeSlot: InsertTimeSlot): Promise<TimeSlot> {
    const { data, error } = await supabase
      .from('time_slots')
      .insert({
        slot_time: insertTimeSlot.slotTime,
        is_active: insertTimeSlot.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create time slot: ${error.message}`);
    }

    return this.convertSupabaseTimeSlot(data);
  }

  async getActiveTimeSlots(): Promise<TimeSlot[]> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_active', true)
      .order('slot_time');

    if (error) {
      throw new Error(`Failed to get active time slots: ${error.message}`);
    }

    return data?.map(this.convertSupabaseTimeSlot) || [];
  }

  async getAllTimeSlots(): Promise<TimeSlot[]> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('slot_time');

    if (error) {
      throw new Error(`Failed to get all time slots: ${error.message}`);
    }

    return data?.map(this.convertSupabaseTimeSlot) || [];
  }


}