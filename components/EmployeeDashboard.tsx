
import React, { useState, useEffect } from 'react';
import { format, addDays, isAfter, parseISO, addMonths } from 'date-fns';
import { Employee, LeaveRequest, LeaveType, ShiftType, RequestStatus } from '../types';
import { db } from '../services/db';
import { calculateAccruals, isLockedForBumping, getSeniorityRank } from '../utils/calculations';

interface EmployeeDashboardProps {
  employee: Employee;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ employee }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>(db.getRequests());
  const [balances, setBalances] = useState(calculateAccruals(employee, requests));
  
  // Form State
  const [date, setDate] = useState(format(addDays(new Date(), 31), 'yyyy-MM-dd'));
  const [shift, setShift] = useState<ShiftType>(ShiftType.Day);
  const [type, setType] = useState<LeaveType>(LeaveType.Vacation);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const allRequests = db.getRequests();
    setRequests(allRequests);
    setBalances(calculateAccruals(employee, allRequests));
  }, [employee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reqDate = parseISO(date);
    const now = new Date();
    
    // 1. Check if > 30 days out for automatic check
    const diffDays = Math.ceil((reqDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // 2. Check 6-month window restriction
    if (isAfter(reqDate, addMonths(now, 6))) {
      setMessage({ text: 'You can only request leave up to 6 months in advance.', type: 'error' });
      return;
    }

    // 3. Check Accrual (Future looking, but based on current earned)
    // Note: In a real system we'd project future accruals, but per requirements we check if they HAVE the days.
    if (type === LeaveType.Vacation && (balances.vacation + balances.holiday) <= 0) {
      setMessage({ text: 'Insufficient vacation/holiday balance to cover this request.', type: 'error' });
      return;
    }
    if (type === LeaveType.Sick && balances.sick <= 0) {
      setMessage({ text: 'Insufficient sick balance.', type: 'error' });
      return;
    }

    const allRequests = db.getRequests();
    const shiftMatches = allRequests.filter(r => r.date === date && r.shift === shift && r.status === RequestStatus.Approved);
    
    let status = RequestStatus.Pending;
    let autoApproved = false;
    let bumpedId: string | null = null;

    if (diffDays >= 30) {
      if (shiftMatches.length < 2) {
        status = RequestStatus.Approved;
        autoApproved = true;
      } else {
        // Seniority Bump logic
        // Only if NOT in the lock period
        if (!isLockedForBumping(date)) {
          const employees = db.getEmployees();
          const shiftEmployees = shiftMatches.map(r => ({
            request: r,
            employee: employees.find(e => e.id === r.employeeId)!,
            rank: getSeniorityRank(employees.find(e => e.id === r.employeeId)!)
          }));

          const juniorMost = shiftEmployees.reduce((prev, curr) => prev.rank > curr.rank ? prev : curr);
          const myRank = getSeniorityRank(employee);

          if (myRank < juniorMost.rank) {
             status = RequestStatus.Approved;
             autoApproved = true;
             bumpedId = juniorMost.request.id;
          }
        }
      }
    }

    const newRequest: LeaveRequest = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      date,
      shift,
      type,
      status,
      submittedAt: new Date().toISOString()
    };

    let updatedRequests = [...allRequests, newRequest];
    if (bumpedId) {
       updatedRequests = updatedRequests.map(r => 
         r.id === bumpedId ? { ...r, status: RequestStatus.Bumped } : r
       );
    }

    db.saveRequests(updatedRequests);
    setRequests(updatedRequests);
    setBalances(calculateAccruals(employee, updatedRequests));
    setMessage({ 
      text: autoApproved 
        ? (bumpedId ? 'Request approved! You bumped a more junior employee.' : 'Request automatically approved based on shift availability.') 
        : 'Request submitted for supervisor approval (within 30-day window).', 
      type: 'success' 
    });
  };

  const myRequests = requests.filter(r => r.employeeId === employee.id).sort((a,b) => b.date.localeCompare(a.date));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="bg-red-100 text-red-700 p-2 rounded-lg mr-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </span>
            Leave Balances
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500 font-medium">Vacation Days</p>
              <p className="text-3xl font-bold text-slate-800">{balances.vacation.toFixed(1)}</p>
              <p className="text-xs text-slate-400 mt-1">Reset to 30 every June 30th</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500 font-medium">Holiday Pool</p>
              <p className="text-3xl font-bold text-red-600">{balances.holiday}</p>
              <p className="text-xs text-slate-400 mt-1">Used before vacation pool</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500 font-medium">Sick Days</p>
              <p className="text-3xl font-bold text-slate-800">{balances.sick.toFixed(1)}</p>
              <p className="text-xs text-slate-400 mt-1">1 day earned per month</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Request History</h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 text-sm uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Shift</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{req.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{req.shift}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{req.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                        ${req.status === RequestStatus.Approved ? 'bg-green-100 text-green-700' : 
                          req.status === RequestStatus.Denied || req.status === RequestStatus.Bumped ? 'bg-red-100 text-red-700' : 
                          'bg-amber-100 text-amber-700'}`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {myRequests.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No requests yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 sticky top-24">
          <h2 className="text-lg font-bold mb-6 flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Submit New Request
          </h2>
          
          {message && (
            <div className={`mb-4 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Requested Date</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Shift Block</label>
              <select 
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
              >
                <option value={ShiftType.Day}>Day Shift (0800-2000)</option>
                <option value={ShiftType.Night}>Night Shift (2000-0800)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Leave Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none"
              >
                <option value={LeaveType.Vacation}>Vacation (Uses Holidays first)</option>
                <option value={LeaveType.Sick}>Sick Leave</option>
              </select>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
              >
                Submit Request
              </button>
              <p className="text-[10px] text-slate-400 mt-2 text-center italic">
                * Vacation requests automatically deduct from Holiday pool first.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
