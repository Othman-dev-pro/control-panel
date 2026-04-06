import { useState, useEffect, useCallback } from "react";
import { useActiveAds } from "@/hooks/useAds";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";

export default function AdBanner() {
  const { data: ads = [] } = useActiveAds();
  const { isRTL } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % ads.length);
  }, [ads.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + ads.length) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [ads.length, next]);

  useEffect(() => {
    if (current >= ads.length) setCurrent(0);
  }, [ads.length, current]);

  if (ads.length === 0) return null;

  const ad = ads[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const content = (
    <div className="relative w-full overflow-hidden rounded-xl bg-muted">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.img
          key={ad.id}
          src={ad.image_url}
          alt="Ad"
          className="w-full h-28 sm:h-36 object-cover"
          loading="lazy"
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        />
      </AnimatePresence>

      {ads.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
            className="absolute start-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm hover:bg-background/90 transition-colors"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
            className="absolute end-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm hover:bg-background/90 transition-colors"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </>
      )}

      {ads.length > 1 && (
        <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-4 bg-primary" : "w-1.5 bg-background/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (ad.link) {
    return (
      <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}
