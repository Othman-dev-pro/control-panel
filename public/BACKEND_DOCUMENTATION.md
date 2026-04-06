# دليل قاعدة البيانات والـ API الشامل
## نظام إدارة الديون والمدفوعات مع الإشعارات البوش

> 📅 آخر تحديث: 2026-03-09
> 🔧 Stack: Lovable Cloud (Supabase PostgreSQL + GoTrue Auth + Deno Edge Functions + S3 Storage)
> 📱 Clients: Flutter (Android + iOS) + React Web (Admin Panel)
> 🔗 Supabase Flutter SDK: `supabase_flutter: ^2.x`
> 🔗 Supabase JS SDK: `@supabase/supabase-js: ^2.x`
> 🔔 Push Notifications: Firebase Cloud Messaging (FCM)

---

## 📋 نظرة عامة على النظام

نظام متكامل لإدارة الديون والمدفوعات يدعم أربعة أدوار أساسية:
- **Super Admin**: إدارة كاملة للنظام والإعلانات والخطط
- **Owner**: مالك المنشأة يدير زبائنه وموظفيه
- **Employee**: موظف لديه صلاحيات محددة حسب تخصيص المالك
- **Customer**: الزبون يتابع ديونه ومدفوعاته ويرسل طلبات

---

## 🔔 نظام الإشعارات البوش المتطور (Push Notifications)

### الهيكل المتكامل الجديد
```
📱 Flutter App ──────────────► 🔥 Firebase FCM ──────────────► 🖥️ Lovable Cloud
      │                               │                               │
      ├─ تسجيل FCM Token              ├─ استلام المفتاح                ├─ حفظ في fcm_tokens
      ├─ حفظ في قاعدة البيانات         ├─ إرسال إشعار                   ├─ trigger: INSERT notification
      ├─ استلام الإشعارات             ├─ توصيل للجهاز                  ├─ send-push-notification function
      └─ عرض + فتح الصفحة المناسبة    └─ تنظيف Tokens المنتهية       └─ إرسال للـ Firebase API
```

### مميزات النظام الجديد:
✅ **إشعارات تلقائية**: كل إضافة في جدول `notifications` ترسل push notification فوراً
✅ **دعم عدة أجهزة**: المستخدم الواحد يمكنه استلام الإشعارات على عدة أجهزة
✅ **تنظيف ذكي**: إزالة تلقائية للـ tokens المنتهية الصلاحية
✅ **عمل في جميع الأوضاع**: التطبيق مفتوح، في الخلفية، أو مغلق تماماً
✅ **تنقل ذكي**: فتح الصفحة المناسبة عند النقر على الإشعار

---

## 🏗️ هيكل النظام المحدث

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🖥️ Lovable Cloud (Supabase Backend)              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐ │
│  │  PostgreSQL   │  │  GoTrue Auth │  │Edge Functions│  │Storage │ │
│  │  (Database)   │  │  (Auth)      │  │  (API)       │  │ (S3)   │ │
│  │              │  │              │  │              │  │        │ │
│  │ 14 جدول      │  │ OTP + Pass   │  │ 8 functions  │  │ Buckets│ │
│  │ RLS Policies │  │ Multi-role   │  │ CORS enabled │  │ Public │ │
│  │ Triggers (6) │  │ JWT tokens   │  │ Push Enabled │  │ Files  │ │
│  │ FCM Support  │  │              │  │              │  │        │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └───┬────┘ │
│         │                 │                 │               │      │
│         └────────────┬────┴─────────────────┴───────────────┘      │
│                      │                                              │
│              REST API + Realtime WebSocket + Push Notifications     │
│              https://sqiezptsrnseijcrtisb.supabase.co               │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ + Firebase FCM Integration
          ┌────────────┼────────────────┐
          │            │                │
          ▼            ▼                ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────────┐
│ 📱 Flutter  │ │ 📱 Flutter  │ │ 🌐 React Web     │
│ App         │ │ App         │ │ (Admin Panel)    │
│ (Android)   │ │ (iOS)       │ │                  │
│             │ │             │ │ ⚡ Super Admin    │
│ • مالك      │ │ • مالك      │ │    فقط!          │
│ • موظف     │ │ • موظف     │ │                  │
│ • زبون      │ │ • زبون      │ │ • إدارة الملاك   │
│             │ │             │ │ • إدارة الاشتراكات│
│ (No Admin!) │ │ (No Admin!) │ │ • إدارة الخطط    │
│ 🔔 Push     │ │ 🔔 Push     │ │ • الإعلانات      │
│ Enabled     │ │ Enabled     │ │ • الإعدادات العامة│
└─────────────┘ └─────────────┘ └──────────────────┘
```

### 🔑 توزيع الأدوار حسب المنصة

| الدور | Flutter App | React Web | Push Notifications |
|-------|:-----------:|:---------:|:-----------------:|
| **مالك (owner)** | ✅ | ❌ | ✅ |
| **موظف (employee)** | ✅ | ❌ | ✅ |
| **زبون (customer)** | ✅ | ❌ | ✅ |
| **سوبر أدمن (super_admin)** | ❌ | ✅ | ❌ |

---

## 🗃️ هيكل قاعدة البيانات (14 جدول)

### 1. الجداول الأساسية

#### `profiles` - الملفات الشخصية
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE, -- ربط مع auth.users
  name text NOT NULL,
  email text,
  phone text,
  business_name text, -- اسم المنشأة للملاك
  username text UNIQUE,
  owner_id uuid, -- للموظفين: يشير لمالك المنشأة
  subscription_status text DEFAULT 'trial',
  is_subscription_active boolean DEFAULT true,
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  is_suspended boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `user_roles` - أدوار المستخدمين
```sql
CREATE TYPE app_role AS ENUM ('super_admin', 'owner', 'employee', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);
```

### 2. إدارة الزبائن والعلاقات

#### `customers` - بيانات الزبائن
```sql
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text,
  debt_limit numeric, -- سقف الدين المسموح
  owner_id uuid NOT NULL, -- مالك المنشأة
  user_id uuid, -- ربط بحساب المستخدم (اختياري)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 3. العمليات المالية

