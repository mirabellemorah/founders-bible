import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Share, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only show on mobile devices
    if (!isMobile) return;

    // Check if user has already seen the prompt
    const hasSeenPrompt = localStorage.getItem('fb-install-prompt-seen') === 'true';
    if (hasSeenPrompt) return;

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // Show prompt after a short delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isMobile]);

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('fb-install-prompt-seen', 'true');
  };

  const getInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: "Install Founder's Bible",
          steps: [
            "Tap the Share button at the bottom of your screen",
            "Scroll down and tap 'Add to Home Screen'",
            "Tap 'Add' to confirm"
          ],
          icon: <Share className="w-6 h-6 text-primary" />
        };
      case 'android':
        return {
          title: "Install Founder's Bible", 
          steps: [
            "Tap the menu button (⋮) at the top right",
            "Select 'Add to Home screen' or 'Install app'",
            "Tap 'Add' to confirm"
          ],
          icon: <Plus className="w-6 h-6 text-primary" />
        };
      default:
        return {
          title: "Install Founder's Bible",
          steps: [
            "Look for 'Add to Home Screen' in your browser menu",
            "Follow the prompts to install the app"
          ],
          icon: <Smartphone className="w-6 h-6 text-primary" />
        };
    }
  };

  const instructions = getInstructions();

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full bg-background rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {instructions.icon}
                <h2 className="font-display text-xl font-bold text-foreground">
                  {instructions.title}
                </h2>
              </div>
              <button
                onClick={dismissPrompt}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Get quick access to daily scripture and reflections by adding this app to your home screen.
              </p>

              <div className="space-y-3">
                <p className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
                  How to Install:
                </p>
                {instructions.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={dismissPrompt}
                  className="flex-1 py-3 px-4 bg-muted text-muted-foreground font-body font-medium text-sm rounded-lg transition-colors hover:bg-muted/80"
                >
                  Maybe Later
                </button>
                <button
                  onClick={dismissPrompt}
                  className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-body font-bold text-sm rounded-lg transition-colors hover:bg-primary/90"
                >
                  Got It
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Works offline • No app store needed
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}