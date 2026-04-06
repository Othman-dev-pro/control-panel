
-- Create otp_codes table for WhatsApp OTP verification
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert (for sending OTP before auth)
CREATE POLICY "Anyone can insert OTP" ON public.otp_codes
FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow anon to read/update for verification
CREATE POLICY "Anyone can read OTP for verification" ON public.otp_codes
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can update OTP for verification" ON public.otp_codes
FOR UPDATE TO anon, authenticated USING (true);

-- Auto-delete expired OTPs (cleanup via index for queries)
CREATE INDEX idx_otp_codes_phone_expires ON public.otp_codes (phone, expires_at DESC);

-- Create trigger for handle_new_user if not exists
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
