import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, BookOpen, Flame, Heart, Moon, Sun, Bell, BellOff, Info, ArrowRight, Pencil, Check, X, Palette, Clock, Droplets, Download } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { themes } from "@/data/scriptures";
import { toast } from "sonner";
import { requestNotificationPermission, startNotificationScheduler, stopNotificationScheduler, scheduleDailyNotification, cancelDailyNotification } from "@/lib/notifications";
import { Capacitor } from "@capacitor/core";
import { triggerInstallPrompt } from "@/components/InstallPrompt";
const virtueThemes = ["Leadership", "Courage", "Faith", "Patience", "Discipline", "Purpose", "Wisdom", "Perseverance", "Hope", "Love", "Humility", "Gratitude", "Trust", "Strength", "Peace", "Integrity"];
const realTalkThemes = ["Fear", "Money", "Negotiation", "Anxiety", "Failure", "Anger", "Jealousy", "Loneliness", "Doubt", "Greed", "Pride", "Suffering"];

type ColorMode = "crimson" | "ocean" | "ember" | "forest" | "royal" | "midnight";

const colorModes: { id: ColorMode; label: string; preview: string; hue: string }[] = [
  { id: "crimson", label: "Crimson", preview: "bg-[hsl(0,80%,50%)]", hue: "0" },
  { id: "ocean", label: "Ocean", preview: "bg-[hsl(210,80%,50%)]", hue: "210" },
  { id: "ember", label: "Ember", preview: "bg-[hsl(30,80%,50%)]", hue: "30" },
  { id: "forest", label: "Forest", preview: "bg-[hsl(150,60%,40%)]", hue: "150" },
  { id: "royal", label: "Royal", preview: "bg-[hsl(270,70%,55%)]", hue: "270" },
  { id: "midnight", label: "Midnight", preview: "bg-[hsl(220,20%,25%)]", hue: "220" },
];

function applyColorMode(mode: ColorMode, isDark: boolean) {
  const root = document.documentElement;
  const config = colorModes.find(c => c.id === mode)!;
  const h = config.hue;

  if (mode === "midnight") {
    root.style.setProperty("--primary", `${h} 20% ${isDark ? "55" : "25"}%`);
    root.style.setProperty("--accent", `${h} 20% ${isDark ? "55" : "25"}%`);
    root.style.setProperty("--ring", `${h} 20% ${isDark ? "55" : "25"}%`);
  } else {
    root.style.setProperty("--primary", `${h} 80% ${isDark ? "55" : "50"}%`);
    root.style.setProperty("--accent", `${h} 80% ${isDark ? "55" : "50"}%`);
    root.style.setProperty("--ring", `${h} 80% ${isDark ? "55" : "50"}%`);
  }

  localStorage.setItem("fb-color-mode", mode);
}

