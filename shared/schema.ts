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
  status: text("status").notNull().default("confirmed"), // "confirmed" | "pending" | "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
});

export const managers = pgTable("managers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  time: text("time").notNull(), // Format: HH:MM
  isActive: boolean("is_active").notNull().default(true),
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
export type LoginData = z.infer<typeof loginSchema>;
