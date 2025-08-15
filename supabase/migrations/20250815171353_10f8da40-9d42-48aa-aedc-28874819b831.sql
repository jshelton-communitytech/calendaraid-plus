-- Fix function search path for security
DROP FUNCTION public.update_updated_at_column();
DROP FUNCTION public.handle_new_user();

-- Recreate update function with proper security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;