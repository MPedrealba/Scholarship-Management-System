import type { AuthUser, CollegeCode } from '../types';
import { COLLEGE_NAMES } from './mockData';

export interface EvaluatorPreset {
  college: CollegeCode;
  name: string;
  email: string;
  title: string;
  collegeName: string;
}

export const PRECONFIGURED_EVALUATORS: Record<CollegeCode, EvaluatorPreset> = {
  CIT: {
    college: 'CIT',
    name: 'Prof. Noel Carpio',
    email: 'noel.carpio@earist.edu.ph',
    title: 'College Evaluator (SFAO-CIT)',
    collegeName: COLLEGE_NAMES.CIT,
  },
  CAFA: {
    college: 'CAFA',
    name: 'Ar. Ericoff Dela Rosa',
    email: 'ericoff.delarosa@earist.edu.ph',
    title: 'College Evaluator (SFAO-CAFA)',
    collegeName: COLLEGE_NAMES.CAFA,
  },
  CAS: {
    college: 'CAS',
    name: 'Prof. Marlon Santos',
    email: 'marlon.santos@earist.edu.ph',
    title: 'College Evaluator (SFAO-CAS)',
    collegeName: COLLEGE_NAMES.CAS,
  },
  CBA: {
    college: 'CBA',
    name: 'Prof. Corazon Reyes',
    email: 'corazon.reyes@earist.edu.ph',
    title: 'College Evaluator (SFAO-CBA)',
    collegeName: COLLEGE_NAMES.CBA,
  },
  CED: {
    college: 'CED',
    name: 'Prof. Teresa Garcia',
    email: 'teresa.garcia@earist.edu.ph',
    title: 'College Evaluator (SFAO-CED)',
    collegeName: COLLEGE_NAMES.CED,
  },
  CEN: {
    college: 'CEN',
    name: 'Engr. Ricardo Bautista',
    email: 'ricardo.bautista@earist.edu.ph',
    title: 'College Evaluator (SFAO-CEN)',
    collegeName: COLLEGE_NAMES.CEN,
  },
  CHM: {
    college: 'CHM',
    name: 'Prof. Elena Morales',
    email: 'elena.morales@earist.edu.ph',
    title: 'College Evaluator (SFAO-CHM)',
    collegeName: COLLEGE_NAMES.CHM,
  },
};

export const SUPER_ADMIN_USER: AuthUser = {
  role: 'superadmin',
  name: 'Dr. Mario M. Santos',
  email: 'sfao.director@earist.edu.ph',
  title: 'Super Admin (SFAO Director)',
};

export const DEFAULT_STUDENT_USER: AuthUser = {
  role: 'student',
  name: 'Student Applicant',
  email: 'applicant.portal@earist.edu.ph',
  title: 'Student Applicant',
};
