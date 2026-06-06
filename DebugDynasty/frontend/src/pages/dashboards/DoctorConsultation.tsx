import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ConsultationRoom } from "./ConsultationRoom";
import {
  Stethoscope,
  User,
  Search,
  Calendar as CalendarIcon,
  X,
  Loader2
} from "lucide-react";

const REST_ROOMS = "http://localhost:8080/api/consultation-rooms";

interface Doctor {
  firebaseUid: string;
  fullName: string;
  specialization: string;
  experienceYears: number;
  preferredLanguage: string;
  onlineStatus: boolean;
  phone?: string;
  medicalRegistrationNumber?: string;
}

const DEFAULT_DOCTORS: Doctor[] = [
  {
    firebaseUid: "mock-doc-1",
    fullName: "Dr. Sarah Jenkins",
    specialization: "Cardiologist",
    experienceYears: 12,
    preferredLanguage: "English",
    onlineStatus: true,
    phone: "9876540001",
    medicalRegistrationNumber: "REG-66231"
  },
  {
    firebaseUid: "mock-doc-2",
    fullName: "Dr. Rajesh K. Sharma",
    specialization: "General Physician",
    experienceYears: 15,
    preferredLanguage: "Hindi",
    onlineStatus: false,
    phone: "9876540002",
    medicalRegistrationNumber: "REG-88123"
  },
  {
    firebaseUid: "mock-doc-3",
    fullName: "Dr. Priya Patel",
    specialization: "Pediatrician",
    experienceYears: 9,
    preferredLanguage: "Gujarati",
    onlineStatus: true,
    phone: "9876540003",
    medicalRegistrationNumber: "REG-99120"
  },
  {
    firebaseUid: "mock-doc-4",
    fullName: "Dr. Amit Verma",
    specialization: "Dermatologist",
    experienceYears: 11,
    preferredLanguage: "Punjabi",
    onlineStatus: true,
    phone: "9876540004",
    medicalRegistrationNumber: "REG-33410"
  },
  {
    firebaseUid: "mock-doc-5",
    fullName: "Dr. Neha Rao",
    specialization: "Neurologist",
    experienceYears: 14,
    preferredLanguage: "Kannada",
    onlineStatus: true,
    phone: "9876540005",
    medicalRegistrationNumber: "REG-21142"
  },
  {
    firebaseUid: "mock-doc-6",
    fullName: "Dr. Suresh Kumar",
    specialization: "Orthopedic",
    experienceYears: 18,
    preferredLanguage: "Tamil",
    onlineStatus: false,
    phone: "9876540006",
    medicalRegistrationNumber: "REG-54911"
  },
  {
    firebaseUid: "mock-doc-7",
    fullName: "Dr. Ananya Sen",
    specialization: "ENT Specialist",
    experienceYears: 8,
    preferredLanguage: "Bengali",
    onlineStatus: true,
    phone: "9876540007",
    medicalRegistrationNumber: "REG-87221"
  },
  {
    firebaseUid: "mock-doc-8",
    fullName: "Dr. Vikram Gokhale",
    specialization: "Psychiatrist",
    experienceYears: 16,
    preferredLanguage: "Marathi",
    onlineStatus: true,
    phone: "9876540008",
    medicalRegistrationNumber: "REG-12002"
  },
  {
    firebaseUid: "mock-doc-9",
    fullName: "Dr. Sunitha Reddy",
    specialization: "Gynecologist",
    experienceYears: 13,
    preferredLanguage: "Telugu",
    onlineStatus: true,
    phone: "9876540009",
    medicalRegistrationNumber: "REG-65902"
  }
];

const SPECIALIZATIONS = [
  "All Specializations",
  "Cardiologist",
  "Neurologist",
  "Orthopedic",
  "Dermatologist",
  "Pediatrician",
  "General Physician",
  "ENT Specialist",
  "Psychiatrist",
  "Gynecologist"
];

const TIME_SLOTS = [
  "09:00 AM - 09:30 AM",
  "10:00 AM - 10:30 AM",
  "11:00 AM - 11:30 AM",
  "02:00 PM - 02:30 PM",
  "03:00 PM - 03:30 PM",
  "04:00 PM - 04:30 PM"
];

