
CREATE OR REPLACE FUNCTION public.send_push_notification_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Push notification trigger failed: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;
