import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  RefreshCcw, Heart, Calendar,
  Plus, Trash2, Clock, Bell, Pill, AlertCircle, CheckCircle2
} from "lucide-react";

interface MedicineTracked {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  createdAt: string;
}

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

export const FollowUpCare: React.FC = () => {
  const { user } = useAuth();
  const patientUid = user?.uid || "mock-patient-uid";

  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");

  const [trackedMeds, setTrackedMeds] = useState<MedicineTracked[]>([]);
  const [reminders, setReminders] = useState<UnifiedReminder[]>([]);
  
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [savingMed, setSavingMed] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchTrackedMedicines = async () => {
    setLoadingMeds(true);
    try {
      const res = await fetch(`http://localhost:8080/api/followup/medicine/patient/${patientUid}`);
      if (res.ok) {
        const data = await res.json();
        setTrackedMeds(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMeds(false);
    }
  };

  const fetchReminders = async () => {
    setLoadingReminders(true);
    try {
      const res = await fetch(`http://localhost:8080/api/followup/reminders/patient/${patientUid}`);
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    fetchTrackedMedicines();
    fetchReminders();
  }, [patientUid]);

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!medicineName.trim()) {
      setErrorMsg("Medicine name is required.");
      return;
    }

    setSavingMed(true);
    try {
      const res = await fetch("http://localhost:8080/api/followup/medicine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientUid,
          medicineName,
          dosage,
          frequency,
          duration,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Medicine tracker updated successfully!");
        setMedicineName("");
        setDosage("");
        setFrequency("");
        setDuration("");
        fetchTrackedMedicines();
        fetchReminders();
      } else {
        setErrorMsg("Failed to add medicine to tracker.");
      }
    } catch (err) {
      setErrorMsg("Network error connecting to backend.");
    } finally {
      setSavingMed(false);
    }
  };

  const handleDeleteMedicine = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/followup/medicine/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTrackedMedicines();
        fetchReminders();
      }
    } catch (err) {
      console.error("Failed to delete medicine tracking entry", err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stormy-teal flex items-center gap-2">
          <RefreshCcw className="h-6 w-6 text-turquoise" />
          Follow-Up Care &amp; Reminders
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Track recovery tasks, medicine dosages, appointments, and medical reminders in one unified list.
        </p>
      </div>

      {/* Recovery progress banner */}
      <div className="bg-gradient-to-r from-stormy-teal to-turquoise rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15">
          <Heart className="h-28 w-28 text-white fill-current" />
        </div>
        <div className="relative space-y-2">
          <span className="inline-block text-[10px] font-black px-2 py-0.5 bg-white/20 text-white rounded-md uppercase tracking-widest">
            Recovery Plan
          </span>
          <h2 className="text-xl font-black">Active Care Journey</h2>
          <p className="text-xs text-white/85 max-w-md">
            Complete your daily reminders below and keep track of your recovery schedule carefully.
          </p>
          <div className="pt-3 flex items-center gap-3">
            <div className="flex-grow bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-white h-full w-[45%]" />
            </div>
            <span className="text-xs font-black">45% Complete</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medicine Tracker Form & List */}
        <div className="lg:col-span-1 space-y-6">
          {/* Add Tracker Form */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-stormy-teal to-turquoise" />
            <form onSubmit={handleAddMedicine} className="p-5 space-y-4">
              <h3 className="font-black text-stormy-teal flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-turquoise" />
                Add Medicine Tracker
              </h3>

              {errorMsg && (
                <div className="p-3 bg-rose-55 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-teal-50 text-stormy-teal text-xs font-bold rounded-xl border border-teal-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Medicine Name</label>
                <input
                  type="text"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Vitamin C"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Dosage</label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 500mg"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Frequency</label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. Once daily / 1-0-1"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 7 Days"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
                />
              </div>

              <button
                type="submit"
                disabled={savingMed}
                className="w-full py-2 bg-turquoise text-stormy-teal font-black text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
              >
                {savingMed ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Medication
              </button>
            </form>
          </div>

          {/* Tracked Medicine List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-5 space-y-3">
            <h3 className="font-black text-stormy-teal text-sm border-b border-slate-50 pb-2">
              Tracked Medicines
            </h3>

            {loadingMeds ? (
              <div className="text-xs text-slate-400 animate-pulse">Loading medicine list...</div>
            ) : trackedMeds.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No medications tracked yet.</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {trackedMeds.map((med) => (
                  <div key={med.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-stormy-teal">{med.medicineName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {med.dosage && `${med.dosage} · `}
                        {med.frequency && `${med.frequency} · `}
                        {med.duration}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMedicine(med.id)}
                      className="text-slate-350 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Unified Reminders Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-stormy-teal text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-turquoise" />
              Unified Care Reminders
            </h3>
            <button onClick={fetchReminders} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>

          {loadingReminders ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="h-6 w-6 border-2 border-t-transparent border-turquoise rounded-full animate-spin mx-auto mb-2" />
              Loading reminders...
            </div>
          ) : reminders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">No reminders today</p>
              <p className="text-slate-400 text-sm mt-1">Your upcoming appointments and medicine tracker reminders will show here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reminders.map((reminder) => {
                const isAppointment = reminder.type === "APPOINTMENT";
                const isRxMed = reminder.type === "PRESCRIPTION_MED";
                
                return (
                  <div
                    key={`${reminder.type}-${reminder.id}`}
                    className={`p-4 rounded-2xl bg-white border shadow-md flex items-start gap-3.5 hover:shadow-lg transition-all ${
                      isAppointment ? "border-indigo-100" : isRxMed ? "border-purple-100" : "border-teal-100"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isAppointment ? "bg-indigo-50 text-indigo-600" : isRxMed ? "bg-purple-50 text-purple-600" : "bg-teal-50 text-turquoise"
                    }`}>
                      {isAppointment ? <Calendar className="h-4.5 w-4.5" /> : <Pill className="h-4.5 w-4.5" />}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isAppointment ? "bg-indigo-100 text-indigo-700" : isRxMed ? "bg-purple-100 text-purple-700" : "bg-teal-100 text-turquoise-dark"
                        }`}>
                          {isAppointment ? "Appointment" : isRxMed ? "Prescription Rx" : "My Tracker"}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-stormy-teal truncate">{reminder.title}</h4>
                      
                      {isAppointment && (
                        <div className="text-xs text-slate-500 font-semibold space-y-0.5">
                          <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {reminder.date} at {reminder.time}</p>
                          {reminder.doctorName && <p className="text-slate-400">Dr. {reminder.doctorName} ({reminder.specialization})</p>}
                        </div>
                      )}

                      {(isRxMed || reminder.type === "MEDICINE") && (
                        <div className="text-xs text-slate-500 font-semibold space-y-0.5">
                          {reminder.dosage && <p>Dosage: <span className="font-extrabold text-stormy-teal">{reminder.dosage}</span></p>}
                          {reminder.frequency && <p>Frequency: <span className="font-extrabold text-stormy-teal">{reminder.frequency}</span></p>}
                          {reminder.duration && <p>Duration: <span className="font-extrabold text-slate-400">{reminder.duration}</span></p>}
                          {isRxMed && reminder.doctorName && <p className="text-[10px] text-slate-400 mt-1">Prescribed by Dr. {reminder.doctorName}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowUpCare;
