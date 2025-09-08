import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  time: text("time").notNull(), // Format: HH:MM
  status: text("status").notNull().default("confirmed"), // "confirmed" | "pending" | "cancelled" | "rescheduled"
  createdAt: timestamp("created_at").defaultNow(),
});

export const managers = pgTable("managers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slotTime: text("slot_time").notNull(), // Format: HH:MM
  isActive: boolean("is_active").notNull().default(true),
});

export const scheduleClosures = pgTable("schedule_closures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  closureType: text("closure_type").notNull(), // "weekly" | "specific_date"
  dayOfWeek: text("day_of_week"), // For weekly closures: "monday", "tuesday", etc. (nullable for specific dates)
  specificDate: text("specific_date"), // For specific date closures: "YYYY-MM-DD" (nullable for weekly)
  reason: text("reason"), // Optional reason for closure
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeSlotBlocks = pgTable("time_slot_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  specificDate: text("specific_date").notNull(), // Format: YYYY-MM-DD
  startTime: text("start_time").notNull(), // Format: HH:MM
  endTime: text("end_time").notNull(), // Format: HH:MM
  reason: text("reason"), // Optional reason for the block
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});



export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
}).extend({
  clientName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  clientPhone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Telefone deve estar no formato (11) 99999-9999"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"),
});

export const insertManagerSchema = createInsertSchema(managers).omit({
  id: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
});

export const insertScheduleClosureSchema = createInsertSchema(scheduleClosures).omit({
  id: true,
  createdAt: true,
}).extend({
  closureType: z.enum(["weekly", "specific_date"], {
    required_error: "Tipo de fechamento é obrigatório",
  }),
  dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]).optional(),
  specificDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
  reason: z.string().optional(),
}).refine(
  (data) => {
    if (data.closureType === "weekly" && !data.dayOfWeek) {
      return false;
    }
    if (data.closureType === "specific_date" && !data.specificDate) {
      return false;
    }
    return true;
  },
  {
    message: "Dia da semana é obrigatório para fechamento semanal, ou data específica para fechamento pontual",
  }
);

export const insertTimeSlotBlockSchema = createInsertSchema(timeSlotBlocks).omit({
  id: true,
  createdAt: true,
}).extend({
  specificDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário de início deve estar no formato HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Horário de fim deve estar no formato HH:MM"),
  reason: z.string().optional(),
}).refine(
  (data) => {
    // Validate that end time is after start time
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;
    return endTotalMinutes > startTotalMinutes;
  },
  {
    message: "Horário de fim deve ser posterior ao horário de início",
    path: ["endTime"],
  }
);



export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertManager = z.infer<typeof insertManagerSchema>;
export type Manager = typeof managers.$inferSelect;
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type InsertScheduleClosure = z.infer<typeof insertScheduleClosureSchema>;
export type ScheduleClosure = typeof scheduleClosures.$inferSelect;
export type InsertTimeSlotBlock = z.infer<typeof insertTimeSlotBlockSchema>;
export type TimeSlotBlock = typeof timeSlotBlocks.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
