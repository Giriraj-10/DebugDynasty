import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  FileText,
  AlertTriangle,
  Brain,
  Stethoscope,
  RefreshCcw,
  ArrowRight,
  Heart,
  Activity,
  Shield,
  ChevronRight,
  Pill,
  Zap,
  Clock
} from "lucide-react";

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bgColor: string;
}> = ({ icon, label, value, sub, color, bgColor }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-300`}>
    <div className={`p-3.5 rounded-xl ${bgColor} shrink-0`}>
      <span className={color}>{icon}</span>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-black text-stormy-teal leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  </div>
);

const QuickActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  gradient: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
}> = ({ icon, title, description, gradient, badge, badgeColor, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left group relative overflow-hidden rounded-2xl p-5 text-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
    style={{ background: gradient }}
  >
    {/* background decoration */}
    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
      <span className="text-[80px]">{icon}</span>
    </div>
    <div className="relative space-y-2">
      {badge && (
        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${badgeColor}`}>
          {badge}
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span className="text-white/90">{icon}</span>
        <h3 className="font-black text-base leading-tight">{title}</h3>
      </div>
      <p className="text-xs text-white/80 leading-relaxed">{description}</p>
      <div className="flex items-center gap-1 text-xs font-semibold text-white/90 mt-1 group-hover:gap-2 transition-all">
        <span>Open</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  </button>
);

interface UnifiedReminder {
  type: "APPOINTMENT" | "MEDICINE" | "PRESCRIPTION_MED";
  id: string | number;
  title: string;
  date?: string;
  time?: string;
  doctorName?: string;
  specialization?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  createdAt?: string;
}

