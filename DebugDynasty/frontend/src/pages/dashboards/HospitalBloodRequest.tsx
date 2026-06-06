import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Droplet, Plus, Clock, CheckCircle2, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";

interface BloodBank {
  uid: string;
  name: string;
  address: string;
  phone: string;
  aPositive: number;
  aNegative: number;
  bPositive: number;
  bNegative: number;
  abPositive: number;
  abNegative: number;
  oPositive: number;
  oNegative: number;
}

interface BloodRequest {
  id: number;
  bloodBankUid: string;
  bloodBankName: string;
  bloodGroup: string;
  requiredUnits: number;
  status: string;
  createdAt: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const HospitalBloodRequest: React.FC = () => {
  const { user } = useAuth();
  const hospitalUid = user?.uid || "mock-hospital-1";

  const [bloodGroup, setBloodGroup] = useState("O+");
  const [requiredUnits, setRequiredUnits] = useState<number>(1);
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [selectedBankUid, setSelectedBankUid] = useState<string>("");
  const [requestHistory, setRequestHistory] = useState<BloodRequest[]>([]);
  
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchBloodBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch("http://localhost:8080/api/blood/banks");
      if (res.ok) {
        const data = await res.json();
        setBloodBanks(data);
        if (data.length > 0) {
          setSelectedBankUid(data[0].uid);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBanks(false);
    }
  };

  const fetchRequestHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`http://localhost:8080/api/blood/requests/hospital/${hospitalUid}`);
      if (res.ok) {
        const data = await res.json();
        setRequestHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBloodBanks();
    fetchRequestHistory();
  }, [hospitalUid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedBankUid) {
      setErrorMsg("Please select a blood bank.");
      return;
    }

    if (requiredUnits <= 0) {
      setErrorMsg("Required units must be greater than 0.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:8080/api/blood/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hospitalUid,
          bloodBankUid: selectedBankUid,
          bloodGroup,
          requiredUnits,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Blood request submitted successfully and sent to Blood Bank via WebSockets!");
        setRequiredUnits(1);
        fetchRequestHistory();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.message || "Failed to submit blood request.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please make sure the backend server is running.");
    } finally {
      setSubmitting(false);
    }
  };

  const getBankStock = (bank: BloodBank, group: string): number => {
    switch (group) {
      case "A+": return bank.aPositive;
      case "A-": return bank.aNegative;
      case "B+": return bank.bPositive;
      case "B-": return bank.bNegative;
      case "AB+": return bank.abPositive;
      case "AB-": return bank.abNegative;
      case "O+": return bank.oPositive;
      case "O-": return bank.oNegative;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stormy-teal flex items-center gap-2">
          <Droplet className="h-6 w-6 text-rose-500 fill-current" />
          Blood Supply Network
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Request units of blood from partner Blood Banks in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blood Request Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden self-start">
          <div className="h-1.5 bg-gradient-to-r from-rose-500 to-rose-400" />
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <h2 className="text-base font-black text-stormy-teal flex items-center gap-2">
              <Plus className="h-5 w-5 text-rose-500" />
              Create Blood Request
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
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
              >
                {BLOOD_GROUPS.map((grp) => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Required Units</label>
              <input
                type="number"
                min={1}
                max={50}
                value={requiredUnits}
                onChange={(e) => setRequiredUnits(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-stormy-teal outline-none focus:border-turquoise focus:ring-2 focus:ring-turquoise/10"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Select Partner Blood Bank</label>
              {loadingBanks ? (
                <div className="text-xs text-slate-400 py-2 animate-pulse">Loading partner blood banks...</div>
              ) : bloodBanks.length === 0 ? (
                <div className="text-xs text-rose-500 py-2 font-bold">No blood banks available.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {bloodBanks.map((bank) => {
                    const stock = getBankStock(bank, bloodGroup);
                    const isSelected = selectedBankUid === bank.uid;
                    return (
                      <div
                        key={bank.uid}
                        onClick={() => setSelectedBankUid(bank.uid)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "border-rose-300 bg-rose-50/30 ring-2 ring-rose-200/50"
                            : "border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-black text-stormy-teal">{bank.name}</p>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            stock >= requiredUnits ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            Stock: {stock} units
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">{bank.address}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedBankUid}
              className="w-full mt-2 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-200 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Droplet className="h-4 w-4" />
              )}
              Send Emergency Blood Request
            </button>
          </form>
        </div>

        {/* Request History List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-stormy-teal flex items-center gap-2">
              <Clock className="h-5 w-5 text-rose-500" />
              Active &amp; Past Blood Requests
            </h2>
            <button onClick={fetchRequestHistory} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loadingHistory ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="h-6 w-6 border-2 border-t-transparent border-rose-500 rounded-full animate-spin mx-auto mb-2" />
              Loading history...
            </div>
          ) : requestHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <MessageSquare className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">No blood requests submitted yet</p>
              <p className="text-slate-400 text-sm mt-1">Submit your first blood request using the left form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requestHistory.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
                  <div className={`h-1 ${
                    req.status === "ACCEPTED" ? "bg-emerald-400" :
                    req.status === "REJECTED" ? "bg-slate-350" : "bg-rose-400 animate-pulse"
                  }`} />
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-black border ${
                        req.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        req.status === "REJECTED" ? "bg-slate-50 text-slate-500 border-slate-200" :
                        "bg-rose-50 text-rose-600 border-rose-200"
                      }`}>
                        {req.bloodGroup}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-stormy-teal">{req.bloodBankName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Requested <span className="font-bold text-rose-500">{req.requiredUnits} units</span>
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1">
                          {req.createdAt ? new Date(req.createdAt).toLocaleString() : "Just now"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        req.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                        req.status === "REJECTED" ? "bg-slate-100 text-slate-600" :
                        "bg-rose-100 text-rose-700 animate-pulse"
                      }`}>
                        {req.status}
                      </span>
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

export default HospitalBloodRequest;
