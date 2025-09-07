"use client";

import {
  CopyCheck,
  GitCompare,
  Home,
  LucideIcon,
  Share,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  id: string;
}

const DashboardMenubarNavigation = () => {
  const pathname = usePathname();

  const navItems: NavItemProps[] = [
    {
      icon: Home,
      label: "Home",
      href: "/dashboard",
      id: "home",
    },
    {
      icon: CopyCheck,
      label: "Task",
      href: "/task",
      id: "task",
    },
    {
      icon: Share,
      label: "VIP",
      href: "/vip",
      id: "vip",
    },
    {
      icon: GitCompare,
      label: "Profit",
      href: "/profit",
      id: "profit",
    },
    {
      icon: User,
      label: "My",
      href: "/user",
      id: "my",
    },
  ];

  return (
    <>
      {/* Mobile Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        {/* Gradient fade effect above navigation */}
        <div className="h-6 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />

        {/* Navigation container */}
        <div className="bg-gradient-to-t from-slate-900/98 via-slate-800/95 to-slate-700/92 backdrop-blur-xl border-t border-emerald-500/20 shadow-2xl">
          <nav className="flex items-center justify-around h-16 px-2 safe-area-bottom">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link href={item.href} key={item.id} className="flex-1 group">
                  <div
                    className={`
                      flex flex-col items-center justify-center py-2 px-2 rounded-2xl mx-1
                      transition-all duration-300 ease-out
                      group-hover:bg-emerald-500/20 group-active:scale-95
                      min-h-[56px]
                      ${
                        isActive
                          ? "bg-gradient-to-t from-emerald-500/40 via-emerald-500/30 to-cyan-500/20 shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
                          : "hover:bg-white/10"
                      }
                    `}
                  >
                    <IconComponent
                      size={22}
                      className={`
                        transition-colors duration-300 ease-out mb-1
                        ${
                          isActive
                            ? "text-emerald-300 drop-shadow-sm"
                            : "text-slate-300 group-hover:text-emerald-200"
                        }
                      `}
                    />
                    <span
                      className={`
                        text-xs font-medium transition-colors duration-300 ease-out leading-tight
                        ${
                          isActive
                            ? "text-emerald-200 font-semibold"
                            : "text-slate-400 group-hover:text-emerald-200"
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop/Tablet Navigation - Hidden on mobile */}
      <div className="hidden sm:fixed sm:bottom-6 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:z-50 sm:block">
        <div className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-700/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl p-2">
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link href={item.href} key={item.id} className="group">
                  <div
                    className={`
                      flex items-center gap-3 py-3 px-4 rounded-xl
                      transition-all duration-300 ease-out
                      group-hover:bg-emerald-500/20 group-active:scale-95
                      min-w-[100px] justify-center
                      ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/20 shadow-lg shadow-emerald-500/25 border border-emerald-400/30"
                          : "hover:bg-white/10"
                      }
                    `}
                  >
                    <IconComponent
                      size={20}
                      className={`
                        transition-colors duration-300 ease-out
                        ${
                          isActive
                            ? "text-emerald-300"
                            : "text-slate-300 group-hover:text-emerald-200"
                        }
                      `}
                    />
                    <span
                      className={`
                        text-sm font-medium transition-colors duration-300 ease-out
                        ${
                          isActive
                            ? "text-emerald-200 font-semibold"
                            : "text-slate-400 group-hover:text-emerald-200"
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default DashboardMenubarNavigation;
