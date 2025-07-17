-- Create enum for equipment types
CREATE TYPE public.equipment_type AS ENUM ('tablet', 'notebook', 'vr_glasses');

-- Create enum for shift types
CREATE TYPE public.shift_type AS ENUM ('morning', 'afternoon', 'night');

-- Create enum for space types
CREATE TYPE public.space_type AS ENUM ('study_room', 'general_space');

-- Create enum for reservation status
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'staff', 'library_admin');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  registration_number TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type equipment_type NOT NULL,
  identifier TEXT NOT NULL UNIQUE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  last_maintenance DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment reservations table
CREATE TABLE public.equipment_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  shift shift_type NOT NULL,
  pickup_time TIME NOT NULL,
  return_time TIME NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  purpose TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint to prevent double booking same equipment on same shift/date
  UNIQUE(equipment_id, reservation_date, shift)
);

-- Create space reservations table
CREATE TABLE public.space_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_type space_type NOT NULL,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  group_size INTEGER NOT NULL,
  group_members TEXT[] NOT NULL DEFAULT '{}',
  purpose TEXT NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Library admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'library_admin'
  )
);

-- Create policies for equipment (public read, admin write)
CREATE POLICY "Everyone can view equipment" 
ON public.equipment 
FOR SELECT 
USING (true);

CREATE POLICY "Library admins can manage equipment" 
ON public.equipment 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'library_admin'
  )
);

-- Create policies for equipment reservations
CREATE POLICY "Users can view their own equipment reservations" 
ON public.equipment_reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create equipment reservations" 
ON public.equipment_reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment reservations" 
ON public.equipment_reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Library admins can view all equipment reservations" 
ON public.equipment_reservations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'library_admin'
  )
);

CREATE POLICY "Library admins can manage all equipment reservations" 
ON public.equipment_reservations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'library_admin'
  )
);

-- Create policies for space reservations
CREATE POLICY "Users can view their own space reservations" 
ON public.space_reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create space reservations" 
ON public.space_reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own space reservations" 
ON public.space_reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Library admins can view all space reservations" 
ON public.space_reservations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'library_admin'
  )
);

CREATE POLICY "Library admins can manage all space reservations" 
ON public.space_reservations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'library_admin'
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_reservations_updated_at
  BEFORE UPDATE ON public.equipment_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_space_reservations_updated_at
  BEFORE UPDATE ON public.space_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert initial equipment data
INSERT INTO public.equipment (type, identifier) VALUES
-- Tablets (30 units)
('tablet', 'TAB-001'), ('tablet', 'TAB-002'), ('tablet', 'TAB-003'), ('tablet', 'TAB-004'), ('tablet', 'TAB-005'),
('tablet', 'TAB-006'), ('tablet', 'TAB-007'), ('tablet', 'TAB-008'), ('tablet', 'TAB-009'), ('tablet', 'TAB-010'),
('tablet', 'TAB-011'), ('tablet', 'TAB-012'), ('tablet', 'TAB-013'), ('tablet', 'TAB-014'), ('tablet', 'TAB-015'),
('tablet', 'TAB-016'), ('tablet', 'TAB-017'), ('tablet', 'TAB-018'), ('tablet', 'TAB-019'), ('tablet', 'TAB-020'),
('tablet', 'TAB-021'), ('tablet', 'TAB-022'), ('tablet', 'TAB-023'), ('tablet', 'TAB-024'), ('tablet', 'TAB-025'),
('tablet', 'TAB-026'), ('tablet', 'TAB-027'), ('tablet', 'TAB-028'), ('tablet', 'TAB-029'), ('tablet', 'TAB-030'),

-- Notebooks (19 units)
('notebook', 'NB-001'), ('notebook', 'NB-002'), ('notebook', 'NB-003'), ('notebook', 'NB-004'), ('notebook', 'NB-005'),
('notebook', 'NB-006'), ('notebook', 'NB-007'), ('notebook', 'NB-008'), ('notebook', 'NB-009'), ('notebook', 'NB-010'),
('notebook', 'NB-011'), ('notebook', 'NB-012'), ('notebook', 'NB-013'), ('notebook', 'NB-014'), ('notebook', 'NB-015'),
('notebook', 'NB-016'), ('notebook', 'NB-017'), ('notebook', 'NB-018'), ('notebook', 'NB-019'),

-- VR Glasses (15 units)
('vr_glasses', 'VR-001'), ('vr_glasses', 'VR-002'), ('vr_glasses', 'VR-003'), ('vr_glasses', 'VR-004'), ('vr_glasses', 'VR-005'),
('vr_glasses', 'VR-006'), ('vr_glasses', 'VR-007'), ('vr_glasses', 'VR-008'), ('vr_glasses', 'VR-009'), ('vr_glasses', 'VR-010'),
('vr_glasses', 'VR-011'), ('vr_glasses', 'VR-012'), ('vr_glasses', 'VR-013'), ('vr_glasses', 'VR-014'), ('vr_glasses', 'VR-015');