export const PatientDashboard: React.FC = () => {
  const { profileData, user } = useAuth();
  const navigate = useNavigate();
  const patientUid = user?.uid || "mock-patient-uid";

  const [reminders, setReminders] = useState<UnifiedReminder[]>([]);
  const [loading, setLoading] = useState(false);

  const data = profileData || {
    fullName: "Patient",
    phone: "--",
    age: "--",
    bloodGroup: "--",
  };

  const name = data.fullName || user?.email?.split("@")[0] || "Patient";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/followup/reminders/patient/${patientUid}`);
      if (res.ok) {
        const list = await res.json();
        setReminders(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [patientUid]);

  const appointmentsList = reminders.filter(r => r.type === "APPOINTMENT");
  const activeMedsList = reminders.filter(r => r.type === "MEDICINE" || r.type === "PRESCRIPTION_MED");

  return (
    <div className="space-y-6">

      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stormy-teal via-[#0a7a8e] to-turquoise p-7 text-white shadow-xl">
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute right-24 -bottom-8 h-24 w-24 rounded-full bg-white/5" />
        <Heart className="absolute right-6 top-6 h-8 w-8 text-white/10 fill-current" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-turquoise/90 font-semibold text-sm tracking-wide">{greeting} 👋</p>
            <h1 className="text-3xl font-black leading-tight">{name}</h1>
            <p className="text-white/70 text-sm max-w-md">
              Your IntelliCare health dashboard. Monitor appointments, prescriptions, and access emergency care in one place.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {data.bloodGroup && data.bloodGroup !== "--" && (
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-center">
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Blood Group</p>
                <p className="text-2xl font-black text-white">{data.bloodGroup}</p>
              </div>
            )}
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-center">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Age</p>
              <p className="text-2xl font-black text-white">{data.age || "--"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          label="Upcoming Appointments"
          value={appointmentsList.length}
          sub={appointmentsList.length > 0 ? `${appointmentsList.length} scheduled visits` : "No scheduled visits"}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />
        <StatCard
          icon={<Pill className="h-6 w-6" />}
          label="Active Medications"
          value={activeMedsList.length}
          sub={activeMedsList.length > 0 ? `${activeMedsList.length} medications active` : "No active medications"}
          color="text-turquoise"
          bgColor="bg-teal-50"
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6" />}
          label="Emergency Requests"
          value={0}
          sub="No active SOS requests"
          color="text-rose-500"
          bgColor="bg-rose-50"
        />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-black text-stormy-teal mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-turquoise" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<Brain className="h-5 w-5" />}
            title="AI Symptom Triage"
            description="Describe symptoms to our AI assistant and get instant health guidance."
            path="/patient/dashboard/ai-triage"
            gradient="linear-gradient(135deg, #086375 0%, #1dd3b0 100%)"
            badge="AI Powered"
            badgeColor="bg-green-yellow/30 text-green-yellow"
            onClick={() => navigate("/patient/dashboard/ai-triage")}
          />
          <QuickActionCard
            icon={<Stethoscope className="h-5 w-5" />}
            title="Doctor Consultation"
            description="Book virtual or in-person consultations with verified doctors."
            path="/patient/dashboard/consultation"
            gradient="linear-gradient(135deg, #1e40af 0%, #6366f1 100%)"
            onClick={() => navigate("/patient/dashboard/consultation")}
          />
          <QuickActionCard
            icon={<AlertTriangle className="h-5 w-5" />}
            title="SOS Emergency"
            description="Trigger an emergency alert to dispatch nearby ambulances immediately."
            path="/patient/dashboard/sos"
            gradient="linear-gradient(135deg, #991b1b 0%, #ef4444 100%)"
            badge="Emergency"
            badgeColor="bg-white/20 text-white"
            onClick={() => navigate("/patient/dashboard/sos")}
          />
          <QuickActionCard
            icon={<RefreshCcw className="h-5 w-5" />}
            title="Follow-Up Care"
            description="Track your post-treatment recovery and scheduled follow-ups."
            path="/patient/dashboard/followup"
            gradient="linear-gradient(135deg, #065f46 0%, #10b981 100%)"
            onClick={() => navigate("/patient/dashboard/followup")}
          />
          <QuickActionCard
            icon={<FileText className="h-5 w-5" />}
            title="Prescription History"
            description="View all your past and current medical prescriptions in one place."
            path="/patient/dashboard/prescriptions"
            gradient="linear-gradient(135deg, #6b21a8 0%, #a855f7 100%)"
            onClick={() => navigate("/patient/dashboard/prescriptions")}
          />
          <QuickActionCard
            icon={<Activity className="h-5 w-5" />}
            title="Health Overview"
            description="Check your vitals, recent trends, and personalized health summary."
            path="/patient/dashboard"
            gradient="linear-gradient(135deg, #9a3412 0%, #f97316 100%)"
            onClick={() => navigate("/patient/dashboard/profile")}
          />
        </div>
      </div>

      {/* Health Summary & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-stormy-teal flex items-center gap-2">
              <Calendar className="h-5 w-5 text-turquoise" />
              Upcoming Appointments
            </h3>
            <button
              onClick={() => navigate("/patient/dashboard/consultation")}
              className="text-xs font-bold text-turquoise hover:text-stormy-teal transition-colors flex items-center gap-1"
            >
              Book Now <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400">Loading appointments...</div>
          ) : appointmentsList.length > 0 ? (
            <div className="space-y-3">
              {appointmentsList.map((app) => (
                <div key={app.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-stormy-teal">{app.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {app.date} at {app.time}
                    </p>
                  </div>
                  {app.doctorName && (
                    <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                      Dr. {app.doctorName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <Calendar className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No upcoming appointments</p>
              <p className="text-xs text-slate-400 mt-1">Book a consultation to get started</p>
              <button
                onClick={() => navigate("/patient/dashboard/consultation")}
                className="mt-3 text-xs font-bold text-turquoise hover:underline"
              >
                + Schedule a visit
              </button>
            </div>
          )}
        </div>

        {/* Active Prescriptions / Medications */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-stormy-teal flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-500" />
              Active Medications
            </h3>
            <button
              onClick={() => navigate("/patient/dashboard/followup")}
              className="text-xs font-bold text-turquoise hover:text-stormy-teal transition-colors flex items-center gap-1"
            >
              Manage Tracker <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400">Loading medications...</div>
          ) : activeMedsList.length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {activeMedsList.map((med, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-stormy-teal">{med.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {med.dosage && `${med.dosage} · `}
                      {med.frequency && `${med.frequency} · `}
                      {med.duration}
                    </p>
                  </div>
                  {med.doctorName && (
                    <span className="text-[9px] font-black px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
                      Rx
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <Pill className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No active medications</p>
              <p className="text-xs text-slate-400 mt-1">Medications from doctors or your tracker will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Request card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-stormy-teal flex items-center gap-2">
            <Shield className="h-5 w-5 text-rose-500" />
            Emergency Requests
          </h3>
          <button
            onClick={() => navigate("/patient/dashboard/sos")}
            className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1"
          >
            SOS Center <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center text-center py-6 rounded-xl bg-rose-50/50 border border-dashed border-rose-200">
          <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500">No active emergency requests</p>
          <p className="text-xs text-slate-400 mt-1">Your emergency SOS requests will appear here</p>
          <button
            onClick={() => navigate("/patient/dashboard/sos")}
            className="mt-3 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Open SOS Center
          </button>
        </div>
      </div>

    </div>
  );
};

export default PatientDashboard;