export const DoctorConsultation: React.FC = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>(DEFAULT_DOCTORS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specializations");
  
  // Modals state
  const [viewingProfileDoc, setViewingProfileDoc] = useState<Doctor | null>(null);
  const [bookingDoc, setBookingDoc] = useState<Doctor | null>(null);

  // WebSocket consultation room state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoomDoctor, setActiveRoomDoctor] = useState<Doctor | null>(null);
  const [requestingConsult, setRequestingConsult] = useState<string | null>(null); // doctorUid loading
  
  // Booking Form State
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch doctors from backend
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/consultations/doctors");
      if (res.ok) {
        const data = await res.json();
        // If backend has registered doctors, use them. Otherwise, merge or use default seed.
        if (data && data.length > 0) {
          setDoctors(data);
        }
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using simulated doctor directory.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoc || !bookingDate || !bookingSlot) return;
    setSubmittingBooking(true);
    setStatusMsg(null);

    const payload = {
      patientUid: user?.uid || "mock-patient-uid",
      doctorUid: bookingDoc.firebaseUid,
      appointmentDate: bookingDate,
      timeSlot: bookingSlot
    };

    try {
      const response = await fetch("http://localhost:8080/api/consultations/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setStatusMsg({ type: "success", text: "Appointment requested successfully! Wait for doctor approval." });
        // Save to local persistence fallback for simulator simulation
        const mockAppointments = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        mockAppointments.push({
          id: Date.now(),
          ...payload,
          status: "PENDING",
          doctorName: bookingDoc.fullName,
          doctorSpecialization: bookingDoc.specialization
        });
        localStorage.setItem("mock_appointments", JSON.stringify(mockAppointments));

        setTimeout(() => {
          setBookingDoc(null);
          setBookingDate("");
          setBookingSlot("");
          setStatusMsg(null);
        }, 3000);
      } else {
        throw new Error("Failed to book appointment in database");
      }
    } catch (err) {
      // Fallback local storage simulation
      const mockAppointments = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
      mockAppointments.push({
        id: Date.now(),
        ...payload,
        status: "PENDING",
        doctorName: bookingDoc.fullName,
        doctorSpecialization: bookingDoc.specialization
      });
      localStorage.setItem("mock_appointments", JSON.stringify(mockAppointments));

      setStatusMsg({ type: "success", text: "Simulated Appointment booked successfully! (Local offline mode)" });
      setTimeout(() => {
        setBookingDoc(null);
        setBookingDate("");
        setBookingSlot("");
        setStatusMsg(null);
      }, 3000);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleImmediateConsultation = async (doc: Doctor) => {
    if (!doc.onlineStatus) return;
    setRequestingConsult(doc.firebaseUid);
    setStatusMsg(null);
    try {
      const patientUid = user?.uid || "mock-patient-uid";
      const patientName = (user as any)?.displayName || "Patient";
      const res = await fetch(`${REST_ROOMS}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientUid,
          doctorUid: doc.firebaseUid,
          patientName,
          doctorName: doc.fullName
        })
      });
      if (res.ok) {
        const room = await res.json();
        setActiveRoomId(room.id);
        setActiveRoomDoctor(doc);
      } else {
        throw new Error("Backend error");
      }
    } catch {
      // Offline fallback: create a local room ID and still open chat UI
      const fallbackRoomId = `local-room-${doc.firebaseUid}-${Date.now()}`;
      setActiveRoomId(fallbackRoomId);
      setActiveRoomDoctor(doc);
    } finally {
      setRequestingConsult(null);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "All Specializations" || doc.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stormy-teal flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-turquoise" />
          Doctor Consultation
        </h1>
        <p className="text-slate-500 text-sm mt-1">Book virtual appointments or access immediate medical consulting.</p>
      </div>

      {/* Specialty horizontal slider / buttons */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Filter by Specialization</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                selectedSpecialty === spec
                  ? "bg-stormy-teal border-stormy-teal text-white shadow-md shadow-stormy-teal/15"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by doctor name or credentials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-turquoise/40 focus:border-turquoise transition-all"
        />
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <div className="h-6 w-6 border-2 border-t-transparent border-turquoise rounded-full animate-spin mx-auto mb-2" />
          Loading doctor directory...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.firebaseUid}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between space-y-4"
            >
              {/* Top info */}
              <div className="flex gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-stormy-teal to-turquoise/80 flex items-center justify-center text-white shrink-0 shadow-md">
                  <User className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-stormy-teal truncate leading-tight">{doc.fullName}</h3>
                  <p className="text-xs font-bold text-turquoise mt-0.5">{doc.specialization}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {doc.experienceYears} Years Exp
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      🗣️ {doc.preferredLanguage}
                    </span>
                  </div>
                </div>
              </div>

              {/* Online/Offline Status Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {doc.onlineStatus ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-600">Online & Ready</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    <span className="text-slate-400">Offline</span>
                  </>
                )}
              </div>

              {/* Dynamic Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50">
                <button
                  onClick={() => setViewingProfileDoc(doc)}
                  className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all border border-slate-200/50"
                >
                  Profile
                </button>
                <button
                  onClick={() => setBookingDoc(doc)}
                  className="py-2.5 bg-turquoise hover:bg-turquoise/90 text-stormy-teal font-black text-xs rounded-xl shadow-sm transition-all"
                >
                  Book Slot
                </button>
                <button
                  disabled={!doc.onlineStatus || requestingConsult === doc.firebaseUid}
                  onClick={() => handleImmediateConsultation(doc)}
                  className={`py-2.5 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 ${
                    doc.onlineStatus
                      ? "bg-stormy-teal text-white hover:bg-stormy-teal/95 shadow-sm"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
                  }`}
                >
                  {requestingConsult === doc.firebaseUid ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Immediate"
                  )}
                </button>
              </div>
            </div>
          ))}

          {filteredDoctors.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
              <Stethoscope className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No doctors found matching filters</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: View Profile */}
      {viewingProfileDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-stormy-teal to-turquoise px-6 py-5 text-white flex justify-between items-center">
              <h3 className="font-black text-lg">Doctor Profile</h3>
              <button onClick={() => setViewingProfileDoc(null)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200">
                  <User className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-black text-stormy-teal text-base leading-tight">{viewingProfileDoc.fullName}</h4>
                  <p className="text-xs font-bold text-turquoise mt-0.5">{viewingProfileDoc.specialization}</p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Reg: {viewingProfileDoc.medicalRegistrationNumber || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Experience</p>
                  <p className="font-black text-slate-700 mt-0.5">{viewingProfileDoc.experienceYears} Years</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Language Preferred</p>
                  <p className="font-black text-slate-700 mt-0.5">{viewingProfileDoc.preferredLanguage}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Contact Hotline</p>
                  <p className="font-black text-slate-700 mt-0.5">{viewingProfileDoc.phone || "Not Shared"}</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => { setBookingDoc(viewingProfileDoc); setViewingProfileDoc(null); }}
                  className="w-full py-3 bg-turquoise text-stormy-teal font-black rounded-xl text-sm shadow-md transition-colors"
                >
                  Book Consultation Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Book Appointment */}
      {bookingDoc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-stormy-teal to-[#075666] px-6 py-5 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">Schedule Slot</h3>
                <p className="text-xs text-turquoise/90 font-medium">with {bookingDoc.fullName}</p>
              </div>
              <button onClick={() => setBookingDoc(null)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
              {statusMsg && (
                <div className={`p-4 rounded-xl text-xs font-bold border ${
                  statusMsg.type === "success" ? "bg-teal-50 border-teal-200 text-stormy-teal" : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {statusMsg.text}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Choose Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-turquoise/40 focus:border-turquoise transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Choose Time Slot</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBookingSlot(slot)}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all text-center ${
                        bookingSlot === slot
                          ? "bg-turquoise border-turquoise text-stormy-teal shadow"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBookingDoc(null)}
                  className="w-1/2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-xl text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking || !bookingDate || !bookingSlot}
                  className="w-1/2 py-2.5 bg-stormy-teal hover:bg-stormy-teal/95 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 transition-colors"
                >
                  {submittingBooking ? "Booking..." : "Request Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REAL-TIME: WebSocket Consultation Room */}
      {activeRoomId && activeRoomDoctor && (
        <ConsultationRoom
          roomId={activeRoomId}
          currentUserUid={user?.uid || "mock-patient-uid"}
          currentUserRole="PATIENT"
          currentUserName={(user as any)?.displayName || "Patient"}
          otherPartyName={activeRoomDoctor.fullName}
          onClose={() => { setActiveRoomId(null); setActiveRoomDoctor(null); }}
        />
      )}
    </div>
  );
};

export default DoctorConsultation;
