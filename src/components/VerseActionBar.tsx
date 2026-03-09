import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, Share2, X, Image } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";
import { getSavedHighlights, toggleHighlight, type SavedHighlight } from "@/lib/highlights";

interface VerseActionBarProps {
  verseText: string;
  reference: string;
  scriptureId?: string;
  onClose: () => void;
}

export default function VerseActionBar({ verseText, reference, scriptureId, onClose }: VerseActionBarProps) {
  const { toggle, isFavorite } = useFavorites();
  const [highlightSaved, setHighlightSaved] = useState(false);

  useEffect(() => {
    if (!scriptureId) {
      const highlights = getSavedHighlights();
      setHighlightSaved(highlights.some(h => h.reference === reference && h.text === verseText));
    }
  }, [scriptureId, reference, verseText]);

  const saved = scriptureId ? isFavorite(scriptureId) : highlightSaved;

  const handleSave = () => {
    if (scriptureId) {
      toggle(scriptureId);
      toast.success(saved ? "Removed from saved" : "Saved to favorites");
    } else {
      toggleHighlight({ text: verseText, reference });
      setHighlightSaved(!highlightSaved);
      toast.success(highlightSaved ? "Removed from saved" : "Saved to highlights");
    }
  };

  const handleShareText = async () => {
    const shareText = `"${verseText}"\n${reference}\n\nvia Founder's Bible`;
    if (navigator.share) {
      await navigator.share({ text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard");
    }
    onClose();
  };

  const handleShareImage = async (mode: "dark" | "cream") => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const w = 1080, h = 1350;
    canvas.width = w;
    canvas.height = h;

    const isDark = mode === "dark";
    ctx.fillStyle = isDark ? "#1a1a1a" : "#f9f8f0";
    ctx.fillRect(0, 0, w, h);

    const textColor = isDark ? "#f9f8f0" : "#1a1a1a";
    const accentColor = isDark ? "#e85d5d" : "#c44040";
    const mutedColor = isDark ? "rgba(249,248,240,0.5)" : "rgba(26,26,26,0.5)";

    ctx.fillStyle = accentColor;
    ctx.fillRect(80, 80, 8, 160);

    ctx.fillStyle = textColor;
    ctx.font = "italic 56px Georgia, serif";
    const words = verseText.split(" ");
    const lines: string[] = [];
    let currentLine = "\u201C";
    for (const word of words) {
      const test = currentLine + word + " ";
      if (ctx.measureText(test).width > w - 220) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine = test;
      }
    }
    lines.push(currentLine.trim() + "\u201D");

    let y = 240;
    for (const line of lines) {
      ctx.fillText(line, 120, y);
      y += 76;
    }

    ctx.fillStyle = accentColor;
    ctx.fillRect(120, y + 30, 80, 4);
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(reference.toUpperCase(), 220, y + 40);

    ctx.fillStyle = mutedColor;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("FOUNDER'S BIBLE", 120, h - 80);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "founders-bible-highlight.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "founders-bible-highlight.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Image downloaded");
      }
      onClose();
    }, "image/png");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-3 bg-foreground p-4 border-l-2 border-primary"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-body font-bold uppercase tracking-[0.2em] text-background/60">
          {reference}
        </p>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-background/60 hover:text-background" />
        </button>
      </div>
      <p className="text-xs font-body text-background/70 italic line-clamp-2 mb-3">
        "{verseText}"
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className={`flex-1 py-2.5 font-body text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            saved
              ? "bg-primary text-primary-foreground"
              : "border border-background/20 text-background hover:border-primary hover:text-primary"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={handleShareText}
          className="flex-1 py-2.5 border border-background/20 text-background font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5"
        >
          <Share2 className="w-3.5 h-3.5" /> Text
        </button>
        <button
          onClick={() => handleShareImage("cream")}
          className="flex-1 py-2.5 bg-background text-foreground border border-background/20 font-body text-[10px] font-bold uppercase tracking-wider hover:border-primary transition-all flex items-center justify-center gap-1.5"
        >
          <Image className="w-3.5 h-3.5" /> Image
        </button>
      </div>
    </motion.div>
  );
}
