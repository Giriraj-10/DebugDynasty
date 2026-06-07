import React, { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import {
  Heart,
  LayoutDashboard,
  User,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Building2,
  Truck,
  Droplet,
  Activity,
  Layers,
  Brain,
  AlertTriangle,
  RefreshCcw,
  FileText,
  ChevronRight
} from "lucide-react";

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout, profileData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return null;

  const role = user.role;

  const getSidebarItems = (): SidebarItem[] => {
    switch (role) {
      case "PATIENT":
        return [
          { label: "Dashboard", path: "/patient/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: "AI Symptom Triage", path: "/patient/dashboard/ai-triage", icon: <Brain className="h-5 w-5" />, badge: "AI" },
          { label: "Doctor Consultation", path: "/patient/dashboard/consultation", icon: <Stethoscope className="h-5 w-5" /> },
          { label: "SOS", path: "/patient/dashboard/sos", icon: <AlertTriangle className="h-5 w-5" />, badge: "!" },
          { label: "Follow-Up Care", path: "/patient/dashboard/followup", icon: <RefreshCcw className="h-5 w-5" /> },
          { label: "Prescription History", path: "/patient/dashboard/prescriptions", icon: <FileText className="h-5 w-5" /> },
          { label: "Profile", path: "/patient/dashboard/profile", icon: <User className="h-5 w-5" /> },
        ];
      case "DOCTOR":
        return [
          { label: "Dashboard", path: "/doctor/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: "Prescribe Patient", path: "/doctor/dashboard/prescribe", icon: <FileText className="h-5 w-5" /> },
          { label: "Appointments", path: "/doctor/dashboard/appointments", icon: <Calendar className="h-5 w-5" /> },
          { label: "Analytics", path: "/doctor/dashboard/analytics", icon: <Activity className="h-5 w-5" /> },
          { label: "Profile", path: "/doctor/dashboard/profile", icon: <User className="h-5 w-5" /> },
          { label: "Settings", path: "/doctor/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
        ];
      case "HOSPITAL":
        return [
          { label: "Dashboard", path: "/hospital/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: "Blood Request", path: "/hospital/dashboard/blood-request", icon: <Droplet className="h-5 w-5" /> },
          { label: "Bed Inventory", path: "/hospital/dashboard/beds", icon: <Layers className="h-5 w-5" /> },
          { label: "Profile", path: "/hospital/dashboard/profile", icon: <User className="h-5 w-5" /> },
          { label: "Settings", path: "/hospital/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
        ];
      case "AMBULANCE":
        return [
          { label: "Dashboard", path: "/ambulance/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: "Fleet Status", path: "/ambulance/dashboard/fleet", icon: <Truck className="h-5 w-5" /> },
          { label: "Profile", path: "/ambulance/dashboard/profile", icon: <User className="h-5 w-5" /> },
          { label: "Settings", path: "/ambulance/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
        ];
      case "BLOOD_BANK":
        return [
          { label: "Dashboard", path: "/blood_bank/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: "Donors List", path: "/blood_bank/dashboard/donors", icon: <Droplet className="h-5 w-5" /> },
          { label: "Profile", path: "/blood_bank/dashboard/profile", icon: <User className="h-5 w-5" /> },
          { label: "Settings", path: "/blood_bank/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
        ];
      default:
        return [
          { label: "Dashboard", path: `/${role.toLowerCase()}/dashboard`, icon: <LayoutDashboard className="h-5 w-5" /> },
        ];
    }
  };

  const menuItems = getSidebarItems();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getRoleHeaderConfig = () => {
    switch (role) {
      case "DOCTOR": return { icon: <Stethoscope className="h-5 w-5 text-indigo-500" />, badge: "Verified Doctor", badgeBg: "bg-indigo-50 text-indigo-700 border border-indigo-100" };
      case "HOSPITAL": return { icon: <Building2 className="h-5 w-5 text-sky-500" />, badge: "Verified Hospital", badgeBg: "bg-sky-50 text-sky-700 border border-sky-100" };
      case "AMBULANCE": return { icon: <Truck className="h-5 w-5 text-amber-500" />, badge: "Verified Ambulance", badgeBg: "bg-amber-50 text-amber-700 border border-amber-100" };
      case "BLOOD_BANK": return { icon: <Droplet className="h-5 w-5 text-rose-500" />, badge: "Verified Blood Bank", badgeBg: "bg-rose-50 text-rose-700 border border-rose-100" };
      default: return { icon: <User className="h-5 w-5 text-turquoise" />, badge: "Verified Patient", badgeBg: "bg-teal-50 text-teal-700 border border-teal-100" };
    }
  };

  const headerConfig = getRoleHeaderConfig();
  const welcomeName =
    profileData?.fullName || profileData?.hospitalName || profileData?.providerName || profileData?.bloodBankName ||
    user.email.split("@")[0];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 z-50 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Sidebar gradient background */}
        <div className="flex flex-col h-full bg-gradient-to-b from-stormy-teal via-stormy-teal to-[#043b46] text-white">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
              <div className="bg-white/15 p-2 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Heart className="h-5 w-5 text-turquoise fill-current" />
              </div>
              <span className="text-xl font-black tracking-tight">
                Intelli<span className="text-turquoise">Care</span>
              </span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info mini card */}
          <div className="px-4 py-3 mx-3 mt-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-turquoise/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {welcomeName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{welcomeName}</p>
                <p className="text-[11px] text-turquoise font-medium">{role.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    active
                      ? "bg-turquoise text-stormy-teal shadow-lg shadow-turquoise/20"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? "text-stormy-teal" : "text-white/60 group-hover:text-white transition-colors"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        item.badge === "AI" ? "bg-green-yellow/30 text-green-yellow" :
                        item.badge === "!" ? "bg-rose-400/30 text-rose-300 animate-pulse" :
                        "bg-white/20 text-white"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight className="h-3.5 w-3.5 text-stormy-teal" />}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide ${headerConfig.badgeBg}`}>
                {headerConfig.badge}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-500 hidden md:block">
              Welcome, <span className="text-stormy-teal font-extrabold">{welcomeName}</span>
            </span>
            <LanguageSelector />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
