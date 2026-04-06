# مواصفات تصميم Flutter UI الكاملة
## نظام إدارة الديون والمدفوعات مع الإشعارات البوش

> 📅 آخر تحديث: 2026-03-09
> 🎯 هذا الملف يصف **جميع الشاشات والحقول والأزرار** بالتفصيل لتطبيق Flutter (Android + iOS)
> 
> ⚠️ **ملاحظة**: شاشات الأدمن (super_admin) **غير موجودة في التطبيق** - الأدمن يدير كل شيء من **لوحة تحكم الويب فقط**
> 
> 🔔 **جديد**: دعم كامل للإشعارات البوش عبر Firebase Cloud Messaging

---

## 🎨 نظرة عامة على التصميم

تطبيق Flutter متعدد الأدوار بتصميم Material Design 3 يدعم:
- **اللغة العربية كأساسية** مع دعم الإنجليزية
- **تخطيط RTL كامل** للنصوص العربية
- **ثيم داكن وفاتح** قابل للتبديل
- **إشعارات فورية** عبر Firebase Cloud Messaging 🆕
- **واجهات متجاوبة** للهواتف والأجهزة اللوحية

---

## 🔔 نظام الإشعارات البوش في Flutter

### تهيئة Firebase Cloud Messaging 🆕
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

### خدمة الإشعارات 🆕
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
        GoRouter.of(context).go('/owner/debts');
        break;
      case 'payment':
        // التنقل لصفحة المدفوعات  
        GoRouter.of(context).go('/owner/payments');
        break;
      case 'order':
        // التنقل لصفحة الطلبات
        GoRouter.of(context).go('/owner/orders');
        break;
    }
  }
}
```

---

## 🏗️ هيكل التطبيق العام

### التنقل (Navigation)
- **المالك (Owner)**: Sidebar جانبي على الشاشات الكبيرة + Hamburger Menu على الموبايل
- **الموظف (Employee)**: نفس layout المالك لكن بعناصر أقل حسب الصلاحيات
- **الزبون (Customer)**: Bottom Navigation Bar ثابت في الأسفل

### اللغات
- عربي (RTL) + English (LTR)
- زر تبديل اللغة: 🌐 أيقونة Globe في Header

### الألوان (Design Tokens)
```dart
// الألوان الأساسية
const Color primaryColor = Color(0xFF1976D2);      // أزرق أساسي
const Color primaryVariant = Color(0xFF1565C0);    // أزرق داكن
const Color secondaryColor = Color(0xFF03DAC6);    // تركوازي
const Color backgroundColor = Color(0xFFF5F5F5);   // رمادي فاتح
const Color surfaceColor = Color(0xFFFFFFFF);      // أبيض
const Color errorColor = Color(0xFFE57373);        // أحمر فاتح

// ألوان النصوص
const Color textPrimary = Color(0xFF212121);       // رمادي داكن
const Color textSecondary = Color(0xFF757575);     // رمادي متوسط
const Color textHint = Color(0xFFBDBDBD);          // رمادي فاتح

