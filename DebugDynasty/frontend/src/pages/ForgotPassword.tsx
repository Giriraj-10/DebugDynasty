import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import {
  Heart, Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2, ShieldCheck
} from "lucide-react";

export const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const role = (searchParams.get("role") || "PATIENT").toUpperCase();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send password reset link. Please check your email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* ── Left Brand Panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-stormy-teal via-[#0a7a8e] to-turquoise flex-col justify-between p-10 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
            <Heart className="h-6 w-6 text-white fill-current" />
          </div>
          <span className="text-2xl font-black tracking-tight">Intelli<span className="opacity-75">Care</span></span>
        </div>

        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/15">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black leading-tight">Account Recovery</h1>
          </div>
          <p className="text-sm text-white/70 leading-relaxed max-w-xs">
            Securely reset your IntelliCare password. A recovery link will be sent to your registered email address.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            {["Firebase-secured email delivery", "Link expires in 1 hour", "No personal data exposed"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                <CheckCircle2 className="h-4 w-4 text-white/60 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© 2026 IntelliCare · All sessions encrypted</p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* mobile header */}
        <header className="lg:hidden px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-stormy-teal p-2 rounded-xl shadow-md"><Heart className="h-5 w-5 text-turquoise fill-current" /></div>
            <span className="text-xl font-black text-stormy-teal tracking-tight">Intelli<span className="text-turquoise">Care</span></span>
          </div>
          <LanguageSelector />
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md space-y-8 page-enter">

            {/* top bar */}
            <div className="flex items-center justify-between">
              <button onClick={() => navigate(`/login?role=${role}`)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-stormy-teal transition-colors font-semibold">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>
              <div className="hidden lg:block"><LanguageSelector /></div>
            </div>

            {/* heading */}
            {!success ? (
              <>
                <div className="space-y-1">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{t("forgotPassword")}</h2>
                  <p className="text-sm text-slate-500">Enter your email address to receive password recovery instructions.</p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("email")}</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:bg-white focus:border-stormy-teal focus:ring-2 focus:ring-stormy-teal/15 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    id="forgot-submit-btn"
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 bg-stormy-teal hover:bg-[#064e5c] disabled:opacity-60 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /><span>{t("submitting")}</span></>
                    ) : (
                      <span>{t("sendResetLink")}</span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Success state */
              <div className="text-center space-y-6 py-8">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-emerald-100">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Check your inbox</h2>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                    {t("resetLinkSent")} We sent a recovery link to <strong className="text-slate-700">{email}</strong>.
                    The link will expire in 1 hour.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/login?role=${role}`)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-stormy-teal text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-[#064e5c] transition-all text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> {t("backToLogin")}
                </button>
              </div>
            )}

            {!success && (
              <p className="text-center text-sm text-slate-500">
                Remember your password?{" "}
                <Link to={`/login?role=${role}`} className="font-bold text-turquoise hover:underline">{t("login")}</Link>
              </p>
            )}
          </div>
        </div>

        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
          IntelliCare Authentication Recovery Service.
        </footer>
      </div>
    </div>
  );
};
