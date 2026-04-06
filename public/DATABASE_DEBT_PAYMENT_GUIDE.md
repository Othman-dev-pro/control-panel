# دليل قاعدة البيانات الشامل - نظام الديون والمدفوعات
# Complete Database Guide - Debts & Payments System

---

## 📋 الفهرس | Table of Contents

1. [هيكل الجداول | Tables Structure](#1-هيكل-الجداول)
2. [تسجيل دين جديد | Create Debt](#2-تسجيل-دين-جديد)
3. [حذف دين | Delete Debt](#3-حذف-دين)
4. [تسجيل سداد | Create Payment](#4-تسجيل-سداد)
5. [نظام الطلبات من الزبون | Customer Orders](#5-نظام-الطلبات)
6. [معالجة الطلبات | Process Orders](#6-معالجة-الطلبات)
7. [سقف الدين | Debt Limit](#7-سقف-الدين)
8. [الإشعارات التلقائية | Auto Notifications](#8-الإشعارات-التلقائية)
9. [سياسات الأمان RLS | Security Policies](#9-سياسات-الأمان)
10. [الدوال المساعدة | Helper Functions](#10-الدوال-المساعدة)
11. [إحصائيات لوحة التحكم | Dashboard Stats](#11-إحصائيات-لوحة-التحكم)
12. [تخزين الصور | Image Storage](#12-تخزين-الصور)

---

## 1. هيكل الجداول | Tables Structure

### جدول الديون `debts`

| العمود | النوع | إلزامي | القيمة الافتراضية | الوصف |
|--------|-------|--------|-------------------|-------|
| `id` | uuid | ✅ | `gen_random_uuid()` | المعرف الفريد |
| `customer_id` | uuid | ✅ | - | معرف الزبون (FK → customers.id) |
| `owner_id` | uuid | ✅ | - | معرف المالك |
| `amount` | numeric | ✅ | `0` | مبلغ الدين |
| `description` | text | ❌ | `null` | وصف الدين (إجباري في الواجهة) |
| `image_url` | text | ❌ | `null` | رابط صورة مرفقة |
| `created_by` | uuid | ✅ | - | من أنشأ السجل (مالك أو موظف) |
| `created_at` | timestamptz | ✅ | `now()` | تاريخ الإنشاء |

**العلاقات (Foreign Keys):**
- `debts.customer_id` → `customers.id`

---

### جدول المدفوعات `payments`

| العمود | النوع | إلزامي | القيمة الافتراضية | الوصف |
|--------|-------|--------|-------------------|-------|
| `id` | uuid | ✅ | `gen_random_uuid()` | المعرف الفريد |
| `debt_id` | uuid | ✅ | - | معرف الدين المرتبط (FK → debts.id) |
| `customer_id` | uuid | ✅ | - | معرف الزبون (FK → customers.id) |
| `owner_id` | uuid | ✅ | - | معرف المالك |
| `amount` | numeric | ✅ | `0` | مبلغ السداد |
| `description` | text | ❌ | `null` | وصف السداد |
| `created_by` | uuid | ✅ | - | من أنشأ السجل |
| `created_at` | timestamptz | ✅ | `now()` | تاريخ الإنشاء |

**العلاقات (Foreign Keys):**
- `payments.debt_id` → `debts.id`
- `payments.customer_id` → `customers.id`

---

### جدول الطلبات `orders`

| العمود | النوع | إلزامي | القيمة الافتراضية | الوصف |
|--------|-------|--------|-------------------|-------|
| `id` | uuid | ✅ | `gen_random_uuid()` | المعرف الفريد |
| `customer_id` | uuid | ✅ | - | معرف الزبون (FK → customers.id) |
| `owner_id` | uuid | ✅ | - | معرف المالك |
| `amount` | numeric | ✅ | `0` | المبلغ المطلوب |
| `type` | text | ✅ | - | نوع الطلب: `debt_request` أو `payment_request` |
| `status` | text | ✅ | `'pending'` | الحالة: `pending` / `approved` / `rejected` |
| `description` | text | ❌ | `null` | وصف الطلب |
| `image_url` | text | ❌ | `null` | صورة مرفقة (لطلبات الدين) |
| `rejection_reason` | text | ❌ | `null` | سبب الرفض |
| `payment_method_type` | text | ❌ | `null` | نوع طريقة الدفع |
| `payment_method_provider` | text | ❌ | `null` | مزود الدفع (جيب، ون كاش...) |
| `transaction_number` | text | ❌ | `null` | رقم العملية |
| `sender_name` | text | ❌ | `null` | اسم المرسل |
| `processed_at` | timestamptz | ❌ | `null` | تاريخ المعالجة |
| `processed_by` | uuid | ❌ | `null` | من عالج الطلب |
| `created_at` | timestamptz | ✅ | `now()` | تاريخ الإنشاء |

---

## 2. تسجيل دين جديد | Create Debt

### المنطق البرمجي (من المالك/الموظف مباشرة):

```
العملية: useCreateDebt() في useOwnerData.ts

الخطوات:
1. التحقق من سقف الدين (debt_limit):
   أ. جلب سقف الدين للزبون من جدول customers
   ب. إذا كان السقف محدد (ليس null):
      - جلب جميع ديون الزبون → حساب المجموع
      - جلب جميع مدفوعات الزبون → حساب المجموع
      - الرصيد الحالي = إجمالي الديون - إجمالي المدفوعات
      - إذا (الرصيد الحالي + المبلغ الجديد > سقف الدين):
        ✖ رفض → خطأ "DEBT_LIMIT_EXCEEDED"

2. إدراج السجل في جدول debts:
   - customer_id: معرف الزبون
   - owner_id: معرف المالك (أو مالك الموظف)
   - amount: المبلغ
   - description: الوصف
   - image_url: رابط الصورة (اختياري)
   - created_by: معرف المستخدم الحالي (مالك أو موظف)

3. الإشعارات التلقائية (عبر Trigger):
   - إشعار للزبون: "تم تسجيل دين بقيمة X عليك في [اسم المنشأة]"
   - إشعار للمالك (إذا أنشأه موظف): "قام موظفك بتسجيل دين..."
```

### استعلام SQL المكافئ:
```sql
-- التحقق من السقف
SELECT debt_limit FROM customers WHERE id = '{customer_id}';

-- حساب الرصيد الحالي
SELECT COALESCE(SUM(amount), 0) FROM debts WHERE customer_id = '{customer_id}';
SELECT COALESCE(SUM(amount), 0) FROM payments WHERE customer_id = '{customer_id}';

-- إدراج الدين
INSERT INTO debts (customer_id, owner_id, amount, description, image_url, created_by)
VALUES ('{customer_id}', '{owner_id}', {amount}, '{description}', '{image_url}', '{user_id}')
RETURNING *;
```

### رفع صورة الدين:
```
1. الملف يُرفع إلى Supabase Storage → bucket: "debt-images"
2. المسار: debt-images/{timestamp}_{filename}
3. يُحصل على الرابط العام: supabase.storage.from("debt-images").getPublicUrl(path)
4. يُخزن الرابط في حقل image_url
```

---

## 3. حذف دين | Delete Debt

```
العملية: useDeleteDebt() في useOwnerData.ts

الخطوات:
1. حذف السجل من جدول debts بناءً على id
2. ⚠️ ملاحظة: لا يوجد تحقق من وجود مدفوعات مرتبطة قبل الحذف
3. يتم إعادة تحميل: debts, payments, dashboard-stats

استعلام SQL:
DELETE FROM debts WHERE id = '{debt_id}';
```

---

## 4. تسجيل سداد | Create Payment

### المنطق البرمجي (التوزيع التلقائي FIFO):

```
العملية: useCreatePayment() في useOwnerData.ts

الخطوات:
1. جلب جميع ديون الزبون (مرتبة من الأقدم للأحدث):
   SELECT id, amount FROM debts 
   WHERE customer_id = X AND owner_id = Y 
   ORDER BY created_at ASC;

2. جلب جميع المدفوعات السابقة للزبون:
   SELECT debt_id, amount FROM payments 
   WHERE customer_id = X AND owner_id = Y;

3. حساب المدفوع لكل دين:
   paidMap[debt_id] = مجموع المدفوعات لهذا الدين

4. توزيع مبلغ السداد (FIFO - الأقدم أولاً):
   remaining = مبلغ السداد
   
   لكل دين (من الأقدم للأحدث):
     المتبقي_من_الدين = مبلغ_الدين - المدفوع_سابقاً
     إذا المتبقي_من_الدين <= 0: تخطي (الدين مسدد بالكامل)
     
     مبلغ_الدفعة = الأقل بين (remaining, المتبقي_من_الدين)
     
     إدراج سجل في payments:
       debt_id: معرف هذا الدين
       customer_id: معرف الزبون
       owner_id: معرف المالك
       amount: مبلغ_الدفعة
       description: الوصف
       created_by: المستخدم الحالي
     
     remaining -= مبلغ_الدفعة
     إذا remaining <= 0: توقف

5. إذا لم يتم إدراج أي دفعة:
   ✖ خطأ "NO_OUTSTANDING_DEBTS" (لا توجد ديون مستحقة)

6. الإشعارات التلقائية (عبر Trigger):
   - إشعار للزبون: "تم تسجيل سداد بقيمة X في [اسم المنشأة]"
   - إشعار للمالك (إذا أنشأه موظف)
```

### مثال عملي:
```
الديون:
  دين #1: 500 ر.ي (created_at: 1 يناير) → مدفوع سابقاً: 200
  دين #2: 300 ر.ي (created_at: 15 يناير) → مدفوع سابقاً: 0
  دين #3: 400 ر.ي (created_at: 1 فبراير) → مدفوع سابقاً: 0

سداد جديد: 500 ر.ي

التوزيع:
  دين #1: المتبقي = 500-200 = 300 → يُدفع 300 (remaining = 200)
  دين #2: المتبقي = 300-0 = 300 → يُدفع 200 (remaining = 0)
  دين #3: لم يُدفع شيء

النتيجة: سجلين في payments:
  payment_1: debt_id=#1, amount=300
  payment_2: debt_id=#2, amount=200
```

---

## 5. نظام الطلبات من الزبون | Customer Orders

### طلب تسجيل دين (debt_request):
```
الزبون يرسل طلب من صفحة تفاصيل المنشأة

البيانات المطلوبة:
  - amount: المبلغ (إجباري)
  - description: الوصف (إجباري)
  - image_url: صورة مرفقة (اختياري)

يُدرج في جدول orders:
  type: 'debt_request'
  status: 'pending'
  customer_id: معرف الزبون في هذه المنشأة
  owner_id: معرف المالك
```

### طلب سداد (payment_request):
```
البيانات المطلوبة:
  - amount: المبلغ (إجباري)
  - payment_method_provider: مزود الدفع (جيب، ون كاش، الكريمي...)
  - transaction_number: رقم العملية
  - sender_name: اسم المرسل

يُدرج في جدول orders:
  type: 'payment_request'
  status: 'pending'
  + بيانات الدفع أعلاه
```

### إشعار تلقائي (عبر Trigger `notify_new_order`):
```sql
-- يُرسل إشعار للمالك تلقائياً عند إدراج طلب جديد
INSERT INTO notifications (user_id, title, message, type, related_id)
VALUES (
  NEW.owner_id,
  'طلب تسجيل دين جديد' أو 'طلب سداد جديد',
  '[اسم الزبون] طلب تسجيل دين/سداد بقيمة X ر.ي',
  'info',
  NEW.id
);
```

---

## 6. معالجة الطلبات | Process Orders (Edge Function)

### الدالة: `supabase/functions/process-order/index.ts`

```
المدخلات:
  - order_id: معرف الطلب
  - action: 'approve' أو 'reject'
  - rejection_reason: سبب الرفض (عند الرفض)

═══════════════════════════════════════
  الموافقة على طلب دين (approve + debt_request)
═══════════════════════════════════════

1. التحقق من سقف الدين:
   - إذا تجاوز السقف → رفض تلقائي مع إشعار

2. إنشاء سجل دين جديد في جدول debts:
   INSERT INTO debts (customer_id, owner_id, amount, description, image_url, created_by)

3. تحديث حالة الطلب:
   UPDATE orders SET status='approved', processed_at=now(), processed_by=user_id

4. إشعارات:
   - للزبون: "تم قبول طلبك وتسجيل مبلغ X عليك"
   - للمالك: "تم تسجيل مبلغ X على [اسم الزبون]"

═══════════════════════════════════════
  الموافقة على طلب سداد (approve + payment_request)
═══════════════════════════════════════

1. جلب ديون الزبون (الأقدم أولاً)
2. جلب المدفوعات السابقة
3. توزيع المبلغ بنظام FIFO (نفس منطق useCreatePayment)
4. الوصف يتضمن معلومات الدفع:
   "{مزود الدفع} - {رقم العملية}"

5. تحديث حالة الطلب → approved
6. إشعارات للطرفين

═══════════════════════════════════════
  رفض الطلب (reject)
═══════════════════════════════════════

1. تحديث حالة الطلب:
   UPDATE orders SET 
     status='rejected', 
     rejection_reason='{السبب}',
     processed_at=now(), 
     processed_by=user_id

2. إشعار للزبون: "تم رفض طلبك. السبب: ..."
```

---

## 7. سقف الدين | Debt Limit

### التحقق عند تسجيل دين:
```
المعادلة:
  الرصيد_الحالي = مجموع_الديون - مجموع_المدفوعات
  
  إذا (الرصيد_الحالي + المبلغ_الجديد > سقف_الدين):
    ✖ رفض العملية
```

### قفل تعديل السقف (30 يوم):
```
العملية: useUpdateCustomer() في useOwnerData.ts

عند محاولة تعديل debt_limit:
1. جلب أقدم حركة مالية (دين أو سداد) للزبون
2. إذا كانت أقدم حركة خلال آخر 30 يوم:
   ✖ رفض التعديل → خطأ "DEBT_LIMIT_LOCKED"
3. إذا لم تكن هناك حركات أو مرّ أكثر من 30 يوم:
   ✔ السماح بالتعديل

المنطق:
  أقدم_حركة = MIN(أقدم_دين, أقدم_سداد)
  قبل_30_يوم = التاريخ_الحالي - 30 يوم
  
  إذا (أقدم_حركة > قبل_30_يوم):
    ✖ DEBT_LIMIT_LOCKED
```

---

## 8. الإشعارات التلقائية | Auto Notifications (Database Triggers)

### Trigger: `notify_debt_created`
```
يُنفذ: بعد INSERT في جدول debts

الإشعارات:
1. للزبون (إذا مرتبط بحساب وليس هو من أنشأ الدين):
   عنوان: "دين جديد"
   رسالة: "تم تسجيل دين بقيمة X ر.ي عليك في [اسم المنشأة]"

2. للمالك (إذا أنشأه موظف):
   عنوان: "تم تسجيل دين جديد"
   رسالة: "قام موظفك بتسجيل دين بقيمة X ر.ي على [اسم الزبون]"
```

### Trigger: `notify_payment_created`
```
يُنفذ: بعد INSERT في جدول payments

الإشعارات:
1. للزبون (إذا مرتبط بحساب وليس هو من أنشأ السداد):
   عنوان: "تم تسجيل سداد"
   رسالة: "تم تسجيل سداد بقيمة X ر.ي في [اسم المنشأة]"

2. للمالك (إذا أنشأه موظف):
   عنوان: "تم تسجيل سداد جديد"
   رسالة: "قام موظفك بتسجيل سداد بقيمة X ر.ي من [اسم الزبون]"
```

### Trigger: `notify_new_order`
```
يُنفذ: بعد INSERT في جدول orders

إشعار للمالك:
  عنوان: "طلب تسجيل دين جديد" أو "طلب سداد جديد"
  رسالة: "[اسم الزبون] طلب تسجيل دين/سداد بقيمة X ر.ي"
```

### Trigger: `send_push_notification_trigger`
```
يُنفذ: بعد INSERT في جدول notifications

العملية:
  يستدعي Edge Function "send-push-notification" عبر HTTP
  لإرسال إشعار Push للجوال عبر FCM
```

---

## 9. سياسات الأمان RLS | Security Policies

### جدول debts:
| السياسة | الأمر | من يستطيع | الشرط |
|---------|-------|-----------|-------|
| Owners can manage their debts | ALL | المالك | `owner_id = auth.uid()` |
| Employees can read owner debts | SELECT | الموظف | `owner_id IN (SELECT owner_id FROM profiles WHERE user_id = auth.uid())` |
| Employees can insert debts for owner | INSERT | الموظف | نفس الشرط أعلاه |
| Super admins can read all debts | SELECT | المدير | `has_role(auth.uid(), 'super_admin')` |
| Customers can read own debts | SELECT | الزبون | `customer_id IN (SELECT get_customer_ids_for_user(auth.uid()))` |

### جدول payments:
| السياسة | الأمر | من يستطيع | الشرط |
|---------|-------|-----------|-------|
| Owners can manage their payments | ALL | المالك | `owner_id = auth.uid()` |
| Employees can read owner payments | SELECT | الموظف | عبر profiles.owner_id |
| Employees can insert payments for owner | INSERT | الموظف | عبر profiles.owner_id |
| Super admins can read all payments | SELECT | المدير | `has_role(...)` |
| Customers can read own payments | SELECT | الزبون | عبر `get_customer_ids_for_user()` |

### جدول orders:
| السياسة | الأمر | من يستطيع | الشرط |
|---------|-------|-----------|-------|
| Owners can read/update/delete their orders | SELECT/UPDATE/DELETE | المالك | `owner_id = auth.uid()` |
| Employees can read/update owner orders | SELECT/UPDATE | الموظف | عبر profiles.owner_id |
| Customers can insert orders | INSERT | الزبون | `customer_id IN get_customer_ids_for_user()` |
| Customers can read own orders | SELECT | الزبون | نفس الشرط |

---

## 10. الدوال المساعدة | Helper Functions

### `get_effective_owner_id()`
```sql
-- تُرجع owner_id الفعلي (للموظف: مالكه، للمالك: نفسه)
SELECT COALESCE(
  (SELECT owner_id FROM profiles WHERE user_id = auth.uid() AND owner_id IS NOT NULL),
  auth.uid()
);
```

### `get_customer_ids_for_user(uuid)`
```sql
-- تُرجع معرفات الزبون المرتبطة بحساب المستخدم
SELECT id FROM customers WHERE user_id = _user_id AND is_active = true;
```

### `get_owner_ids_for_customer(uuid)`
```sql
-- تُرجع معرفات المالكين الذين الزبون مسجل عندهم
SELECT owner_id FROM customers WHERE user_id = _user_id AND is_active = true;
```

### `find_customer_user_by_phone(text)`
```sql
-- تبحث عن حساب زبون بناءً على رقم الهاتف (للربط التلقائي)
SELECT p.user_id FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.user_id
WHERE ur.role = 'customer' AND p.phone = _phone
LIMIT 1;
```

---

## 11. إحصائيات لوحة التحكم | Dashboard Stats

### العملية: `useDashboardStats()` في useOwnerData.ts

```
الاستعلامات المتوازية (Promise.all):

1. عدد الزبائن:
   SELECT count(*) FROM customers WHERE owner_id = '{ownerId}'

2. إجمالي الديون:
   SELECT amount FROM debts WHERE owner_id = '{ownerId}'
   → المجموع في الكود: reduce((sum, d) => sum + d.amount, 0)

3. إجمالي المدفوعات:
   SELECT amount FROM payments WHERE owner_id = '{ownerId}'
   → المجموع في الكود: reduce((sum, p) => sum + p.amount, 0)

4. الرصيد المتبقي:
   balance = totalDebts - totalPayments

النتيجة:
{
  totalCustomers: عدد الزبائن,
  totalDebts: إجمالي الديون,
  totalPayments: إجمالي المدفوعات,
  balance: الرصيد (الديون - المدفوعات)
}
```

⚠️ **تحذير أداء**: إذا تجاوز عدد سجلات الديون أو المدفوعات 1000، فإن Supabase يُرجع 1000 سجل فقط بشكل افتراضي، مما قد يعطي إحصائيات غير دقيقة.

---

## 12. تخزين الصور | Image Storage

### Bucket: `debt-images`
```
النوع: عام (Public)
الاستخدام: صور مرفقة مع الديون

رفع صورة:
  const { data, error } = await supabase.storage
    .from("debt-images")
    .upload(`${timestamp}_${filename}`, file);

الحصول على الرابط:
  const { data: { publicUrl } } = supabase.storage
    .from("debt-images")
    .getPublicUrl(path);
```

---

## 📊 ملخص تدفق العمليات | Operations Flow Summary

```
┌─────────────────────────────────────────────────────┐
│                  تسجيل دين مباشر                      │
│  (المالك/الموظف)                                      │
│                                                       │
│  1. تحقق من سقف الدين ←──── customers.debt_limit     │
│  2. INSERT INTO debts ←──── حساب الرصيد               │
│  3. Trigger → إشعار للزبون + المالك                    │
│  4. Trigger → Push Notification (FCM)                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  تسجيل سداد مباشر                     │
│  (المالك/الموظف)                                      │
│                                                       │
│  1. جلب الديون (الأقدم أولاً)                          │
│  2. حساب المدفوع لكل دين                              │
│  3. توزيع FIFO → INSERT INTO payments (عدة سجلات)     │
│  4. Trigger → إشعار للزبون + المالك                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               طلب من الزبون                           │
│                                                       │
│  1. INSERT INTO orders (status=pending)               │
│  2. Trigger → إشعار للمالك                             │
│  3. المالك يوافق/يرفض ──→ Edge Function               │
│     ├─ approve: إنشاء debt/payment + إشعارات          │
│     └─ reject: تحديث status + إشعار للزبون            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               حذف زبون                                │
│                                                       │
│  1. تحقق: هل عليه رصيد؟ (ديون - مدفوعات > 0)         │
│     ✖ إذا نعم → رفض الحذف "CUSTOMER_HAS_DEBT"        │
│  2. حذف: payments → debts → orders → customer         │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Realtime (التحديث الفوري)

الجداول المفعّل عليها Realtime:
- `notifications` → لتحديث جرس الإشعارات فوراً
- `orders` → لتحديث حالة الطلبات فوراً
- `debts` → لتحديث سجل الديون فوراً
- `payments` → لتحديث سجل المدفوعات فوراً

```typescript
// مثال: الاستماع لتغييرات الديون
const channel = supabase
  .channel('debts-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'debts',
    filter: `owner_id=eq.${ownerId}`
  }, (payload) => {
    // تحديث الواجهة
  })
  .subscribe();
```

---

## 🔑 ملاحظات مهمة | Important Notes

1. **التوزيع التلقائي للسداد**: يتم بنظام FIFO (الأقدم أولاً)، ولا يمكن للمستخدم اختيار دين محدد للسداد.

2. **سقف الدين**: يُفحص في 3 أماكن:
   - `useCreateDebt()` (تسجيل مباشر)
   - `process-order` Edge Function (موافقة على طلب دين)
   - `useUpdateCustomer()` (قفل التعديل لمدة 30 يوم)

3. **الصلاحيات**: الموظف يرث صلاحيات مالكه عبر `owner_id` في جدول `profiles`، مع تحكم دقيق عبر `employee_permissions`.

4. **الربط التلقائي**: عند إضافة زبون برقم هاتف مطابق لحساب مسجل بدور `customer`، يتم ربطه تلقائياً عبر `find_customer_user_by_phone()`.

5. **حد الاستعلام**: Supabase يُرجع 1000 سجل كحد أقصى افتراضياً. يجب مراعاة ذلك عند حساب الإحصائيات للحسابات الكبيرة.