// ألوان الحالات
const Color successColor = Color(0xFF4CAF50);      // أخضر
const Color warningColor = Color(0xFFF57C00);      // برتقالي
const Color infoColor = Color(0xFF2196F3);         // أزرق فاتح
```

---

## 🎯 مواصفات الحقول والأنواع

### حقول البيانات المطابقة لقاعدة البيانات

#### بيانات المستخدمين (profiles)
```dart
class UserProfile {
  final String id;
  final String userId;
  final String name;                    // text NOT NULL
  final String? email;                  // text nullable
  final String? phone;                  // text nullable
  final String? businessName;           // text nullable
  final String? username;               // text nullable
  final String? ownerId;                // uuid nullable (للموظفين)
  final String subscriptionStatus;      // text DEFAULT 'trial'
  final bool isSubscriptionActive;      // boolean DEFAULT true
  final DateTime? trialEndsAt;          // timestamptz nullable
  final DateTime? subscriptionEndsAt;   // timestamptz nullable
  final bool isSuspended;               // boolean DEFAULT false
  final DateTime createdAt;             // timestamptz NOT NULL
  final DateTime updatedAt;             // timestamptz NOT NULL
}
```

#### بيانات الزبائن (customers)
```dart
class Customer {
  final String id;
  final String name;              // text NOT NULL
  final String phone;             // text NOT NULL
  final String? address;          // text nullable
  final double? debtLimit;        // numeric nullable
  final String ownerId;           // uuid NOT NULL
  final String? userId;           // uuid nullable
  final bool isActive;            // boolean DEFAULT true
  final DateTime createdAt;       // timestamptz NOT NULL
}
```

#### بيانات الديون (debts)
```dart
class Debt {
  final String id;
  final String customerId;        // uuid NOT NULL
  final String ownerId;           // uuid NOT NULL
  final String createdBy;         // uuid NOT NULL
  final double amount;            // numeric NOT NULL DEFAULT 0
  final String? description;      // text nullable
  final String? imageUrl;         // text nullable
  final DateTime createdAt;       // timestamptz NOT NULL
}
```

#### بيانات المدفوعات (payments)
```dart
class Payment {
  final String id;
  final String customerId;        // uuid NOT NULL
  final String debtId;            // uuid NOT NULL
  final String ownerId;           // uuid NOT NULL
  final String createdBy;         // uuid NOT NULL
  final double amount;            // numeric NOT NULL DEFAULT 0
  final String? description;      // text nullable
  final DateTime createdAt;       // timestamptz NOT NULL
}
```

#### طلبات العملاء (orders)
```dart
class Order {
  final String id;
  final String customerId;             // uuid NOT NULL
  final String ownerId;                // uuid NOT NULL
  final String type;                   // text NOT NULL - 'debt_request' or 'payment_request'
  final double amount;                 // numeric NOT NULL DEFAULT 0
  final String? description;           // text nullable
  final String? imageUrl;              // text nullable
  final String status;                 // text DEFAULT 'pending'
  
  // معلومات طريقة الدفع
  final String? paymentMethodType;     // text nullable
  final String? paymentMethodProvider; // text nullable
  final String? senderName;            // text nullable
  final String? transactionNumber;     // text nullable
  
