import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfDay, subDays } from "date-fns";

export type DateFilterValue = "today" | "yesterday" | "custom" | "all";

interface DateFilterProps {
  onFilterChange: (startDate: Date | null, endDate: Date | null) => void;
}

export default function DateFilter({ onFilterChange }: DateFilterProps) {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const [active, setActive] = useState<DateFilterValue>("today");
  const [customDate, setCustomDate] = useState<Date | undefined>();

  const handleFilter = (filter: DateFilterValue) => {
    setActive(filter);
    const now = new Date();
    switch (filter) {
      case "today":
        onFilterChange(startOfDay(now), now);
        break;
      case "yesterday": {
        const yesterday = subDays(now, 1);
        onFilterChange(startOfDay(yesterday), startOfDay(now));
        break;
      }
      case "all":
        onFilterChange(null, null);
        break;
      case "custom":
        // Don't change filter yet, wait for date pick
        break;
    }
  };

  const handleCustomDate = (date: Date | undefined) => {
    setCustomDate(date);
    if (date) {
      setActive("custom");
      const start = startOfDay(date);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      onFilterChange(start, end);
    }
  };

  const labels = {
    today: isAr ? "اليوم" : "Today",
    yesterday: isAr ? "أمس" : "Yesterday",
    all: isAr ? "الكل" : "All",
    custom: isAr ? "تاريخ محدد" : "Custom",
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["today", "yesterday", "all"] as const).map((f) => (
        <Button
          key={f}
          variant={active === f ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilter(f)}
          className="text-xs"
        >
          {labels[f]}
        </Button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={active === "custom" ? "default" : "outline"}
            size="sm"
            className={cn("text-xs gap-1.5")}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {active === "custom" && customDate
              ? format(customDate, "yyyy/MM/dd")
              : labels.custom}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={customDate}
            onSelect={handleCustomDate}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
