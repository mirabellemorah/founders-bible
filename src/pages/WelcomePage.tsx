import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-ink relative overflow-hidden">
      {/* Giant decorative background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.03, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="font-display text-[280px] font-black text-cream leading-none whitespace-nowrap"
        >
          FAITH
        </motion.p>
      </div>

      {/* Top editorial header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-6 pt-safe"
      >
        <div className="flex items-center justify-between pt-4 pb-3 border-b border-cream/10">
          <p className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-cream/60">
            Founder's Bible
          </p>
          <p className="font-body text-[9px] uppercase tracking-widest text-cream/30">
            Vol. I
          </p>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Giant number decoration */}
          <motion.p
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="font-display text-[120px] font-black leading-none text-primary -mb-6"
          >
            01
          </motion.p>

          <h1 className="font-display text-6xl font-black text-cream leading-[0.9] tracking-tight">
            BUILD
            <br />
            <span className="italic font-normal text-primary">with</span>
            <br />
            PURPOSE
          </h1>

          <div className="mt-6 flex items-start gap-4">
            <div className="w-12 h-0.5 bg-primary mt-3 shrink-0" />
            <p className="text-cream/50 font-body text-sm leading-relaxed max-w-[240px]">
              Biblical wisdom for builders, leaders, and dreamers who refuse to build without meaning.
            </p>
          </div>
        </motion.div>

        {/* Feature pills — collage style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex flex-wrap gap-2"
        >
          {["Daily Scripture", "AI Reflections", "Save & Grow", "Real Talk"].map((f, i) => (
            <motion.span
              key={f}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              className={`px-4 py-2 text-xs font-body font-bold uppercase tracking-wider border ${
                i === 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-cream/70 border-cream/20"
              }`}
            >
              {f}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="px-6 pb-10"
      >
        <button
          onClick={() => {
            localStorage.setItem("fb-onboarded", "true");
            navigate("/");
          }}
          className="w-full flex items-center justify-between py-5 px-6 bg-primary text-primary-foreground font-body font-bold text-sm uppercase tracking-widest active:scale-[0.98] transition-transform group"
        >
          Begin Your Journey
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="mt-3 text-center text-[10px] text-cream/30 font-body uppercase tracking-widest">
          Free · No account required
        </p>
      </motion.div>

      {/* Scrolling marquee at bottom */}
      <div className="overflow-hidden border-t border-cream/10 py-2">
        <div className="animate-marquee flex whitespace-nowrap">
          {Array(4).fill("SCRIPTURE · WISDOM · COURAGE · FAITH · PURPOSE · ").map((t, i) => (
            <span key={i} className="font-body text-[10px] font-bold uppercase tracking-[0.4em] text-cream/10 mx-4">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