  final String? processedBy;           // uuid nullable
  final DateTime? processedAt;         // timestamptz nullable
  final String? rejectionReason;       // text nullable
  final DateTime createdAt;            // timestamptz NOT NULL
}
```

#### طرق الدفع (payment_methods)
```dart
class PaymentMethod {
  final String id;
  final String ownerId;            // uuid NOT NULL
  final String type;               // text NOT NULL - 'bank', 'wallet', 'cash_point'
  final String provider;           // text NOT NULL - 'sps', 'alansari', etc.
  final String? accountName;       // text nullable
  final String? accountNumber;     // text nullable
  final String? phoneNumber;       // text nullable
  final String? pointNumber;       // text nullable
  final bool isActive;             // boolean DEFAULT true
  final DateTime createdAt;        // timestamptz NOT NULL
}
```

#### الإشعارات (notifications)
```dart
class AppNotification {
  final String id;
  final String userId;             // uuid NOT NULL
  final String title;              // text NOT NULL
  final String message;            // text NOT NULL
  final String type;               // text DEFAULT 'info'
  final bool isRead;               // boolean DEFAULT false
  final String? relatedId;         // uuid nullable
  final DateTime createdAt;        // timestamptz NOT NULL
}
```

#### رموز FCM (fcm_tokens) 🆕
```dart
class FcmToken {
  final String id;
  final String userId;             // uuid NOT NULL
  final String token;              // text NOT NULL UNIQUE
  final String platform;           // text NOT NULL - 'ios', 'android', 'web'
  final String? deviceId;          // text nullable
  final bool isActive;             // boolean DEFAULT true
  final DateTime createdAt;        // timestamptz NOT NULL
  final DateTime updatedAt;        // timestamptz NOT NULL
}
```

---

## 🔔 مكونات الإشعارات في Flutter

### مكون جرس الإشعارات 🆕
```dart
class NotificationBell extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<AppNotification>>(
      stream: _getNotificationsStream(),
      builder: (context, snapshot) {
        final unreadCount = snapshot.data?.where((n) => !n.isRead).length ?? 0;
        
        return IconButton(
          icon: Stack(
            children: [
              Icon(Icons.notifications_outlined, size: 28),
              if (unreadCount > 0)
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    padding: EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    constraints: BoxConstraints(
                      minWidth: 20,
                      minHeight: 20,
                    ),
                    child: Text(
                      unreadCount > 99 ? '99+' : unreadCount.toString(),
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          onPressed: () {
            _showNotificationsBottomSheet(context, snapshot.data);
          },
        );
      },
    );
  }
}
```

### قائمة الإشعارات 🆕
```dart
class NotificationsList extends StatelessWidget {
  final List<AppNotification> notifications;
  
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        final notification = notifications[index];
        return Card(
          margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _getNotificationColor(notification.type),
              child: Icon(
                _getNotificationIcon(notification.type),
                color: Colors.white,
                size: 20,
              ),
            ),
            title: Text(
              notification.title,
              style: TextStyle(
                fontWeight: notification.isRead 
                    ? FontWeight.normal 
                    : FontWeight.bold,
              ),
            ),
            subtitle: Text(
              notification.message,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _formatTimeAgo(notification.createdAt),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
                if (!notification.isRead)
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: primaryColor,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
            onTap: () {
              _markAsRead(notification.id);
              _navigateToRelatedPage(notification);
            },
          ),
        );
      },
    );
  }
  
  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'debt':
        return Icons.receipt_long;
      case 'payment':
        return Icons.payment;
      case 'order':
        return Icons.shopping_bag;
      default:
        return Icons.info;
    }
  }
  
  Color _getNotificationColor(String type) {
    switch (type) {
      case 'debt':
        return Colors.red;
      case 'payment':
        return Colors.green;
      case 'order':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}
```

---

## 📱 مواصفات الواجهات الأساسية

### البنر الإعلاني المحدث 🆕
```dart
class AdBanner extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Ad>>(
      future: _getActiveAds(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return SizedBox.shrink();
        }
        
        final ads = snapshot.data!;
        return Container(
          height: 120,
          margin: EdgeInsets.all(16),
          child: PageView.builder(
            controller: PageController(viewportFraction: 0.9),
            itemCount: ads.length,
            itemBuilder: (context, index) {
              final ad = ads[index];
              return Container(
                margin: EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black26,
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: InkWell(
                    onTap: () {
                      if (ad.link != null) {
                        _launchURL(ad.link!);
                      }
                    },
                    child: Image.network(
                      ad.imageUrl,
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          color: Colors.grey[200],
                          child: Center(
                            child: CircularProgressIndicator(
                              value: loadingProgress.expectedTotalBytes != null
                                  ? loadingProgress.cumulativeBytesLoaded /
                                      loadingProgress.expectedTotalBytes!
                                  : null,
                            ),
                          ),
                        );
                      },
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: Colors.grey[200],
                          child: Icon(Icons.broken_image, size: 48),
                        );
                      },
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Future<List<Ad>> _getActiveAds() async {
    final response = await Supabase.instance.client
        .from('ads')
        .select()
        .eq('is_active', true)
        .order('sort_order');
    
    return (response as List)
        .map((json) => Ad.fromJson(json))
        .toList();
  }
}

// معايير الصور الإعلانية:
// - الأبعاد المناسبة: 16:9 أو 2:1
// - الحد الأقصى للحجم: 2MB
// - الصيغ المدعومة: PNG, JPG, WebP
// - دقة مقترحة: 800x400px للحصول على وضوح جيد
```

### Header مع الإشعارات 🆕
```dart
class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool showNotifications;
  
  const AppHeader({
    required this.title,
    this.showNotifications = true,
  });
  
  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      centerTitle: true,
      actions: [
        // زر تبديل اللغة
        IconButton(
          icon: Icon(Icons.language),
          onPressed: () => _toggleLanguage(context),
        ),
        
        // جرس الإشعارات
        if (showNotifications) NotificationBell(),
        
        SizedBox(width: 8),
      ],
    );
  }
  
  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight);
}
```

---

## 📝 نماذج الإدخال المحدثة

### نموذج إضافة دين مع معاينة الصورة 🆕
```dart
class AddDebtForm extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          // اختيار الزبون
          DropdownButtonFormField<String>(
            decoration: InputDecoration(
              labelText: 'اختر الزبون',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.person),
            ),
            items: customers.map((customer) {
              return DropdownMenuItem(
                value: customer.id,
                child: Text(customer.name),
              );
            }).toList(),
            validator: (value) => value == null ? 'يرجى اختيار الزبون' : null,
            onChanged: (value) => setState(() => selectedCustomerId = value),
          ),
          
          SizedBox(height: 16),
          
          // مبلغ الدين
          TextFormField(
            controller: amountController,
            decoration: InputDecoration(
              labelText: 'مبلغ الدين (ر.ي)',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.attach_money),
            ),
            keyboardType: TextInputType.numberWithOptions(decimal: true),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'يرجى إدخال المبلغ';
              }
              final amount = double.tryParse(value);
              if (amount == null || amount <= 0) {
                return 'يرجى إدخال مبلغ صحيح';
              }
              return null;
            },
          ),
          
          SizedBox(height: 16),
          
          // الوصف
          TextFormField(
            controller: descriptionController,
            decoration: InputDecoration(
              labelText: 'الوصف (اختياري)',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.description),
            ),
            maxLines: 3,
          ),
          
          SizedBox(height: 16),
          
          // رفع صورة
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: selectedImage != null
                  ? Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.file(
                          selectedImage!,
                          fit: BoxFit.cover,
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: IconButton(
                            onPressed: () => setState(() => selectedImage = null),
                            icon: Icon(Icons.close),
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.black54,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_a_photo, size: 48, color: Colors.grey),
                        SizedBox(height: 8),
                        Text(
                          'اضغط لإضافة صورة إيصال',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
            ),
          ),
          
          SizedBox(height: 24),
          
          // زر الحفظ
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _submitDebt,
              child: _isLoading 
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('تسجيل الدين'),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );
    
    if (pickedFile != null) {
      setState(() {
        selectedImage = File(pickedFile.path);
      });
    }
  }
}
```

---

## 🔄 إدارة الحالة مع الإشعارات

### AuthProvider محدث 🆕
```dart
// providers/auth_provider.dart
class AuthProvider with ChangeNotifier {
  User? _user;
  UserProfile? _profile;
  bool _isLoading = false;
  
