import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { PatientDashboard } from "./pages/dashboards/PatientDashboard";
import { AISymptomTriage } from "./pages/dashboards/AISymptomTriage";
import { DoctorConsultation } from "./pages/dashboards/DoctorConsultation";
import { SOS } from "./pages/dashboards/SOS";
import { FollowUpCare } from "./pages/dashboards/FollowUpCare";
import { PrescriptionHistory } from "./pages/dashboards/PrescriptionHistory";
import { PatientProfile } from "./pages/dashboards/PatientProfile";
import { DoctorDashboard } from "./pages/dashboards/DoctorDashboard";
import { HospitalDashboard } from "./pages/dashboards/HospitalDashboard";
import { AmbulanceDashboard } from "./pages/dashboards/AmbulanceDashboard";
import { BloodBankDashboard } from "./pages/dashboards/BloodBankDashboard";
import { GenericSubpageSkeleton } from "./pages/dashboards/GenericSubpageSkeleton";
import { HospitalBloodRequest } from "./pages/dashboards/HospitalBloodRequest";
import { PrescribePatient } from "./pages/dashboards/PrescribePatient";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Patient Secured Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRole="PATIENT">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="dashboard/ai-triage" element={<AISymptomTriage />} />
            <Route path="dashboard/consultation" element={<DoctorConsultation />} />
            <Route path="dashboard/sos" element={<SOS />} />
            <Route path="dashboard/followup" element={<FollowUpCare />} />
            <Route path="dashboard/prescriptions" element={<PrescriptionHistory />} />
            <Route path="dashboard/profile" element={<PatientProfile />} />
            <Route path="dashboard/*" element={<GenericSubpageSkeleton />} />
          </Route>

          {/* Doctor Secured Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRole="DOCTOR">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="dashboard/prescribe" element={<PrescribePatient />} />
            <Route path="dashboard/*" element={<GenericSubpageSkeleton />} />
          </Route>

          {/* Hospital Secured Routes */}
          <Route
            path="/hospital"
            element={
              <ProtectedRoute allowedRole="HOSPITAL">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HospitalDashboard />} />
            <Route path="dashboard/blood-request" element={<HospitalBloodRequest />} />
            <Route path="dashboard/*" element={<GenericSubpageSkeleton />} />
          </Route>

          {/* Ambulance Secured Routes */}
          <Route
            path="/ambulance"
            element={
              <ProtectedRoute allowedRole="AMBULANCE">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AmbulanceDashboard />} />
            <Route path="dashboard/*" element={<GenericSubpageSkeleton />} />
          </Route>

          {/* Blood Bank Secured Routes */}
          <Route
            path="/blood_bank"
            element={
              <ProtectedRoute allowedRole="BLOOD_BANK">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<BloodBankDashboard />} />
            <Route path="dashboard/*" element={<GenericSubpageSkeleton />} />
          </Route>

          {/* Redirect all unmatched paths to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