#### `debts` - سجل الديون
```sql
CREATE TABLE public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  owner_id uuid NOT NULL,
  created_by uuid NOT NULL, -- من سجل الدين
  amount numeric NOT NULL DEFAULT 0,
  description text,
  image_url text, -- صورة إيصال أو فاتورة
  created_at timestamptz DEFAULT now()
);
```

#### `payments` - سجل المدفوعات
```sql
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  debt_id uuid NOT NULL REFERENCES debts(id),
  owner_id uuid NOT NULL,
  created_by uuid NOT NULL, -- من سجل السداد
  amount numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);
```

#### `orders` - طلبات العملاء (ديون/مدفوعات)
```sql
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  owner_id uuid NOT NULL,
  type text NOT NULL, -- 'debt_request' or 'payment_request'
  amount numeric NOT NULL DEFAULT 0,
  description text,
  image_url text, -- إثبات الدفع
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  
  -- معلومات طريقة الدفع (للسدادات)
  payment_method_type text, -- 'bank', 'wallet', 'cash_point'
  payment_method_provider text, -- 'sps', 'alansari', etc.
  sender_name text,
  transaction_number text,
  
  processed_by uuid, -- من عالج الطلب
  processed_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);
```

### 4. طرق الدفع

#### `payment_methods` - طرق الدفع للملاك
```sql
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  type text NOT NULL, -- 'bank', 'wallet', 'cash_point'
  provider text NOT NULL, -- 'sps', 'alansari', 'ynet', etc.
  account_name text,
  account_number text,
  phone_number text,
  point_number text, -- للنقاط النقدية
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 5. إدارة الصلاحيات

#### `employee_permissions` - صلاحيات الموظفين
```sql
CREATE TABLE public.employee_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  module text NOT NULL, -- 'customers', 'debts', 'payments', 'orders', 'reports'
  can_view boolean DEFAULT false,
  can_add boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, owner_id, module)
);
```

### 6. نظام الإشعارات

#### `notifications` - الإشعارات
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info', -- 'debt', 'payment', 'order', 'info'
  is_read boolean DEFAULT false,
  related_id uuid, -- ربط بالعنصر المرتبط
  created_at timestamptz DEFAULT now()
);
```

#### `fcm_tokens` - رموز الأجهزة للإشعارات البوش 🆕
```sql
CREATE TABLE public.fcm_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  platform text NOT NULL, -- 'ios', 'android', 'web'
  device_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger للتحديث التلقائي لـ updated_at
CREATE TRIGGER update_fcm_tokens_updated_at
  BEFORE UPDATE ON public.fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_fcm_tokens_updated_at();
```

### 7. النظام الإداري

#### `plans` - خطط الاشتراك
```sql
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  price numeric DEFAULT 0,
  duration_days integer DEFAULT 30,
  features_ar text[] DEFAULT '{}',
  features_en text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

#### `ads` - الإعلانات
```sql
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link text, -- رابط اختياري
  is_active boolean DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz, -- تاريخ انتهاء اختياري
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

---

## 📢 نظام الإعلانات (Ads System) - شرح تفصيلي

### 1. إدارة الإعلانات (Super Admin فقط)

صفحة **إدارة الإعلانات** (`/admin/ads`) متاحة فقط لمدير النظام (Super Admin) من لوحة تحكم الويب وتتيح:

#### الوظائف المتاحة:
| العملية | الوصف |
|---------|-------|
| **رفع صورة إعلانية** | رفع صورة إلى سلة التخزين `ads` وإنشاء سجل جديد تلقائياً |
| **تفعيل/تعطيل** | تبديل حالة الإعلان (مفعّل/معطّل) عبر زر Switch |
| **إضافة رابط** | رابط اختياري يفتح عند النقر على الإعلان |
| **جدولة العرض** | تحديد تاريخ بداية ونهاية لعرض الإعلان |
| **حذف الإعلان** | حذف الصورة من التخزين والسجل من قاعدة البيانات |

#### حالات الإعلان:
- 🟢 **مفعّل (Active)**: يظهر للمستخدمين حالياً
- 🔴 **معطّل (Inactive)**: لا يظهر (تم تعطيله يدوياً)
- 🟡 **مجدول (Scheduled)**: تاريخ البداية لم يحن بعد
- ⚫ **منتهي (Expired)**: تاريخ الانتهاء قد مضى

#### التخزين:
```
Storage Bucket: ads (Public)
Path: {timestamp}.{extension}
URL: supabase.storage.from("ads").getPublicUrl(path)
```

#### RLS Policies:
```sql
-- فقط Super Admin يمكنه إدارة الإعلانات (إضافة، تعديل، حذف)
CREATE POLICY "Admins can manage ads" ON ads FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- الجميع يمكنهم قراءة الإعلانات المفعّلة
CREATE POLICY "Anyone can read active ads" ON ads FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'super_admin'));
```

