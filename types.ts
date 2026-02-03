
export enum CertLevel {
  EMT = 'EMT',
  AEMT = 'AEMT',
  Paramedic = 'Paramedic',
  CriticalCareParamedic = 'Critical Care Paramedic'
}

export enum AdminLevel {
  Staff = 'Staff',
  Sergeant = 'Sergeant',
  Lieutenant = 'Lieutenant',
  Commander = 'Commander',
  Captain = 'Captain',
  Director = 'Director'
}

export enum ShiftType {
  Day = '0800-2000',
  Night = '2000-0800'
}

export enum LeaveType {
  Vacation = 'Vacation',
  Sick = 'Sick',
  Holiday = 'Holiday'
}

export enum RequestStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Denied = 'Denied',
  Bumped = 'Bumped (Seniority)'
}

export interface Employee {
  id: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  email: string;
  hireDate: string; // ISO string
  certLevel: CertLevel;
  adminLevel: AdminLevel;
  forcePasswordChange: boolean;
  lastAccrualRun?: string; // Date when balances were last updated
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  type: LeaveType;
  status: RequestStatus;
  submittedAt: string;
  processedBy?: string;
  reason?: string;
}

export interface LeaveBalance {
  vacation: number; // in 12-hour units
  sick: number;
  holiday: number;
}
