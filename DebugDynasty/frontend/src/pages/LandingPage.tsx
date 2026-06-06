import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "../components/LanguageSelector";
import { 
  Heart, 
  Stethoscope, 
  Building2, 
  Truck, 
  Droplet, 
  User, 
  Users, 
  ChevronDown, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handlePortalNavigate = (role: string) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col justify-between font-sans">
      {/* Decorative Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-light-green/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-turquoise/15 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-stormy-teal p-2.5 rounded-xl shadow-md flex items-center justify-center">
              <Heart className="h-6 w-6 text-turquoise fill-current animate-pulse" />
            </div>
            <span className="text-2xl font-extrabold text-stormy-teal tracking-tight">
              Intelli<span className="text-turquoise">Care</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Hero Content Section */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-12 z-10">
        
        {/* Left Column: Copywriting & CTAs */}
        <div className="flex-1 text-center lg:text-left space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-turquoise/10 text-stormy-teal font-semibold text-sm border border-turquoise/20">
            <Activity className="h-4 w-4 text-turquoise" />
            <span>Smart Multilingual Healthcare Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stormy-teal leading-tight tracking-tight">
            {t("heroTitle")}
          </h1>

          <p className="text-slate-600 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
            {t("heroSubtitle")}
          </p>

          {/* User Entry Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 relative">
            
            {/* Patient Portal Direct CTA */}
            <button
              onClick={() => handlePortalNavigate("PATIENT")}
              className="w-full sm:w-auto px-8 py-4 bg-stormy-teal hover:bg-stormy-teal-dark text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover-glow transition-all duration-300 flex items-center justify-center gap-2 group text-base"
            >
              <User className="h-5 w-5 text-turquoise" />
              <span>{t("patientPortal")}</span>
              <ArrowRight className="h-4 w-4 text-turquoise group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Others Dropdown */}
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 text-stormy-teal font-bold rounded-2xl border border-slate-200 shadow-md flex items-center justify-center gap-2 transition-all duration-300 text-base"
              >
                <Users className="h-5 w-5 text-turquoise" />
                <span>{t("otherServices")}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 sm:right-auto sm:w-60 mt-2 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden z-50 divide-y divide-slate-100 animate-float-short">
                    
                    <button
                      onClick={() => handlePortalNavigate("DOCTOR")}
                      className="w-full px-5 py-3.5 text-left text-sm text-slate-700 hover:bg-light-green/20 hover:text-stormy-teal flex items-center gap-3 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">{t("doctor")}</span>
                    </button>

                    <button
                      onClick={() => handlePortalNavigate("HOSPITAL")}
                      className="w-full px-5 py-3.5 text-left text-sm text-slate-700 hover:bg-light-green/20 hover:text-stormy-teal flex items-center gap-3 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-sky-50 text-sky-500">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">{t("hospital")}</span>
                    </button>

                    <button
                      onClick={() => handlePortalNavigate("AMBULANCE")}
                      className="w-full px-5 py-3.5 text-left text-sm text-slate-700 hover:bg-light-green/20 hover:text-stormy-teal flex items-center gap-3 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                        <Truck className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">{t("ambulance")}</span>
                    </button>

                    <button
                      onClick={() => handlePortalNavigate("BLOOD_BANK")}
                      className="w-full px-5 py-3.5 text-left text-sm text-slate-700 hover:bg-light-green/20 hover:text-stormy-teal flex items-center gap-3 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-rose-50 text-rose-500">
                        <Droplet className="h-4 w-4" />
                      </div>
                      <span className="font-semibold">{t("bloodBank")}</span>
                    </button>

                  </div>
                </>
              )}
            </div>

          </div>

          {/* Quick Statistics/Features badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-lg mx-auto lg:mx-0 border-t border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <ShieldCheck className="h-5 w-5 text-turquoise shrink-0" />
              <span>Firebase Secure</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Zap className="h-5 w-5 text-green-yellow shrink-0" />
              <span>Realtime Status</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <Users className="h-5 w-5 text-stormy-teal shrink-0" />
              <span>Role Routing</span>
            </div>
          </div>

        </div>

        {/* Right Column: Visual Component / Graphics */}
        <div className="flex-1 w-full flex justify-center items-center relative">
          <div className="relative w-full max-w-[420px] aspect-square rounded-[2.5rem] bg-gradient-to-tr from-stormy-teal to-turquoise p-6 shadow-2xl animate-float">
            
            {/* Embedded glassmorphism status card */}
            <div className="absolute top-10 left-[-40px] w-64 glass p-5 rounded-2xl shadow-xl border border-white/30 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-turquoise/20 flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-stormy-teal" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stormy-teal">Doctor Available</h4>
                  <p className="text-xs text-slate-500">Connected to 12 hospitals</p>
                </div>
              </div>
            </div>

            {/* Embedded glassmorphism ambulance card */}
            <div className="absolute bottom-10 right-[-30px] w-56 glass p-4 rounded-2xl shadow-xl border border-white/30 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-yellow/20 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-stormy-teal" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stormy-teal">Ambulance Online</h4>
                  <p className="text-[10px] text-green-600 font-semibold">Ready to dispatch</p>
                </div>
              </div>
            </div>

            <div className="w-full h-full flex flex-col justify-between text-white p-4">
              <div className="flex justify-between items-start">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Heart className="h-6 w-6 text-green-yellow fill-current" />
                </div>
                <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium">
                  Active Session
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs tracking-wider uppercase opacity-80">Healthcare Ecosystem</p>
                <h2 className="text-3xl font-extrabold leading-tight">
                  Providing Care Without Language Barriers.
                </h2>
                <div className="flex gap-2">
                  <span className="h-2 w-8 rounded-full bg-green-yellow" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-stormy-teal text-white py-6 px-6 border-t border-slate-700/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-turquoise" />
            <span className="font-bold">IntelliCare © 2026</span>
          </div>
          <p className="text-slate-300 text-xs">
            Multilingual Integrated Patient-Care Network. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