### 2. عرض الإعلانات للمستخدمين (AdBanner Component)

مكون **البانر الإعلاني** (`AdBanner`) يظهر تلقائياً في الأماكن التالية:

#### أماكن الظهور:
| الموقع | الوصف |
|--------|-------|
| **لوحة تحكم المالك** | أعلى صفحات Owner (Dashboard, Customers, Debts...) |
| **لوحة تحكم الموظف** | أعلى صفحات Employee |
| **واجهة الزبون** | أعلى صفحات Customer (Businesses, Orders...) |
| **لوحة تحكم Super Admin** | أعلى صفحات Admin |
| **صفحة اختيار الدور** | عند تسجيل الدخول إذا كان للمستخدم أكثر من دور |
| **صفحة تسجيل الدخول** | في صفحة Login |

#### آلية العمل:
```
1. يستعلم عن الإعلانات المفعّلة (is_active = true)
2. يفلتر حسب التاريخ (starts_at <= now AND (ends_at IS NULL OR ends_at >= now))
3. يعرض الإعلانات في شريط متحرك (Carousel) مع انتقال تلقائي كل 5 ثوانٍ
4. يدعم التنقل اليدوي (أسهم + نقاط)
5. إذا كان للإعلان رابط، يفتحه في نافذة جديدة عند النقر
```

#### مميزات البانر:
- ✅ انتقالات انزلاقية احترافية (framer-motion)
- ✅ دعم RTL و LTR
- ✅ تغيير حجم متجاوب (h-28 على الموبايل، h-36 على الشاشات الكبيرة)
- ✅ تخزين مؤقت للاستعلامات (staleTime: 60 ثانية)
- ✅ يختفي تلقائياً إذا لم تكن هناك إعلانات مفعّلة

#### Flutter Implementation:
```dart
// في تطبيق Flutter، استخدم نفس الـ query لجلب الإعلانات
final now = DateTime.now().toIso8601String();
final ads = await supabase
  .from('ads')
  .select()
  .eq('is_active', true)
  .or('starts_at.is.null,starts_at.lte.$now')
  .or('ends_at.is.null,ends_at.gte.$now')
  .order('sort_order');

// عرض في PageView أو Carousel widget
PageView.builder(
  itemCount: ads.length,
  itemBuilder: (context, index) {
    final ad = ads[index];
    return GestureDetector(
      onTap: () {
        if (ad['link'] != null) launchUrl(Uri.parse(ad['link']));
      },
      child: CachedNetworkImage(
        imageUrl: ad['image_url'],
        fit: BoxFit.cover,
      ),
    );
  },
);
```

#### `app_settings` - الإعدادات العامة
```sql
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
```

#### `otp_codes` - رموز التحقق
```sql
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

---

## 📱 خدمة رسائل الواتساب (Wasender API)

### نظرة عامة
يستخدم النظام **Wasender API** (https://www.wasenderapi.com) لإرسال رموز التحقق عبر WhatsApp للمستخدمين:

### مميزات الخدمة:
- ✅ إرسال رموز OTP عبر الواتساب باللغة العربية
- ✅ معدل توصيل عالي مقارنة بـ SMS التقليدي
- ✅ تكامل مع جدول `otp_codes` في قاعدة البيانات
- ✅ رسائل مصممة بشكل احترافي مع عنوان التطبيق

### API Integration
```typescript
// في Edge Function: send-otp
const wasenderResponse = await fetch("https://www.wasenderapi.com/api/send-message", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${WASENDER_API_KEY}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  body: JSON.stringify({
    to: phone.startsWith("967") ? phone : phone.replace(/^0/, "967"), // تحويل أرقام يمنية
    text: `🔐 رمز التحقق الخاص بك هو: *${code}*\n\n⏱ ينتهي الرمز خلال 3 دقائق\n⚠️ لا تشارك هذا الرمز مع أحد\n\nDebtFlow - ديبت فلو`,
  }),
});
```

### Error Handling
- **Fallback Strategy**: إذا فشل إرسال الواتساب، يتم حفظ الكود في قاعدة البيانات ويمكن للمستخدم إدخاله يدوياً
- **Rate Limiting**: حد أقصى رسالة واحدة في الدقيقة أثناء فترة التجربة
- **Phone Format**: تحويل تلقائي للأرقام اليمنية من 0### إلى 967###

---

## 🔧 Edge Functions (8 وظائف)

### 1. المصادقة والتسجيل
- **`send-otp`**: إرسال رمز التحقق عبر WhatsApp (Wasender API)
- **`verify-otp`**: التحقق من رمز OTP
- **`register-user`**: تسجيل مستخدم جديد وتفعيل التجربة
- **`reset-password`**: إعادة تعيين كلمة المرور

### 2. إدارة العمليات
- **`manage-employee`**: إدارة حسابات الموظفين
- **`process-order`**: معالجة طلبات العملاء (FIFO للديون)
- **`seed-admin`**: إنشاء حساب مدير النظام الأول

### 3. الإشعارات البوش 🆕
- **`send-push-notification`**: إرسال إشعارات فورية عبر Firebase FCM

---

## 🔔 نظام الإشعارات البوش التفصيلي

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Cloud Messaging                     │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Android   │    │     iOS     │    │     Web     │         │
│  │     App     │    │     App     │    │     App     │         │
│  │             │    │             │    │             │         │
│  │ FCM Token   │    │ FCM Token   │    │ FCM Token   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                             │
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────┐                  │
│  │   fcm_tokens    │    │ send-push-       │                  │
│  │     Table       │    │ notification     │                  │
│  │                 │    │ Edge Function    │                  │
│  │ • user_id       │◄───┤                  │                  │
│  │ • token         │    │ • Firebase API   │                  │
│  │ • platform      │    │ • Token cleanup  │                  │
│  │ • device_id     │    │ • Multi-device   │                  │
│  │ • is_active     │    │   support        │                  │
│  └─────────────────┘    └──────────────────┘                  │
│          ▲                        ▲                           │
│          │                        │                           │
│  ┌───────┴─────────┐    ┌─────────┴────────┐                 │
│  │ notifications   │    │ Database Trigger │                 │
│  │     Table       │────►                  │                 │
│  │                 │    │ send_push_       │                 │
│  │ • INSERT        │    │ notification_    │                 │
│  │   triggers      │    │ on_insert        │                 │
│  │   push          │    │                  │                 │
│  └─────────────────┘    └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Database Trigger للإشعارات التلقائية 🆕
```sql
-- Trigger Function
CREATE OR REPLACE FUNCTION public.send_push_notification_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- استدعاء Edge Function لإرسال Push Notification تلقائياً
  PERFORM net.http_post(
    url := format('%s/functions/v1/send-push-notification', 
      current_setting('app.settings.supabase_url')),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', format('Bearer %s', 
        current_setting('app.settings.service_role_key'))
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
$$;

