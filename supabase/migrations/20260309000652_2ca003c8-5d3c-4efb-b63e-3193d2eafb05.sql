-- Create function to send push notification when database notification is created
CREATE OR REPLACE FUNCTION public.send_push_notification_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the edge function asynchronously to send push notification
  PERFORM
    net.http_post(
      url := format('%s/functions/v1/send-push-notification', 
        COALESCE(current_setting('app.settings.supabase_url', true), 'http://localhost:54321')),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', format('Bearer %s', 
          COALESCE(current_setting('app.settings.service_role_key', true), ''))
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id::text,
        'title', NEW.title,
        'message', NEW.message,
        'type', NEW.type,
        'related_id', COALESCE(NEW.related_id::text, '')
      )
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net;

-- Create trigger on notifications table to send push notifications
DROP TRIGGER IF EXISTS send_push_notification_on_insert ON public.notifications;
CREATE TRIGGER send_push_notification_on_insert
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_push_notification_trigger();