  // Getters
  User? get user => _user;
  UserProfile? get profile => _profile;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  
  // تسجيل الدخول
  Future<bool> login(String phone, String password) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final response = await supabase.auth.signInWithPassword(
        email: phone + '@debtflow.com', // تحويل الهاتف لإيميل وهمي
        password: password,
      );
      
      if (response.user != null) {
        _user = response.user;
        await _loadUserProfile();
        
        // تهيئة الإشعارات البوش 🆕
        await NotificationService.initialize();
        
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('خطأ في تسجيل الدخول: $e');
    }
    
    _isLoading = false;
    notifyListeners();
    return false;
  }
  
  // تسجيل الخروج
  Future<void> logout() async {
    // إلغاء تفعيل FCM tokens 🆕
    await _deactivateFcmTokens();
    
    await supabase.auth.signOut();
    _user = null;
    _profile = null;
    notifyListeners();
  }
  
  // إلغاء تفعيل FCM Tokens 🆕
  Future<void> _deactivateFcmTokens() async {
    if (_user == null) return;
    
    try {
      await supabase
          .from('fcm_tokens')
          .update({'is_active': false})
          .eq('user_id', _user!.id);
    } catch (e) {
      print('خطأ في إلغاء تفعيل FCM tokens: $e');
    }
  }
}
```

---

## 🎭 دعم اللغات المتعددة مع الإشعارات

### ملف الترجمات المحدث 🆕
```dart
// lib/l10n/app_localizations.dart
class AppLocalizations {
  final Locale locale;
  
