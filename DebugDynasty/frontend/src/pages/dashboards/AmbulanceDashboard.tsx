import React, { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "../../context/AuthContext";
import {
  Truck,
  Navigation,
  Radio,
  Bell,
  CheckCircle2,
  X,
  Hospital,
  User,
  Droplets,
  Phone,
  MapPin,
  Activity,
  WifiOff,
  Wifi,
  Clock,
  AlarmCheck
} from "lucide-react";

const REST_BASE = "http://localhost:8080/api/ambulance";
const WS_URL = "http://localhost:8080/ws/consultation";

interface Assignment {
  logId: number;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientBloodGroup: string;
  patientLatitude: number;
  patientLongitude: number;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  assignedAt: string;
  status: string;
}

export const AmbulanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const ambulanceUid = user?.uid || "mock-ambulance-1";

  const [isOnDuty, setIsOnDuty] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [pendingRequest, setPendingRequest] = useState<Assignment | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const stompRef = useRef<Client | null>(null);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Timer
  useEffect(() => {
    if (currentAssignment) {
      setElapsedSecs(0);
      timerRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSecs(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentAssignment]);

  // GPS watch
  const startGPSWatch = useCallback(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        // Simulate movement around Mumbai
        setCurrentLocation(prev => ({
          lat: (prev?.lat ?? 19.0760) + (Math.random() - 0.5) * 0.001,
          lon: (prev?.lon ?? 72.8777) + (Math.random() - 0.5) * 0.001
        }));
      },
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
  }, []);

  const stopGPSWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Broadcast location via WebSocket
  const startBroadcast = useCallback((client: Client, loc: { lat: number; lon: number }) => {
    setBroadcastActive(true);
    gpsIntervalRef.current = setInterval(() => {
      setCurrentLocation(prev => {
        const updated = prev ?? loc;
        if (client.connected) {
          client.publish({
            destination: `/app/ambulance/location`,
            body: JSON.stringify({
              ambulanceUid,
              latitude: updated.lat,
              longitude: updated.lon,
              timestamp: new Date().toISOString()
            })
          });
        }
        return updated;
      });
    }, 3000);
  }, [ambulanceUid]);

  const stopBroadcast = useCallback(() => {
    setBroadcastActive(false);
    if (gpsIntervalRef.current) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }
  }, []);

  // Connect WebSocket
  const connectWS = useCallback(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/ambulance/${ambulanceUid}/assignments`, (frame) => {
          const data = JSON.parse(frame.body);
          if (data.type === "SOS_ASSIGNMENT") {
            setPendingRequest(data.assignment);
          } else if (data.type === "ASSIGNMENT_CANCELLED") {
            setCurrentAssignment(null);
            setPendingRequest(null);
          } else if (data.type === "ASSIGNMENT_COMPLETED") {
            setCurrentAssignment(null);
          }
        });

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setCurrentLocation(loc);
            startBroadcast(client, loc);
          },
          () => {
            const loc = { lat: 19.0760, lon: 72.8777 };
            setCurrentLocation(loc);
            startBroadcast(client, loc);
          }
        );
      },
      onDisconnect: () => {
        setIsConnected(false);
        stopBroadcast();
      }
    });
    client.activate();
    stompRef.current = client;
  }, [ambulanceUid, startBroadcast, stopBroadcast]);

  const disconnectWS = useCallback(() => {
    stompRef.current?.deactivate();
    stompRef.current = null;
    setIsConnected(false);
    stopBroadcast();
  }, [stopBroadcast]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        // 1. Fetch ambulance profile to check if on duty
        const profileRes = await fetch(`${REST_BASE}/${ambulanceUid}`);
        if (profileRes.ok && active) {
          const profile = await profileRes.json();
          if (profile.status === "AVAILABLE" || profile.status === "BUSY") {
            setIsOnDuty(true);
            startGPSWatch();
            connectWS();
          }
        }
        
        // 2. Fetch active assignment
        const assignmentRes = await fetch(`http://localhost:8080/api/sos/active/ambulance/${ambulanceUid}`);
        if (assignmentRes.ok && active) {
          const data = await assignmentRes.json();
          if (data.active && data.incident) {
            const inc = data.incident;
            const assignment: Assignment = {
              logId: inc.logId,
              patientName: inc.patientName,
              patientPhone: inc.patientPhone,
              patientAge: inc.patientAge,
              patientBloodGroup: inc.patientBloodGroup,
              patientLatitude: inc.patientLatitude,
              patientLongitude: inc.patientLongitude,
              hospitalName: inc.hospitalName,
              hospitalAddress: inc.hospitalAddress,
              hospitalPhone: inc.hospitalPhone || "",
              assignedAt: inc.createdAt || new Date().toISOString(),
              status: inc.status
            };
            setCurrentAssignment(assignment);
          }
        }
      } catch (err) {
        console.error("Failed to initialize ambulance dashboard", err);
      }
    };
    init();

    return () => {
      active = false;
      disconnectWS();
      stopGPSWatch();
    };
  }, [ambulanceUid, connectWS, startGPSWatch, disconnectWS, stopGPSWatch]);

  const handleToggleDuty = async () => {
    if (isOnDuty) {
      disconnectWS();
      stopGPSWatch();
      await fetch(`${REST_BASE}/${ambulanceUid}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OFFLINE" })
      }).catch(() => {});
      setIsOnDuty(false);
      setCurrentAssignment(null);
      setPendingRequest(null);
    } else {
      startGPSWatch();
      connectWS();
      await fetch(`${REST_BASE}/${ambulanceUid}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "AVAILABLE" })
      }).catch(() => {});
      setIsOnDuty(true);
    }
  };

  const handleAcceptAssignment = async (assignment: Assignment) => {
    setPendingRequest(null);
    setCurrentAssignment(assignment);
    await fetch(`${REST_BASE}/${ambulanceUid}/accept/${assignment.logId}`, { method: "POST" }).catch(() => {});
    await fetch(`${REST_BASE}/${ambulanceUid}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "BUSY" })
    }).catch(() => {});
  };

  const handleDeclineAssignment = async (assignment: Assignment) => {
    setPendingRequest(null);
    await fetch(`${REST_BASE}/${ambulanceUid}/decline/${assignment.logId}`, { method: "POST" }).catch(() => {});
  };

  const handleCompleteAssignment = async () => {
    if (!currentAssignment) return;
    await fetch(`${REST_BASE}/${ambulanceUid}/complete/${currentAssignment.logId}`, { method: "POST" }).catch(() => {});
    await fetch(`${REST_BASE}/${ambulanceUid}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "AVAILABLE" })
    }).catch(() => {});
    setCurrentAssignment(null);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* Welcome hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-[#92400e] p-7 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute right-24 -bottom-8 h-24 w-24 rounded-full bg-white/5" />
        <Truck className="absolute right-6 top-6 h-10 w-10 text-white/10" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-amber-200 font-semibold text-sm tracking-wide">Ambulance Command Center</p>
            <h1 className="text-3xl font-black leading-tight">Ambulance Dashboard</h1>
            <p className="text-white/70 text-sm max-w-md">Toggle duty status, broadcast your live GPS, and manage incoming SOS emergency assignments.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className={`px-4 py-3 rounded-2xl text-center border ${isOnDuty ? "bg-white/15 border-white/20" : "bg-white/5 border-white/10"}`}>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Status</p>
              <p className={`text-sm font-black ${isOnDuty ? "text-emerald-300" : "text-slate-300"}`}>{isOnDuty ? "ON DUTY" : "OFF DUTY"}</p>
            </div>
            <div className={`px-4 py-3 rounded-2xl text-center border ${isConnected ? "bg-white/15 border-white/20" : "bg-white/5 border-white/10"}`}>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Network</p>
              <div className="flex items-center gap-1.5 justify-center mt-0.5">
                {isConnected ? <Wifi className="h-4 w-4 text-emerald-300" /> : <WifiOff className="h-4 w-4 text-slate-300" />}
                <p className="text-sm font-black">{isConnected ? "Live" : "Offline"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duty Toggle */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className={`h-1.5 ${isOnDuty ? "bg-gradient-to-r from-emerald-400 to-turquoise" : "bg-slate-200"}`} />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Duty Status</p>
              <p className="text-2xl font-black text-stormy-teal mt-0.5">
                {isOnDuty ? "ON DUTY" : "OFF DUTY"}
              </p>
              {isOnDuty && currentLocation && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-turquoise" />
                  {currentLocation.lat.toFixed(5)}, {currentLocation.lon.toFixed(5)}
                  {broadcastActive && <span className="ml-1 text-emerald-500 font-bold">● Broadcasting</span>}
                </p>
              )}
            </div>
            <button
              onClick={handleToggleDuty}
              className={`relative h-12 w-24 rounded-full border-2 transition-all duration-300 ${
                isOnDuty
                  ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200"
                  : "bg-slate-200 border-slate-200"
              }`}
            >
              <span className={`absolute top-1 h-9 w-9 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${isOnDuty ? "left-[calc(100%-2.5rem)]" : "left-1"}`}>
                <Truck className={`h-4 w-4 ${isOnDuty ? "text-emerald-600" : "text-slate-400"}`} />
              </span>
            </button>
          </div>

          {isOnDuty && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "GPS", icon: <Navigation className="h-4 w-4" />, active: !!currentLocation },
                { label: "Broadcasting", icon: <Radio className="h-4 w-4" />, active: broadcastActive },
                { label: "WebSocket", icon: <Wifi className="h-4 w-4" />, active: isConnected }
              ].map(({ label, icon, active }) => (
                <div key={label} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold ${active ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
                  {icon}
                  <span>{label}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Assignment Request */}
      {pendingRequest && (
        <div className="bg-white rounded-3xl border-2 border-rose-200 shadow-xl overflow-hidden animate-pulse-slow">
          <div className="h-1.5 bg-gradient-to-r from-rose-500 to-orange-400" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-rose-500 animate-bounce" />
              <h3 className="font-black text-rose-600 uppercase tracking-wide text-sm">Incoming SOS Assignment!</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { icon: <User className="h-3.5 w-3.5" />, label: "Patient", value: pendingRequest.patientName },
                { icon: <Droplets className="h-3.5 w-3.5" />, label: "Blood Group", value: pendingRequest.patientBloodGroup },
                { icon: <Phone className="h-3.5 w-3.5" />, label: "Phone", value: pendingRequest.patientPhone },
                { icon: <Hospital className="h-3.5 w-3.5" />, label: "Hospital", value: pendingRequest.hospitalName }
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">{icon}{label}</p>
                  <p className="text-xs font-extrabold text-slate-700">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeclineAssignment(pendingRequest)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-500 font-bold rounded-xl text-sm transition-colors"
              >
                <X className="h-4 w-4" />
                Decline
              </button>
              <button
                onClick={() => handleAcceptAssignment(pendingRequest)}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-3 rounded-xl text-sm shadow-lg shadow-emerald-200 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Assignment */}
      {currentAssignment ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-turquoise to-emerald-400" />
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlarmCheck className="h-5 w-5 text-turquoise" />
                <h3 className="font-black text-stormy-teal">Active Assignment</h3>
              </div>
              <div className="flex items-center gap-2 bg-turquoise/10 px-3 py-1.5 rounded-full">
                <Clock className="h-3.5 w-3.5 text-turquoise" />
                <span className="text-xs font-extrabold text-turquoise">{formatTime(elapsedSecs)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-xs font-black text-stormy-teal uppercase tracking-wide">Patient Info</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">Name</p>
                    <p className="text-sm font-extrabold text-slate-700">{currentAssignment.patientName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">Age / Blood</p>
                    <p className="text-sm font-extrabold text-slate-700">{currentAssignment.patientAge}y · {currentAssignment.patientBloodGroup}</p>
                  </div>
                  <a href={`tel:${currentAssignment.patientPhone}`} className="flex items-center gap-1.5 text-xs text-turquoise font-bold hover:underline">
                    <Phone className="h-3 w-3" />{currentAssignment.patientPhone}
                  </a>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-xs font-black text-stormy-teal uppercase tracking-wide">Destination</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">Hospital</p>
                    <p className="text-sm font-extrabold text-slate-700">{currentAssignment.hospitalName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">Address</p>
                    <p className="text-sm font-extrabold text-slate-700">{currentAssignment.hospitalAddress || "On Route"}</p>
                  </div>
                  {currentAssignment.hospitalPhone && (
                    <a href={`tel:${currentAssignment.hospitalPhone}`} className="flex items-center gap-1.5 text-xs text-turquoise font-bold hover:underline">
                      <Phone className="h-3 w-3" />{currentAssignment.hospitalPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-extrabold text-emerald-700">En route — broadcasting live location</span>
              {broadcastActive && <span className="ml-auto h-2 w-2 bg-emerald-500 rounded-full animate-ping" />}
            </div>

            <button
              onClick={handleCompleteAssignment}
              className="w-full bg-stormy-teal hover:bg-stormy-teal/90 text-white font-black py-3 rounded-xl text-sm shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Completed (Patient Delivered)
            </button>
          </div>
        </div>
      ) : (
        isOnDuty && !pendingRequest && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Radio className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-extrabold text-slate-500 text-lg">Standby for SOS</h3>
            <p className="text-slate-400 text-sm mt-2">You are broadcasting your location. An SOS request will appear here.</p>
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-turquoise/10 rounded-full text-turquoise text-xs font-bold">
                <span className="h-2 w-2 bg-turquoise rounded-full animate-ping" />
                Live GPS · Broadcasting every 3s
              </div>
            </div>
          </div>
        )
      )}

      {!isOnDuty && !pendingRequest && !currentAssignment && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 text-center">
          <Truck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="font-extrabold text-slate-400">You are currently off duty</h3>
          <p className="text-slate-400 text-sm mt-1">Toggle duty on to start accepting emergency assignments.</p>
        </div>
      )}
    </div>
  );
};

export default AmbulanceDashboard;
