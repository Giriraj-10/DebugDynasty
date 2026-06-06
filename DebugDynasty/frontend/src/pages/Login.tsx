import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import { 
  Heart, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Stethoscope,
  Building2,
  Truck,
  Droplet,
  User
} from "lucide-react";

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Role can come from search params (e.g. ?role=DOCTOR) or we can inspect URL
  const rawRole = searchParams.get("role") || "PATIENT";
  const role = rawRole.toUpperCase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password, role);
      // Success: route to specific dashboard based on role
      navigate(`/${role.toLowerCase()}/dashboard`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get specific styles/icons based on role
  const getRoleConfig = () => {
    switch (role) {
      case "DOCTOR":
        return {
          title: t("doctor"),
          icon: <Stethoscope className="h-6 w-6 text-indigo-500" />,
          bgColor: "from-indigo-50 to-white",
          accentColor: "indigo",
          colorClasses: "border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-700"
        };
      case "HOSPITAL":
        return {
          title: t("hospital"),
          icon: <Building2 className="h-6 w-6 text-sky-500" />,
          bgColor: "from-sky-50 to-white",
          accentColor: "sky",
          colorClasses: "border-sky-200 focus:ring-sky-500 focus:border-sky-500 text-sky-700"
        };
      case "AMBULANCE":
        return {
          title: t("ambulance"),
          icon: <Truck className="h-6 w-6 text-amber-500" />,
          bgColor: "from-amber-50 to-white",
          accentColor: "amber",
          colorClasses: "border-amber-200 focus:ring-amber-500 focus:border-amber-500 text-amber-700"
        };
      case "BLOOD_BANK":
        return {
          title: t("bloodBank"),
          icon: <Droplet className="h-6 w-6 text-rose-500" />,
          bgColor: "from-rose-50 to-white",
          accentColor: "rose",
          colorClasses: "border-rose-200 focus:ring-rose-500 focus:border-rose-500 text-rose-700"
        };
      case "PATIENT":
      default:
        return {
          title: t("patientPortal"),
          icon: <User className="h-6 w-6 text-turquoise" />,
          bgColor: "from-teal-50 to-white",
          accentColor: "turquoise",
          colorClasses: "border-teal-200 focus:ring-turquoise focus:border-turquoise text-stormy-teal"
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgColor} flex flex-col justify-between font-sans`}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-stormy-teal p-2 rounded-xl shadow-md">
            <Heart className="h-5 w-5 text-turquoise fill-current" />
          </div>
          <span className="text-xl font-black text-stormy-teal tracking-tight">
            Intelli<span className="text-turquoise">Care</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
        </div>
      </header>

      {/* Main Login Form Container */}
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
          
          {/* Top border colored line */}
          <div className="h-2 bg-gradient-to-r from-stormy-teal to-turquoise" />

          {/* Form Content */}
          <div className="p-8 space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col items-center text-center space-y-2 relative">
              <button
                onClick={() => navigate("/")}
                className="absolute left-0 top-1 text-slate-400 hover:text-stormy-teal transition-colors"
                title="Back to Landing Page"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner mt-4 lg:mt-0">
                {config.icon}
              </div>

              <h2 className="text-2xl font-extrabold text-stormy-teal pt-2">
                {config.title} {t("login")}
              </h2>
              <p className="text-sm text-slate-500">
                Please enter your credentials to access your dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {t("email")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {t("password")}
                  </label>
                  <Link
                    to={`/forgot-password?role=${role}`}
                    className="text-xs font-bold text-turquoise hover:text-turquoise-dark transition-colors"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all"
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-stormy-teal hover:bg-stormy-teal-dark text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{t("submitting")}</span>
                  </>
                ) : (
                  <span>{t("login")}</span>
                )}
              </button>

            </form>

            {/* Footer Registration Link */}
            <div className="text-center pt-2 border-t border-slate-100 text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to={`/register?role=${role}`}
                className="font-bold text-turquoise hover:underline transition-all"
              >
                {t("signup")}
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 bg-white/20 border-t border-slate-100">
        IntelliCare Unified Authentication System. All sessions are encrypted.
      </footer>
    </div>
  );
};
