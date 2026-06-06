import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import auth, { isMockFirebase } from "../firebase";

export interface UserSession {
  uid: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: UserSession | null;
  profileData: any;
  loading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  signup: (email: string, password: string, role: string, additionalData: any) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sync session with local storage for persistence
  useEffect(() => {
    const savedSession = localStorage.getItem("intellicare_session");
    const savedProfile = localStorage.getItem("intellicare_profile");
    if (savedSession) {
      setUser(JSON.parse(savedSession));
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }
    }

    if (!isMockFirebase && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Fetch user details from localStorage or Spring Boot Backend
          const savedSession = localStorage.getItem("intellicare_session");
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed.uid === firebaseUser.uid) {
              setUser(parsed);
              setLoading(false);
              return;
            }
          }
          // If no local session found but Firebase user is active, fetch from backend (or fallback to patient role)
          const fallbackUser: UserSession = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            role: "PATIENT"
          };
          setUser(fallbackUser);
          localStorage.setItem("intellicare_session", JSON.stringify(fallbackUser));
        } else {
          setUser(null);
          setProfileData(null);
          localStorage.removeItem("intellicare_session");
          localStorage.removeItem("intellicare_profile");
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    try {
      let uid = "";
      if (isMockFirebase || !auth) {
        // Mock authentication validation
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Simple mock registry search or fallback creation
        const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
        const match = mockUsers.find((u: any) => u.email === email && u.role === role);
        uid = match ? match.uid : `mock-${role.toLowerCase()}-${Date.now()}`;
      } else {
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        uid = credentials.user.uid;
      }

      // Synchronize with Spring Boot Backend (or fallback to local database mock)
      let profile = null;
      try {
        const response = await fetch(`http://localhost:8080/api/dashboard/summary?role=${role}&uid=${uid}`);
        if (response.ok) {
          profile = await response.json();
        }
      } catch (err) {
        console.warn("Backend API not reachable. Using local simulated profile.", err);
      }

      if (!profile) {
        // Mock dummy profile
        profile = {
          fullName: email.split("@")[0].toUpperCase(),
          phone: "9876543210",
          email: email,
          ...(role === "PATIENT" && { age: 30, bloodGroup: "O+" }),
          ...(role === "DOCTOR" && { medicalRegistrationNumber: "REG-12345", experienceYears: 8, specialization: "General Medicine", preferredLanguage: "English" }),
          ...(role === "HOSPITAL" && { hospitalName: email.split("@")[0].toUpperCase() + " Hospital", registrationNumber: "HOSP-999" }),
          ...(role === "AMBULANCE" && { providerName: "Emergency Fleet Ltd", vehicleNumber: "MH-12-AB-3456", driverName: "John Doe" }),
          ...(role === "BLOOD_BANK" && { bloodBankName: "Metro Blood Bank", registrationNumber: "BANK-777" }),
        };
      }

      const sessionUser: UserSession = { uid, email, role };
      setUser(sessionUser);
      setProfileData(profile);
      localStorage.setItem("intellicare_session", JSON.stringify(sessionUser));
      localStorage.setItem("intellicare_profile", JSON.stringify(profile));
    } catch (error) {
      setUser(null);
      setProfileData(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, role: string, additionalData: any) => {
    setLoading(true);
    try {
      let uid = "";
      if (isMockFirebase || !auth) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        uid = `mock-${role.toLowerCase()}-${Date.now()}`;
        // Store in mock user registry
        const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
        mockUsers.push({ email, role, uid });
        localStorage.setItem("mock_users", JSON.stringify(mockUsers));
      } else {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        uid = credentials.user.uid;
      }

      // Format payload for backend API
      const registerPayload = {
        firebaseUid: uid,
        email: email,
        role: role,
        ...additionalData
      };

      // Call Spring Boot backend to save the profile in PostgreSQL/MySQL
      try {
        const response = await fetch("http://localhost:8080/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerPayload)
        });
        if (!response.ok) {
          throw new Error("Failed to register profile in backend database");
        }
      } catch (err) {
        console.warn("Backend API not reachable during registration. Profile saved locally.", err);
      }

      const sessionUser: UserSession = { uid, email, role };
      setUser(sessionUser);
      setProfileData({ email, ...additionalData });
      localStorage.setItem("intellicare_session", JSON.stringify(sessionUser));
      localStorage.setItem("intellicare_profile", JSON.stringify({ email, ...additionalData }));
    } catch (error) {
      setUser(null);
      setProfileData(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (!isMockFirebase && auth) {
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error("Firebase logout failed", error);
    } finally {
      setUser(null);
      setProfileData(null);
      localStorage.removeItem("intellicare_session");
      localStorage.removeItem("intellicare_profile");
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (isMockFirebase || !auth) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return;
    }
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, profileData, loading, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
