import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, CollegeCode, UserRoleType } from '../types';
import {
  PRECONFIGURED_EVALUATORS,
  SUPER_ADMIN_USER,
  DEFAULT_STUDENT_USER,
} from '../data/authPresets';
import { loginApi } from '../utils/api';

const AUTH_STORAGE_KEY = 'earist_sfao_auth_session_v1';

export interface AuthContextType {
  currentUser: AuthUser;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginAsRole: (role: UserRoleType, college?: CollegeCode) => void;
  loginWithCredentials: (
    usernameOrEmail: string,
    password: string
  ) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logoutToStudent: () => void;
  updateUserProfile: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored auth user', e);
    }
    return DEFAULT_STUDENT_USER;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    } catch (e) {
      console.error('Failed to persist auth session', e);
    }
  }, [currentUser]);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const loginAsRole = (role: UserRoleType, college: CollegeCode = 'CIT') => {
    let email = 'student@earist.edu.ph';
    if (role === 'student') {
      email = 'student@earist.edu.ph';
      setCurrentUser(DEFAULT_STUDENT_USER);
    } else if (role === 'superadmin') {
      email = 'admin@earist.edu.ph';
      setCurrentUser(SUPER_ADMIN_USER);
    } else if (role === 'evaluator') {
      email = 'evaluator@earist.edu.ph';
      const preset = PRECONFIGURED_EVALUATORS[college] || PRECONFIGURED_EVALUATORS.CIT;
      setCurrentUser({
        role: 'evaluator',
        name: preset.name,
        email: preset.email,
        college: preset.college,
        collegeName: preset.collegeName,
        title: preset.title,
      });
    }

    // Acquire valid JWT in background for demo switching
    loginApi(email, 'password123')
      .then((res) => {
        if (res.token) {
          localStorage.setItem('earist_sfao_jwt', res.token);
        }
      })
      .catch(() => {});

    setIsLoginModalOpen(false);
  };

  const loginWithCredentials = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    const input = usernameOrEmail.trim();

    if (!input || !password) {
      return { success: false, error: 'Please enter your username/email and password.' };
    }

    try {
      const data = await loginApi(input, password);
      if (data.success && data.user) {
        if (data.token) {
          localStorage.setItem('earist_sfao_jwt', data.token);
        }

        const backendRole = data.user.role;
        const mappedRole: UserRoleType = backendRole === 'admin' ? 'superadmin' : backendRole;
        const college = (data.user.college as CollegeCode) || 'CIT';
        const collegeName = college
          ? PRECONFIGURED_EVALUATORS[college]?.collegeName || `College of ${college}`
          : undefined;

        const authUser: AuthUser = {
          role: mappedRole,
          name: data.user.name,
          email: data.user.email,
          college: mappedRole === 'evaluator' ? college : (data.user.college as CollegeCode) || undefined,
          collegeName: mappedRole === 'superadmin' ? 'All Colleges (Institutional Administration)' : collegeName,
          title:
            mappedRole === 'superadmin'
              ? 'Head of Student Financial Assistance'
              : mappedRole === 'evaluator'
              ? `${college} Scholarship Evaluator`
              : 'Undergraduate Student Scholar',
          employeeId: data.user.employeeId || undefined,
          studentId: data.user.studentNumber || undefined,
        };

        setCurrentUser(authUser);
        setIsLoginModalOpen(false);
        return { success: true, user: authUser };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Authentication failed';
      if (
        errMsg.toLowerCase().includes('invalid') ||
        errMsg.toLowerCase().includes('suspended') ||
        errMsg.toLowerCase().includes('deactivated')
      ) {
        return { success: false, error: errMsg };
      }
      console.warn('Backend login unavailable, falling back to institutional presets:', errMsg);
    }

    // Offline / Demo fallback
    const inputLower = input.toLowerCase();
    if (inputLower.includes('admin') || inputLower === 'director' || inputLower === 'sfao.director@earist.edu.ph') {
      setCurrentUser(SUPER_ADMIN_USER);
      setIsLoginModalOpen(false);
      return { success: true, user: SUPER_ADMIN_USER };
    }

    let targetCollege: CollegeCode = 'CIT';
    if (inputLower.includes('cafa') || inputLower.includes('ericoff') || inputLower.includes('delarosa')) {
      targetCollege = 'CAFA';
    } else if (inputLower.includes('cas') || inputLower.includes('marlon') || inputLower.includes('santos')) {
      targetCollege = 'CAS';
    } else if (inputLower.includes('cba') || inputLower.includes('corazon') || inputLower.includes('reyes')) {
      targetCollege = 'CBA';
    } else if (inputLower.includes('ced') || inputLower.includes('teresa') || inputLower.includes('garcia')) {
      targetCollege = 'CED';
    } else if (inputLower.includes('cen') || inputLower.includes('ricardo') || inputLower.includes('bautista')) {
      targetCollege = 'CEN';
    } else if (inputLower.includes('chm') || inputLower.includes('morales')) {
      targetCollege = 'CHM';
    } else if (inputLower.includes('cit') || inputLower.includes('noel') || inputLower.includes('carpio')) {
      targetCollege = 'CIT';
    } else if (inputLower.includes('student') || inputLower.includes('juan')) {
      setCurrentUser(DEFAULT_STUDENT_USER);
      setIsLoginModalOpen(false);
      return { success: true, user: DEFAULT_STUDENT_USER };
    } else if (inputLower.includes('evaluator') || inputLower.endsWith('@earist.edu.ph')) {
      targetCollege = 'CIT';
    } else {
      return {
        success: false,
        error: 'Invalid institutional credentials. Please check your username and password.',
      };
    }

    const preset = PRECONFIGURED_EVALUATORS[targetCollege];
    const user: AuthUser = {
      role: 'evaluator',
      name: preset.name,
      email: preset.email,
      college: preset.college,
      collegeName: preset.collegeName,
      title: preset.title,
    };
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    return { success: true, user };
  };

  const logoutToStudent = () => {
    try {
      localStorage.removeItem('earist_sfao_jwt');
    } catch (e) {
      console.warn('Failed to remove JWT token from storage', e);
    }
    setCurrentUser(DEFAULT_STUDENT_USER);
    setIsLoginModalOpen(false);
  };

  const updateUserProfile = (updates: Partial<AuthUser>) => {
    setCurrentUser((prev) => {
      const updated: AuthUser = { ...prev, ...updates };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist updated profile', e);
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        loginAsRole,
        loginWithCredentials,
        logoutToStudent,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
