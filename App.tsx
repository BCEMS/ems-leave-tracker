
import React, { useState, useEffect } from 'react';
import { Employee, LeaveRequest, AdminLevel, ShiftType, RequestStatus } from './types';
import { db } from './services/db';
import Login from './components/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';
import PasswordChange from './components/PasswordChange';

const App: React.FC = () => {
  const [user, setUser] = useState<Employee | null>(db.getCurrentUser());
  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');

  useEffect(() => {
    // If admin level, default to admin view? No, let them choose
    if (user && db.canApprove(user)) {
      // setView('admin'); 
    }
  }, [user]);

  const handleLogout = () => {
    db.setCurrentUser(null);
    setUser(null);
    setView('dashboard');
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.forcePasswordChange) {
    return <PasswordChange user={user} onComplete={(updatedUser) => {
      setUser(updatedUser);
      db.setCurrentUser(updatedUser);
    }} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-red-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1 rounded-full">
              <svg className="w-8 h-8 text-red-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1h3a1 1 0 110 2h-3v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V6H5a1 1 0 010-2h3V3a1 1 0 011-1z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Bradley County EMS</h1>
              <p className="text-xs text-red-100 opacity-80 uppercase tracking-widest">Leave Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm hidden sm:inline-block">Welcome, <span className="font-semibold">{user.firstName}</span></span>
            {db.canApprove(user) && (
              <button 
                onClick={() => setView(view === 'dashboard' ? 'admin' : 'dashboard')}
                className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-md text-sm transition-colors border border-white/20"
              >
                {view === 'dashboard' ? 'Switch to Admin' : 'Switch to Dashboard'}
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="bg-red-800 hover:bg-red-900 px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4">
        {view === 'admin' ? (
          <AdminDashboard currentUser={user} />
        ) : (
          <EmployeeDashboard employee={user} />
        )}
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} Bradley County EMS. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;
