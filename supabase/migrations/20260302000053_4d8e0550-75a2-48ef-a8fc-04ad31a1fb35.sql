
-- Trigger: Notify customer when added by owner
CREATE OR REPLACE FUNCTION public.notify_customer_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _owner_name text;
  _biz_name text;
BEGIN
  -- Only notify if customer has a linked user account
  IF NEW.user_id IS NOT NULL THEN
    SELECT COALESCE(p.business_name, p.name, '') INTO _biz_name
    FROM public.profiles p WHERE p.user_id = NEW.owner_id;
    
    _owner_name := COALESCE(_biz_name, '');
    
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.user_id,
      'تمت إضافتك كزبون',
      'تم إضافتك كزبون في ' || _owner_name,
      'info',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_customer_added
AFTER INSERT ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.notify_customer_added();

-- Trigger: Notify when debt is created (notify customer + owner)
CREATE OR REPLACE FUNCTION public.notify_debt_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _customer_user_id uuid;
  _customer_name text;
  _biz_name text;
BEGIN
  -- Get customer info
  SELECT c.user_id, c.name INTO _customer_user_id, _customer_name
  FROM public.customers c WHERE c.id = NEW.customer_id;
  
  -- Get owner business name
  SELECT COALESCE(p.business_name, p.name, '') INTO _biz_name
  FROM public.profiles p WHERE p.user_id = NEW.owner_id;
  
  -- Notify customer
  IF _customer_user_id IS NOT NULL AND _customer_user_id != NEW.created_by THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      _customer_user_id,
      'دين جديد',
      'تم تسجيل دين بقيمة ' || NEW.amount || ' ر.ي عليك في ' || _biz_name,
      'debt',
      NEW.id
    );
  END IF;
  
  -- Notify owner (if debt was created by employee)
  IF NEW.created_by != NEW.owner_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.owner_id,
      'تم تسجيل دين جديد',
      'قام موظفك بتسجيل دين بقيمة ' || NEW.amount || ' ر.ي على ' || COALESCE(_customer_name, 'زبون'),
      'debt',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_debt_created
AFTER INSERT ON public.debts
FOR EACH ROW
EXECUTE FUNCTION public.notify_debt_created();

-- Trigger: Notify when payment is created (notify customer + owner)
CREATE OR REPLACE FUNCTION public.notify_payment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _customer_user_id uuid;
  _customer_name text;
  _biz_name text;
BEGIN
  -- Get customer info
  SELECT c.user_id, c.name INTO _customer_user_id, _customer_name
  FROM public.customers c WHERE c.id = NEW.customer_id;
  
  -- Get owner business name
  SELECT COALESCE(p.business_name, p.name, '') INTO _biz_name
  FROM public.profiles p WHERE p.user_id = NEW.owner_id;
  
  -- Notify customer
  IF _customer_user_id IS NOT NULL AND _customer_user_id != NEW.created_by THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      _customer_user_id,
      'تم تسجيل سداد',
      'تم تسجيل سداد بقيمة ' || NEW.amount || ' ر.ي في ' || _biz_name,
      'payment',
      NEW.id
    );
  END IF;
  
  -- Notify owner (if payment was created by employee)
  IF NEW.created_by != NEW.owner_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.owner_id,
      'تم تسجيل سداد جديد',
      'قام موظفك بتسجيل سداد بقيمة ' || NEW.amount || ' ر.ي من ' || COALESCE(_customer_name, 'زبون'),
      'payment',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_payment_created
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_created();

-- Trigger: Notify when order status changes (already handled in edge function, but add for new orders)
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _customer_name text;
BEGIN
  -- Get customer name
  SELECT c.name INTO _customer_name
  FROM public.customers c WHERE c.id = NEW.customer_id;
  
  -- Notify owner about new order
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (
    NEW.owner_id,
    CASE WHEN NEW.type = 'debt_request' THEN 'طلب تسجيل دين جديد' ELSE 'طلب سداد جديد' END,
    CASE WHEN NEW.type = 'debt_request' 
      THEN COALESCE(_customer_name, 'زبون') || ' طلب تسجيل دين بقيمة ' || NEW.amount || ' ر.ي'
      ELSE COALESCE(_customer_name, 'زبون') || ' طلب سداد بقيمة ' || NEW.amount || ' ر.ي'
    END,
    'info',
    NEW.id
  );
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_order();
