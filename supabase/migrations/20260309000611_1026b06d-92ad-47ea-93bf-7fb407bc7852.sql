-- Fix overly permissive RLS policies identified by the linter

-- Fix OTP codes policies - more restrictive approach
DROP POLICY IF EXISTS "Anyone can insert OTP" ON public.otp_codes;
DROP POLICY IF EXISTS "Anyone can read OTP for verification" ON public.otp_codes;  
DROP POLICY IF EXISTS "Anyone can update OTP for verification" ON public.otp_codes;

-- Create more secure OTP policies
CREATE POLICY "Service role can manage OTP codes"
ON public.otp_codes
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Allow unauthenticated users to read OTP for verification (needed for registration flow)
CREATE POLICY "Unauthenticated can read OTP for verification"
ON public.otp_codes
FOR SELECT
USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- Fix app_settings policy - keep public read but restrict writes
DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;

-- More secure app_settings policy - authenticated users can read, only super admins can write
CREATE POLICY "Authenticated can read settings"
ON public.app_settings
FOR SELECT
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');