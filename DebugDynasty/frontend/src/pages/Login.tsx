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
  User,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const rawRole = searchParams.get("role") || "PATIENT";
  const role = rawRole.toUpperCase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password, role);
      navigate(`/${role.toLowerCase()}/dashboard`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleConfig = () => {
    switch (role) {
      case "DOCTOR":
        return {
          title: t("doctor"),
          icon: <Stethoscope className="h-6 w-6" />,
          accent: "indigo",
          accentHex: "#6366f1",
          panelGrad: "from-indigo-600 via-indigo-700 to-[#3730a3]",
          panelIcon: <Stethoscope className="h-20 w-20 opacity-20" />,
          tagline: "Access your patient schedules and live consultation requests.",
        };
      case "HOSPITAL":
        return {
          title: t("hospital"),
          icon: <Building2 className="h-6 w-6" />,
          accent: "sky",
          accentHex: "#0ea5e9",
          panelGrad: "from-sky-600 via-sky-700 to-[#0c4a6e]",
          panelIcon: <Building2 className="h-20 w-20 opacity-20" />,
          tagline: "Manage beds, SOS alerts and blood supply in real-time.",
        };
      case "AMBULANCE":
        return {
          title: t("ambulance"),
          icon: <Truck className="h-6 w-6" />,
          accent: "amber",
          accentHex: "#f59e0b",
          panelGrad: "from-amber-500 via-amber-600 to-[#92400e]",
          panelIcon: <Truck className="h-20 w-20 opacity-20" />,
          tagline: "Go on duty, receive SOS assignments, and broadcast your GPS.",
        };
      case "BLOOD_BANK":
        return {
          title: t("bloodBank"),
          icon: <Droplet className="h-6 w-6" />,
          accent: "rose",
          accentHex: "#f43f5e",
          panelGrad: "from-rose-600 via-rose-700 to-[#881337]",
          panelIcon: <Droplet className="h-20 w-20 opacity-20" />,
          tagline: "Update inventory and fulfil hospital blood requests instantly.",
        };
      default:
        return {
          title: t("patientPortal"),
          icon: <User className="h-6 w-6" />,
          accent: "teal",
          accentHex: "#1dd3b0",
          panelGrad: "from-stormy-teal via-[#0a7a8e] to-turquoise",
          panelIcon: <Heart className="h-20 w-20 opacity-20 fill-current" />,
          tagline: "Book consultations, trigger SOS, and track your health journey.",
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* ── Left Brand Panel ── */}
      <div className={`hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br ${config.panelGrad} flex-col justify-between p-10 text-white relative overflow-hidden`}>
        {/* decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5" />

        {/* logo */}
        <div
          className="relative flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
            <Heart className="h-6 w-6 text-white fill-current" />
          </div>
          <span className="text-2xl font-black tracking-tight">
            Intelli<span className="opacity-75">Care</span>
          </span>
        </div>

        {/* centre copy */}
        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/15">
              {config.icon}
            </div>
            <h1 className="text-3xl font-black leading-tight">
              {config.title} Portal
            </h1>
          </div>
          <p className="text-sm text-white/75 leading-relaxed max-w-xs">
            {config.tagline}
          </p>

          {/* feature pillls */}
          <div className="flex flex-col gap-2 pt-4">
            {[
              { icon: <ShieldCheck className="h-4 w-4" />, text: "Firebase-secured authentication" },
              { icon: <Heart className="h-4 w-4" />, text: "Unified multilingual healthcare platform" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-white/80">
                <span className="text-white/60">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        {/* footer quote */}
        <p className="relative text-xs text-white/40">
          © 2026 IntelliCare · All sessions encrypted
        </p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* mobile header */}
        <header className="lg:hidden px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-stormy-teal p-2 rounded-xl shadow-md">
              <Heart className="h-5 w-5 text-turquoise fill-current" />
            </div>
            <span className="text-xl font-black text-stormy-teal tracking-tight">
              Intelli<span className="text-turquoise">Care</span>
            </span>
          </div>
          <LanguageSelector />
        </header>

        {/* form content */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md space-y-8 page-enter">

            {/* top bar: back + language on desktop */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-stormy-teal transition-colors font-semibold"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="hidden lg:block">
                <LanguageSelector />
              </div>
            </div>

            {/* heading */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                  {config.icon}
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Sign in to {config.title}
              </h2>
              <p className="text-sm text-slate-500">
                Enter your credentials to access your dashboard.
              </p>
            </div>

            {/* error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t("email")}
                </label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-0 ml-3.5 my-auto h-4.5 w-4.5 text-slate-400 pointer-events-none h-4 w-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:bg-white focus:border-stormy-teal focus:ring-2 focus:ring-stormy-teal/15 transition-all"
                  />
                </div>
              </div>

              {/* password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {t("password")}
                  </label>
                  <Link
                    to={`/forgot-password?role=${role}`}
                    className="text-xs font-bold text-turquoise hover:text-stormy-teal transition-colors"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:bg-white focus:border-stormy-teal focus:ring-2 focus:ring-stormy-teal/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-stormy-teal hover:bg-[#064e5c] disabled:opacity-60 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("submitting")}</span>
                  </>
                ) : (
                  <span>{t("login")}</span>
                )}
              </button>
            </form>

            {/* footer */}
            <p className="text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to={`/register?role=${role}`}
                className="font-bold text-turquoise hover:underline"
              >
                {t("signup")}
              </Link>
            </p>
          </div>
        </div>

        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
          IntelliCare Unified Authentication System. All sessions are encrypted.
        </footer>
      </div>
    </div>
  );
};
