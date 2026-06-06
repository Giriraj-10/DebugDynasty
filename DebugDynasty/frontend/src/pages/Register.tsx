import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { LanguageSelector } from "../components/LanguageSelector";
import { 
  Heart, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  FileText,
  Save
} from "lucide-react";

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signup } = useAuth();

  const rawRole = searchParams.get("role") || "PATIENT";
  const role = rawRole.toUpperCase();

  // General fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    // Build role-specific payloads
    try {
      if (role === "PATIENT") {
        additionalData = {
          fullName: patientName,
          phone: patientPhone,
          age: parseInt(patientAge) || 0,
          bloodGroup: patientBloodGroup
        };
      } else if (role === "DOCTOR") {
        additionalData = {
          fullName: doctorName,
          phone: doctorPhone,
          medicalRegistrationNumber: doctorRegNo,
          degreeCertificateUrl: degreeFileName || "simulated_upload.pdf",
          experienceYears: parseInt(doctorExperience) || 0,
          specialization: doctorSpecialization,
          preferredLanguage: doctorPreferredLang
        };
      } else if (role === "HOSPITAL") {
        additionalData = {
          hospitalName: hospitalName,
          registrationNumber: hospitalRegNo,
          address: hospitalAddress,
          contactNumber: hospitalContact
        };
      } else if (role === "AMBULANCE") {
        additionalData = {
          providerName: ambulanceProviderName,
          vehicleNumber: ambulanceVehicleNo,
          driverName: ambulanceDriverName,
          contactNumber: ambulanceContact
        };
      } else if (role === "BLOOD_BANK") {
        additionalData = {
          bloodBankName: bloodBankName,
          registrationNumber: bloodBankRegNo,
          address: bloodBankAddress,
          contactNumber: bloodBankContact
        };
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

  const renderRoleFields = () => {
    switch (role) {
      case "PATIENT":
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("fullName")}</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="John Doe"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("age")}</label>
                <input
                  type="number"
                  required
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="30"
                  min="0"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("bloodGroup")}</label>
                <select
                  required
                  value={patientBloodGroup}
                  onChange={(e) => setPatientBloodGroup(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("phone")}</label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="9876543210"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
          </>
        );

      case "DOCTOR":
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("fullName")}</label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("phone")}</label>
              <input
                type="tel"
                required
                value={doctorPhone}
                onChange={(e) => setDoctorPhone(e.target.value)}
                placeholder="9876543210"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("medicalRegNo")}</label>
              <input
                type="text"
                required
                value={doctorRegNo}
                onChange={(e) => setDoctorRegNo(e.target.value)}
                placeholder="MCI-12345"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("degreeCertificate")}</label>
              <div className="relative border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs text-slate-500 font-medium text-center">
                  {degreeFileName ? `Selected: ${degreeFileName}` : "Click or drag to upload certificate (PDF, JPG, PNG)"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("experience")}</label>
                <input
                  type="number"
                  required
                  value={doctorExperience}
                  onChange={(e) => setDoctorExperience(e.target.value)}
                  placeholder="5"
                  min="0"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("specialization")}</label>
                <input
                  type="text"
                  required
                  value={doctorSpecialization}
                  onChange={(e) => setDoctorSpecialization(e.target.value)}
                  placeholder="Cardiology"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("preferredLang")}</label>
              <select
                required
                value={doctorPreferredLang}
                onChange={(e) => setDoctorPreferredLang(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Marathi">मराठी (Marathi)</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
                <option value="Telugu">తెలుగు (Telugu)</option>
                <option value="Bengali">বাংলা (Bengali)</option>
                <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                <option value="Malayalam">മലയാളം (Malayalam)</option>
              </select>
            </div>
          </>
        );

      case "HOSPITAL":
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("hospitalName")}</label>
              <input
                type="text"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="City General Hospital"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("registrationNo")}</label>
              <input
                type="text"
                required
                value={hospitalRegNo}
                onChange={(e) => setHospitalRegNo(e.target.value)}
                placeholder="HOSP-REG-456"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("contactNo")}</label>
              <input
                type="tel"
                required
                value={hospitalContact}
                onChange={(e) => setHospitalContact(e.target.value)}
                placeholder="022-12345678"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("address")}</label>
              <textarea
                required
                rows={2}
                value={hospitalAddress}
                onChange={(e) => setHospitalAddress(e.target.value)}
                placeholder="123 Hospital Marg, Mumbai"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all resize-none"
              />
            </div>
          </>
        );

      case "AMBULANCE":
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("providerName")}</label>
              <input
                type="text"
                required
                value={ambulanceProviderName}
                onChange={(e) => setAmbulanceProviderName(e.target.value)}
                placeholder="Speedy Rescue Services"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("vehicleNo")}</label>
              <input
                type="text"
                required
                value={ambulanceVehicleNo}
                onChange={(e) => setAmbulanceVehicleNo(e.target.value)}
                placeholder="MH-12-PQ-9999"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("driverName")}</label>
              <input
                type="text"
                required
                value={ambulanceDriverName}
                onChange={(e) => setAmbulanceDriverName(e.target.value)}
                placeholder="Robert Jackson"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("contactNo")}</label>
              <input
                type="tel"
                required
                value={ambulanceContact}
                onChange={(e) => setAmbulanceContact(e.target.value)}
                placeholder="9876543210"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
          </>
        );

      case "BLOOD_BANK":
        return (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("bloodBankName")}</label>
              <input
                type="text"
                required
                value={bloodBankName}
                onChange={(e) => setBloodBankName(e.target.value)}
                placeholder="Apex Red Cross Bank"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("registrationNo")}</label>
              <input
                type="text"
                required
                value={bloodBankRegNo}
                onChange={(e) => setBloodBankRegNo(e.target.value)}
                placeholder="BANK-REG-987"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("contactNo")}</label>
              <input
                type="tel"
                required
                value={bloodBankContact}
                onChange={(e) => setBloodBankContact(e.target.value)}
                placeholder="9876543210"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("address")}</label>
              <textarea
                required
                rows={2}
                value={bloodBankAddress}
                onChange={(e) => setBloodBankAddress(e.target.value)}
                placeholder="45 Blood Bank Rd, Pune"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all resize-none"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm z-10">
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

      {/* Main Form container */}
      <div className="flex-grow flex items-center justify-center p-6 my-6">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
          
          <div className="h-2 bg-gradient-to-r from-stormy-teal via-turquoise to-green-yellow" />

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

              <div className="h-10 w-10 rounded-xl bg-turquoise/15 flex items-center justify-center mt-3 sm:mt-0">
                <Save className="h-5 w-5 text-stormy-teal" />
              </div>

              <h2 className="text-2xl font-extrabold text-stormy-teal pt-1">
                {role} {t("register")}
              </h2>
              <p className="text-sm text-slate-500">
                Create your verified {role.toLowerCase()} profile
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                Account Credentials
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("email")}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t("password")}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-turquoise transition-all"
                />
              </div>

              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 pt-2 mb-2">
                Profile Details
              </h3>

              {renderRoleFields()}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-stormy-teal hover:bg-stormy-teal-dark text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 pt-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{t("submitting")}</span>
                  </>
                ) : (
                  <span>{t("signup")}</span>
                )}
              </button>

            </form>

            <div className="text-center pt-2 border-t border-slate-100 text-sm text-slate-500">
              Already have a profile?{" "}
              <Link
                to={`/login?role=${role}`}
                className="font-bold text-turquoise hover:underline transition-all"
              >
                {t("login")}
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 bg-white border-t border-slate-200">
        IntelliCare Account Registration. By signing up, you agree to profile verification rules.
      </footer>
    </div>
  );
};
