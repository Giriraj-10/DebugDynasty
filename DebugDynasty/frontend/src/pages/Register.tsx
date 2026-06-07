import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import {
  Heart, ArrowLeft, Loader2, AlertCircle, FileText, Save,
  Stethoscope, Building2, Truck, Droplet, User, Eye, EyeOff,
  Mail, Lock, CheckCircle2,
} from "lucide-react";

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signup } = useAuth();

  const rawRole = searchParams.get("role") || "PATIENT";
  const role = rawRole.toUpperCase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Patient Fields
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientBloodGroup, setPatientBloodGroup] = useState("");

  // Doctor Fields
  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [doctorExperience, setDoctorExperience] = useState("");
  const [doctorSpecialization, setDoctorSpecialization] = useState("");
  const [doctorPreferredLang, setDoctorPreferredLang] = useState("English");
  const [degreeFileName, setDegreeFileName] = useState("");

  // Hospital Fields
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalRegNo, setHospitalRegNo] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [hospitalContact, setHospitalContact] = useState("");

  // Ambulance Fields
  const [ambulanceProviderName, setAmbulanceProviderName] = useState("");
  const [ambulanceVehicleNo, setAmbulanceVehicleNo] = useState("");
  const [ambulanceDriverName, setAmbulanceDriverName] = useState("");
  const [ambulanceContact, setAmbulanceContact] = useState("");

  // Blood Bank Fields
  const [bloodBankName, setBloodBankName] = useState("");
  const [bloodBankRegNo, setBloodBankRegNo] = useState("");
  const [bloodBankAddress, setBloodBankAddress] = useState("");
  const [bloodBankContact, setBloodBankContact] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDegreeFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    let additionalData: any = {};
    try {
      if (role === "PATIENT") {
        additionalData = { fullName: patientName, phone: patientPhone, age: parseInt(patientAge) || 0, bloodGroup: patientBloodGroup };
      } else if (role === "DOCTOR") {
        additionalData = { fullName: doctorName, phone: doctorPhone, medicalRegistrationNumber: doctorRegNo, degreeCertificateUrl: degreeFileName || "simulated_upload.pdf", experienceYears: parseInt(doctorExperience) || 0, specialization: doctorSpecialization, preferredLanguage: doctorPreferredLang };
      } else if (role === "HOSPITAL") {
        additionalData = { hospitalName, registrationNumber: hospitalRegNo, address: hospitalAddress, contactNumber: hospitalContact };
      } else if (role === "AMBULANCE") {
        additionalData = { providerName: ambulanceProviderName, vehicleNumber: ambulanceVehicleNo, driverName: ambulanceDriverName, contactNumber: ambulanceContact };
      } else if (role === "BLOOD_BANK") {
        additionalData = { bloodBankName, registrationNumber: bloodBankRegNo, address: bloodBankAddress, contactNumber: bloodBankContact };
      }
      await signup(email, password, role, additionalData);
      navigate(`/${role.toLowerCase()}/dashboard`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed. Email might already be registered.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleConfig = () => {
    switch (role) {
      case "DOCTOR": return { icon: <Stethoscope className="h-5 w-5" />, label: "Doctor", panelGrad: "from-indigo-600 via-indigo-700 to-[#3730a3]", perks: ["Verified medical profile", "Live consultation queue", "Multilingual support"] };
      case "HOSPITAL": return { icon: <Building2 className="h-5 w-5" />, label: "Hospital", panelGrad: "from-sky-600 via-sky-700 to-[#0c4a6e]", perks: ["Real-time bed management", "SOS alert dispatch", "Blood inventory sync"] };
      case "AMBULANCE": return { icon: <Truck className="h-5 w-5" />, label: "Ambulance", panelGrad: "from-amber-500 via-amber-600 to-[#92400e]", perks: ["GPS duty broadcast", "SOS assignment alerts", "Route assistance"] };
      case "BLOOD_BANK": return { icon: <Droplet className="h-5 w-5" />, label: "Blood Bank", panelGrad: "from-rose-600 via-rose-700 to-[#881337]", perks: ["Live inventory dashboard", "Hospital request sync", "Expiry alerts"] };
      default: return { icon: <User className="h-5 w-5" />, label: "Patient", panelGrad: "from-stormy-teal via-[#0a7a8e] to-turquoise", perks: ["Book consultations instantly", "One-tap SOS emergency", "Health record tracking"] };
    }
  };

  const inputClass = "block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:bg-white focus:border-stormy-teal focus:ring-2 focus:ring-stormy-teal/15 transition-all";
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider";

  const renderRoleFields = () => {
    switch (role) {
      case "PATIENT":
        return (
          <>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("fullName")}</label>
              <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="John Doe" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>{t("age")}</label>
                <input type="number" required value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="30" min="0" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>{t("bloodGroup")}</label>
                <select required value={patientBloodGroup} onChange={(e) => setPatientBloodGroup(e.target.value)} className={inputClass}>
                  <option value="">Select</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("phone")}</label>
              <input type="tel" required value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="9876543210" className={inputClass} />
            </div>
          </>
        );

      case "DOCTOR":
        return (
          <>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("fullName")}</label>
              <input type="text" required value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="Dr. Jane Smith" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("phone")}</label>
              <input type="tel" required value={doctorPhone} onChange={(e) => setDoctorPhone(e.target.value)} placeholder="9876543210" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("medicalRegNo")}</label>
              <input type="text" required value={doctorRegNo} onChange={(e) => setDoctorRegNo(e.target.value)} placeholder="MCI-12345" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("degreeCertificate")}</label>
              <div className="relative border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center cursor-pointer">
                <input type="file" required accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <FileText className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-500 font-medium text-center">
                  {degreeFileName ? `✓ ${degreeFileName}` : "Click or drag to upload certificate (PDF, JPG, PNG)"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>{t("experience")}</label>
                <input type="number" required value={doctorExperience} onChange={(e) => setDoctorExperience(e.target.value)} placeholder="5" min="0" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>{t("specialization")}</label>
                <input type="text" required value={doctorSpecialization} onChange={(e) => setDoctorSpecialization(e.target.value)} placeholder="Cardiology" className={inputClass} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("preferredLang")}</label>
              <select required value={doctorPreferredLang} onChange={(e) => setDoctorPreferredLang(e.target.value)} className={inputClass}>
                {["English","Hindi","Marathi","Tamil","Telugu","Bengali","Gujarati","Punjabi","Kannada","Malayalam"].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </>
        );

      case "HOSPITAL":
        return (
          <>
            <div className="space-y-1.5"><label className={labelClass}>{t("hospitalName")}</label><input type="text" required value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="City General Hospital" className={inputClass} /></div>
            <div className="space-y-1.5"><label className={labelClass}>{t("registrationNo")}</label><input type="text" required value={hospitalRegNo} onChange={(e) => setHospitalRegNo(e.target.value)} placeholder="HOSP-REG-456" className={inputClass} /></div>
            <div className="space-y-1.5"><label className={labelClass}>{t("contactNo")}</label><input type="tel" required value={hospitalContact} onChange={(e) => setHospitalContact(e.target.value)} placeholder="022-12345678" className={inputClass} /></div>
            <div className="space-y-1.5"><label className={labelClass}>{t("address")}</label><textarea required rows={2} value={hospitalAddress} onChange={(e) => setHospitalAddress(e.target.value)} placeholder="123 Hospital Marg, Mumbai" className={`${inputClass} resize-none`} /></div>
          </>
        );

      case "AMBULANCE":
        return (
          <>
            <div className="space-y-1.5"><label className={labelClass}>{t("providerName")}</label><input type="text" required value={ambulanceProviderName} onChange={(e) => setAmbulanceProviderName(e.target.value)} placeholder="Speedy Rescue Services" className={inputClass} /></div>
            <div className="space-y-1.5"><label className={labelClass}>{t("vehicleNo")}</label><input type="text" required value={ambulanceVehicleNo} onChange={(e) => setAmbulanceVehicleNo(e.target.value)} placeholder="MH-12-PQ-9999" className={inputClass} /></div>
            <div className="space-y-1.5"><label className={labelClass}>{t("driverName")}</label><input type="text" required value={ambulanceDriverName} onChange={(e) => setAmbulanceDriverName(e.target.value)} placeholder="Robert Jackson" className={inputClass} /></div>
            <div className="space-y-1.5"><label className={labelClass}>{t("contactNo")}</label><input type="tel" required value={ambulanceContact} onChange={(e) => setAmbulanceContact(e.target.value)} placeholder="9876543210" className={inputClass} /></div>
          </>
        );

      case "BLOOD_BANK":
        return (
          <>
            <div className="space-y-1.5"><label className={labelClass}>{t("bloodBankName")}</label><input type="text" required value={bloodBankName} onChange={(e) => setBloodBankName(e.target.value)} placeholder="Apex Red Cross Bank" className={inputClass} /></div>
            <div className="space-y-1.5"><label className={labelClass}>{t("registrationNo")}</label><input type="text" required value={bloodBankRegNo} onChange={(e) => setBloodBankRegNo(e.target.value)} placeholder="BANK-REG-987" className={inputClass} /></div>
            <div className="space-y-1.5"><label className={labelClass}>{t("contactNo")}</label><input type="tel" required value={bloodBankContact} onChange={(e) => setBloodBankContact(e.target.value)} placeholder="9876543210" className={inputClass} /></div>
            <div className="space-y-1.5"><label className={labelClass}>{t("address")}</label><textarea required rows={2} value={bloodBankAddress} onChange={(e) => setBloodBankAddress(e.target.value)} placeholder="45 Blood Bank Rd, Pune" className={`${inputClass} resize-none`} /></div>
          </>
        );

      default: return null;
    }
  };

  const config = getRoleConfig();

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* ── Left Panel ── */}
      <div className={`hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br ${config.panelGrad} flex-col justify-between p-10 text-white relative overflow-hidden`}>
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
            <Heart className="h-6 w-6 text-white fill-current" />
          </div>
          <span className="text-2xl font-black tracking-tight">Intelli<span className="opacity-75">Care</span></span>
        </div>

        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/15">{config.icon}</div>
            <h1 className="text-3xl font-black leading-tight">{config.label} Registration</h1>
          </div>
          <p className="text-sm text-white/70 leading-relaxed max-w-xs">
            Create a verified {config.label.toLowerCase()} profile to access your dedicated IntelliCare dashboard.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            {config.perks.map((p) => (
              <div key={p} className="flex items-center gap-2.5 text-sm text-white/85">
                <CheckCircle2 className="h-4 w-4 text-white/60 shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© 2026 IntelliCare · All data encrypted</p>
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

        <div className="flex-1 overflow-y-auto px-6 py-8 flex items-start justify-center">
          <div className="w-full max-w-md space-y-7 page-enter">

            {/* top row */}
            <div className="flex items-center justify-between">
              <button onClick={() => navigate(`/login?role=${role}`)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-stormy-teal transition-colors font-semibold">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>
              <div className="hidden lg:block"><LanguageSelector /></div>
            </div>

            {/* heading */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">{config.icon}</div>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Create {config.label} Account</h2>
              <p className="text-sm text-slate-500">Fill in your details to register your verified profile.</p>
            </div>

            {/* error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* section: credentials */}
              <div className="space-y-4">
                <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="h-3 w-3" /> Account Credentials
                </h3>
                <div className="space-y-1.5">
                  <label className={labelClass}>{t("email")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`${inputClass} pl-10`} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>{t("password")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input id="reg-password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} className={`${inputClass} pl-10 pr-11`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* section: profile */}
              <div className="space-y-4 pt-1">
                <h3 className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Save className="h-3 w-3" /> Profile Details
                </h3>
                {renderRoleFields()}
              </div>

              <button id="reg-submit-btn" type="submit" disabled={submitting}
                className="w-full py-3.5 px-4 bg-stormy-teal hover:bg-[#064e5c] disabled:opacity-60 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm">
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /><span>{t("submitting")}</span></>
                ) : (
                  <span>{t("signup")}</span>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 pb-4">
              Already have an account?{" "}
              <Link to={`/login?role=${role}`} className="font-bold text-turquoise hover:underline">{t("login")}</Link>
            </p>
          </div>
        </div>

        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
          IntelliCare Account Registration. By signing up, you agree to profile verification rules.
        </footer>
      </div>
    </div>
  );
};