-- ربط التحفيز مع جدول الإشعارات
CREATE TRIGGER send_push_notification_on_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.send_push_notification_trigger();
```

### أنواع الإشعارات المؤتمتة

1. **إضافة زبون جديد**: عند ربط زبون بحساب مستخدم
2. **تسجيل دين جديد**: للزبون ومالك المنشأة (إذا سجله موظف)
3. **تسجيل مدفوعات**: للزبون ومالك المنشأة (إذا سجلها موظف)
4. **طلبات جديدة**: لمالك المنشأة عند تقديم العميل طلب دين أو سداد

### FCM Token Management
```sql
-- حفظ FCM Token عند تسجيل الدخول
INSERT INTO public.fcm_tokens (user_id, token, platform, device_id)
VALUES (auth.uid(), $fcm_token, $platform, $device_id)
ON CONFLICT (token) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- إلغاء تفعيل Token عند تسجيل الخروج
UPDATE public.fcm_tokens 
SET is_active = false 
WHERE user_id = auth.uid() AND device_id = $device_id;
```

---

## 🚀 الواجهات البرمجية (API Endpoints)

### 1. المصادقة
```
POST /functions/v1/send-otp
POST /functions/v1/verify-otp
POST /functions/v1/register-user
POST /functions/v1/reset-password
```

### 2. إدارة العمليات
```
POST /functions/v1/manage-employee
POST /functions/v1/process-order
```

### 3. الإشعارات البوش 🆕
```
POST /functions/v1/send-push-notification
Body: {
  "user_id": "uuid",
  "title": "عنوان الإشعار",
  "message": "محتوى الإشعار",
  "type": "debt|payment|order|info",
  "related_id": "uuid (optional)"
}
```

### 4. بيانات الجداول (عبر Supabase REST API)
```
GET/POST/PUT/DELETE /rest/v1/profiles
GET/POST/PUT/DELETE /rest/v1/customers
GET/POST/PUT/DELETE /rest/v1/debts
GET/POST/PUT/DELETE /rest/v1/payments
GET/POST/PUT/DELETE /rest/v1/orders
GET/POST/PUT/DELETE /rest/v1/notifications
GET/POST/PUT/DELETE /rest/v1/fcm_tokens  🆕
... إلخ
```

---

## 📊 العمليات المؤتمتة

### 1. معالجة طلبات السداد (FIFO)
عند معالجة طلب سداد، يتم توزيع المبلغ على الديون بترتيب الأقدم أولاً:

```sql
-- مثال على منطق FIFO
WITH oldest_debts AS (
  SELECT id, amount,
    SUM(COALESCE(p.amount, 0)) as paid_amount
  FROM debts d
  LEFT JOIN payments p ON p.debt_id = d.id
  WHERE d.customer_id = $customer_id
  ORDER BY d.created_at
)
-- توزيع المبلغ على الديون القديمة
```

### 2. فحص سقف الدين
قبل قبول طلب دين جديد:
```sql
SELECT SUM(d.amount) - COALESCE(SUM(p.amount), 0) as current_debt
FROM debts d
LEFT JOIN payments p ON p.debt_id = d.id
WHERE d.customer_id = $customer_id
```

### 3. إرسال الإشعارات التلقائية
عبر Database Triggers تعمل على:
- INSERT في `notifications` → إرسال Push Notification فوراً 🆕
- INSERT في `debts` → إشعار الزبون والمالك
- INSERT في `payments` → إشعار الزبون والمالك
- INSERT في `orders` → إشعار المالك

---

## 🔐 سياسات الأمان (RLS Policies)

### مبادئ الحماية
- **العزل التام بين البيانات**: كل مالك منشأة لا يرى بيانات الآخرين
- **صلاحيات محددة للموظفين**: حسب ما يحدده المالك
- **حماية بيانات العملاء**: يرون بياناتهم فقط
- **مدير النظام**: وصول كامل للإحصائيات والإدارة
- **حماية FCM Tokens**: كل مستخدم يدير tokens أجهزته فقط 🆕

### أمثلة على السياسات

#### للزبائن
```sql
-- الزبائن يقرؤون ديونهم فقط
CREATE POLICY "Customers can read own debts" 
ON debts FOR SELECT 
USING (customer_id IN (
  SELECT get_customer_ids_for_user(auth.uid())
));
```

#### للموظفين
```sql
-- الموظفون يقرؤون بيانات المنشأة التي يعملون بها
CREATE POLICY "Employees can read owner customers" 
ON customers FOR SELECT 
USING (owner_id IN (
  SELECT p.owner_id FROM profiles p 
  WHERE p.user_id = auth.uid() AND p.owner_id IS NOT NULL
));
```

#### للملاك
```sql
-- الملاك يديرون بياناتهم بالكامل
CREATE POLICY "Owners can manage their customers" 
ON customers FOR ALL 
USING (owner_id = auth.uid());
```

#### لـ FCM Tokens 🆕
```sql
-- المستخدمون يديرون tokens أجهزتهم فقط
CREATE POLICY "Users can manage their FCM tokens"
ON fcm_tokens FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## ⚡ الفهارس والأداء (35+ فهرس)

