import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, BookOpen, Flame, Heart, Moon, Sun, Bell, BellOff, Info, ArrowRight, Pencil, Check, Palette } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { themes } from "@/data/scriptures";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const THEME_STYLES = [
  { id: "gold", label: "Warm Gold", primary: "38 80% 50%", gold: "38 80% 50%", accent: "38 80% 50%" },
  { id: "navy", label: "Royal Navy", primary: "220 60% 30%", gold: "220 60% 30%", accent: "220 50% 45%" },
  { id: "emerald", label: "Emerald", primary: "152 55% 35%", gold: "152 55% 35%", accent: "152 45% 45%" },
  { id: "teal", label: "Deep Teal", primary: "185 55% 30%", gold: "185 55% 30%", accent: "185 45% 40%" },
  { id: "crimson", label: "Crimson", primary: "0 65% 45%", gold: "0 65% 45%", accent: "0 55% 55%" },
  { id: "plum", label: "Royal Plum", primary: "280 40% 40%", gold: "280 40% 40%", accent: "280 35% 50%" },
  { id: "midnight", label: "Midnight", primary: "0 0% 8%", gold: "0 0% 8%", accent: "0 0% 20%" },
] as const;

export default function ProfilePage() {
  const { favorites } = useFavorites();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("fb-notifications") === "true"
  );
  const [founderName, setFounderName] = useState(
    () => localStorage.getItem("fb-founder-name") || "FOUNDER"
  );
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(founderName);
  const [activeTheme, setActiveTheme] = useState(
    () => localStorage.getItem("fb-theme-style") || "gold"
  );
  const [showThemePicker, setShowThemePicker] = useState(false);

  const saveName = () => {
    const trimmed = nameInput.trim() || "FOUNDER";
    setFounderName(trimmed.toUpperCase());
    localStorage.setItem("fb-founder-name", trimmed.toUpperCase());
    setEditingName(false);
    toast.success("Name updated");
  };

  const applyTheme = (theme: typeof THEME_STYLES[number]) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--gold", theme.gold);
    root.style.setProperty("--highlight", theme.accent);
    setActiveTheme(theme.id);
    localStorage.setItem("fb-theme-style", theme.id);
    localStorage.setItem("fb-theme-primary", theme.primary);
    localStorage.setItem("fb-theme-gold", theme.gold);
    localStorage.setItem("fb-theme-accent", theme.accent);
    toast.success(`${theme.label} theme applied`);
  };

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
    { icon: Flame, label: "Streak", value: streak.toString(), suffix: "days" },
    { icon: Heart, label: "Saved", value: favorites.length.toString(), suffix: "verses" },
    { icon: BookOpen, label: "Themes", value: themes.length.toString(), suffix: "topics" },
  ];

  const settings = [
    {
      icon: Pencil,
      label: "Change Name",
      action: () => { setNameInput(founderName); setEditingName(true); },
    },
    {
      icon: Palette,
      label: "Theme Style",
      action: () => setShowThemePicker(!showThemePicker),
    },
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
      {/* Hero */}
      <div className="pt-6 pb-4 relative">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          className="absolute -top-2 right-0 font-display text-[100px] font-black text-foreground leading-none select-none pointer-events-none"
        >
          YOU
        </motion.p>
        <h1 className="font-display text-5xl font-black text-foreground leading-[0.9] tracking-tight relative z-10">
          YOUR
          <br />
          <span className="italic text-primary">PROFILE</span>
        </h1>
      </div>

      {/* Avatar area */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 flex items-center gap-4 p-4 bg-foreground"
      >
        <div className="w-16 h-16 bg-primary flex items-center justify-center shrink-0">
          <User className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
        </div>
        <div>
          <p className="font-display text-lg font-black text-background tracking-tight">{founderName}</p>
          <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-background/50">Building with faith</p>
        </div>
      </motion.div>

      {/* Name editor */}
      <AnimatePresence>
        {editingName && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 overflow-hidden"
          >
            <div className="flex gap-2 p-3 bg-card border-2 border-primary/20">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="font-body text-sm uppercase"
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveName()}
              />
              <button
                onClick={saveName}
                className="px-4 bg-primary text-primary-foreground font-body font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-1">
        {stats.map(({ icon: Icon, label, value, suffix }) => (
          <div key={label} className="bg-card border-2 border-foreground/10 p-4 text-center">
            <Icon className="w-4 h-4 text-primary mx-auto mb-2" strokeWidth={2} />
            <p className="font-display text-3xl font-black text-foreground leading-none">{value}</p>
            <p className="text-[9px] font-body font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">{suffix}</p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="mt-5 space-y-0">
        <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">Settings</p>
        {settings.map(({ icon: Icon, label, action }, i) => (
          <div key={label}>
            <button
              onClick={action}
              className="w-full flex items-center justify-between px-4 py-4 bg-card border-b border-border hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                <span className="text-sm font-body font-semibold text-foreground">{label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" strokeWidth={2} />
            </button>

            {/* Theme picker dropdown */}
            <AnimatePresence>
              {label === "Theme Style" && showThemePicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2 p-4 bg-card border-b border-border">
                    {THEME_STYLES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => applyTheme(theme)}
                        className={`relative p-3 border-2 transition-all ${
                          activeTheme === theme.id
                            ? "border-foreground"
                            : "border-foreground/10 hover:border-foreground/30"
                        }`}
                      >
                        <div
                          className="w-full h-6 mb-2"
                          style={{ backgroundColor: `hsl(${theme.primary})` }}
                        />
                        <p className="text-[9px] font-body font-bold uppercase tracking-wider text-foreground">
                          {theme.label}
                        </p>
                        {activeTheme === theme.id && (
                          <div className="absolute top-1 right-1">
                            <Check className="w-3 h-3 text-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="h-8" />
    </div>
  );
}
