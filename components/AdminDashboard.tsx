
import React, { useState, useEffect } from 'react';
import { Employee, LeaveRequest, CertLevel, AdminLevel, RequestStatus } from '../types';
import { db } from '../services/db';
import CalendarView from './CalendarView';
import { format, parseISO } from 'date-fns';

interface AdminDashboardProps {
  currentUser: Employee;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'employees' | 'calendar'>('approvals');
  const [employees, setEmployees] = useState<Employee[]>(db.getEmployees());
  const [requests, setRequests] = useState<LeaveRequest[]>(db.getRequests());

  // New Employee State
  const [newEmp, setNewEmp] = useState({
    firstName: '',
    lastName: '',
    email: '',
    hireDate: format(new Date(), 'yyyy-MM-dd'),
    certLevel: CertLevel.EMT,
    adminLevel: AdminLevel.Staff
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const username = db.generateUsername(newEmp.lastName);
    const employee: Employee = {
      ...newEmp,
      id: Math.random().toString(36).substr(2, 9),
      username,
      passwordHash: 'password1',
      forcePasswordChange: true
    };
    const updated = [...employees, employee];
    db.saveEmployees(updated);
    setEmployees(updated);
    setNewEmp({
      firstName: '',
      lastName: '',
      email: '',
      hireDate: format(new Date(), 'yyyy-MM-dd'),
      certLevel: CertLevel.EMT,
      adminLevel: AdminLevel.Staff
    });
  };

  const handleProcessRequest = (id: string, status: RequestStatus) => {
    const updated = requests.map(r => r.id === id ? { ...r, status, processedBy: currentUser.id } : r);
    db.saveRequests(updated);
    setRequests(updated);
    // Logic for "Emailing" would go here
    const req = requests.find(r => r.id === id);
    const emp = employees.find(e => e.id === req?.employeeId);
    alert(`Email sent to ${emp?.email}: Your request for ${req?.date} has been ${status}.`);
  };

  const pendingRequests = requests.filter(r => r.status === RequestStatus.Pending).sort((a,b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('approvals')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'approvals' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Pending Approvals ({pendingRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'calendar' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Weekly Calendar
        </button>
        <button 
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'employees' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Manage Employees
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'approvals' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Employee</th>
                  <th className="px-6 py-4 font-bold">Leave Date</th>
                  <th className="px-6 py-4 font-bold">Date Submitted</th>
                  <th className="px-6 py-4 font-bold">Shift & Type</th>
                  <th className="px-6 py-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.map(req => {
                  const emp = employees.find(e => e.id === req.employeeId);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{emp?.firstName} {emp?.lastName}</div>
                        <div className="text-xs text-slate-400">{emp?.certLevel}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-red-700">{req.date}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{format(parseISO(req.submittedAt), 'MM/dd/yyyy')}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-slate-700">{req.shift}</div>
                        <div className="text-xs font-medium text-slate-400 uppercase">{req.type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleProcessRequest(req.id, RequestStatus.Approved)}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button 
                            onClick={() => handleProcessRequest(req.id, RequestStatus.Denied)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                            title="Deny"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pendingRequests.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">No pending requests requiring manual approval.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView requests={requests} employees={employees} />
        )}

        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Add New Employee
                </h3>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                      <input type="text" required value={newEmp.firstName} onChange={e => setNewEmp({...newEmp, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
                      <input type="text" required value={newEmp.lastName} onChange={e => setNewEmp({...newEmp, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input type="email" required value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hire Date</label>
                    <input type="date" required value={newEmp.hireDate} onChange={e => setNewEmp({...newEmp, hireDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cert Level</label>
                      <select value={newEmp.certLevel} onChange={e => setNewEmp({...newEmp, certLevel: e.target.value as CertLevel})} className="w-full px-3 py-2 border rounded-lg text-sm">
                        {Object.values(CertLevel).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admin Level</label>
                      <select value={newEmp.adminLevel} onChange={e => setNewEmp({...newEmp, adminLevel: e.target.value as AdminLevel})} className="w-full px-3 py-2 border rounded-lg text-sm">
                        {Object.values(AdminLevel).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg mt-4 shadow-lg transition-all">
                    Create Employee Profile
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-4 font-bold">Name & Username</th>
                      <th className="px-6 py-4 font-bold">Cert / Admin</th>
                      <th className="px-6 py-4 font-bold">Hire Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-slate-400">@{emp.username}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-700">{emp.certLevel}</div>
                          <div className="text-xs font-bold text-red-600 uppercase">{emp.adminLevel}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {emp.hireDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
