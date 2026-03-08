import { motion } from "framer-motion";
import { User, BookOpen, Flame, Heart, ChevronRight } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export default function ProfilePage() {
  const { favorites } = useFavorites();

  const stats = [
    { icon: Flame, label: "Day Streak", value: "1" },
    { icon: Heart, label: "Saved", value: favorites.length.toString() },
    { icon: BookOpen, label: "Themes", value: "8" },
  ];

  return (
    <div className="px-5 pt-safe">
      <div className="pt-6 pb-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">Profile</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-full bg-card border-2 border-border flex items-center justify-center">
          <User className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className="mt-3 font-display text-lg font-semibold text-foreground">Founder</p>
        <p className="text-xs font-body text-muted-foreground">Building with faith</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <Icon className="w-5 h-5 text-gold mx-auto mb-1" strokeWidth={1.5} />
            <p className="font-display text-xl font-semibold text-foreground">{value}</p>
            <p className="text-[10px] font-body text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {["Notification Settings", "Reading Preferences", "About Founders Bible"].map((item) => (
          <button
            key={item}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-card border border-border"
          >
            <span className="text-sm font-body font-medium text-foreground">{item}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <div className="h-8" />
    </div>
  );
}
