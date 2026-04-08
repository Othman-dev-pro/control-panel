import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  BarChart3, 
  MessageSquare, 
  FileSpreadsheet, 
  Smartphone,
  Lock,
  ArrowLeftRight,
  Sparkles,
  Sun,
  Moon,
  Globe,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/hooks/useAdminData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Index() {
  const { data: settings } = useAppSettings();
  const { t, lang, setLang, dir, isRTL } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  const playStoreUrl = settings?.["play_store_url"] || "#";
  const appStoreUrl = settings?.["app_store_url"] || "#";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'mesh-gradient-dark text-white' : 'mesh-gradient text-slate-900'} font-['Cairo'] selection:bg-primary/20 overflow-x-hidden transition-all duration-700`} dir={dir}>
      {/* Premium Navbar */}
      <nav className={`fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-50 rounded-3xl ${theme === 'dark' ? 'glass-card-dark' : 'glass-card'} transition-all duration-500`}>
        <div className="px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500 overflow-hidden border border-border/10">
              <img src="/logo.png" alt="Deyoni Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">ديوني</span>
          </div>

          <div className="flex items-center gap-2 lg:gap-6">
            <div className="hidden md:flex items-center gap-8 px-8 border-x border-border/10 h-8">
                <a href="#features" className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 hover:opacity-100 hover:text-primary transition-all">{t("landing.nav.features")}</a>
            </div>
            
            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-xl h-10 w-10 hover:bg-primary/10 transition-all"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <AnimatePresence mode="wait">
                        {theme === "dark" ? (
                            <motion.div key="sun" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}><Sun className="h-4 w-4 text-amber-400" /></motion.div>
                        ) : (
                            <motion.div key="moon" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}><Moon className="h-4 w-4 text-blue-600" /></motion.div>
                        )}
                    </AnimatePresence>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 rounded-xl h-10 px-3 hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest opacity-70 hover:opacity-100 transition-all">
                            <Globe className="h-3.5 w-3.5" />
                            {lang.toUpperCase()}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 border-border/10 bg-background/80 backdrop-blur-2xl">
                        <DropdownMenuItem onClick={() => setLang("ar")} className="rounded-xl font-bold py-2.5 gap-3 cursor-pointer">
                            <span className="text-lg">🇾🇪</span> العربية
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLang("en")} className="rounded-xl font-bold py-2.5 gap-3 cursor-pointer">
                            <span className="text-lg">🇺🇸</span> English
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-24 lg:pt-64 lg:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div 
              initial={{ x: isRTL ? 50 : -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`space-y-10 text-center ${isRTL ? 'lg:text-right' : 'lg:text-left'}`}
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.25em] uppercase shadow-sm">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>{t("landing.hero.badge")}</span>
              </div>
              <h1 className="text-5xl lg:text-8xl font-black leading-[1.05] tracking-tight">
                {t("landing.hero.title").split(' ').slice(0, -1).join(' ')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-500">
                  {t("landing.hero.title").split(' ').pop()}
                </span>
              </h1>
              <p className="text-lg opacity-70 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium italic">
                {t("landing.hero.subtitle")}
              </p>
              
              <div className="space-y-8 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">{t("landing.footer.download")}</p>
                <div className={`flex flex-wrap items-center gap-6 justify-center ${isRTL ? 'lg:justify-start' : 'lg:justify-end'}`}>
                    <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-primary/20 rounded-2xl overflow-hidden">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-14 w-auto" />
                    </a>
                    <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-primary/20 rounded-2xl overflow-hidden">
                        <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="App Store" className="h-14 w-auto border border-white/10" />
                    </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: 20 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className="relative perspective-1000"
            >
              <div className={`relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[12px] ${theme === 'dark' ? 'border-slate-800' : 'border-white'} animate-float`}>
                <img src="/clean-mockup.png" alt="Deyoni App Interface" className="w-full h-auto object-cover" />
              </div>
              
              {/* Decorative Glow */}
              <div className="absolute -inset-10 bg-primary/20 blur-[120px] -z-10 rounded-full animate-pulse opacity-50" />
              
              {/* Floating Glass UI */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 1 }}
                className={`absolute -bottom-12 -right-12 ${theme === 'dark' ? 'glass-card-dark' : 'glass-card'} p-8 rounded-[2.5rem] max-w-[220px] hidden sm:block`}
              >
                <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="h-10 w-10 bg-primary/20 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider">{t("landing.hero.badge.safe")}</span>
                </div>
                <p className="text-[10px] opacity-60 font-bold leading-relaxed italic">{t("landing.hero.badge.safe.desc")}</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* High-End Identity Section */}
      <section className="py-32 relative overflow-hidden font-['Cairo']">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
             <motion.div 
               initial={{ opacity: 0, x: -50 }} 
               whileInView={{ opacity: 1, x: 0 }} 
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="order-2 lg:order-1 relative group"
             >
                <div className="absolute inset-0 bg-primary/30 blur-[100px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000 -z-10" />
                <img 
                  src="/icon-showcase.png" 
                  alt="Deyoni Icon Showcase" 
                  className="w-full max-w-[550px] mx-auto drop-shadow-2xl animate-float"
                />
             </motion.div>
             <motion.div 
               initial={{ opacity: 0, x: 50 }} 
               whileInView={{ opacity: 1, x: 0 }} 
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className={`space-y-10 order-1 lg:order-2 ${isRTL ? 'lg:text-right' : 'lg:text-left'}`}
             >
                <h2 className="text-4xl lg:text-6xl font-black leading-tight italic">{t("landing.features.4.title")}</h2>
                <p className="text-xl opacity-60 leading-loose font-medium italic border-l-4 border-primary/30 pl-8">
                   {t("landing.features.4.desc")}
                </p>
                <div className="grid grid-cols-2 gap-6">
                   {[t("landing.features.6.title"), t("landing.features.5.title"), t("landing.features.1.title"), t("landing.features.2.title")].map((item, i) => (
                     <div key={i} className={`flex items-center gap-4 text-xs font-black p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} transition-all hover:bg-primary/10 hover:text-primary`}>
                        <Sparkles className="h-4 w-4" />
                        {item}
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className={`py-32 ${theme === 'dark' ? 'bg-slate-900/40' : 'bg-white/40'} border-y border-border/10`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-6 mb-24">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight italic">{t("landing.features.title")}</h2>
            <p className="opacity-60 max-w-2xl mx-auto font-medium leading-relaxed italic text-lg">{t("landing.features.subtitle")}</p>
          </div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { icon: BarChart3, title: t("landing.features.1.title"), desc: t("landing.features.1.desc"), color: "primary" },
              { icon: MessageSquare, title: t("landing.features.2.title"), desc: t("landing.features.2.desc"), color: "indigo-500" },
              { icon: FileSpreadsheet, title: t("landing.features.3.title"), desc: t("landing.features.3.desc"), color: "emerald-500" },
              { icon: Lock, title: t("landing.features.4.title"), desc: t("landing.features.4.desc"), color: "rose-500" },
              { icon: ArrowLeftRight, title: t("landing.features.5.title"), desc: t("landing.features.5.desc"), color: "amber-500" },
              { icon: Smartphone, title: t("landing.features.6.title"), desc: t("landing.features.6.desc"), color: "sky-500" },
            ].map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants} className={`${theme === 'dark' ? 'glass-card-dark' : 'glass-card'} p-12 rounded-[3.5rem] hover:scale-[1.03] transition-all duration-500 group relative overflow-hidden`}>
                <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                <div className={`h-20 w-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform duration-500 shadow-xl`}>
                  <feature.icon className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-black mb-6 italic">{feature.title}</h3>
                <p className="opacity-50 text-sm font-medium leading-loose italic">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-950'} text-white py-32 pb-16 relative overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row justify-between items-center gap-16 border-b border-white/5 pb-24">
            <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'} space-y-6`}>
              <div className={`flex items-center justify-center ${isRTL ? 'md:justify-start' : 'md:justify-end'} gap-4 group cursor-pointer`}>
                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                  <img src="/logo.png" alt="Deyoni Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-3xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">ديوني</span>
              </div>
              <p className="text-white/40 max-w-sm font-medium leading-loose italic opacity-80">{t("landing.footer.tagline")}</p>
            </div>
            
            <div className="flex flex-col items-center gap-6">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30">{t("landing.footer.download")}</p>
                <div className="flex flex-wrap justify-center gap-6">
                   <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-all hover:shadow-2xl hover:shadow-primary/20">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="h-12 w-auto" />
                   </a>
                   <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-all hover:shadow-2xl hover:shadow-primary/20">
                        <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="App Store" className="h-12 w-auto" />
                   </a>
                </div>
            </div>
          </div>
          <div className="pt-16 text-center">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] italic opacity-50">
              {t("app.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
