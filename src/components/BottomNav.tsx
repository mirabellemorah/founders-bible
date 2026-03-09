import { Home, MessageCircle, BookOpen, Bookmark, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/library", icon: BookOpen, label: "Library" },
  { to: "/saved", icon: Bookmark, label: "Saved" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-foreground border-t-2 border-primary pb-safe">
      <div className="flex items-center justify-around h-14 w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
                isActive
                  ? "text-primary"
                  : "text-background/50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} strokeWidth={isActive ? 2 : 1.5} />
                <span className={`text-[9px] font-body font-bold uppercase tracking-wider ${isActive ? "text-primary" : ""}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