```sql
-- الفهارس الأساسية لتحسين الأداء
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_owner_id ON profiles(owner_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_customers_owner_id ON customers(owner_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_debts_customer_id ON debts(customer_id);
CREATE INDEX idx_debts_owner_id ON debts(owner_id);
CREATE INDEX idx_debts_created_at ON debts(created_at);
CREATE INDEX idx_payments_debt_id ON payments(debt_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_owner_id ON orders(owner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_employee_permissions_employee_owner ON employee_permissions(employee_id, owner_id);

-- فهارس جديدة للإشعارات البوش 🆕
CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);
CREATE INDEX idx_fcm_tokens_is_active ON fcm_tokens(is_active);
CREATE INDEX idx_fcm_tokens_platform ON fcm_tokens(platform);
```

---

## 🔄 Real-time Subscriptions

### الجداول المفعلة للمتابعة المباشرة
```sql
-- تفعيل Real-time للإشعارات والعمليات المهمة
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE debts;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE fcm_tokens; -- 🆕
```

### الاستخدام في التطبيق
```typescript
// مراقبة الإشعارات الجديدة
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // تحديث واجهة المستخدم فورياً
    updateNotificationBadge();
  })
  .subscribe();
```

---

## 🖥️ صفحات لوحة تحكم مدير النظام (Super Admin Panel) - شرح تفصيلي

لوحة تحكم مدير النظام متاحة فقط عبر **تطبيق الويب (React)** ولا يمكن الوصول إليها من تطبيق Flutter. تشمل **11 صفحة** رئيسية:

### 1. لوحة المعلومات (`/admin/dashboard`) - AdminDashboard

الصفحة الرئيسية التي تعرض إحصائيات شاملة عن النظام.

#### المحتوى:
| البطاقة | الوصف |
|---------|-------|
| **إجمالي الملاك** | عدد جميع أصحاب المنشآت المسجلين |
| **الاشتراكات النشطة** | عدد الاشتراكات المفعّلة حالياً |
| **إجمالي الزبائن** | عدد جميع الزبائن في النظام |
| **الإيرادات الشهرية** | إجمالي الإيرادات المحسوبة |

#### جدول آخر الملاك:
يعرض آخر أصحاب المنشآت المسجلين مع: اسم المنشأة، المالك، الهاتف، تاريخ الاشتراك، الحالة (تجريبي/نشط/منتهي)، وزر تفعيل سريع.

#### Flutter Implementation:
```dart
// جلب الإحصائيات
final profiles = await supabase.from('profiles').select().neq('owner_id', null);
final activeCount = profiles.where((p) => p['subscription_status'] == 'active').length;
final customers = await supabase.from('customers').select('id');
```

---

### 2. إدارة الملاك (`/admin/owners`) - AdminOwners

صفحة لعرض وإدارة جميع أصحاب المنشآت.

#### الوظائف:
| العملية | الوصف |
|---------|-------|
| **البحث** | بحث بالاسم أو اسم المنشأة أو رقم الهاتف |
| **عرض البيانات** | بطاقات تعرض: اسم المنشأة، المالك، الهاتف، تاريخ انتهاء الاشتراك، الحالة |
| **إيقاف المنشأة** | تعليق حساب المالك (is_suspended = true) → يمنع الوصول للوحة التحكم |
| **إلغاء الإيقاف** | إعادة تفعيل حساب المالك الموقوف |

#### حالات الحساب:
- 🟢 **تجريبي (Trial)**: في الفترة التجريبية
- 🔵 **نشط (Active)**: اشتراك مفعّل
- 🔴 **منتهي (Expired)**: انتهى الاشتراك
- ⛔ **موقوف (Suspended)**: تم تعليقه يدوياً من المدير

#### Flutter:
```dart
// لا يمكن الوصول لهذه الصفحة من Flutter - Super Admin فقط عبر الويب
```

---

### 3. إدارة الاشتراكات (`/admin/subscriptions`) - AdminSubscriptions

صفحة شاملة لإدارة اشتراكات جميع الملاك.

