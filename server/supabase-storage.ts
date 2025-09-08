import { type Appointment, type InsertAppointment, type Manager, type InsertManager, type TimeSlot, type InsertTimeSlot, type ScheduleClosure, type InsertScheduleClosure, type TimeSlotBlock, type InsertTimeSlotBlock } from "@shared/schema";
import { supabase, type SupabaseAppointment, type SupabaseManager, type SupabaseTimeSlot, type SupabaseScheduleClosure, type SupabaseTimeSlotBlock } from "./supabase";
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

  private convertSupabaseScheduleClosure(supabaseData: SupabaseScheduleClosure): ScheduleClosure {
    return {
      id: supabaseData.id,
      closureType: supabaseData.closure_type as "weekly" | "specific_date",
      dayOfWeek: supabaseData.day_of_week,
      specificDate: supabaseData.specific_date,
      reason: supabaseData.reason,
      isActive: supabaseData.is_active,
      createdAt: new Date(supabaseData.created_at),
    };
  }

  private convertSupabaseTimeSlotBlock(supabaseData: SupabaseTimeSlotBlock): TimeSlotBlock {
    return {
      id: supabaseData.id,
      specificDate: supabaseData.specific_date,
      startTime: supabaseData.start_time,
      endTime: supabaseData.end_time,
      reason: supabaseData.reason,
      isActive: supabaseData.is_active,
      createdAt: new Date(supabaseData.created_at),
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

  async updateTimeSlot(id: string, updates: Partial<InsertTimeSlot>): Promise<TimeSlot | undefined> {
    const updateData: any = {};
    
    if (updates.slotTime !== undefined) updateData.slot_time = updates.slotTime;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('time_slots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - time slot not found
        return undefined;
      }
      throw new Error(`Failed to update time slot: ${error.message}`);
    }

    return data ? this.convertSupabaseTimeSlot(data) : undefined;
  }

  async deleteTimeSlot(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - time slot not found
        return false;
      }
      throw new Error(`Failed to delete time slot: ${error.message}`);
    }

    return !!data;
  }

  // Schedule Closures
  async createScheduleClosure(insertScheduleClosure: InsertScheduleClosure): Promise<ScheduleClosure> {
    const { data, error } = await supabase
      .from('schedule_closures')
      .insert({
        closure_type: insertScheduleClosure.closureType,
        day_of_week: insertScheduleClosure.dayOfWeek,
        specific_date: insertScheduleClosure.specificDate,
        reason: insertScheduleClosure.reason,
        is_active: insertScheduleClosure.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create schedule closure: ${error.message}`);
    }

    return this.convertSupabaseScheduleClosure(data);
  }

  async getActiveScheduleClosures(): Promise<ScheduleClosure[]> {
    const { data, error } = await supabase
      .from('schedule_closures')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (error) {
      throw new Error(`Failed to get active schedule closures: ${error.message}`);
    }

    return data?.map(this.convertSupabaseScheduleClosure) || [];
  }

  async deleteScheduleClosure(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('schedule_closures')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - closure not found
        return false;
      }
      throw new Error(`Failed to delete schedule closure: ${error.message}`);
    }

    return !!data;
  }

  async isDateClosed(date: string): Promise<boolean> {
    const closures = await this.getActiveScheduleClosures();
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dateObj.getDay()];
    
    for (const closure of closures) {
      // Check for specific date closure
      if (closure.closureType === 'specific_date' && closure.specificDate === date) {
        return true;
      }
      
      // Check for weekly closure
      if (closure.closureType === 'weekly' && closure.dayOfWeek === dayOfWeek) {
        return true;
      }
    }
    
    return false;
  }

  // Time Slot Blocks
  async createTimeSlotBlock(insertTimeSlotBlock: InsertTimeSlotBlock): Promise<TimeSlotBlock> {
    try {
      const { data, error } = await supabase
        .from('time_slot_blocks')
        .insert({
          specific_date: insertTimeSlotBlock.specificDate,
          start_time: insertTimeSlotBlock.startTime,
          end_time: insertTimeSlotBlock.endTime,
          reason: insertTimeSlotBlock.reason,
          is_active: insertTimeSlotBlock.isActive ?? true,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('Could not find the table')) {
          throw new Error('Time slot blocks table not found. Please create the table in Supabase first.');
        }
        throw new Error(`Failed to create time slot block: ${error.message}`);
      }

      return this.convertSupabaseTimeSlotBlock(data);
    } catch (error: any) {
      throw error;
    }
  }

  async getTimeSlotBlocksByDate(date: string): Promise<TimeSlotBlock[]> {
    try {
      const { data, error } = await supabase
        .from('time_slot_blocks')
        .select('*')
        .eq('specific_date', date)
        .eq('is_active', true)
        .order('start_time');

      if (error) {
        // If table doesn't exist, return empty array instead of throwing error
        if (error.message.includes('Could not find the table')) {
          console.warn('time_slot_blocks table not found in Supabase, returning empty array');
          return [];
        }
        throw new Error(`Failed to get time slot blocks: ${error.message}`);
      }

      return data?.map(this.convertSupabaseTimeSlotBlock) || [];
    } catch (error: any) {
      console.warn('Error accessing time_slot_blocks table:', error.message);
      return [];
    }
  }

  async getActiveTimeSlotBlocks(): Promise<TimeSlotBlock[]> {
    try {
      const { data, error } = await supabase
        .from('time_slot_blocks')
        .select('*')
        .eq('is_active', true)
        .order('specific_date')
        .order('start_time');

      if (error) {
        // If table doesn't exist, return empty array instead of throwing error
        if (error.message.includes('Could not find the table')) {
          console.warn('time_slot_blocks table not found in Supabase, returning empty array');
          return [];
        }
        throw new Error(`Failed to get active time slot blocks: ${error.message}`);
      }

      return data?.map(this.convertSupabaseTimeSlotBlock) || [];
    } catch (error: any) {
      console.warn('Error accessing time_slot_blocks table:', error.message);
      return [];
    }
  }

  async deleteTimeSlotBlock(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('time_slot_blocks')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.message.includes('Could not find the table')) {
          console.warn('time_slot_blocks table not found in Supabase');
          return false;
        }
        if (error.code === 'PGRST116') {
          // No rows returned - block not found
          return false;
        }
        throw new Error(`Failed to delete time slot block: ${error.message}`);
      }

      return !!data;
    } catch (error: any) {
      console.warn('Error deleting time slot block:', error.message);
      return false;
    }
  }

  async isTimeSlotBlocked(date: string, time: string): Promise<boolean> {
    const blocks = await this.getTimeSlotBlocksByDate(date);
    
    for (const block of blocks) {
      const [blockStartHour, blockStartMin] = block.startTime.split(':').map(Number);
      const [blockEndHour, blockEndMin] = block.endTime.split(':').map(Number);
      const [timeHour, timeMin] = time.split(':').map(Number);
      
      const blockStartMinutes = blockStartHour * 60 + blockStartMin;
      const blockEndMinutes = blockEndHour * 60 + blockEndMin;
      const timeMinutes = timeHour * 60 + timeMin;
      
      // Check if the time falls within the blocked range
      if (timeMinutes >= blockStartMinutes && timeMinutes < blockEndMinutes) {
        return true;
      }
    }
    
    return false;
  }


}