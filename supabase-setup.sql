-- AgendaFlow Supabase Database Setup
-- Run these SQL commands in your Supabase SQL Editor

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    time TEXT NOT NULL, -- Format: HH:MM
    status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' | 'pending' | 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create managers table
CREATE TABLE IF NOT EXISTS managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_time TEXT NOT NULL, -- Format: HH:MM
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(date, time);
CREATE INDEX IF NOT EXISTS idx_managers_username ON managers(username);
CREATE INDEX IF NOT EXISTS idx_time_slots_active ON time_slots(is_active);

-- Insert default manager (admin/admin)
INSERT INTO managers (username, password) 
VALUES ('admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default time slots
INSERT INTO time_slots (slot_time, is_active) VALUES
    ('09:00', true),
    ('09:30', true),
    ('10:00', true),
    ('10:30', true),
    ('11:00', true),
    ('11:30', true),
    ('14:00', true),
    ('14:30', true),
    ('15:00', true),
    ('15:30', true),
    ('16:00', true),
    ('16:30', true),
    ('17:00', true)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- Note: These are permissive policies for development. 
-- In production, you should implement proper authentication-based policies.

-- Appointments policies
CREATE POLICY "Anyone can view appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert appointments" ON appointments FOR INSERT WITH CHECK (true);

-- Managers policies (more restrictive)
CREATE POLICY "Anyone can view managers" ON managers FOR SELECT USING (true);

-- Time slots policies
CREATE POLICY "Anyone can view time slots" ON time_slots FOR SELECT USING (true);

-- Optional: Create a function to get available time slots for a specific date
CREATE OR REPLACE FUNCTION get_available_slots(target_date TEXT)
RETURNS TABLE(id UUID, slot_time TEXT, is_active BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT ts.id, ts.slot_time, ts.is_active
    FROM time_slots ts
    WHERE ts.is_active = true
    AND ts.slot_time NOT IN (
        SELECT a.time
        FROM appointments a
        WHERE a.date = target_date
    )
    ORDER BY ts.slot_time;
END;
$$ LANGUAGE plpgsql;