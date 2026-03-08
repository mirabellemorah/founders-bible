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
    <div className="min-h-screen flex flex-col px-6 pt-safe">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex flex-col justify-center items-center text-center"
      >
        {/* Logo mark */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
          <BookOpen className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
        </div>

        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground leading-tight">
          Founders<br />
          <span className="italic text-gold">Bible</span>
        </h1>

        <p className="mt-4 text-muted-foreground font-body text-sm leading-relaxed max-w-[260px]">
          Biblical wisdom for builders, leaders, and dreamers who build with purpose.
        </p>

        <div className="mt-12 w-full space-y-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex items-center gap-4 bg-card rounded-xl px-4 py-3.5 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-scripture flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-gold" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-display text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground font-body">{desc}</p>
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
          className="mt-10 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-body font-medium text-sm tracking-wide active:scale-[0.98] transition-transform"
        >
          Begin Your Journey
        </motion.button>

        <p className="mt-4 mb-8 text-xs text-muted-foreground font-body">
          Free · No account required
        </p>
      </motion.div>
    </div>
  );
}