  AppLocalizations(this.locale);
  
  static const LocalizationsDelegate<AppLocalizations> delegate = 
      _AppLocalizationsDelegate();
  
  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }
  
  // النصوص الأساسية
  String get welcome => locale.languageCode == 'ar' ? 'مرحباً' : 'Welcome';
  String get login => locale.languageCode == 'ar' ? 'تسجيل الدخول' : 'Login';
  String get customers => locale.languageCode == 'ar' ? 'الزبائن' : 'Customers';
  String get debts => locale.languageCode == 'ar' ? 'الديون' : 'Debts';
  String get payments => locale.languageCode == 'ar' ? 'المدفوعات' : 'Payments';
  
  // نصوص الإشعارات الجديدة 🆕
  String get notifications => locale.languageCode == 'ar' ? 'الإشعارات' : 'Notifications';
  String get noNotifications => locale.languageCode == 'ar' ? 'لا توجد إشعارات' : 'No notifications';
  String get markAllRead => locale.languageCode == 'ar' ? 'قراءة الكل' : 'Mark all read';
  String get newDebtNotification => locale.languageCode == 'ar' ? 'دين جديد' : 'New debt';
  String get newPaymentNotification => locale.languageCode == 'ar' ? 'تم تسجيل سداد' : 'Payment registered';
  String get newOrderNotification => locale.languageCode == 'ar' ? 'طلب جديد' : 'New order';
}
```

---

## 🔧 إعدادات تقنية محدثة

### pubspec.yaml dependencies 🆕
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Supabase للباك إند
  supabase_flutter: ^2.0.0
  
  # Firebase للإشعارات البوش 🆕
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  flutter_local_notifications: ^18.0.0
  
  # إدارة الحالة
  provider: ^6.1.1
  
  # التنقل
  go_router: ^12.0.0
  
  # واجهة المستخدم
  cupertino_icons: ^1.0.2
  material_design_icons_flutter: ^7.0.7296
  
  # المخططات البيانية
  fl_chart: ^0.68.0
  
  # معالجة الصور
  image_picker: ^1.0.4
  cached_network_image: ^3.3.0
  
  # أدوات مساعدة
  intl: ^0.19.0
  url_launcher: ^6.2.1
  path_provider: ^2.1.1
  device_info_plus: ^9.1.0  # 🆕 للحصول على معرف الجهاز
  
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

### إعدادات Android محدثة 🆕
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- أذونات الإشعارات 🆕 -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <application
        android:label="ديبت فلو"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
            
            <!-- Intent filter للإشعارات 🆕 -->
            <intent-filter>
                <action android:name="FLUTTER_NOTIFICATION_CLICK" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>
        
        <!-- خدمة Firebase Messaging 🆕 -->
        <service
            android:name="com.google.firebase.messaging.FirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
        
        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
```

### إعدادات iOS محدثة 🆕
```xml
<!-- ios/Runner/Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- ... existing keys ... -->
    
    <!-- أذونات الإشعارات 🆕 -->
    <key>UIBackgroundModes</key>
    <array>
        <string>fetch</string>
        <string>remote-notification</string>
    </array>
    
    <key>FirebaseAppDelegateProxyEnabled</key>
    <false/>
</dict>
</plist>
```

---

## 📊 شاشات التقارير مع الإشعارات

