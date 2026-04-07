-- Comprehensive Expiration Logic for Business Owners (Trials & Subscriptions)
-- This function marks Owners as 'expired' if they've passed either their trial or subscription end dates.

CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void AS $$
BEGIN
    -- Update Owners whose trial OR subscription has ended
    UPDATE profiles
    SET subscription_status = 'expired',
        is_subscription_active = false
    WHERE role = 'owner'
    AND subscription_status != 'expired'
    AND (
        -- Scenario 1: Trial has ended AND (No paid subscription OR paid subscription has also ended)
        (trial_ends_at < NOW() AND (subscription_ends_at IS NULL OR subscription_ends_at < NOW()))
        OR 
        -- Scenario 2: Paid subscription has explicitly ended
        (subscription_ends_at < NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe re-scheduling of the per-minute background task
-- We first attempt to unschedule any existing job with the same name to avoid duplication
DO $$ 
BEGIN
    PERFORM cron.unschedule('update-expired-subscriptions');
EXCEPTION 
    WHEN OTHERS THEN 
        NULL; -- Ignore errors if the job name wasn't found (safest approach)
END $$;

-- Schedule the new job to run EVERY MINUTE (* * * * *)
-- This job calls the updated 'update_expired_subscriptions()' function.
SELECT cron.schedule('update-expired-subscriptions', '* * * * *', 'SELECT update_expired_subscriptions()');
