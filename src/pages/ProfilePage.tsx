import { useState } from "react";
import { motion } from "framer-motion";
import { User, BookOpen, Flame, Heart, ChevronRight, Moon, Sun, Bell, BellOff, Info } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { themes } from "@/data/scriptures";
import { toast } from "sonner";

export default function ProfilePage() {
  const { favorites } = useFavorites();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("fb-notifications") === "true"
  );

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("fb-dark-mode", next ? "true" : "false");
    toast.success(next ? "Dark mode enabled" : "Light mode enabled");
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          setNotificationsEnabled(true);
          localStorage.setItem("fb-notifications", "true");
          toast.success("Notifications enabled");
        } else {
          toast.error("Permission denied");
        }
      } else {
        toast.error("Notifications not supported");
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem("fb-notifications", "false");
      toast.success("Notifications disabled");
    }
  };

  // Calculate streak from localStorage
  const streak = (() => {
    const lastVisit = localStorage.getItem("fb-last-visit");
    const streakCount = parseInt(localStorage.getItem("fb-streak") || "1");
    const today = new Date().toISOString().split("T")[0];
    if (lastVisit !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newStreak = lastVisit === yesterday ? streakCount + 1 : 1;
      localStorage.setItem("fb-last-visit", today);
      localStorage.setItem("fb-streak", newStreak.toString());
      return newStreak;
    }
    return streakCount;
  })();

  const stats = [
    { icon: Flame, label: "Day Streak", value: streak.toString() },
    { icon: Heart, label: "Saved", value: favorites.length.toString() },
    { icon: BookOpen, label: "Themes", value: themes.length.toString() },
  ];

  const settings = [
    {
      icon: notificationsEnabled ? Bell : BellOff,
      label: notificationsEnabled ? "Notifications On" : "Notifications Off",
      action: toggleNotifications,
    },
    {
      icon: darkMode ? Moon : Sun,
      label: darkMode ? "Dark Mode" : "Light Mode",
      action: toggleDarkMode,
    },
    {
      icon: Info,
      label: "About Founder's Bible",
      action: () => toast("Founder's Bible — Biblical wisdom for builders, leaders, and dreamers. v1.0"),
    },
  ];

  return (
    <div className="px-5">
      <div className="pt-4 pb-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Pro<span className="italic text-primary">file</span>
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center">
          <User className="w-8 h-8 text-background" strokeWidth={1.5} />
        </div>
        <p className="mt-3 font-display text-lg font-bold text-foreground">Founder</p>
        <p className="text-xs font-body text-muted-foreground">Building with faith</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <Icon className="w-5 h-5 text-primary mx-auto mb-1" strokeWidth={1.5} />
            <p className="font-display text-xl font-bold text-foreground">{value}</p>
            <p className="text-[10px] font-body text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {settings.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-card border border-border hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-sm font-body font-medium text-foreground">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <div className="h-8" />
    </div>
  );
}
