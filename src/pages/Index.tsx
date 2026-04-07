import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  BarChart3, 
  MessageSquare, 
  FileSpreadsheet, 
  Smartphone,
  Lock,
  ArrowLeftRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden" dir="rtl">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <BarChart3 className="text-white h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">ديوني</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">المميزات</a>
            <Button className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95">
              تصفح الموقع
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-50" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-8 text-center lg:text-right"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black tracking-widest uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>نظام إدارة الديون والزبائن الأول</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.15]">
                أدر مدفوعاتك <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-indigo-600">بذكاء واحترافية</span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                ديوني هو الحل المتكامل لأصحاب المنشآت لإدارة السجلات المالية، مراقبة الديون، وتنبيه الزبائن بأسلوب عصري ومنظم يضمن لك حقوقك المالية.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button size="lg" className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-3 shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                  <Smartphone className="h-5 w-5" />
                  تحميل التطبيق
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-10 rounded-2xl border-slate-200 font-bold hover:bg-slate-50 transition-all active:scale-95">
                  تواصل معنا
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white bg-slate-100">
                <img 
                  src="/deyoni_hero_mockup_1775605107383.png" 
                  alt="Deyoni App Interface" 
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating Cards */}
              <div className="absolute -bottom-10 -right-10 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-white max-w-[200px] hidden sm:block">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black">بيانات آمنة</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">تشفير كامل لكافة سجلاتك المالية مع نسخ احتياطي دوري.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium italic">صممنا "ديوني" ليكون بسيطاً في الشكل، عميقاً في الإمكانيات، ليناسب كافة أحجام التجارة.</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: BarChart3, title: "تقارير مالية دقيقة", desc: "احصل على رؤية شاملة لديونك وسداداتك من خلال رسوم بيانية واضحة.", color: "bg-blue-100 text-blue-600" },
              { icon: MessageSquare, title: "تنبيهات ذكية", desc: "أرسل إشعارات وتنبيهات للزبائن بموعد السداد لزيادة سرعة التحصيل.", color: "bg-indigo-100 text-indigo-600" },
              { icon: FileSpreadsheet, title: "نسخ احتياطي إكسل", desc: "قم بتصدير كافة بياناتك لملفات Excel بلمسة واحدة لسهولة الأرشفة والقراءة.", color: "bg-emerald-100 text-emerald-600" },
              { icon: Lock, title: "خصوصية مطلقة", desc: "بيانات منشأتك وزبائنك محمية بأحدث معايير الأمان والتشفير العالمي.", color: "bg-rose-100 text-rose-600" },
              { icon: ArrowLeftRight, title: "إدارة الحركات", desc: "تتبع كل ريال يدخل أو يخرج من خلال سجل حركات مفصل لكل زبون بالثانية.", color: "bg-amber-100 text-amber-600" },
              { icon: Smartphone, title: "مزامنة سحابية", desc: "بياناتك معك دائماً على كافة أجهزتك من خلال مزامنة سحابية فورية وآمنة.", color: "bg-sky-100 text-sky-600" },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={itemVariants}
                className="bg-white p-8 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/5 group"
              >
                <div className={`h-14 w-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-loose">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 border-b border-white/10 pb-16">
            <div className="text-center md:text-right space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-white h-6 w-6" />
                </div>
                <span className="text-2xl font-black">ديوني</span>
              </div>
              <p className="text-slate-400 max-w-sm font-medium leading-loose italic underline-offset-4">ثورة في إدارة الديون للشركات الصغيرة والمتوسطة. بساطة، أمان، واحترافية.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100 px-8 font-black">تحميل الأندرويد</Button>
              <Button size="lg" className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-8 font-black">تحميل الآيفون</Button>
            </div>
          </div>
          <div className="pt-10 text-center">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-loose">
              جميع الحقوق محفوظة {new Date().getFullYear()} © لشركة عثمان أسعد برو - ديوني
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
