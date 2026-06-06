import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Phone, Mail, Calendar, Heart, Edit2, Check, X, Shield } from "lucide-react";

export const PatientProfile: React.FC = () => {
  const { profileData, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form state
  const [formData, setFormData] = useState({
    fullName: profileData?.fullName || user?.email?.split("@")[0] || "Patient",
    age: profileData?.age || "",
    bloodGroup: profileData?.bloodGroup || "",
    email: profileData?.email || user?.email || "",
    phone: profileData?.phone || "",
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    try {
      // Update local storage representation
      const currentProfile = JSON.parse(localStorage.getItem("intellicare_profile") || "{}");
      const updatedProfile = {
        ...currentProfile,
        fullName: formData.fullName,
        age: parseInt(formData.age as string, 10) || formData.age,
        bloodGroup: formData.bloodGroup,
        email: formData.email,
        phone: formData.phone,
      };

      localStorage.setItem("intellicare_profile", JSON.stringify(updatedProfile));
      // Display success message (to apply globally, the user would need to reload or state would update on next login,
      // but let's notify the user and keep the UI updated locally)
      setNotification({ type: "success", message: "Profile updated successfully! Refresh to sync globally." });
      setIsEditing(false);

      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      setNotification({ type: "error", message: "Failed to update profile." });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-stormy-teal">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your personal information and contact details.</p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all duration-300 ${
            notification.type === "success"
              ? "bg-teal-50 border-teal-200 text-stormy-teal"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <Shield className="h-5 w-5 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {/* Banner with gradient color scheme */}
        <div className="h-32 bg-gradient-to-r from-stormy-teal to-turquoise relative">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-12 bottom-2 h-16 w-16 rounded-full bg-white/10 pointer-events-none" />
        </div>

        <div className="px-6 pb-8 relative">
          {/* Avatar placement */}
          <div className="absolute -top-12 left-6">
            <div className="h-24 w-24 rounded-2xl bg-white p-1.5 shadow-md border border-slate-100">
              <div className="h-full w-full rounded-xl bg-gradient-to-br from-stormy-teal to-turquoise flex items-center justify-center text-white font-black text-3xl">
                {formData.fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Edit/Save Actions */}
          <div className="flex justify-end pt-4">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 bg-turquoise text-stormy-teal rounded-xl text-sm font-black shadow-lg shadow-turquoise/20 hover:bg-turquoise/90 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Identity details */}
          <div className="mt-6 pt-4">
            <h2 className="text-xl font-black text-stormy-teal">{formData.fullName}</h2>
            <p className="text-xs font-bold text-turquoise uppercase tracking-wider mt-0.5">Patient Account</p>
          </div>

          <hr className="my-6 border-slate-100" />

          {/* Grid Layout of Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-turquoise/40 focus:border-turquoise disabled:opacity-75 disabled:bg-slate-50 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={true} // Email is immutable generally for authentication
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Age Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Age</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  min="0"
                  max="120"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-turquoise/40 focus:border-turquoise disabled:opacity-75 disabled:bg-slate-50 transition-all"
                />
              </div>
            </div>

            {/* Blood Group Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Blood Group</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Heart className="h-4 w-4" />
                </span>
                {isEditing ? (
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-turquoise/40 focus:border-turquoise transition-all appearance-none"
                  >
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="bloodGroup"
                    value={formData.bloodGroup || "--"}
                    disabled={true}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold disabled:opacity-75"
                  />
                )}
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-turquoise/40 focus:border-turquoise disabled:opacity-75 disabled:bg-slate-50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
