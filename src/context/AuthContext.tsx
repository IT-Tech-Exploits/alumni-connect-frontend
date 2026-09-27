import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { api, getErrorMessage } from "../api/client";

export type UserRole = "student" | "alumni" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  graduationYear?: string;
  university?: string;
  department?: string;
  program?: string;
  registrationNumber?: string;
  company?: string;
  position?: string;
  profilePhoto?: string;
  skills?: string[];
  bio?: string;
  cvUrl?: string;
  isApproved?: boolean;
  mustChangePassword?: boolean;
  token?: string;
}

const STORAGE_KEY = "alumniConnectUser";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ mustChangePassword: boolean; user: User }>;
  registerStudent: (data: Record<string, string>) => Promise<void>;
  registerFirstAdmin: (data: Record<string, string>) => Promise<void>;
  registerAlumni: (
    data: Record<string, string>,
  ) => Promise<{ pendingApproval: boolean }>;
  updateStoredUser: (u: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    localStorage.removeItem("ac_user");

    if (!stored) {
      setLoading(false);
      return;
    }

    let parsed: User | null = null;
    try {
      parsed = JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
      return;
    }

    api
      .get("/profile", {
        headers: { Authorization: `Bearer ${parsed?.token}` },
      })
      .then(() => {
        setUser(parsed);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const persist = (u: User) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const updateStoredUser = (u: User) => {
    const token = user?.token ?? u.token;
    persist({ ...u, token: token || u.token });
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post<{
        user: User;
        token: string;
        message?: string;
        mustChangePassword?: boolean;
      }>("/login", { email, password });
      if (!data.user || !data.token)
        throw new Error(data.message || "Login failed");
      const mustChangePassword =
        data.mustChangePassword === true || !!data.user.mustChangePassword;
      persist({ ...data.user, token: data.token, mustChangePassword });
      return { mustChangePassword, user: data.user };
    } catch (e) {
      throw new Error(getErrorMessage(e, "Login failed"));
    }
  };

  const registerStudent = async (data: Record<string, string>) => {
    try {
      const { data: body } = await api.post<{
        user: User;
        token: string;
        message?: string;
      }>("/register", { ...data, role: "student" });
      if (!body.token || !body.user)
        throw new Error(body.message || "Registration failed");
      persist({ ...body.user, token: body.token, mustChangePassword: false });
    } catch (e) {
      throw new Error(getErrorMessage(e, "Registration failed"));
    }
  };

  const registerFirstAdmin = async (data: Record<string, string>) => {
    try {
      const { data: body } = await api.post<{
        user: User;
        token: string;
        message?: string;
      }>("/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "admin",
      });
      if (!body.token || !body.user)
        throw new Error(body.message || "Registration failed");
      persist({ ...body.user, token: body.token, mustChangePassword: false });
    } catch (e) {
      throw new Error(getErrorMessage(e, "Registration failed"));
    }
  };

  const registerAlumni = async (data: Record<string, string>) => {
    try {
      const { data: body } = await api.post<{
        user: User;
        token: string | null;
        pendingApproval?: boolean;
        message?: string;
      }>("/register", { ...data, role: "alumni" });
      if (body.pendingApproval) return { pendingApproval: true };
      if (body.token && body.user)
        persist({ ...body.user, token: body.token, mustChangePassword: false });
      return { pendingApproval: false };
    } catch (e) {
      throw new Error(getErrorMessage(e, "Registration failed"));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerStudent,
        registerFirstAdmin,
        registerAlumni,
        updateStoredUser,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;