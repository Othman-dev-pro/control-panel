
-- تحديث دالة إشعار الدين الجديد مع رسائل محسّنة
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
  _msg text;
BEGIN
  -- Get customer info
  SELECT c.user_id, c.name INTO _customer_user_id, _customer_name
  FROM public.customers c WHERE c.id = NEW.customer_id;
  
  -- Get owner business name
  SELECT COALESCE(p.business_name, p.name, '') INTO _biz_name
  FROM public.profiles p WHERE p.user_id = NEW.owner_id;
  
  -- Notify customer with detailed message
  IF _customer_user_id IS NOT NULL AND _customer_user_id != NEW.created_by THEN
    _msg := 'تم تسجيل عليك دين بمبلغ ' || NEW.amount || ' ريال.' || CHR(10) || 
             'التفاصيل: ' || COALESCE(NEW.description, 'بدون تفاصيل');
    
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      _customer_user_id,
      'إشعار دين جديد - ' || _biz_name,
      _msg,
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

-- تحديث دالة إشعار السداد مع الرصيد المتبقي
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
  _total_debts numeric;
  _total_payments numeric;
  _balance numeric;
  _msg text;
BEGIN
  -- Get customer info
  SELECT c.user_id, c.name INTO _customer_user_id, _customer_name
  FROM public.customers c WHERE c.id = NEW.customer_id;
  
  -- Get owner business name
  SELECT COALESCE(p.business_name, p.name, '') INTO _biz_name
  FROM public.profiles p WHERE p.user_id = NEW.owner_id;
  
  -- Calculate remaining balance for this customer with this owner
  SELECT COALESCE(SUM(amount), 0) INTO _total_debts 
  FROM public.debts WHERE customer_id = NEW.customer_id AND owner_id = NEW.owner_id;
  
  SELECT COALESCE(SUM(amount), 0) INTO _total_payments 
  FROM public.payments WHERE customer_id = NEW.customer_id AND owner_id = NEW.owner_id;
  
  _balance := _total_debts - _total_payments;
  
  -- Notify customer with detailed message including balance
  IF _customer_user_id IS NOT NULL AND _customer_user_id != NEW.created_by THEN
    _msg := 'تم تسديد دفعة من إجمالي الدين.' || CHR(10) ||
             'المبلغ المسدد: ' || NEW.amount || ' ريال.' || CHR(10) ||
             'تفاصيل السداد: ' || COALESCE(NEW.description, 'نقد') || CHR(10) ||
             'المتبقي عليك: ' || _balance || ' ريال.';
    
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      _customer_user_id,
      'إشعار سداد دفعة - ' || _biz_name,
      _msg,
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

-- إنشاء/تحديث التريقرز
DROP TRIGGER IF EXISTS on_debt_inserted ON public.debts;
DROP TRIGGER IF EXISTS on_debt_created ON public.debts;
CREATE TRIGGER on_debt_inserted
  AFTER INSERT ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.notify_debt_created();

DROP TRIGGER IF EXISTS on_payment_inserted ON public.payments;
DROP TRIGGER IF EXISTS on_payment_created ON public.payments;
CREATE TRIGGER on_payment_inserted
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_created();