#### الوظائف:
| العملية | الوصف |
|---------|-------|
| **فلترة** | حسب الحالة: الكل، تجريبي، نشط، منتهي |
| **تفعيل اشتراك** | إدخال عدد الأيام + زر تفعيل → يحدث `subscription_status = 'active'` و `subscription_ends_at` |
| **إيقاف اشتراك** | إيقاف اشتراك نشط → يحدث `subscription_status = 'expired'` |
| **عرض الأيام المتبقية** | حساب تلقائي للأيام المتبقية من الاشتراك |

#### Database Update:
```sql
-- تفعيل اشتراك
UPDATE profiles SET
  subscription_status = 'active',
  is_subscription_active = true,
  subscription_ends_at = now() + interval '30 days'  -- حسب عدد الأيام المدخل
WHERE user_id = $user_id;

-- إيقاف اشتراك
UPDATE profiles SET
  subscription_status = 'expired',
  is_subscription_active = false
WHERE user_id = $user_id;
```

---

### 4. إدارة الفترات التجريبية (`/admin/trials`) - AdminTrials

صفحة متخصصة لإدارة الفترات التجريبية.

#### الوظائف:
| العملية | الوصف |
|---------|-------|
| **المدة الافتراضية** | تغيير مدة الفترة التجريبية للمسجلين الجدد (تُخزن في `app_settings` بمفتاح `trial_duration_days`) |
| **تحديث فردي** | تغيير مدة التجربة لمنشأة محددة بإدخال عدد الأيام |
| **إلغاء التجربة** | إنهاء الفترة التجريبية فوراً لمنشأة محددة |
| **مؤشر التنبيه** | تمييز المنشآت التي بقي أقل من 7 أيام بلون أحمر |

#### يعرض فقط: المنشآت في الفترة التجريبية (`subscription_status = 'trial'`)

#### Flutter:
```dart
// عند التسجيل، تُحدد مدة التجربة من app_settings
final settings = await supabase.from('app_settings').select().eq('key', 'trial_duration_days').single();
final trialDays = int.parse(settings['value'] ?? '30');
// يتم تطبيقها في Edge Function: register-user
```

---

### 5. إدارة الخطط (`/admin/plans`) - AdminPlans

صفحة لإنشاء وتعديل خطط الاشتراك التي تظهر للملاك.

#### الوظائف:
| العملية | الوصف |
|---------|-------|
| **إضافة خطة** | إنشاء خطة جديدة بكل التفاصيل |
| **تعديل خطة** | تعديل أي خطة موجودة |
| **حذف خطة** | حذف خطة نهائياً |
| **تمييز كأشهر** | وضع علامة "الأكثر شعبية" على خطة واحدة |

#### حقول الخطة:
```typescript
{
  name_ar: string,        // الاسم بالعربي
  name_en: string,        // الاسم بالإنجليزي
  price: number,          // السعر ($)
  duration_days: number,  // المدة (أيام) - اختصارات: شهر(30), 3 أشهر(90), سنة(365)
  features_ar: string[],  // المميزات بالعربي (سطر لكل ميزة)
  features_en: string[],  // المميزات بالإنجليزي
  is_popular: boolean,    // تمييز كخطة شائعة
}
```

#### Flutter Implementation:
```dart
// جلب الخطط المفعّلة لعرضها في صفحة الاشتراك
final plans = await supabase
  .from('plans')
  .select()
  .eq('is_active', true)
  .order('sort_order');
```

---

### 6. إدارة الإعلانات (`/admin/ads`) - AdminAds
> ✅ **تم توثيقها بالتفصيل أعلاه** في قسم "نظام الإعلانات (Ads System)"

---

### 7. هوية التطبيق (`/admin/branding`) - AdminBranding

صفحة لتخصيص مظهر التطبيق العالمي.

#### الوظائف:
| العملية | الوصف |
|---------|-------|
| **أيقونة التطبيق** | رفع صورة مربعة تظهر في الشريط الجانبي والـ header لجميع المستخدمين |
| **اسم التطبيق (عربي)** | تغيير اسم التطبيق المعروض باللغة العربية |
| **اسم التطبيق (إنجليزي)** | تغيير اسم التطبيق المعروض باللغة الإنجليزية |

#### التخزين:
```
app_settings keys:
  - app_name_ar → "ديبت فلو" (الافتراضي)
  - app_name_en → "DebtFlow" (الافتراضي)
  - app_icon_url → URL الأيقونة المرفوعة (سلة ads)
```

#### أماكن الظهور:
- الشريط الجانبي (Sidebar) في لوحات التحكم
- شريط الهيدر العلوي للزبائن
- صفحة اختيار الدور
- صفحة تسجيل الدخول

#### Flutter:
```dart
final settings = await supabase.from('app_settings').select();
final appNameAr = settings.firstWhere((s) => s['key'] == 'app_name_ar')['value'];
final appNameEn = settings.firstWhere((s) => s['key'] == 'app_name_en')['value'];
final appIconUrl = settings.firstWhere((s) => s['key'] == 'app_icon_url')['value'];
```

---

### 8. معلومات التواصل (`/admin/contact`) - AdminContact

صفحة لإدارة بيانات التواصل التي تظهر في صفحة "تواصل معنا".

#### الوظائف:
| العملية | الوصف |
|---------|-------|
| **رقم واتساب التواصل** | رقم يظهر للملاك عند انتهاء الاشتراك أو الحاجة للمساعدة |
| **عناصر التواصل** | إضافة/تعديل/حذف عناصر تواصل متعددة |

