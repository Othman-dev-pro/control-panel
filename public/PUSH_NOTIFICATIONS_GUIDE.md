# نظام الإشعارات الفورية (Push Notifications)

تم تجهيز نظام الإشعارات الفورية للتطبيق المحمول باستخدام Firebase Cloud Messaging (FCM) مع الربط التلقائي بنظام الإشعارات الموجود في قاعدة البيانات.

## 🔧 ما تم إعداده في الباك اند

### 1. جدول FCM Tokens
- جدول `fcm_tokens` لحفظ tokens الأجهزة لكل مستخدم
- دعم منصات: iOS، Android، Web
- تنظيف تلقائي للـ tokens المنتهية الصلاحية

### 2. Edge Function للإشعارات
- `send-push-notification` يرسل إشعارات عبر Firebase
- يتعامل مع عدة أجهزة للمستخدم الواحد
- إدارة ذكية للـ tokens غير صالحة

### 3. ربط تلقائي مع النظام الموجود
- كل إشعار يُحفظ في قاعدة البيانات يُرسل تلقائياً كـ push notification
- يعمل مع جميع الإشعارات الموجودة: الديون، المدفوعات، الطلبات، إلخ

## 📱 خطوات التنفيذ في Flutter

### 1. إعداد Firebase
```bash
# إضافة المكاتب المطلوبة
flutter pub add firebase_messaging firebase_core
```

### 2. تهيئة Firebase في التطبيق
```dart
// main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // تهيئة Firebase
  await Firebase.initializeApp();
  
  // إعداد الإشعارات في الخلفية
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(MyApp());
}

// معالج الإشعارات في الخلفية
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Handling a background message: ${message.messageId}");
}
```

### 3. خدمة الإشعارات
```dart
// services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  
  static Future<void> initialize() async {
    // طلب الإذن
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // الحصول على token
      String? token = await _messaging.getToken();
      if (token != null) {
        await _saveTokenToDatabase(token);
      }
      
      // مراقبة تحديث الـ token
      _messaging.onTokenRefresh.listen(_saveTokenToDatabase);
      
      // معالجة الإشعارات عند فتح التطبيق
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);
      
      // معالجة الإشعار الذي فتح التطبيق
      RemoteMessage? initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleMessageOpenedApp(initialMessage);
      }
    }
  }
  
  static Future<void> _saveTokenToDatabase(String token) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    
    // حفظ الـ token في قاعدة البيانات
    await Supabase.instance.client.from('fcm_tokens').upsert({
      'user_id': user.id,
      'token': token,
      'platform': Platform.isIOS ? 'ios' : 'android',
      'device_id': await _getDeviceId(),
      'is_active': true,
    });
  }
  
  static void _handleForegroundMessage(RemoteMessage message) {
    // عرض الإشعار في التطبيق
    print('Got a message whilst in the foreground!');
    print('Message data: ${message.data}');
    
    if (message.notification != null) {
      // عرض الإشعار محلياً
      _showLocalNotification(message);
    }
  }
  
  static void _handleMessageOpenedApp(RemoteMessage message) {
    // التنقل للصفحة المناسبة حسب نوع الإشعار
    String? type = message.data['type'];
    String? relatedId = message.data['related_id'];
    
    switch (type) {
      case 'debt':
        // التنقل لصفحة الديون
        break;
      case 'payment':
        // التنقل لصفحة المدفوعات  
        break;
      case 'order':
        // التنقل لصفحة الطلبات
        break;
    }
  }
}
```

### 4. إدارة حالة الإشعارات
```dart
// في AuthProvider أو حيث تدير حالة المستخدم
Future<void> onUserLogin() async {
  // عند تسجيل الدخول، تهيئة الإشعارات
  await NotificationService.initialize();
}

Future<void> onUserLogout() async {
  // عند تسجيل الخروج، إلغاء تفعيل الـ token
  final user = Supabase.instance.client.auth.currentUser;
  if (user != null) {
    await Supabase.instance.client
        .from('fcm_tokens')
        .update({'is_active': false})
        .eq('user_id', user.id);
  }
}
```

## 🔑 المتغيرات المطلوبة

### في Supabase (Edge Functions Secrets):
```
FIREBASE_SERVER_KEY=your_firebase_server_key_here
```

### كيفية الحصول على Firebase Server Key:
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروعك > Project Settings
3. Cloud Messaging tab
4. انسخ "Server key"

## ✅ المميزات المكتملة

- ✅ حفظ وإدارة FCM tokens للأجهزة
- ✅ إرسال إشعارات فورية للأجهزة النشطة
- ✅ ربط تلقائي مع نظام الإشعارات الموجود  
- ✅ تنظيف الـ tokens المنتهية الصلاحية
- ✅ دعم عدة أجهزة لنفس المستخدم
- ✅ معالجة الأخطاء والحالات الاستثنائية

## 📋 ملاحظات مهمة

1. **الإشعارات تعمل في جميع الحالات:**
   - التطبيق مفتوح (foreground)
   - التطبيق في الخلفية (background)  
   - التطبيق مغلق تماماً (terminated)

2. **الربط التلقائي:** كل إشعار يُضاف لجدول `notifications` يُرسل تلقائياً كـ push notification

3. **الأمان:** جميع FCM tokens محمية بـ RLS policies - كل مستخدم يدير tokens أجهزته فقط

4. **الأداء:** الإشعارات ترسل بشكل غير متزامن ولا تؤثر على أداء العمليات الأخرى