import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, Heart } from "lucide-react";

export default function WelcomePage() {
  const navigate = useNavigate();

  const features = [
    { icon: BookOpen, title: "Daily Scripture", desc: "Curated verses for founders" },
    { icon: Sparkles, title: "AI Reflection", desc: "Personalized spiritual guidance" },
    { icon: Heart, title: "Save & Grow", desc: "Build your spiritual library" },
  ];

  return (
    <div className="min-h-screen flex flex-col px-6 pt-safe bg-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex flex-col justify-center items-center text-center"
      >
        {/* Logo mark */}
        <div className="w-3 h-3 rounded-full bg-primary mb-8" />

        <h1 className="font-display text-5xl font-black tracking-tight text-background leading-[1.1]">
          Founder's<br />
          <span className="italic text-primary">Bible</span>
        </h1>

        <p className="mt-5 text-background/60 font-body text-sm leading-relaxed max-w-[260px]">
          Biblical wisdom for builders, leaders, and dreamers who build with purpose.
        </p>

        <div className="mt-14 w-full space-y-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex items-center gap-4 bg-background/5 border border-background/10 rounded-xl px-4 py-3.5 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-background">{title}</p>
                <p className="text-xs text-background/50 font-body">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          onClick={() => {
            localStorage.setItem("fb-onboarded", "true");
            navigate("/");
          }}
          className="mt-10 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-body font-semibold text-sm tracking-wide active:scale-[0.98] transition-transform"
        >
          Begin Your Journey
        </motion.button>

        <p className="mt-4 mb-8 text-xs text-background/40 font-body">
          Free · No account required
        </p>
      </motion.div>
    </div>
  );
}
