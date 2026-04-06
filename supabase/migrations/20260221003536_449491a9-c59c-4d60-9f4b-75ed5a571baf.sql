
-- Allow customers to read their own profile (user_id = auth.uid())
-- This is already covered by "Users can read own profile" policy
-- But let's verify it works by checking: the existing policy uses (auth.uid() = user_id) which should work
-- The issue was the "Customers can read owner profiles" causing recursion with customers table
-- That's now fixed with security definer functions. No additional changes needed.
SELECT 1;
