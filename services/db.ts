
import { Employee, LeaveRequest, AdminLevel, RequestStatus } from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'bce_employees',
  REQUESTS: 'bce_requests',
  CURRENT_USER: 'bce_current_user'
};

export const db = {
  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : [];
  },

  saveEmployees: (employees: Employee[]) => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  getRequests: (): LeaveRequest[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return data ? JSON.parse(data) : [];
  },

  saveRequests: (requests: LeaveRequest[]) => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  },

  getCurrentUser: (): Employee | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (employee: Employee | null) => {
    if (employee) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(employee));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  generateUsername: (lastName: string): string => {
    const base = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const employees = db.getEmployees();
    const count = employees.filter(e => e.username.startsWith(base)).length;
    return `${base}${count + 1}`;
  },

  canApprove: (employee: Employee): boolean => {
    return employee.adminLevel !== AdminLevel.Staff;
  }
};
