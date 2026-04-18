import { APP_ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Calendar, GraduationCap, Home, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    labelKey: "navigation:home",
    href: APP_ROUTES.HOME,
    icon: Home,
  },
  {
    labelKey: "navigation:students",
    href: APP_ROUTES.STUDENTS,
    icon: Users,
  },
  {
    labelKey: "navigation:classes",
    href: APP_ROUTES.CLASSES,
    icon: GraduationCap,
  },
  {
    labelKey: "navigation:schedules",
    href: APP_ROUTES.SCHEDULES,
    icon: Calendar,
  },
];

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="sticky bottom-0 left-0 right-0 z-50">
      <div
        className={cn(
          "flex justify-around items-center px-4 pb-6 pt-3 rounded-t-2xl bg-card shadow-lg"
        )}
        style={{
          boxShadow: "0px -8px 24px rgba(109, 99, 243, 0.04)",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center px-4 py-1.5",
                "transition-all duration-150",
                isActive ? "text-primary" : "text-slate-400 hover:text-primary"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-foreground rounded-xl"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 22,
                  }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <Icon className="size-5" />
                <span className="font-label text-[9px] font-semibold uppercase tracking-wider mt-1">
                  {t(item.labelKey)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
