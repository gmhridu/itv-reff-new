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
    <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col flex-shrink-0 shadow-lg">
      {/* Enhanced background with gradient and better contrast */}
      <div className="h-[60px] bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700 border-t border-slate-600/50 backdrop-blur-sm">
        <nav className="flex items-center justify-between h-full px-4">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link href={item.href} key={item.id} className="flex-1 group">
                <div
                  className={`
                    flex flex-col items-center justify-center py-2 px-3 rounded-lg
                    transition-all duration-200 ease-out
                    group-hover:bg-white/10 active:scale-95
                    ${isActive
                      ? 'bg-blue-500/20 shadow-lg shadow-blue-500/25'
                      : ''
                    }
                  `}
                >
                  <IconComponent
                    size={22}
                    className={`
                      transition-colors duration-200 ease-out mb-1
                      ${isActive
                        ? "text-blue-400"
                        : "text-slate-300 group-hover:text-white"
                      }
                    `}
                  />
                  <span
                    className={`
                      text-xs font-medium transition-colors duration-200 ease-out
                      ${isActive
                        ? "text-blue-300 font-semibold"
                        : "text-slate-400 group-hover:text-white"
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
  );
};

export default DashboardMenubarNavigation;