export default function ProfilePage() {
  const { favorites } = useFavorites();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("fb-notifications") === "true"
  );

  // Editable name
  const [name, setName] = useState(() => localStorage.getItem("fb-founder-name") || "FOUNDER");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  // Theme preferences
  const [showThemes, setShowThemes] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(() => {
    const saved = localStorage.getItem("fb-selected-themes");
    return saved ? JSON.parse(saved) : [...themes];
  });

  // Notification time
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notifTime, setNotifTime] = useState(() => localStorage.getItem("fb-notif-time") || "08:00");
  const [tempTime, setTempTime] = useState(notifTime);

  // Bible version
  const bibleVersions = [
    { id: "kjv", label: "KJV (King James Version)" },
    { id: "web", label: "WEB (World English Bible)" },
    { id: "bbe", label: "BBE (Bible in Basic English)" },
  ];
  const [showBibleVersion, setShowBibleVersion] = useState(false);
  const [bibleVersion, setBibleVersion] = useState(() => localStorage.getItem("fb-bible-version") || "web");

  const handleBibleVersionChange = (version: string) => {
    setBibleVersion(version);
    localStorage.setItem("fb-bible-version", version);
    toast.success(`Bible version updated to ${version.toUpperCase()}`);
    // Optionally reload or let components read from local storage when they mount
  };

  // Color mode
  const [showColors, setShowColors] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>(() =>
    (localStorage.getItem("fb-color-mode") as ColorMode) || "crimson"
  );

  const saveName = () => {
    const trimmed = nameInput.trim().toUpperCase();
    if (trimmed) {
      setName(trimmed);
      localStorage.setItem("fb-founder-name", trimmed);
      toast.success("Name updated");
    }
    setEditingName(false);
  };

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev => {
      const next = prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme];
      localStorage.setItem("fb-selected-themes", JSON.stringify(next));
      return next;
    });
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("fb-dark-mode", next ? "true" : "false");
    applyColorMode(colorMode, next);
    toast.success(next ? "Dark mode enabled" : "Light mode enabled");
  };

  // Start notification scheduler on mount if enabled
  useEffect(() => {
    if (notificationsEnabled) {
      startNotificationScheduler();
    }
    return () => stopNotificationScheduler();
  }, [notificationsEnabled]);

  const enableNotifications = async (time: string) => {
    setNotifTime(time);
    setTempTime(time);
    localStorage.setItem("fb-notif-time", time);
    
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      
      setNotificationsEnabled(true);
      localStorage.setItem("fb-notifications", "true");
      
      // On native platforms, use reliable daily scheduled notifications
      if (Capacitor.isNativePlatform()) {
        await scheduleDailyNotification(time);
        if (granted) {
          toast.success(`Daily notifications scheduled for ${time}`);
        } else {
          toast.warning("Notifications enabled but permission was denied");
        }
      } else {
        // On web, use interval-based approach
        startNotificationScheduler();
        if (granted) {
          toast.success(`Notifications enabled for ${time}`);
        } else {
          toast.warning("Notifications enabled in app, but your browser is blocking them. (This is normal in the preview editor)");
        }
      }
    } else {
      // Update existing notification time
      if (Capacitor.isNativePlatform()) {
        await scheduleDailyNotification(time);
        toast.success(`Notification time updated to ${time}`);
      } else {
        toast.success(`Notification time set to ${time}`);
      }
    }
  };

  const disableNotifications = async () => {
    setNotificationsEnabled(false);
    localStorage.setItem("fb-notifications", "false");
    
    if (Capacitor.isNativePlatform()) {
      await cancelDailyNotification();
    } else {
      stopNotificationScheduler();
    }
    
    toast.success("Notifications disabled");
  };

  const handleColorChange = (mode: ColorMode) => {
    setColorMode(mode);
    applyColorMode(mode, darkMode);
    toast.success(`${colorModes.find(c => c.id === mode)!.label} theme applied`);
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
    { icon: BookOpen, label: "Themes", value: selectedThemes.length.toString(), suffix: "active" },
  ];

  const colorPanel = (
    <div className="bg-card border-2 border-foreground/10 p-4">
      <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-primary mb-3">Color Mode</p>
      <div className="grid grid-cols-3 gap-2">
        {colorModes.map(mode => (
          <button
            key={mode.id}
            onClick={() => handleColorChange(mode.id)}
            className={`flex flex-col items-center gap-2 p-3 border-2 transition-all ${
              colorMode === mode.id ? "border-foreground bg-secondary" : "border-border hover:border-foreground/40"
            }`}
          >
            <div className={`w-8 h-8 ${mode.preview}`} />
            <span className="text-[10px] font-body font-bold uppercase tracking-wider text-foreground">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const timePanel = (
    <div className="bg-card border-2 border-foreground/10 p-4">
      <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-primary mb-3">Daily Reminder Time</p>
      <p className="text-[9px] font-body text-muted-foreground mb-3">
        You will receive a browser notification at this time daily (keep the app open in a tab).
      </p>
      <div className="flex flex-col gap-3">
        <form onSubmit={e => e.preventDefault()} className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="time"
            value={tempTime}
            onChange={e => setTempTime(e.target.value)}
            className="bg-background text-foreground font-body text-sm font-semibold px-3 py-2 border-2 border-border focus:border-primary outline-none transition-colors"
          />
          <button
            onClick={() => enableNotifications(tempTime)}
            className="px-3 py-2 bg-primary text-primary-foreground font-body text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Save
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          {["06:00", "07:00", "08:00", "09:00", "12:00", "21:00"].map(t => (
            <button key={t} onClick={() => enableNotifications(t)} className={`px-3 py-1.5 text-[10px] font-body font-bold uppercase tracking-wider border-2 transition-all ${(notificationsEnabled && notifTime === t) ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground"}`}>
              {t}
            </button>
          ))}
          <button onClick={disableNotifications} className={`px-3 py-1.5 text-[10px] font-body font-bold uppercase tracking-wider border-2 transition-all ${!notificationsEnabled ? "bg-red-500 text-white border-red-500" : "bg-transparent text-red-500 border-border hover:border-red-500"}`}>
            OFF
          </button>
        </div>
      </div>
    </div>
  );

  const themesPanel = (
    <div className="bg-card border-2 border-foreground/10 p-4">
      <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-primary mb-3">Virtues</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {virtueThemes.map(theme => (
          <button key={theme} onClick={() => toggleTheme(theme)} className={`px-3 py-1.5 text-xs font-body font-bold uppercase tracking-wider border-2 transition-all ${selectedThemes.includes(theme) ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground"}`}>
            {theme}
          </button>
        ))}
      </div>
      <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-primary mb-3">Real Talk</p>
      <div className="flex flex-wrap gap-2">
        {realTalkThemes.map(theme => (
          <button key={theme} onClick={() => toggleTheme(theme)} className={`px-3 py-1.5 text-xs font-body font-bold uppercase tracking-wider border-2 transition-all ${selectedThemes.includes(theme) ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary"}`}>
            {theme}
          </button>
        ))}
      </div>
      <p className="text-[9px] font-body text-muted-foreground mt-3">{selectedThemes.length} themes active</p>
    </div>
  );

  const bibleVersionPanel = (
    <div className="bg-card border-2 border-foreground/10 p-4">
      <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-primary mb-3">Bible Version</p>
      <div className="flex flex-col gap-2">
        {bibleVersions.map(v => (
          <button
            key={v.id}
            onClick={() => handleBibleVersionChange(v.id)}
            className={`text-left px-3 py-2 text-xs font-body font-bold tracking-wider border-2 transition-all ${
              bibleVersion === v.id
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );

  const settings: { icon: any; label: string; action: () => void; panel?: { show: boolean; content: React.ReactNode } }[] = [
    {
      icon: Pencil,
      label: "Edit Name",
      action: () => { setNameInput(name); setEditingName(true); },
    },
    {
      icon: BookOpen,
      label: `Bible Version: ${bibleVersions.find(v => v.id === bibleVersion)?.id.toUpperCase() || "KJV"}`,
      action: () => setShowBibleVersion(prev => !prev),
      panel: { show: showBibleVersion, content: bibleVersionPanel },
    },
    {
      icon: Droplets,
      label: `Color: ${colorModes.find(c => c.id === colorMode)!.label}`,
      action: () => setShowColors(prev => !prev),
      panel: { show: showColors, content: colorPanel },
    },
    {
      icon: darkMode ? Moon : Sun,
      label: darkMode ? "Dark Mode" : "Light Mode",
      action: toggleDarkMode,
    },
    {
      icon: Palette,
      label: "Manage Themes",
      action: () => setShowThemes(prev => !prev),
      panel: { show: showThemes, content: themesPanel },
    },
    {
      icon: notificationsEnabled ? Bell : BellOff,
      label: notificationsEnabled ? `Notifications · ${notifTime}` : "Notifications Off",
      action: () => setShowTimePicker(prev => !prev),
      panel: { show: showTimePicker, content: timePanel },
    },
    {
      icon: Download,
      label: "Install App",
      action: () => triggerInstallPrompt(),
    },
    {
      icon: Info,
      label: "About Founder's Bible",
      action: () => toast("Founder's Bible — Biblical wisdom for builders, leaders, and dreamers. Built by Mirabelle Morah. v1.0"),
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

      {/* Avatar area with editable name */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 flex items-center gap-4 p-4 bg-foreground"
      >
        <div className="w-16 h-16 bg-primary flex items-center justify-center shrink-0">
          <User className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {editingName ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveName()}
                  maxLength={24}
                  className="bg-background text-foreground font-display text-lg font-black tracking-tight px-2 py-1 w-full outline-none border-2 border-primary"
                />
                <button onClick={saveName} className="p-1 text-green-400 hover:text-green-300">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => setEditingName(false)} className="p-1 text-red-400 hover:text-red-300">
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="font-display text-lg font-black text-background tracking-tight truncate">{name}</p>
                <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-background/50">Building with faith</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

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
      <div className="mt-5">
        <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">Settings</p>
        
        {settings.map(({ icon: Icon, label, action, panel }) => {
          const isOpen = panel?.show ?? false;
          return (
          <div key={label}>
            <button
              onClick={action}
              className="w-full flex items-center justify-between px-4 py-4 bg-card border-b border-border hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                <span className="text-sm font-body font-semibold text-foreground">{label}</span>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={2} />
              </motion.div>
            </button>
            {panel && (
              <AnimatePresence>
                {panel.show && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {panel.content}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
          );
        })}
      </div>

      <div className="h-8" />
    </div>
  );
}