### لوحة التحكم المحدثة 🆕
```dart
class OwnerDashboard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppHeader(
        title: 'لوحة التحكم',
        showNotifications: true, // 🆕
      ),
      body: RefreshIndicator(
        onRefresh: _refreshData,
        child: SingleChildScrollView(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // بانر الاشتراك
              SubscriptionBanner(),
              
              SizedBox(height: 16),
              
              // البنر الإعلاني المحدث
              AdBanner(),
              
              SizedBox(height: 16),
              
              // ترحيب مع الوقت
              _buildWelcomeSection(),
              
              SizedBox(height: 24),
              
              // بطاقات الإحصائيات
              _buildStatsGrid(),
              
              SizedBox(height: 24),
              
              // الإشعارات الأخيرة 🆕
              _buildRecentNotifications(),
              
              SizedBox(height: 24),
              
              // النشاط الأخير
              _buildRecentActivity(),
            ],
          ),
        ),
      ),
    );
  }
  
  // قسم الإشعارات الأخيرة 🆕
  Widget _buildRecentNotifications() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'الإشعارات الأخيرة',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton(
              onPressed: () => _showAllNotifications(),
              child: Text('عرض الكل'),
            ),
          ],
        ),
        SizedBox(height: 12),
        FutureBuilder<List<AppNotification>>(
          future: _getRecentNotifications(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Center(child: CircularProgressIndicator());
            }
            
            if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(
                    child: Text(
                      'لا توجد إشعارات جديدة',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                ),
              );
            }
            
            return Column(
              children: snapshot.data!.take(3).map((notification) {
                return Card(
                  margin: EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getNotificationColor(notification.type),
                      radius: 16,
                      child: Icon(
                        _getNotificationIcon(notification.type),
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                    title: Text(
                      notification.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: notification.isRead 
                            ? FontWeight.normal 
                            : FontWeight.bold,
                      ),
                    ),
                    subtitle: Text(
                      notification.message,
                      style: TextStyle(fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: Text(
                      _formatTimeAgo(notification.createdAt),
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey,
                      ),
                    ),
                    onTap: () => _handleNotificationTap(notification),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}
```

---

## 🌐 التطبيق متعدد المنصات

### دعم أحجام الشاشات المختلفة مع الإشعارات 🆕
```dart
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;
  
  const ResponsiveLayout({
    required this.mobile,
    this.tablet,
    this.desktop,
  });
  
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // تهيئة الإشعارات على جميع الأحجام 🆕
        WidgetsBinding.instance.addPostFrameCallback((_) {
          NotificationService.initialize();
        });
        
        if (constraints.maxWidth >= 1200) {
          return desktop ?? tablet ?? mobile;
        } else if (constraints.maxWidth >= 800) {
          return tablet ?? mobile;
        } else {
          return mobile;
        }
      },
    );
  }
}
```

---

## 🎯 خطة التنفيذ للإشعارات البوش

### 1. إعداد Firebase Project
1. إنشاء مشروع Firebase جديد
2. إضافة تطبيقي Android و iOS
3. تنزيل ملفات الإعداد:
   - `android/app/google-services.json`
   - `ios/Runner/GoogleService-Info.plist`
4. الحصول على Server Key من Firebase Console

### 2. إعداد Supabase Edge Function
1. إضافة `FIREBASE_SERVER_KEY` في Secrets
2. نشر `send-push-notification` function
3. تهيئة Database Trigger

### 3. تطوير Flutter App
1. إضافة dependencies المطلوبة
2. تطبيق `NotificationService` class
3. إضافة `NotificationBell` component
4. تحديث `AuthProvider` مع FCM support
5. إضافة navigation logic للإشعارات

### 4. الاختبار
1. اختبار الإشعارات على أجهزة حقيقية
2. اختبار التطبيق في حالات مختلفة (مفتوح، خلفية، مغلق)
3. اختبار التنقل عند النقر على الإشعارات

---

هذا الدليل يغطي جميع مواصفات التصميم والتطوير لتطبيق Flutter مع ضمان التوافق الكامل مع قاعدة البيانات ونظام الإشعارات البوش المتطور.
