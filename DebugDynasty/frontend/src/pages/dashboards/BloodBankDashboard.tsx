import React, { useState, useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "../../context/AuthContext";
import {
  Droplet, Bell, CheckCircle2, X, Wifi, WifiOff,
  MapPin, Phone, Package
} from "lucide-react";

const REST_BASE = "http://localhost:8080/api/blood";
const WS_URL   = "http://localhost:8080/ws/consultation";

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const INVENTORY_KEYS: Record<string, string> = {
  "A+": "aPositive", "A-": "aNegative",
  "B+": "bPositive", "B-": "bNegative",
  "AB+": "abPositive", "AB-": "abNegative",
  "O+": "oPositive", "O-": "oNegative",
};

interface Inventory { [key: string]: number }
interface BankInfo {
  uid: string; name: string; address: string; phone: string;
  inventory: Inventory;
}
interface BloodReqCard {
  id: number; bloodGroup: string; requiredUnits: number;
  hospitalName: string; hospitalAddress: string; hospitalPhone: string;
  status: string; createdAt: string;
}

export const BloodBankDashboard: React.FC = () => {
  const { user, profileData } = useAuth();
  const bankUid = user?.uid || "mock-bloodbank-1";
  const data = profileData || { bloodBankName: "National Red Cross Blood Bank", address: "Mumbai", contactNumber: "9876543210" };

  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [requests, setRequests] = useState<BloodReqCard[]>([]);
  const [editInventory, setEditInventory] = useState<Inventory>({});
  const [isConnected, setIsConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const stompRef = useRef<Client | null>(null);

  const fetchBank = useCallback(async () => {
    try {
      const res = await fetch(`${REST_BASE}/banks/${bankUid}`);
      if (res.ok) {
        const d = await res.json();
        const inv: Inventory = {};
        BLOOD_GROUPS.forEach(g => { inv[g] = d[INVENTORY_KEYS[g]] ?? 0; });
        setBankInfo({ uid: d.uid, name: d.name, address: d.address, phone: d.phone, inventory: inv });
        setEditInventory({ ...inv });
      } else {
        // Mock fallback
        const inv: Inventory = { "A+":45,"A-":12,"B+":38,"B-":8,"AB+":25,"AB-":4,"O+":60,"O-":15 };
        setBankInfo({ uid: bankUid, name: data.bloodBankName, address: data.address, phone: data.contactNumber, inventory: inv });
        setEditInventory({ ...inv });
      }
    } catch {
      const inv: Inventory = { "A+":45,"A-":12,"B+":38,"B-":8,"AB+":25,"AB-":4,"O+":60,"O-":15 };
      setBankInfo({ uid: bankUid, name: data.bloodBankName, address: data.address, phone: data.contactNumber, inventory: inv });
      setEditInventory({ ...inv });
    }
  }, [bankUid, data.bloodBankName, data.address, data.contactNumber]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${REST_BASE}/requests/bloodbank/${bankUid}`);
      if (res.ok) {
        const arr = await res.json();
        setRequests(arr.map((r: any) => ({
          id: r.id, bloodGroup: r.bloodGroup, requiredUnits: r.requiredUnits,
          hospitalName: r.hospitalName || "Hospital", hospitalAddress: r.hospitalAddress || "",
          hospitalPhone: r.hospitalPhone || "", status: r.status, createdAt: r.createdAt
        })));
      }
    } catch { /* offline */ }
  }, [bankUid]);

  useEffect(() => { fetchBank(); fetchRequests(); }, [fetchBank, fetchRequests]);

  // WebSocket
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/bloodbank/${bankUid}/requests`, (frame) => {
          const data = JSON.parse(frame.body);
          if (data.type === "BLOOD_REQUEST" && data.request) {
            const r = data.request;
            setRequests(prev => [{
              id: r.id, bloodGroup: r.bloodGroup, requiredUnits: r.requiredUnits,
              hospitalName: r.hospitalName || "Hospital", hospitalAddress: r.hospitalAddress || "",
              hospitalPhone: r.hospitalPhone || "", status: r.status, createdAt: r.createdAt
            }, ...prev]);
          }
        });
      },
      onDisconnect: () => setIsConnected(false)
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, [bankUid]);

  const handleSaveInventory = async () => {
    setSaving(true);
    const body: Record<string, number> = {};
    BLOOD_GROUPS.forEach(g => { body[INVENTORY_KEYS[g]] = editInventory[g] ?? 0; });
    try {
      const res = await fetch(`${REST_BASE}/banks/${bankUid}/inventory`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const d = await res.json();
        const inv: Inventory = {};
        BLOOD_GROUPS.forEach(g => { inv[g] = d[INVENTORY_KEYS[g]] ?? 0; });
        setBankInfo(prev => prev ? { ...prev, inventory: inv } : prev);
        setEditInventory({ ...inv });
      }
    } catch { /* offline, keep local */ }
    setSaving(false);
  };

  const handleAccept = async (id: number) => {
    try { await fetch(`${REST_BASE}/requests/${id}/accept`, { method: "POST" }); } catch { /* offline */ }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "ACCEPTED" } : r));
    fetchBank(); // refresh inventory after deduction
  };

  const handleReject = async (id: number) => {
    try { await fetch(`${REST_BASE}/requests/${id}/reject`, { method: "POST" }); } catch { /* offline */ }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "REJECTED" } : r));
  };

  const getGroupColor = (qty: number) =>
    qty > 20 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
    qty > 5  ? "bg-amber-50 text-amber-700 border-amber-100" :
               "bg-rose-50 text-rose-700 border-rose-100";

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Welcome hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-[#881337] p-7 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute right-24 -bottom-8 h-24 w-24 rounded-full bg-white/5" />
        <Droplet className="absolute right-6 top-6 h-10 w-10 text-white/10 fill-current" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-rose-200 font-semibold text-sm tracking-wide">Blood Bank Operations</p>
            <h1 className="text-3xl font-black leading-tight">{bankInfo?.name ?? data.bloodBankName}</h1>
            <p className="text-white/70 text-sm max-w-md flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> {bankInfo?.address ?? data.address}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {pendingCount > 0 && (
              <div className="bg-white/20 text-white px-4 py-3 rounded-2xl text-center border border-white/20">
                <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest">Pending</p>
                <p className="text-2xl font-black">{pendingCount}</p>
              </div>
            )}
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

      {/* Blood Inventory */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-rose-500 to-rose-400" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-stormy-teal flex items-center gap-2">
              <Droplet className="h-5 w-5 text-rose-500" /> Blood Inventory
            </h2>
            <button
              onClick={handleSaveInventory}
              disabled={saving}
              className="px-4 py-2 bg-stormy-teal hover:bg-stormy-teal/90 text-white font-black text-xs rounded-xl shadow transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Save Inventory
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BLOOD_GROUPS.map(group => (
              <div key={group} className={`rounded-2xl border p-4 text-center space-y-2 ${getGroupColor(editInventory[group] ?? 0)}`}>
                <p className="text-2xl font-black">{group}</p>
                <input
                  type="number"
                  min={0}
                  value={editInventory[group] ?? 0}
                  onChange={e => setEditInventory(prev => ({ ...prev, [group]: Number(e.target.value) }))}
                  className="w-full text-center bg-white/60 border border-current/20 rounded-xl px-2 py-1.5 text-lg font-black outline-none focus:ring-2 focus:ring-current/20"
                />
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Units</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incoming Requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-stormy-teal flex items-center gap-2">
            <Bell className="h-5 w-5 text-rose-500" /> Incoming Hospital Requests
          </h2>
          <span className="text-xs text-slate-400 font-bold">{requests.length} total</span>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <Package className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">No blood requests received yet</p>
            <p className="text-slate-400 text-sm mt-1">Hospital requests will appear here in real-time.</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className={`bg-white rounded-2xl border shadow-lg overflow-hidden ${req.status === "PENDING" ? "border-rose-200" : "border-slate-100"}`}>
              <div className={`h-1.5 ${req.status === "ACCEPTED" ? "bg-emerald-400" : req.status === "REJECTED" ? "bg-slate-200" : "bg-gradient-to-r from-rose-500 to-orange-400"}`} />
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center text-xl font-black border-2 ${req.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : req.status === "REJECTED" ? "bg-slate-50 text-slate-400 border-slate-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
                  {req.bloodGroup}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-stormy-teal">{req.hospitalName}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${req.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : req.status === "REJECTED" ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-rose-700"}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-bold text-stormy-teal">{req.requiredUnits} units</span> of <span className="font-bold">{req.bloodGroup}</span> required
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {req.hospitalAddress}
                    {req.hospitalPhone && <span className="ml-2 flex items-center gap-1"><Phone className="h-3 w-3" /> {req.hospitalPhone}</span>}
                  </p>
                </div>
                {req.status === "PENDING" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleReject(req.id)} className="px-3 py-2 border border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-500 font-bold rounded-xl text-xs transition-colors flex items-center gap-1">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button onClick={() => handleAccept(req.id)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-200 transition-colors flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                    </button>
                  </div>
                )}
                {req.status !== "PENDING" && (
                  <div className={`text-[10px] font-black flex items-center gap-1 shrink-0 ${req.status === "ACCEPTED" ? "text-emerald-600" : "text-slate-400"}`}>
                    {req.status === "ACCEPTED" ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    {req.status}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BloodBankDashboard;
