import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import { 
  Heart, 
  Mail, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  CheckCircle2
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
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

      {/* Main container */}
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
          
          <div className="h-2 bg-gradient-to-r from-stormy-teal to-turquoise" />

          <div className="p-8 space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col items-center text-center space-y-2 relative">
              <button
                onClick={() => navigate(`/login?role=${role}`)}
                className="absolute left-0 top-1 text-slate-400 hover:text-stormy-teal transition-colors"
                title="Back to Login"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-extrabold text-stormy-teal mt-6 sm:mt-0">
                {t("forgotPassword")}
              </h2>
              <p className="text-sm text-slate-500">
                Enter your email address to receive password recovery instructions
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-800 text-sm flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("resetLinkSent")}</span>
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
                    placeholder="name@example.com"
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
                  />
                </div>
              </div>

              {/* Submit button */}
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
                  <span>{t("sendResetLink")}</span>
                )}
              </button>

            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <Link
                to={`/login?role=${role}`}
                className="text-sm font-bold text-turquoise hover:underline transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("backToLogin")}
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 bg-white border-t border-slate-200">
        IntelliCare Authentication Recovery Service.
      </footer>
    </div>
  );
};
