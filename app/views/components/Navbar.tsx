"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, User, LogOut, Settings, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  role: string | null;
  nama: string;
}

export default function Navbar({ role, nama }: NavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const toggleMobileDropdown = (label: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const getNavItems = (role: string | null) => {
    if (role === "Supervisor") {
      return [
        { href: "/views/spv", label: "Dashboard SPV", type: "link" },
        { 
          label: "Penugasan", 
          type: "dropdown",
          items: [
            { href: "/views/spv/penugasan", label: "Kelola Penugasan" },
            { href: "/views/spv/laporan", label: "Validasi Laporan" },
            { href: "/views/spv/kendala", label: "Kendala" },
          ]
        },
        { href: "/views/spv/inventaris", label: "Inventaris", type: "link" },
        { href: "/views/spv/users", label: "Manajemen User", type: "link" },
      ];
    } else if (role === "Manager") {
      return [
        { href: "/views/manager", label: "Dashboard", type: "link" },
        { href: "/views/manager/overview", label: "Overview", type: "link" },
        { href: "/views/manager/penugasan-final-validasi", label: "Final Validasi", type: "link" },
        { href: "/views/manager/laporan", label: "Laporan", type: "link" },
      ];
    } else if (role === "Teknisi") {
      return [
        { href: "/views/teknisi", label: "Dashboard Teknisi", type: "link" },
        { href: "/views/teknisi/laporan", label: "Laporan", type: "link" },
        { href: "/views/teknisi/alat", label: "Peminjaman Alat", type: "link" },
      ];
    }
    return [];
  };

  const navItems = getNavItems(role);

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "Supervisor": return "SPV";
      case "Manager": return "MGR";
      case "Teknisi": return "TEK";
      default: return "USR";
    }
  };

  return (
    <nav className="w-full bg-primary/90 shadow-sm sticky top-0 z-30 border-b border-border text-primary-foreground">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <Link href="/views" className="font-bold text-xl tracking-tight text-primary-foreground hover:text-primary-foreground/80 transition-colors duration-200">
          CoralOps
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => {
            if (item.type === "dropdown") {
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-3 py-2 rounded transition-all duration-200 ease-in-out transform hover:scale-105 text-sm font-medium hover:bg-primary-foreground/10 hover:text-primary-foreground hover:shadow-md text-primary-foreground/90">
                      {item.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {item.items?.map((subItem) => (
                      <DropdownMenuItem key={subItem.href} asChild>
                        <Link
                          href={subItem.href}
                          className={`w-full cursor-pointer ${
                            pathname === subItem.href
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            
            return (
              <Link
                key={item.href!}
                href={item.href!}
                className={`px-3 py-2 rounded transition-all duration-200 ease-in-out transform hover:scale-105 text-sm font-medium
                  hover:bg-primary-foreground/10 hover:text-primary-foreground hover:shadow-md
                  ${pathname === item.href
                    ? "bg-primary-foreground/20 text-primary-foreground shadow-md"
                    : "text-primary-foreground/90"}
                `}
              >
                {item.label}
              </Link>
            );
          })}
          
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 ease-in-out" suppressHydrationWarning>
                <Avatar className="h-8 w-8 transform hover:scale-110 hover:text-primary-foreground">
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">
                    {getRoleLabel(role)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">{nama}</p>
                  <p className="text-xs text-muted-foreground">{role || "User"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-primary-foreground transition-transform duration-200 hover:scale-110"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden bg-primary/95 border-t border-border overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-2">
          {navItems.map((item, index) => {
            if (item.type === "dropdown") {
              const isDropdownOpen = openDropdowns.has(item.label);
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMobileDropdown(item.label)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground transition-colors duration-200"
                  >
                    <span>{item.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`ml-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                    isDropdownOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    {item.items?.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setIsOpen(false)}
                        className={`block px-3 py-2 rounded transition-all duration-200 ease-in-out text-sm
                          ${pathname === subItem.href
                            ? "bg-primary-foreground/20 text-primary-foreground shadow-md"
                            : "text-primary-foreground/80 hover:text-primary-foreground"}
                        `}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }
            
            return (
              <Link
                key={item.href!}
                href={item.href!}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded transition-all duration-200 ease-in-out transform  text-sm font-medium
                  hover:text-primary-foreground
                  ${pathname === item.href
                    ? "bg-primary-foreground/20 text-primary-foreground shadow-md"
                    : "text-primary-foreground/90"}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-primary-foreground/20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 ease-in-out w-full text-left" suppressHydrationWarning>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">
                      {getRoleLabel(role)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-primary-foreground">{nama}</p>
                    <p className="text-xs text-primary-foreground/70">{role || "User"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">{nama}</p>
                    <p className="text-xs text-muted-foreground">{role || "User"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
