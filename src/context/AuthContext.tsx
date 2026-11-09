import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, CollegeCode, UserRoleType } from '../types';
import {
  PRECONFIGURED_EVALUATORS,
  SUPER_ADMIN_USER,
  DEFAULT_STUDENT_USER,
} from '../data/authPresets';

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
  ) => { success: boolean; user?: AuthUser; error?: string };
  logoutToStudent: () => void;
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
    if (role === 'student') {
      setCurrentUser(DEFAULT_STUDENT_USER);
    } else if (role === 'superadmin') {
      setCurrentUser(SUPER_ADMIN_USER);
    } else if (role === 'evaluator') {
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
    setIsLoginModalOpen(false);
  };

  const loginWithCredentials = (
    usernameOrEmail: string,
    password: string
  ): { success: boolean; user?: AuthUser; error?: string } => {
    const input = usernameOrEmail.trim().toLowerCase();

    if (!input || !password) {
      return { success: false, error: 'Please enter your username/email and password.' };
    }

    if (password.length < 3) {
      return {
        success: false,
        error: 'Invalid institutional credentials. Please check your username and password.',
      };
    }

    // 1. Super Admin check
    if (input.includes('admin') || input === 'director' || input === 'sfao.director@earist.edu.ph') {
      setCurrentUser(SUPER_ADMIN_USER);
      setIsLoginModalOpen(false);
      return { success: true, user: SUPER_ADMIN_USER };
    }

    // 2. College Evaluator check
    let targetCollege: CollegeCode = 'CIT';
    if (input.includes('cafa') || input.includes('ericoff') || input.includes('delarosa')) {
      targetCollege = 'CAFA';
    } else if (input.includes('cas') || input.includes('marlon') || input.includes('santos')) {
      targetCollege = 'CAS';
    } else if (input.includes('cba') || input.includes('corazon') || input.includes('reyes')) {
      targetCollege = 'CBA';
    } else if (input.includes('ced') || input.includes('teresa') || input.includes('garcia')) {
      targetCollege = 'CED';
    } else if (input.includes('cen') || input.includes('ricardo') || input.includes('bautista')) {
      targetCollege = 'CEN';
    } else if (input.includes('chm') || input.includes('morales')) {
      targetCollege = 'CHM';
    } else if (input.includes('cit') || input.includes('noel') || input.includes('carpio')) {
      targetCollege = 'CIT';
    } else if (input.includes('evaluator') || input.endsWith('@earist.edu.ph')) {
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
    setCurrentUser(DEFAULT_STUDENT_USER);
    setIsLoginModalOpen(false);
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
