import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FileText, User, Plus, Clock, CheckCircle2, AlertCircle, RefreshCw, Clipboard, Pill } from "lucide-react";

interface Patient {
  uid: string;
  fullName: string;
  phone: string;
  bloodGroup: string;
}

interface Prescription {
  id: number;
  patientName: string;
  medicines: string;
  dosage: string;
  instructions: string;
  duration: string;
  createdAt: string;
}

export const PrescribePatient: React.FC = () => {
  const { user } = useAuth();
  const doctorUid = user?.uid || "mock-doctor-uid";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientUid, setSelectedPatientUid] = useState("");
  const [medicines, setMedicines] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [duration, setDuration] = useState("");

  const [history, setHistory] = useState<Prescription[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await fetch("http://localhost:8080/api/prescriptions/patients");
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatientUid(data[0].uid);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`http://localhost:8080/api/prescriptions/doctor/${doctorUid}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchHistory();
  }, [doctorUid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedPatientUid) {
      setErrorMsg("Please select a patient.");
      return;
    }

    if (!medicines.trim()) {
      setErrorMsg("Medicines list is required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:8080/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientUid: selectedPatientUid,
          doctorUid,
          medicines,
          dosage,
          instructions,
          duration,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Prescription submitted and stored successfully!");
        setMedicines("");
        setDosage("");
        setInstructions("");
        setDuration("");
        fetchHistory();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Failed to submit prescription.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please make sure the backend server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stormy-teal flex items-center gap-2">
          <FileText className="h-6 w-6 text-turquoise" />
          Patient Prescription Center
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Issue, record, and track official medical prescriptions for your patients.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescription Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden self-start">
          <div className="h-1.5 bg-gradient-to-r from-stormy-teal to-turquoise" />
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <h2 className="text-base font-black text-stormy-teal flex items-center gap-2 mb-2">
              <Plus className="h-5 w-5 text-turquoise" />
              New Prescription
            </h2>

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
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Select Patient</label>
              {loadingPatients ? (
                <div className="text-xs text-slate-400 py-2 animate-pulse">Loading patient list...</div>
              ) : patients.length === 0 ? (
                <div className="text-xs text-rose-500 py-2 font-bold">No patients registered.</div>
              ) : (
                <select
                  value={selectedPatientUid}
                  onChange={(e) => setSelectedPatientUid(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
                >
                  {patients.map((pat) => (
                    <option key={pat.uid} value={pat.uid}>
                      {pat.fullName} ({pat.bloodGroup})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Medicines (use ; to separate)</label>
              <textarea
                rows={2}
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
                placeholder="Paracetamol 500mg; Cetirizine 10mg"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Dosage / Frequency</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="1-0-1 (Morning & Night)"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Instructions</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Take after meals with warm water"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="5 Days / 1 Month"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedPatientUid}
              className="w-full mt-2 py-2.5 bg-stormy-teal hover:bg-stormy-teal/90 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              Submit Prescription
            </button>
          </form>
        </div>

        {/* Prescription History List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-stormy-teal flex items-center gap-2">
              <Clock className="h-5 w-5 text-turquoise" />
              Recently Issued Prescriptions
            </h2>
            <button onClick={fetchHistory} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loadingHistory ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="h-6 w-6 border-2 border-t-transparent border-turquoise rounded-full animate-spin mx-auto mb-2" />
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">No prescriptions recorded yet</p>
              <p className="text-slate-400 text-sm mt-1">Issue a prescription to see it in history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((rx) => (
                <div key={rx.id} className="bg-white rounded-2xl border border-slate-100 shadow-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-50 pb-3 mb-3">
                    <div>
                      <h4 className="text-sm font-black text-stormy-teal flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-400" />
                        Patient: {rx.patientName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Issued: {rx.createdAt ? new Date(rx.createdAt).toLocaleString() : "Just now"}
                      </p>
                    </div>
                    {rx.duration && (
                      <span className="text-[10px] font-black px-2 py-0.5 bg-turquoise/15 text-stormy-teal rounded-full self-start">
                        Duration: {rx.duration}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Medicines</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {rx.medicines.split(";").map((med, idx) => {
                          if (!med.trim()) return null;
                          return (
                            <span key={idx} className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl">
                              <Pill className="h-3.5 w-3.5 text-turquoise" />
                              {med.trim()}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      {rx.dosage && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Dosage</p>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{rx.dosage}</p>
                        </div>
                      )}
                      {rx.instructions && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Instructions</p>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{rx.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescribePatient;
