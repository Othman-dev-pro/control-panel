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
    <div className={`min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-x-hidden transition-colors duration-500`} dir={dir}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <BarChart3 className="text-primary-foreground h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">{t("landing.nav.home")}</span>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden md:flex items-center gap-8 px-8 border-x border-border/50 h-10">
                <a href="#features" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">{t("landing.nav.features")}</a>
            </div>
            
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-xl h-10 w-10 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <AnimatePresence mode="wait">
                        {theme === "dark" ? (
                            <motion.div key="sun" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}><Sun className="h-5 w-5" /></motion.div>
                        ) : (
                            <motion.div key="moon" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}><Moon className="h-5 w-5" /></motion.div>
                        )}
                    </AnimatePresence>
                </Button>

                {/* Language Toggle */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 rounded-xl h-10 px-3 hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:text-primary">
                            <Globe className="h-4 w-4" />
                            {lang.toUpperCase()}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 border-border/50 animate-in fade-in zoom-in-95 duration-200">
                        <DropdownMenuItem onClick={() => setLang("ar")} className="rounded-xl font-bold py-2.5 gap-3 focus:bg-primary/object focus:text-primary cursor-pointer">
                            <span className="text-lg">🇾🇪</span> العربية
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLang("en")} className="rounded-xl font-bold py-2.5 gap-3 focus:bg-primary/10 focus:text-primary cursor-pointer">
                            <span className="text-lg">🇺🇸</span> English
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Button className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-95 text-xs font-black uppercase hidden sm:flex">
              {t("landing.hero.cta.download")}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ x: isRTL ? 50 : -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`space-y-8 text-center ${isRTL ? 'lg:text-right' : 'lg:text-left'}`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t("landing.hero.badge")}</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-foreground leading-[1.15] tracking-tight">
                {t("landing.hero.title").split(' ').slice(0, -1).join(' ')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 uppercase">
                  {t("landing.hero.title").split(' ').pop()}
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                {t("landing.hero.subtitle")}
              </p>
              
              <div className="space-y-6">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{t("landing.footer.download")}</p>
                <div className={`flex flex-wrap items-center gap-5 justify-center ${isRTL ? 'lg:justify-start' : 'lg:justify-end'}`}>
                    <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 active:scale-95 shadow-xl rounded-xl overflow-hidden">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-14 w-auto grayscale-[0.2] dark:grayscale-[0.4] hover:grayscale-0 transition-all" />
                    </a>
                    <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 active:scale-95 shadow-xl rounded-xl overflow-hidden">
                        <img src={theme === "dark" 
                            ? "https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" 
                            : "https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg"} 
                          alt="App Store" className="h-14 w-auto grayscale-[0.2] dark:grayscale-0 hover:grayscale-0 transition-all border border-slate-800/20 dark:border-white/10 rounded-xl" />
                    </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-card bg-card group">
                <img src="/deyoni_hero_mockup_1775605107383.png" alt="Mockup" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-10 -right-10 bg-card/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-primary/5 border border-border/50 max-w-[200px] hidden sm:block animate-pulse duration-[4000ms]">
                <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight">{t("landing.hero.badge.safe")}</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed">{t("landing.hero.badge.safe.desc")}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight italic">{t("landing.features.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">{t("landing.features.subtitle")}</p>
          </div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: t("landing.features.1.title"), desc: t("landing.features.1.desc"), color: "bg-blue-500/10 text-blue-500" },
              { icon: MessageSquare, title: t("landing.features.2.title"), desc: t("landing.features.2.desc"), color: "bg-indigo-500/10 text-indigo-500" },
              { icon: FileSpreadsheet, title: t("landing.features.3.title"), desc: t("landing.features.3.desc"), color: "bg-emerald-500/10 text-emerald-500" },
              { icon: Lock, title: t("landing.features.4.title"), desc: t("landing.features.4.desc"), color: "bg-rose-500/10 text-rose-500" },
              { icon: ArrowLeftRight, title: t("landing.features.5.title"), desc: t("landing.features.5.desc"), color: "bg-amber-500/10 text-amber-500" },
              { icon: Smartphone, title: t("landing.features.6.title"), desc: t("landing.features.6.desc"), color: "bg-sky-500/10 text-sky-500" },
            ].map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants} className="bg-card p-10 rounded-[40px] border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 group">
                <div className={`h-16 w-16 ${feature.color} rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform duration-500`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black mb-4">{feature.title}</h3>
                <p className="text-muted-foreground text-sm font-medium leading-loose italic">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-20 pb-10 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 border-b border-background/10 pb-16">
            <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'} space-y-4`}>
              <div className={`flex items-center justify-center ${isRTL ? 'md:justify-start' : 'md:justify-end'} gap-3`}>
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                  <BarChart3 className="text-primary-foreground h-6 w-6" />
                </div>
                <span className="text-2xl font-black tracking-tight uppercase">ديوني</span>
              </div>
              <p className="text-background/60 max-w-sm font-medium leading-loose opacity-70 italic">{t("landing.footer.tagline")}</p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-background/40">{t("landing.footer.download")}</p>
                <div className="flex flex-wrap justify-center gap-5">
                   <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="h-12 w-auto" />
                   </a>
                   <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-transform">
                        <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="App Store" className="h-12 w-auto" />
                   </a>
                </div>
            </div>
          </div>
          <div className="pt-10 text-center">
            <p className="text-background/40 text-[10px] font-black uppercase tracking-[0.2em] leading-loose opacity-50 italic">
              {t("app.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
