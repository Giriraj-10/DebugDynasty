import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FileText, Download, Eye, Calendar, Tag, RefreshCw, Pill, User } from "lucide-react";

interface Prescription {
  id: number;
  doctorName: string;
  doctorSpecialization: string;
  medicines: string;
  dosage: string;
  instructions: string;
  duration: string;
  createdAt: string;
}

const mockPrescriptions: Prescription[] = [
  {
    id: 101,
    doctorName: "Dr. Sarah Jenkins",
    doctorSpecialization: "Cardiologist",
    medicines: "Atorvastatin 10mg; Lisinopril 5mg",
    dosage: "Once daily in the morning",
    instructions: "With breakfast",
    duration: "1 Month",
    createdAt: new Date().toISOString(),
  },
  {
    id: 102,
    doctorName: "Dr. Rajesh K. Sharma",
    doctorSpecialization: "General Physician",
    medicines: "Cetirizine 10mg; Fluticasone Nasal Spray",
    dosage: "Once daily at bedtime",
    instructions: "Avoid cold drinks",
    duration: "10 Days",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export const PrescriptionHistory: React.FC = () => {
  const { user } = useAuth();
  const patientUid = user?.uid || "mock-patient-uid";

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/prescriptions/patient/${patientUid}`);
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.length > 0 ? data : mockPrescriptions);
        if (data.length > 0) {
          setSelectedPrescription(data[0]);
        } else if (mockPrescriptions.length > 0) {
          setSelectedPrescription(mockPrescriptions[0]);
        }
      } else {
        setPrescriptions(mockPrescriptions);
        setSelectedPrescription(mockPrescriptions[0]);
      }
    } catch (err) {
      setPrescriptions(mockPrescriptions);
      setSelectedPrescription(mockPrescriptions[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [patientUid]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stormy-teal flex items-center gap-2">
            <FileText className="h-6 w-6 text-turquoise" />
            Prescription History
          </h1>
          <p className="text-slate-500 text-sm mt-1">Access all your past and active medical prescriptions.</p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-slate-200 text-slate-500 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescription List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-black text-stormy-teal text-base">All Prescriptions</h3>
          
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="h-6 w-6 border-2 border-t-transparent border-turquoise rounded-full animate-spin mx-auto mb-2" />
              Loading prescriptions...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">No prescription history found</p>
              <p className="text-slate-400 text-sm mt-1">Prescriptions issued by doctors will show here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  onClick={() => setSelectedPrescription(prescription)}
                  className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer ${
                    selectedPrescription?.id === prescription.id
                      ? "border-turquoise shadow-md ring-2 ring-turquoise/15"
                      : "border-slate-100 shadow-sm hover:border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">
                        <Tag className="h-3 w-3" /> Rx #{prescription.id}
                      </span>
                      <h4 className="text-base font-black text-stormy-teal pt-1">{prescription.doctorName || "Doctor"}</h4>
                      <p className="text-xs font-semibold text-turquoise">{prescription.doctorSpecialization || "Specialist"}</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <Calendar className="h-3.5 w-3.5" />
                      {prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : "Date"}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      {prescription.medicines.split(";").filter(m => m.trim()).length} Medications
                    </span>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-teal-50 text-turquoise hover:text-stormy-teal rounded-xl transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Prescription Details Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 self-start">
          {selectedPrescription ? (
            <>
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-black text-stormy-teal text-base">Prescription Details</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                  {selectedPrescription.createdAt ? new Date(selectedPrescription.createdAt).toLocaleString() : ""}
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Consulting Doctor
                  </p>
                  <p className="font-black text-stormy-teal mt-0.5">{selectedPrescription.doctorName}</p>
                  <p className="font-semibold text-turquoise">{selectedPrescription.doctorSpecialization}</p>
                </div>

                {selectedPrescription.duration && (
                  <div>
                    <p className="font-bold text-slate-400 uppercase tracking-widest">Duration</p>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedPrescription.duration}</p>
                  </div>
                )}

                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-widest mb-1.5">Prescribed Drugs</p>
                  <div className="space-y-2">
                    {selectedPrescription.medicines.split(";").map((med, idx) => {
                      if (!med.trim()) return null;
                      return (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-2">
                          <Pill className="h-4 w-4 text-turquoise" />
                          <span>{med.trim()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedPrescription.dosage && (
                  <div>
                    <p className="font-bold text-slate-400 uppercase tracking-widest">Dosage / Frequency</p>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedPrescription.dosage}</p>
                  </div>
                )}

                {selectedPrescription.instructions && (
                  <div>
                    <p className="font-bold text-slate-400 uppercase tracking-widest">Instructions</p>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedPrescription.instructions}</p>
                  </div>
                )}
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-3 bg-turquoise text-stormy-teal font-black text-xs rounded-xl shadow transition-colors">
                <Download className="h-4 w-4" /> Download PDF Prescription
              </button>
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No prescription selected.</p>
              <p className="text-xs text-slate-400 mt-1">Select a prescription from the list to view full details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionHistory;
