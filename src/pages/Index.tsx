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
  ChevronRight,
  Zap,
  CheckCircle2
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
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.8, ease: "easeOut" } 
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} font-['Cairo'] selection:bg-primary/20 overflow-x-hidden transition-all duration-1000`} dir={dir}>
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 ${theme === 'dark' ? 'dot-grid-dark' : 'dot-grid'} opacity-60`} />
        
        {/* Animated Glowing Orbs */}
        <div className="glow-orb top-[-10%] left-[-10%] w-[50%] h-[50%] from-primary/20 via-primary/5 to-transparent animate-pulse" />
        <div className="glow-orb bottom-[-10%] right-[-10%] w-[40%] h-[40%] from-blue-500/20 via-blue-500/5 to-transparent animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="glow-orb top-[40%] left-[60%] w-[30%] h-[30%] from-indigo-500/10 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Ultra-Modern Navbar */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-50">
        <div className={`px-6 lg:px-10 h-20 rounded-[2.5rem] flex items-center justify-between border ${theme === 'dark' ? 'bg-slate-900/40 border-white/5' : 'bg-white/60 border-black/5'} backdrop-blur-3xl shadow-2xl transition-all duration-500 group`}>
          <div className="flex items-center gap-4 cursor-pointer">
            <div className="h-12 w-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform duration-500 transform-gpu overflow-hidden border border-white/20">
              <img src="/logo.png" alt="Deyoni Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col -gap-1">
                <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">ديوني</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Elite System</span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-8">
            <div className="hidden lg:flex items-center gap-10 mr-10 px-10 border-r border-border/10 h-8">
                <a href="#features" className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60 hover:opacity-100 hover:text-primary transition-all relative group">
                    {t("landing.nav.features")}
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
                </a>
            </div>
            
            <div className="flex items-center gap-3">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`rounded-2xl h-11 w-11 transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <AnimatePresence mode="wait">
                        {theme === "dark" ? (
                            <motion.div key="sun" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}><Sun className="h-5 w-5 text-amber-400" /></motion.div>
                        ) : (
                            <motion.div key="moon" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}><Moon className="h-5 w-5 text-blue-600" /></motion.div>
                        )}
                    </AnimatePresence>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={`gap-3 rounded-2xl h-11 px-4 font-black uppercase text-xs tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
                            <Globe className="h-4 w-4 text-primary" />
                            {lang.toUpperCase()}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-3xl p-3 border-border/10 bg-background/80 backdrop-blur-3xl shadow-2xl min-w-[180px]">
                        <DropdownMenuItem onClick={() => setLang("ar")} className="rounded-2xl font-bold py-3.5 gap-4 cursor-pointer focus:bg-primary/10">
                            <span className="text-xl">🇾🇪</span> {t("landing.lang.ar") || "العربية"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLang("en")} className="rounded-2xl font-bold py-3.5 gap-4 cursor-pointer focus:bg-primary/10">
                            <span className="text-xl">🇺🇸</span> {t("landing.lang.en") || "English"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - The Ultra Masterpiece */}
      <section className="relative pt-64 pb-32 lg:pt-80 lg:pb-52 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <motion.div 
              initial={{ x: isRTL ? 100 : -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`space-y-12 text-center ${isRTL ? 'lg:text-right' : 'lg:text-left'}`}
            >
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-black tracking-[0.3em] uppercase shadow-inner"
              >
                <Zap className="h-4 w-4 fill-primary animate-pulse" />
                <span>{t("landing.hero.badge")}</span>
              </motion.div>
              
              <h1 className="text-6xl lg:text-[7.5rem] font-black leading-[0.95] tracking-tight text-glow">
                {t("landing.hero.title").split(' ').slice(0, -1).join(' ')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-indigo-600 drop-shadow-sm">
                  {t("landing.hero.title").split(' ').pop()}
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl opacity-60 leading-loose max-w-2xl mx-auto lg:mx-0 font-medium italic border-l-8 border-primary/20 pl-8">
                {t("landing.hero.subtitle")}
              </p>
              
              <div className="flex flex-col gap-10 pt-8 items-center lg:items-start">
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.5em] opacity-30">
                    <span className="h-px w-8 bg-current" />
                    {t("landing.footer.download")}
                    <span className="h-px w-8 bg-current" />
                </div>
                <div className="flex flex-wrap items-center gap-8">
                    <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-110 active:scale-95 hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)] rounded-[2rem] overflow-hidden group">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-16 w-auto" />
                    </a>
                    <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="transition-all hover:scale-110 active:scale-95 hover:shadow-[0_20px_50px_rgba(59,130,246,0.2)] rounded-[2rem] overflow-hidden group">
                        <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="App Store" className="h-16 w-auto border border-white/10" />
                    </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.7, opacity: 0, rotateY: 30 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative perspective-2000"
            >
              <div className={`relative z-10 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[16px] ${theme === 'dark' ? 'border-slate-900' : 'border-white'} animate-float`}>
                <img src="/clean-mockup.png" alt="Deyoni App Interface" className="w-full h-auto object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
              </div>
              
              {/* Floating Glass Stats */}
              <motion.div 
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -top-16 -right-16 ${theme === 'dark' ? 'glass-card-dark' : 'glass-card'} p-10 rounded-[3rem] shadow-2xl max-w-[260px] hidden sm:block z-20`}
              >
                <div className="flex items-center gap-5 mb-5">
                    <div className="h-12 w-12 bg-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">{t("landing.features.6.title")}</span>
                </div>
                <p className="text-[11px] opacity-60 font-bold leading-relaxed">{t("landing.features.6.desc")}</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Break: Midnight Indigo Section */}
      <section className="py-40 relative bg-slate-950 text-white overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 dot-grid-dark opacity-20" />
        <div className="glow-orb top-[20%] left-[30%] w-[40%] h-[40%] from-primary/30 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }} 
               whileInView={{ opacity: 1, scale: 1 }} 
               viewport={{ once: true }}
               transition={{ duration: 1 }}
               className="relative group"
             >
                <div className="absolute inset-0 bg-primary/20 blur-[150px] group-hover:bg-primary/40 transition-all duration-1000" />
                <img 
                  src="/icon-showcase.png" 
                  alt="Deyoni Icon Showcase" 
                  className="w-full max-w-[600px] mx-auto drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)] animate-float"
                />
             </motion.div>
             
             <div className={`space-y-12 ${isRTL ? 'lg:text-right' : 'lg:text-left'}`}>
                <div className="h-1 w-24 bg-primary rounded-full mb-8" />
                <h2 className="text-5xl lg:text-7xl font-black leading-tight">{t("landing.features.4.title")}</h2>
                <p className="text-2xl opacity-60 leading-loose italic font-medium">
                   {t("landing.features.4.desc")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8">
                   {[t("landing.features.6.title"), t("landing.features.5.title"), t("landing.features.1.title"), t("landing.features.2.title")].map((item, i) => (
                     <div key={i} className="flex items-center gap-5 p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-2 transition-all group">
                        <Sparkles className="h-5 w-5 text-primary group-hover:scale-125 transition-transform" />
                        <span className="text-sm font-black uppercase tracking-wider">{item}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Showcase - Glass Grid */}
      <section id="features" className="py-40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-8 mb-32">
            <h2 className="text-5xl lg:text-[5rem] font-black tracking-tighter italic">{t("landing.features.title")}</h2>
            <p className="opacity-50 max-w-2xl mx-auto font-medium leading-loose text-xl italic">{t("landing.features.subtitle")}</p>
          </div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { icon: BarChart3, title: t("landing.features.1.title"), desc: t("landing.features.1.desc") },
              { icon: MessageSquare, title: t("landing.features.2.title"), desc: t("landing.features.2.desc") },
              { icon: FileSpreadsheet, title: t("landing.features.3.title"), desc: t("landing.features.3.desc") },
              { icon: Lock, title: t("landing.features.4.title"), desc: t("landing.features.4.desc") },
              { icon: ArrowLeftRight, title: t("landing.features.5.title"), desc: t("landing.features.5.desc") },
              { icon: Smartphone, title: t("landing.features.6.title"), desc: t("landing.features.6.desc") },
            ].map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants} className={`${theme === 'dark' ? 'glass-card-dark' : 'glass-card'} p-16 rounded-[4rem] hover:scale-[1.05] transition-all duration-700 group relative cursor-pointer border-r-8 border-primary/20 hover:border-r-primary`}>
                <div className={`h-24 w-24 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mb-12 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl shadow-primary/5`}>
                  <feature.icon className="h-12 w-12" />
                </div>
                <h3 className="text-3xl font-black mb-6 italic tracking-tight">{feature.title}</h3>
                <p className="opacity-50 text-base font-medium leading-relaxed italic">{feature.desc}</p>
                <div className="absolute bottom-8 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className={`h-8 w-8 text-primary ${isRTL ? 'rotate-180' : ''}`} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer - Solid & Deep */}
      <footer className="bg-slate-950 text-white py-48 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-24 border-b border-white/5 pb-32">
            <div className={`text-center ${isRTL ? 'lg:text-right' : 'lg:text-left'} space-y-8`}>
              <div className={`flex items-center justify-center ${isRTL ? 'lg:justify-start' : 'lg:justify-end'} gap-5 group`}>
                <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:rotate-[360deg] transition-transform duration-1000 overflow-hidden">
                  <img src="/logo.png" alt="Deyoni Logo" className="h-full w-full object-contain" />
                </div>
                <div className="flex flex-col">
                    <span className="text-4xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">ديوني</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">The Future of Finance</span>
                </div>
              </div>
              <p className="text-white/40 max-w-md font-medium text-lg leading-loose italic">{t("landing.footer.tagline")}</p>
            </div>
            
            <div className="flex flex-col items-center gap-10">
                <p className="text-xs font-black uppercase tracking-[0.6em] text-white/20">{t("landing.footer.download")}</p>
                <div className="flex flex-wrap justify-center gap-10">
                   <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all hover:shadow-[0_20px_50px_rgba(59,130,246,0.3)]">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="h-16 w-auto" />
                   </a>
                   <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-all hover:shadow-[0_20px_50px_rgba(59,130,246,0.2)]">
                        <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="App Store" className="h-16 w-auto" />
                   </a>
                </div>
            </div>
          </div>
          <div className="pt-20 text-center flex flex-col items-center gap-6">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            <p className="text-white/20 text-xs font-black uppercase tracking-[0.5em] italic">
              {t("app.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
