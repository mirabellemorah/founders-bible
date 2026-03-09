import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus, Smartphone, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Event system to trigger prompt from anywhere
const installPromptListeners: Set<() => void> = new Set();

export function triggerInstallPrompt() {
  installPromptListeners.forEach(listener => listener());
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const isMobile = useIsMobile();

  useEffect(() => {
    // Detect platform on mount
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // Register listener for manual trigger
    const showPromptHandler = () => setShowPrompt(true);
    installPromptListeners.add(showPromptHandler);

    // Auto-show on mobile if not seen before
    if (isMobile) {
      const hasSeenPrompt = localStorage.getItem('fb-install-prompt-seen') === 'true';
      if (!hasSeenPrompt) {
        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => {
          clearTimeout(timer);
          installPromptListeners.delete(showPromptHandler);
        };
      }
    }

    return () => installPromptListeners.delete(showPromptHandler);
  }, [isMobile]);

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('fb-install-prompt-seen', 'true');
  };

  const getInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          steps: ["Tap Share button", "Tap 'Add to Home Screen'"],
          icon: <Share className="w-5 h-5 text-primary" />
        };
      case 'android':
        return {
          steps: ["Tap menu (⋮)", "Select 'Install app'"],
          icon: <Plus className="w-5 h-5 text-primary" />
        };
      default:
        return {
          steps: ["Find 'Add to Home Screen' in browser menu"],
          icon: <Smartphone className="w-5 h-5 text-primary" />
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
          className="fixed inset-0 bg-black/50 z-50 flex items-end pb-20"
          onClick={dismissPrompt}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="w-full mx-4 mb-2 bg-card border-2 border-border rounded-lg p-4 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-bold text-foreground">Install App</h3>
                  <button onClick={dismissPrompt} className="p-1 -mr-1 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {instructions.icon}
                  <span>{instructions.steps.join(" → ")}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={dismissPrompt}
                className="flex-1 py-2 text-xs font-body font-semibold text-muted-foreground bg-muted rounded transition-colors hover:bg-muted/80"
              >
                Later
              </button>
              <button
                onClick={dismissPrompt}
                className="flex-1 py-2 text-xs font-body font-bold text-primary-foreground bg-primary rounded transition-colors hover:bg-primary/90"
              >
                Got It
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
