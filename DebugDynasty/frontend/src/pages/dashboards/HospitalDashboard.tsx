import React, { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "../../context/AuthContext";
import {
  Hospital,
  Bell,
  BedDouble,
  User,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Wifi,
  WifiOff,
  Phone,
  Droplets,
  X
} from "lucide-react";

const REST_BASE = "http://localhost:8080/api/hospital";
const WS_URL = "http://localhost:8080/ws/consultation";

interface SOSAlert {
  logId: number;
  patientName: string;
  patientAge: number;
  patientBloodGroup: string;
  patientPhone: string;
  ambulanceVehicleNumber: string;
  ambulanceDriverName: string;
  ambulancePhone: string;
  estimatedArrivalMins: number;
  alertedAt: string;
  acknowledged: boolean;
}

interface HospitalInfo {
  uid: string;
  name: string;
  address: string;
  phone: string;
  totalBeds: number;
  availableBeds: number;
}

interface BedUpdatePayload {
  availableBeds: number;
}

export const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const hospitalUid = user?.uid || "mock-hospital-1";

  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [bedInputVal, setBedInputVal] = useState<number>(0);
  const [bedUpdateLoading, setBedUpdateLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const stompRef = useRef<Client | null>(null);

  const fetchHospitalInfo = useCallback(async () => {
    try {
      const res = await fetch(`${REST_BASE}/${hospitalUid}`);
      if (res.ok) {
        const data: HospitalInfo = await res.json();
        setHospitalInfo(data);
        setBedInputVal(data.availableBeds);
      } else {
        // Mock fallback
        const mock: HospitalInfo = {
          uid: hospitalUid,
          name: "City General Hospital",
          address: "123 Central Ave, Mumbai",
          phone: "022-1234-5678",
          totalBeds: 100,
          availableBeds: 18
        };
        setHospitalInfo(mock);
        setBedInputVal(mock.availableBeds);
      }
    } catch {
      const mock: HospitalInfo = {
        uid: hospitalUid,
        name: "City General Hospital",
        address: "123 Central Ave, Mumbai",
        phone: "022-1234-5678",
        totalBeds: 100,
        availableBeds: 18
      };
      setHospitalInfo(mock);
      setBedInputVal(mock.availableBeds);
    }
    setLoading(false);
  }, [hospitalUid]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${REST_BASE}/${hospitalUid}/alerts`);
      if (res.ok) {
        const data: SOSAlert[] = await res.json();
        setAlerts(data);
      }
    } catch { /* offline */ }
  }, [hospitalUid]);

  useEffect(() => {
    fetchHospitalInfo();
    fetchAlerts();
  }, [fetchHospitalInfo, fetchAlerts]);

  // WebSocket
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/hospital/${hospitalUid}/alerts`, (frame) => {
          const data = JSON.parse(frame.body);
          if (data.type === "SOS_ALERT" && data.alert) {
            setAlerts(prev => {
              const exists = prev.some(a => a.logId === data.alert.logId);
              if (exists) return prev;
              return [data.alert, ...prev];
            });
          } else if (data.type === "SOS_CANCELLED" || data.type === "SOS_COMPLETED") {
            setAlerts(prev => prev.filter(a => a.logId !== data.logId));
          } else if (data.type === "BED_UPDATE") {
            setHospitalInfo(prev => prev ? { ...prev, availableBeds: data.availableBeds } : prev);
          }
        });
      },
      onDisconnect: () => setIsConnected(false)
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, [hospitalUid]);

  const handleUpdateBeds = async () => {
    setBedUpdateLoading(true);
    try {
      const res = await fetch(`${REST_BASE}/${hospitalUid}/beds`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availableBeds: bedInputVal } as BedUpdatePayload)
      });
      if (res.ok) {
        const data = await res.json();
        setHospitalInfo(prev => prev ? { ...prev, availableBeds: data.availableBeds } : prev);
      }
    } catch { /* offline */ }
    setBedUpdateLoading(false);
  };

  const handleAcknowledgeAlert = async (logId: number) => {
    try {
      await fetch(`${REST_BASE}/${hospitalUid}/alerts/${logId}/acknowledge`, { method: "POST" });
    } catch { /* offline */ }
    setAlerts(prev => prev.map(a => a.logId === logId ? { ...a, acknowledged: true } : a));
  };

  const handleDismissAlert = (logId: number) => {
    setAlerts(prev => prev.filter(a => a.logId !== logId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="space-y-2 text-center">
          <Hospital className="h-8 w-8 text-turquoise mx-auto animate-pulse" />
          <p className="text-slate-500 text-sm">Loading hospital data...</p>
        </div>
      </div>
    );
  }

  const bedPercent = hospitalInfo ? ((hospitalInfo.availableBeds / hospitalInfo.totalBeds) * 100).toFixed(0) : 0;
  const unacknowledged = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stormy-teal flex items-center gap-2">
            <Hospital className="h-6 w-6" />
            Hospital Control
          </h1>
          <p className="text-slate-500 text-sm mt-1">{hospitalInfo?.name} — Emergency operations panel.</p>
        </div>
        <div className="flex items-center gap-3">
          {unacknowledged > 0 && (
            <div className="flex items-center gap-1.5 bg-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-black animate-pulse">
              <Bell className="h-3 w-3" />
              {unacknowledged} SOS Alert{unacknowledged > 1 ? "s" : ""}
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${isConnected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
            {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isConnected ? "Live" : "Offline"}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Available Beds",
            value: hospitalInfo?.availableBeds ?? 0,
            sub: `of ${hospitalInfo?.totalBeds} total`,
            icon: <BedDouble className="h-5 w-5" />,
            color: (hospitalInfo?.availableBeds ?? 0) > 5 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
          },
          {
            label: "Pending Alerts",
            value: unacknowledged,
            sub: `${alerts.length} total today`,
            icon: <Bell className="h-5 w-5" />,
            color: unacknowledged > 0 ? "text-rose-600 bg-rose-50" : "text-slate-600 bg-slate-50"
          },
          {
            label: "Bed Capacity",
            value: `${bedPercent}%`,
            sub: "beds available",
            icon: <Activity className="h-5 w-5" />,
            color: Number(bedPercent) > 20 ? "text-turquoise bg-turquoise/10" : "text-amber-600 bg-amber-50"
          }
        ].map(({ label, value, sub, icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-md p-4 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-black text-slate-800">{value}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bed Management */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-stormy-teal to-turquoise" />
        <div className="p-5">
          <h3 className="font-black text-stormy-teal flex items-center gap-2 mb-4">
            <BedDouble className="h-5 w-5" />
            Bed Availability Management
          </h3>

          {hospitalInfo && (
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                <span>Available Beds</span>
                <span>{hospitalInfo.availableBeds} / {hospitalInfo.totalBeds}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    hospitalInfo.availableBeds > 20 ? "bg-emerald-400" :
                    hospitalInfo.availableBeds > 5 ? "bg-amber-400" : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, (hospitalInfo.availableBeds / hospitalInfo.totalBeds) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Update Available Beds</label>
              <input
                type="number"
                min={0}
                max={hospitalInfo?.totalBeds ?? 200}
                value={bedInputVal}
                onChange={(e) => setBedInputVal(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
              />
            </div>
            <button
              onClick={handleUpdateBeds}
              disabled={bedUpdateLoading}
              className="mt-5 px-5 py-2.5 bg-stormy-teal hover:bg-stormy-teal/90 text-white font-black rounded-xl text-sm shadow-md transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {bedUpdateLoading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <CheckCircle2 className="h-4 w-4" />}
              Update
            </button>
          </div>
        </div>
      </div>

      {/* SOS Alerts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-stormy-teal flex items-center gap-2">
            <Bell className="h-5 w-5 text-rose-500" />
            Incoming SOS Pre-Alerts
          </h3>
          {alerts.length > 0 && (
            <span className="text-xs text-slate-400 font-bold">{alerts.length} total today</span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <Bell className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">No SOS alerts today</p>
            <p className="text-slate-400 text-sm">Pre-alerts from ambulances will appear here.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.logId}
              className={`bg-white rounded-2xl border shadow-lg overflow-hidden transition-all ${alert.acknowledged ? "border-slate-100 opacity-80" : "border-rose-200"}`}
            >
              <div className={`h-1.5 ${alert.acknowledged ? "bg-slate-200" : "bg-gradient-to-r from-rose-500 to-orange-400"}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    {alert.acknowledged
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      : <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 animate-pulse" />}
                    <div>
                      <p className={`text-sm font-black ${alert.acknowledged ? "text-slate-600" : "text-rose-600"}`}>
                        {alert.acknowledged ? "Alert Acknowledged" : "Incoming Emergency Patient"}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.alertedAt ? new Date(alert.alertedAt).toLocaleTimeString() : "Just now"}
                        {!alert.acknowledged && (
                          <span className="ml-2 font-bold text-rose-500">
                            ETA: ~{alert.estimatedArrivalMins ?? 8} min
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismissAlert(alert.logId)}
                    className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                    <p className="text-[10px] font-black text-stormy-teal uppercase tracking-wider mb-1">Patient</p>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><User className="h-3 w-3" /> Name</p>
                      <p className="text-xs font-extrabold text-slate-700">{alert.patientName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Droplets className="h-3 w-3" /> Blood Group</p>
                      <p className="text-xs font-extrabold text-rose-500">{alert.patientBloodGroup}</p>
                    </div>
                    <a href={`tel:${alert.patientPhone}`} className="text-[10px] text-turquoise font-bold flex items-center gap-1 hover:underline">
                      <Phone className="h-3 w-3" /> {alert.patientPhone}
                    </a>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                    <p className="text-[10px] font-black text-stormy-teal uppercase tracking-wider mb-1">Ambulance</p>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Truck className="h-3 w-3" /> Vehicle</p>
                      <p className="text-xs font-extrabold text-slate-700">{alert.ambulanceVehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><User className="h-3 w-3" /> Driver</p>
                      <p className="text-xs font-extrabold text-slate-700">{alert.ambulanceDriverName}</p>
                    </div>
                    <a href={`tel:${alert.ambulancePhone}`} className="text-[10px] text-turquoise font-bold flex items-center gap-1 hover:underline">
                      <Phone className="h-3 w-3" /> {alert.ambulancePhone}
                    </a>
                  </div>
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.logId)}
                    className="w-full bg-stormy-teal hover:bg-stormy-teal/90 text-white font-black py-2.5 rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Acknowledge &amp; Prepare Bed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