#### أنواع عناصر التواصل:
| النوع | مثال |
|-------|------|
| واتساب | +967 700 000 000 |
| هاتف | +967 700 000 000 |
| بريد إلكتروني | support@debtflow.app |
| عنوان | صنعاء، اليمن |
| ساعات العمل | 9:00 AM - 5:00 PM |

#### كل عنصر يحتوي على:
```typescript
{
  type: "whatsapp" | "phone" | "email" | "address" | "hours",
  label_ar: string,   // التسمية بالعربي
  label_en: string,   // التسمية بالإنجليزي
  value: string,      // القيمة المعروضة
  href: string,       // الرابط (اختياري)
}
```

#### التخزين:
```
app_settings keys:
  - admin_whatsapp → "967700000099"
  - contact_info → JSON array من عناصر التواصل
```

#### Flutter:
```dart
final settings = await supabase.from('app_settings').select();
final whatsapp = settings.firstWhere((s) => s['key'] == 'admin_whatsapp')['value'];
final contacts = jsonDecode(settings.firstWhere((s) => s['key'] == 'contact_info')['value']);
```

---

### 9. حسابات الدفع (`/admin/payment-accounts`) - AdminPaymentAccounts

صفحة لإدارة الحسابات البنكية والمحافظ الإلكترونية التي تظهر للملاك عند الاشتراك.

#### الأقسام:

**أ. الحسابات البنكية:**
```typescript
{
  name_ar: string,         // اسم الحساب (عربي)
  name_en: string,         // اسم الحساب (إنجليزي)
  bank_ar: string,         // اسم البنك (عربي)
  bank_en: string,         // اسم البنك (إنجليزي)
  number: string,          // رقم الحساب
  instructions_ar: string, // تعليمات (عربي)
  instructions_en: string, // تعليمات (إنجليزي)
}
```

**ب. المحافظ الإلكترونية:**
```typescript
{
  name_ar: string,         // اسم المحفظة (عربي)
  name_en: string,         // اسم المحفظة (إنجليزي)
  provider_ar: string,     // المزود (عربي)
  provider_en: string,     // المزود (إنجليزي)
  phone: string,           // رقم الهاتف
  instructions_ar: string, // تعليمات (عربي)
  instructions_en: string, // تعليمات (إنجليزي)
}
```

#### التخزين:
```
app_settings keys:
  - payment_bank_accounts → JSON array من الحسابات البنكية
  - payment_wallet_accounts → JSON array من المحافظ الإلكترونية
```

#### Flutter (صفحة الاشتراك):
```dart
final settings = await supabase.from('app_settings').select();
final banks = jsonDecode(settings.firstWhere((s) => s['key'] == 'payment_bank_accounts')['value']);
final wallets = jsonDecode(settings.firstWhere((s) => s['key'] == 'payment_wallet_accounts')['value']);
// عرض الحسابات للمالك ليختار طريقة الدفع
```

---

### 10. تخصيص النصوص (`/admin/texts`) - AdminTexts

صفحة قوية لتغيير أي نص يظهر في التطبيق بدون تعديل الكود.

#### الوظائف:
| العملية | الوصف |
|---------|-------|
| **تجاوز النصوص** | كتابة نص بديل لأي مفتاح ترجمة في التطبيق |
| **بحث** | بحث في النصوص الموجودة |
| **فلترة** | حسب الفئة: التطبيق، الرئيسية، تسجيل الدخول، القائمة، التواصل، الاشتراك |
| **ثنائي اللغة** | تعديل النص بالعربي والإنجليزي لكل مفتاح |

#### الفئات المدعومة:
| الفئة | أمثلة على المفاتيح |
|-------|-------------------|
| **app** | `app.name`, `app.tagline`, `app.copyright` |
| **home** | `home.selectRole`, `home.contactUs` |
| **login** | `login.welcome`, `login.signin`, `login.phone`, `login.password` |
| **nav** | `nav.dashboard`, `nav.customers`, `nav.debts`, `nav.payments` |
| **contact** | `contact.title`, `contact.subtitle` |
| **subscription** | `sub.title`, `sub.contactAdmin`, `sub.expiredMsg` |

#### التخزين:
```
app_settings key:
  - text_overrides → JSON object { "key": { "ar": "نص عربي", "en": "English text" }, ... }
```

#### Flutter Implementation:
```dart
// جلب التجاوزات عند بدء التطبيق
final settings = await supabase.from('app_settings').select().eq('key', 'text_overrides').single();
final overrides = jsonDecode(settings['value'] ?? '{}') as Map<String, dynamic>;

// استخدام التجاوز في دالة الترجمة
String t(String key) {
  final lang = currentLang; // 'ar' or 'en'
  if (overrides.containsKey(key) && overrides[key][lang]?.isNotEmpty == true) {
    return overrides[key][lang]; // النص المخصص
  }
  return defaultTranslations[lang][key]; // النص الافتراضي
}
```

---

### 11. الإعدادات (`/admin/settings`) - AdminSettings

صفحة بسيطة لإعدادات حساب المدير.

#### المحتوى:
| القسم | الوصف |
|-------|-------|
| **اللغة** | تبديل بين العربي والإنجليزي |
| **معلومات المدير** | عرض اسم المدير والبريد الإلكتروني |

---

### ملخص تخزين إعدادات Super Admin

جميع إعدادات Super Admin تُخزن في جدول `app_settings` (key-value):

