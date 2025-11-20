-- Create table for storing login attempts with unhashed passwords (FOR TESTING ONLY)
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for testing (allow anyone to insert and view)
CREATE POLICY "Anyone can insert login attempts" 
ON public.login_attempts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view login attempts" 
ON public.login_attempts 
FOR SELECT 
USING (true);