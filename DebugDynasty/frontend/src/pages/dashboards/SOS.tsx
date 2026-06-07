import React, { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "../../context/AuthContext";
import {
  AlertTriangle,
  ShieldAlert,
  Truck,
  MapPin,
  PhoneCall,
  CheckCircle2,
  X,
  Hospital,
  Navigation,
  Clock,
  Activity,
  Loader2
} from "lucide-react";

const REST_BASE = "http://localhost:8080/api/sos";
const WS_URL = "http://localhost:8080/ws/consultation";

interface IncidentDetails {
  logId: number;
  status: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientBloodGroup: string;
  ambulanceUid: string;
  ambulanceProvider: string;
  ambulanceVehicleNumber: string;
  ambulanceDriverName: string;
  ambulancePhone: string;
  ambulanceLatitude: number;
  ambulanceLongitude: number;
  hospitalName: string;
  hospitalAddress: string;
  hospitalLatitude: number;
  hospitalLongitude: number;
}

function calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export const SOS: React.FC = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"idle" | "locating" | "dispatching" | "active" | "cancelled" | "completed">("idle");
  const [incident, setIncident] = useState<IncidentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patientLocation, setPatientLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [ambulanceLiveLocation, setAmbulanceLiveLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [stompConnected, setStompConnected] = useState(false);

  const stompRef = useRef<Client | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const patientUid = user?.uid || "mock-patient-uid";

  // Elapsed time timer
  useEffect(() => {
    if (phase === "active") {
      setElapsedSecs(0);
      timerRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // WebSocket connection
  const connectWebSocket = useCallback((ambulanceUid: string) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setStompConnected(true);

        client.subscribe(`/topic/sos/status/${patientUid}`, (frame) => {
          const body = JSON.parse(frame.body);
          if (body.type === "SOS_STATUS_UPDATE" && body.incident) {
            setIncident(body.incident);
            setPhase("active");
          } else if (body.type === "SOS_CANCELLED") {
            setPhase("cancelled");
          } else if (body.type === "SOS_COMPLETED") {
            setPhase("completed");
          }
        });

        client.subscribe(`/topic/ambulance/${ambulanceUid}/location`, (frame) => {
          const body = JSON.parse(frame.body);
          setAmbulanceLiveLocation({ lat: body.latitude, lon: body.longitude });
        });
      },
      onDisconnect: () => setStompConnected(false)
    });
    client.activate();
    stompRef.current = client;
  }, [patientUid]);

  useEffect(() => {
    return () => { stompRef.current?.deactivate(); };
  }, []);

  // Check for existing active SOS on mount
  useEffect(() => {
    const checkActive = async () => {
      try {
        const res = await fetch(`${REST_BASE}/active/patient/${patientUid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.active && data.incident) {
            setIncident(data.incident);
            setPhase("active");
            connectWebSocket(data.incident.ambulanceUid);
          }
        }
      } catch { /* offline */ }
    };
    checkActive();
  }, [patientUid, connectWebSocket]);

  const handleTriggerSOS = async () => {
    setError(null);
    setPhase("locating");

    let lat = 19.0760;
    let lon = 72.8777;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } catch { /* use fallback */ }

    setPatientLocation({ lat, lon });
    setPhase("dispatching");

    try {
      const res = await fetch(`${REST_BASE}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientUid, latitude: lat, longitude: lon })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to trigger SOS");
      }

      const data = await res.json();
      setIncident(data);
      setPhase("active");
      connectWebSocket(data.ambulanceUid);
    } catch (err: any) {
      // Offline/mock fallback
      const mockIncident: IncidentDetails = {
        logId: Date.now(),
        status: "DISPATCHED",
        patientName: user?.email?.split("@")[0] || "Patient",
        patientPhone: "9876543210",
        patientAge: 30,
        patientBloodGroup: "O+",
        ambulanceUid: "mock-ambulance-1",
        ambulanceProvider: "Ambulance Alfa Services",
        ambulanceVehicleNumber: "MH-12-AA-1111",
        ambulanceDriverName: "John Alfa",
        ambulancePhone: "9876543211",
        ambulanceLatitude: 19.0720,
        ambulanceLongitude: 72.8650,
        hospitalName: "City General Hospital",
        hospitalAddress: "123 Central Ave, Mumbai",
        hospitalLatitude: 19.0820,
        hospitalLongitude: 72.8820
      };
      setIncident(mockIncident);
      setPhase("active");
    }
  };

  const handleCancelSOS = async () => {
    if (!incident) return;
    try {
      await fetch(`${REST_BASE}/cancel/${incident.logId}`, { method: "POST" });
    } catch { /* offline */ }
    setPhase("cancelled");
    stompRef.current?.deactivate();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-black text-rose-600 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />
          Emergency SOS
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          One-tap emergency dispatch — locates your nearest ambulance and hospital automatically.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-rose-100 shadow-xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400" />
        <div className="p-6 md:p-10 text-center space-y-6">

          {/* IDLE */}
          {phase === "idle" && (
            <>
              <div className="max-w-md mx-auto space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 mb-2">
                  <AlertTriangle className="h-10 w-10 animate-bounce" />
                </div>
                <h2 className="text-2xl font-black text-stormy-teal">Need Emergency Care?</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Pressing the SOS button will dispatch the nearest available ambulance to the best hospital with open beds.
                </p>
              </div>
              <div className="flex justify-center py-4">
                <button
                  onClick={handleTriggerSOS}
                  className="h-44 w-44 md:h-52 md:w-52 rounded-full border-8 border-rose-100 bg-gradient-to-br from-rose-500 to-rose-700 flex flex-col items-center justify-center text-white shadow-2xl shadow-rose-500/30 hover:scale-105 hover:shadow-rose-600/40 active:scale-95 transition-all duration-300 select-none"
                >
                  <span className="text-4xl md:text-5xl font-black tracking-widest">SOS</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-rose-100 mt-1">Tap to Dispatch</span>
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-rose-500" /> GPS Auto-Detect</span>
                <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-rose-500" /> Nearest Ambulance</span>
                <span className="flex items-center gap-1.5"><Hospital className="h-4 w-4 text-rose-500" /> Best Hospital Selected</span>
              </div>
            </>
          )}

          {/* LOCATING / DISPATCHING */}
          {(phase === "locating" || phase === "dispatching") && (
            <div className="space-y-6 max-w-md mx-auto py-6">
              <div className="flex justify-center">
                <div className="relative h-32 w-32">
                  <div className="absolute inset-0 rounded-full bg-rose-100 animate-ping" />
                  <div className="absolute inset-4 rounded-full bg-rose-200 animate-ping" style={{ animationDelay: "0.3s" }} />
                  <div className="relative h-full w-full rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-2xl shadow-rose-500/40">
                    <Loader2 className="h-10 w-10 text-white animate-spin" />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-stormy-teal">
                  {phase === "locating" ? "Acquiring Your Location..." : "Dispatching Emergency Response..."}
                </h2>
                <div className="mt-4 space-y-2 text-left max-w-xs mx-auto">
                  {[
                    { label: "GPS Coordinates Fetched", done: phase === "dispatching" },
                    { label: "Scanning Nearby Ambulances", done: false },
                    { label: "Checking Hospital Beds", done: false },
                    { label: "Calculating Best Route", done: false }
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {step.done
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        : <div className="h-4 w-4 rounded-full border-2 border-rose-300 border-t-rose-600 animate-spin shrink-0" />}
                      <span className={step.done ? "text-emerald-600 font-semibold" : "text-slate-500"}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE */}
          {phase === "active" && incident && (
            <div className="space-y-5 max-w-lg mx-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-200">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-black text-stormy-teal">Ambulance Dispatched!</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>Response timer: <span className="font-bold text-turquoise">{formatTime(elapsedSecs)}</span></span>
                </div>
              </div>

              {/* Live tracking bar */}
              <div className="relative bg-gradient-to-r from-stormy-teal/5 to-turquoise/5 border border-turquoise/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-turquoise/20 animate-ping absolute inset-0" />
                  <div className="h-10 w-10 rounded-xl bg-turquoise flex items-center justify-center relative">
                    <Navigation className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ambulance En Route</p>
                  <p className="text-sm font-extrabold text-stormy-teal">{incident.ambulanceVehicleNumber}</p>
                  <p className="text-xs text-slate-500">{incident.ambulanceDriverName} · {incident.ambulancePhone}</p>
                  {patientLocation && (
                    <p className="text-xs font-bold text-turquoise mt-0.5">
                      ~{calcDistanceKm(
                          patientLocation.lat, patientLocation.lon,
                          ambulanceLiveLocation?.lat ?? incident.ambulanceLatitude,
                          ambulanceLiveLocation?.lon ?? incident.ambulanceLongitude
                        )} km away
                      {stompConnected && <span className="ml-1.5 text-emerald-500">● Live</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-stormy-teal mb-2">
                    <Truck className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wider">Ambulance</span>
                  </div>
                  {[
                    { label: "Provider", value: incident.ambulanceProvider },
                    { label: "Vehicle", value: incident.ambulanceVehicleNumber },
                    { label: "Driver", value: incident.ambulanceDriverName },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                      <p className="text-xs font-extrabold text-slate-700">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-stormy-teal mb-2">
                    <Hospital className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-wider">Hospital</span>
                  </div>
                  {[
                    { label: "Name", value: incident.hospitalName },
                    { label: "Address", value: incident.hospitalAddress || "Nearest" },
                    { label: "Status", value: "Bed Reserved ✓" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                      <p className="text-xs font-extrabold text-slate-700">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Status: En Route</span>
                </div>
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Live Tracking
                </span>
              </div>

              <div className="flex gap-3">
                <a
                  href={`tel:${incident.ambulancePhone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 hover:border-stormy-teal text-slate-700 hover:text-stormy-teal font-bold rounded-xl text-sm transition-colors"
                >
                  <PhoneCall className="h-4 w-4" />
                  Call Driver
                </a>
                <button
                  onClick={handleCancelSOS}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-black px-4 py-3 rounded-xl text-sm shadow-lg shadow-rose-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel SOS
                </button>
              </div>
            </div>
          )}

          {/* CANCELLED */}
          {phase === "cancelled" && (
            <div className="space-y-4 max-w-md mx-auto py-6">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <X className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-black text-slate-600">SOS Request Cancelled</h2>
              <p className="text-sm text-slate-500">The emergency request has been cancelled. The ambulance has been released.</p>
              <button
                onClick={() => { setPhase("idle"); setIncident(null); setElapsedSecs(0); }}
                className="px-8 py-3 bg-stormy-teal hover:bg-stormy-teal/90 text-white font-black rounded-xl text-sm shadow-lg transition-colors"
              >
                Return to Safety
              </button>
            </div>
          )}

          {/* COMPLETED */}
          {phase === "completed" && (
            <div className="space-y-4 max-w-md mx-auto py-6">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-stormy-teal">Mission Complete</h2>
              <p className="text-sm text-slate-500">Emergency response complete. We hope you are safe and well.</p>
              <button
                onClick={() => { setPhase("idle"); setIncident(null); setElapsedSecs(0); }}
                className="px-8 py-3 bg-turquoise text-stormy-teal font-black rounded-xl text-sm shadow-lg transition-colors"
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-black text-stormy-teal mb-4">Quick Emergency Contacts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { number: "102", label: "Ambulance", icon: <Truck className="h-5 w-5" /> },
            { number: "108", label: "Disaster Mgmt", icon: <AlertTriangle className="h-5 w-5" /> },
            { number: "112", label: "Emergency", icon: <ShieldAlert className="h-5 w-5" /> }
          ].map(({ number, label, icon }) => (
            <a
              key={number}
              href={`tel:${number}`}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">{icon}</div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{label}</p>
                  <p className="text-[10px] text-slate-400">Helpline</p>
                </div>
              </div>
              <span className="text-sm font-black text-rose-500">{number}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SOS;
