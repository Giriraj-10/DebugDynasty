import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ConsultationRoom } from "./ConsultationRoom";
import {
  Stethoscope,
  FileSpreadsheet,
  Users,
  Activity,
  Check,
  X,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Bell,
  Wifi
} from "lucide-react";

interface Appointment {
  id: number;
  patientUid: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientBloodGroup?: string;
  appointmentDate: string;
  timeSlot: string;
  status: string; // PENDING, ACCEPTED, REJECTED
}

interface ConsultRequest {
  type: string;
  roomId: string;
  patientUid: string;
  patientName: string;
  timestamp: string;
}

const WS_URL = "http://localhost:8080/ws/consultation";
const REST_ROOMS = "http://localhost:8080/api/consultation-rooms";

export const DoctorDashboard: React.FC = () => {
  const { profileData, user } = useAuth();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Consultation requests and room state
  const [consultRequests, setConsultRequests] = useState<ConsultRequest[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activePatientName, setActivePatientName] = useState<string>("");
  const [wsConnected, setWsConnected] = useState(false);

  const stompClientRef = useRef<Client | null>(null);

  const data = profileData || {
    fullName: "Dr. Jane Smith",
    phone: "9876543210",
    medicalRegistrationNumber: "MCI-12345",
    experienceYears: 10,
    specialization: "General Physician",
    preferredLanguage: "English"
  };

  const doctorUid = user?.uid || "mock-doctor-uid";
  const doctorName = (data as any).fullName || "Doctor";

  // ─── Fetch appointments ───────────────────────────────────────────────────
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/consultations/appointments/doctor/${doctorUid}`);
      if (res.ok) {
        const dataList = await res.json();
        setAppointments(dataList);
      } else {
        throw new Error("Failed to load");
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using simulated local appointments.", err);
      const mockApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
      const filtered = mockApps.filter((app: any) => app.doctorUid === doctorUid || app.doctorUid === "mock-doctor-uid");
      const mapped = filtered.map((app: any) => ({
        id: app.id,
        patientUid: app.patientUid,
        patientName: "Patient (" + app.patientUid.substring(0, 5) + ")",
        patientAge: 28,
        patientBloodGroup: "O+",
        patientPhone: "9876543210",
        appointmentDate: app.appointmentDate,
        timeSlot: app.timeSlot,
        status: app.status
      }));
      setAppointments(mapped);
    } finally {
      setLoading(false);
    }
  };

  // ─── Load pending consultation requests from backend ─────────────────────
  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${REST_ROOMS}/doctor/${doctorUid}/pending`);
      if (res.ok) {
        const list: any[] = await res.json();
        setConsultRequests(list.map((r) => ({
          type: "CONSULTATION_REQUEST",
          roomId: r.id,
          patientUid: r.patientUid,
          patientName: r.patientName || "Patient",
          timestamp: r.createdAt || new Date().toISOString()
        })));
      }
    } catch {
      // Backend offline - no pending requests shown
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPendingRequests();
  }, [doctorUid]);

  // ─── WebSocket: subscribe for incoming consultation requests ─────────────
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setWsConnected(true);

        // Doctor listens for consultation requests on their personal channel
        client.subscribe(`/topic/doctor/${doctorUid}/requests`, (frame) => {
          const body = JSON.parse(frame.body);
          if (body.type === "CONSULTATION_REQUEST") {
            setConsultRequests((prev) => {
              // Avoid duplicate requests
              if (prev.some((r) => r.roomId === body.roomId)) return prev;
              return [body, ...prev];
            });
          }
        });
      },
      onDisconnect: () => setWsConnected(false),
      onStompError: () => setWsConnected(false)
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [doctorUid]);

  // ─── Accept consultation request ─────────────────────────────────────────
  const handleAcceptRequest = async (request: ConsultRequest) => {
    try {
      await fetch(`${REST_ROOMS}/${request.roomId}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorName })
      });
    } catch {
      // Backend offline - still open the room
    }
    // Remove from list and open the room
    setConsultRequests((prev) => prev.filter((r) => r.roomId !== request.roomId));
    setActiveRoomId(request.roomId);
    setActivePatientName(request.patientName);
  };

  // ─── Reject consultation request ─────────────────────────────────────────
  const handleRejectRequest = (roomId: string) => {
    setConsultRequests((prev) => prev.filter((r) => r.roomId !== roomId));
  };

  // ─── Appointment status updates ──────────────────────────────────────────
  const handleUpdateStatus = async (appointmentId: number, newStatus: "ACCEPTED" | "REJECTED") => {
    setActionLoadingId(appointmentId);
    setNotification(null);
    try {
      const res = await fetch(`http://localhost:8080/api/consultations/appointments/${appointmentId}/status?status=${newStatus}`, {
        method: "PUT"
      });

      if (res.ok) {
        setNotification({ type: "success", text: `Appointment ${newStatus.toLowerCase()} successfully!` });
        setAppointments((prev) =>
          prev.map((app) => (app.id === appointmentId ? { ...app, status: newStatus } : app))
        );
        const mockApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
        const updatedMock = mockApps.map((app: any) =>
          app.id === appointmentId ? { ...app, status: newStatus } : app
        );
        localStorage.setItem("mock_appointments", JSON.stringify(updatedMock));
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      setNotification({ type: "success", text: `Simulated: Appointment ${newStatus.toLowerCase()} successfully!` });
      setAppointments((prev) =>
        prev.map((app) => (app.id === appointmentId ? { ...app, status: newStatus } : app))
      );
      const mockApps = JSON.parse(localStorage.getItem("mock_appointments") || "[]");
      const updatedMock = mockApps.map((app: any) =>
        app.id === appointmentId ? { ...app, status: newStatus } : app
      );
      localStorage.setItem("mock_appointments", JSON.stringify(updatedMock));
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const pendingCount = appointments.filter((app) => app.status === "PENDING").length;
  const acceptedCount = appointments.filter((app) => app.status === "ACCEPTED").length;

  return (
    <div className="space-y-6 page-enter">
      
      {/* Welcome banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stormy-teal via-[#0a7589] to-turquoise text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] opacity-15 pointer-events-none">
          <Stethoscope className="h-40 w-40 fill-current text-white" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">Doctor Workspace</h1>
            <p className="text-sm opacity-90 max-w-md">
              Manage patient schedules, accept virtual consultations, and verify medical credentials.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/15 border border-white/20 rounded-xl px-3 py-2">
            <Wifi className={`h-4 w-4 ${wsConnected ? "text-emerald-300" : "text-slate-300"}`} />
            <span className="text-xs font-bold text-white/90">
              {wsConnected ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition-all ${
          notification.type === "success" ? "bg-teal-50 border-teal-200 text-stormy-teal" : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {notification.text}
        </div>
      )}

      {/* ─── Incoming Consultation Requests ─────────────────────────── */}
      {consultRequests.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-sm">
          <h2 className="text-base font-black text-amber-800 flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-amber-500 animate-bounce" />
            Incoming Consultation Requests
            <span className="ml-auto text-[11px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {consultRequests.length} new
            </span>
          </h2>
          <div className="space-y-3">
            {consultRequests.map((req) => (
              <div
                key={req.roomId}
                className="bg-white rounded-xl border border-amber-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{req.patientName}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Immediate consultation request · {new Date(req.timestamp).toLocaleTimeString()}
                    </p>
                    <code className="text-[9px] text-slate-400 font-mono">{req.roomId}</code>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleRejectRequest(req.roomId)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="px-3 py-1.5 bg-stormy-teal hover:bg-stormy-teal/90 text-white font-black text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Accept & Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-500 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Consults</h3>
            <p className="text-xl font-black text-stormy-teal">{appointments.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-teal-50 text-turquoise shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</h3>
            <p className="text-xl font-black text-stormy-teal">{pendingCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500 shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Slots</h3>
            <p className="text-xl font-black text-stormy-teal">{acceptedCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-500 shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specialty</h3>
            <p className="text-xs font-black text-stormy-teal truncate max-w-[120px]">{data.specialization}</p>
          </div>
        </div>

      </div>

      {/* Main Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Details Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4 self-start">
          <h2 className="text-base font-black text-stormy-teal flex items-center gap-2 border-b border-slate-100 pb-3">
            <Stethoscope className="h-5 w-5 text-turquoise" />
            <span>Doctor Profile</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-semibold">Name</span>
              <span className="text-stormy-teal font-extrabold">{data.fullName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-semibold">Registration No.</span>
              <span className="text-slate-600 font-mono font-semibold">{data.medicalRegistrationNumber}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-semibold">Specialization</span>
              <span className="text-slate-600 font-semibold">{data.specialization}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-semibold">Experience</span>
              <span className="text-slate-600">{data.experienceYears} Years</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400 font-semibold">Language</span>
              <span className="text-turquoise font-bold">{data.preferredLanguage}</span>
            </div>
          </div>
        </div>

        {/* Appointment Management Panel */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-base font-black text-stormy-teal border-b border-slate-100 pb-3">
            Appointment Schedule Manager
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <div className="h-6 w-6 border-2 border-t-transparent border-turquoise rounded-full animate-spin mx-auto mb-2" />
              Loading appointments...
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-3.5">
              {appointments.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-stormy-teal">{app.patientName}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-0.5"><Calendar className="h-3.5 w-3.5" /> {app.appointmentDate}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Clock className="h-3.5 w-3.5" /> {app.timeSlot}</span>
                        {app.patientAge && (
                          <>
                            <span>•</span>
                            <span>Age: {app.patientAge}</span>
                          </>
                        )}
                        {app.patientBloodGroup && (
                          <>
                            <span>•</span>
                            <span className="text-rose-500">Blood: {app.patientBloodGroup}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {app.status === "PENDING" ? (
                      <>
                        <button
                          disabled={actionLoadingId === app.id}
                          onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          disabled={actionLoadingId === app.id}
                          onClick={() => handleUpdateStatus(app.id, "ACCEPTED")}
                          className="px-3 py-1.5 bg-turquoise text-stormy-teal font-black text-xs rounded-lg shadow-sm hover:bg-turquoise/90 transition-colors flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                      </>
                    ) : app.status === "ACCEPTED" ? (
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Approved
                      </span>
                    ) : (
                      <span className="text-xs font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-150 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
              <AlertCircle className="h-8 w-8 text-slate-300" />
              <span>No consultation bookings are requested yet.</span>
            </div>
          )}
        </div>

      </div>

      {/* WebSocket Consultation Room Modal */}
      {activeRoomId && (
        <ConsultationRoom
          roomId={activeRoomId}
          currentUserUid={doctorUid}
          currentUserRole="DOCTOR"
          currentUserName={doctorName}
          otherPartyName={activePatientName}
          onClose={() => { setActiveRoomId(null); setActivePatientName(""); }}
        />
      )}

    </div>
  );
};

export default DoctorDashboard;