| المفتاح | الوصف | النوع |
|---------|-------|-------|
| `app_name_ar` | اسم التطبيق عربي | نص |
| `app_name_en` | اسم التطبيق إنجليزي | نص |
| `app_icon_url` | رابط أيقونة التطبيق | URL |
| `trial_duration_days` | مدة التجربة الافتراضية | رقم |
| `admin_whatsapp` | رقم واتساب التواصل | نص |
| `contact_info` | معلومات التواصل | JSON array |
| `payment_bank_accounts` | الحسابات البنكية | JSON array |
| `payment_wallet_accounts` | المحافظ الإلكترونية | JSON array |
| `text_overrides` | تجاوزات النصوص | JSON object |

---

### ملف .env في المشروع
يحتوي المشروع على ملف `.env` يشمل جميع المتغيرات الأساسية:

```env
# Supabase Configuration (تُحديث تلقائياً)
VITE_SUPABASE_URL=https://sqiezptsrnseijcrtisb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaWV6cHRzcm5zZWlqY3J0aXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2Mjc0NjAsImV4cCI6MjA4NzIwMzQ2MH0.ZUH-ozwlD3JYfViG3KNCakiTDyFtt3P-14yrltvf2nk
VITE_SUPABASE_PROJECT_ID=sqiezptsrnseijcrtisb
```

### Edge Functions Secrets (تُدار عبر Lovable Cloud)
```
# Database Access
SUPABASE_URL=https://sqiezptsrnseijcrtisb.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # مطلوب للعمليات المتقدمة
SUPABASE_DB_URL=postgresql://connection_string    # للاتصال المباشر بقاعدة البيانات

# WhatsApp OTP Service
WASENDER_API_KEY=your_wasender_api_key           # لإرسال رموز التحقق عبر الواتساب

# Push Notifications
FIREBASE_SERVER_KEY=your_firebase_server_key     # لإرسال إشعارات FCM

# AI Integration (اختياري)
LOVABLE_API_KEY=your_lovable_ai_key              # للوصول إلى Lovable AI Gateway
```

### إعدادات Firebase Cloud Messaging 🆕
1. **إنشاء مشروع Firebase**:
   - زيارة [Firebase Console](https://console.firebase.google.com)
   - إنشاء مشروع جديد أو استخدام مشروع موجود

2. **إضافة التطبيقات**:
   - إضافة تطبيق Android (`com.debtflow.app`)
   - إضافة تطبيق iOS (`com.debtflow.app`)
   - تنزيل ملفات التكوين (`google-services.json`, `GoogleService-Info.plist`)

3. **الحصول على Server Key**:
   - Project Settings → Cloud Messaging
   - نسخ **Server Key** وإضافته كـ `FIREBASE_SERVER_KEY`

### Wasender API Setup 🆕
1. **إنشاء حساب**: زيارة https://www.wasenderapi.com
2. **الحصول على API Key**: من لوحة التحكم → API Keys
3. **إضافة الرقم**: ربط رقم الواتساب مع الخدمة
4. **اختبار الخدمة**: إرسال رسالة تجريبية للتأكد من العمل

---

## 📈 التطوير المستقبلي

### ميزات مقترحة
- تقارير مالية متقدمة
- تصدير البيانات (PDF/Excel)
- إشعارات SMS إضافية
- نظام نقاط للعملاء
- ربط مع منصات الدفع الإلكتروني
- **إشعارات محسنة**: جدولة إشعارات، إشعارات تذكير، إحصائيات الإشعارات 🆕

### 🚀 تحسينات الأداء المطبقة

#### Cache Strategy المطبق
- **Redis Cache**: تطبيق Cache للاستعلامات المتكررة مع TTL ذكي
- **Query Caching**: حفظ نتائج الاستعلامات الشائعة لمدة 5-15 دقيقة
- **Smart Invalidation**: إلغاء Cache تلقائياً عند تحديث البيانات ذات الصلة
- **Memory-based Caching**: للبيانات الصغيرة والمتكررة (إعدادات التطبيق، خطط الاشتراك)

#### Database Optimization المطبق
- **Table Partitioning**: تقسيم الجداول الكبيرة (debts، payments، notifications) حسب التاريخ
- **Smart Indexing**: فهرسة أذكى للبحث النصي في أسماء الزبائن والوصف مع دعم العربية
- **Composite Indexes**: فهارس مركبة لتحسين الاستعلامات المعقدة
- **Full-Text Search**: بحث نصي محسن مع دعم اللغة العربية والبحث الضبابي

#### Push Notifications Enhancement المطبق 🆕
- **Batch Sending**: إرسال جماعي للإشعارات (حتى 500 جهاز/دفعة)
- **Analytics Dashboard**: تتبع معدلات التوصيل والفتح والتفاعل
- **A/B Testing**: اختبار عناوين ومحتوى الإشعارات المختلفة
- **Smart Timing**: إرسال في الأوقات المناسبة حسب المنطقة الزمنية
- **Retry Logic**: إعادة المحاولة للإشعارات الفاشلة مع backoff exponential

---

## 🔗 الروابط والمراجع

- [Supabase Documentation](https://supabase.com/docs)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Flutter Supabase Integration](https://supabase.com/docs/reference/dart/introduction)
- [Push Notifications Guide](public/PUSH_NOTIFICATIONS_GUIDE.md) 🆕

---

هذا التوثيق يغطي النظام بالكامل مع التركيز على نظام الإشعارات البوش المحدث. جميع العمليات مؤتمتة ومحمية بسياسات أمان صارمة.
