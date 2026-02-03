
import React, { useState } from 'react';
import { Employee } from '../types';
import { db } from '../services/db';

interface PasswordChangeProps {
  user: Employee;
  onComplete: (updatedUser: Employee) => void;
}

const PasswordChange: React.FC<PasswordChangeProps> = ({ user, onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const employees = db.getEmployees();
    const updatedUser = { ...user, passwordHash: newPassword, forcePasswordChange: false };
    const updatedEmployees = employees.map(e => e.id === user.id ? updatedUser : e);
    
    db.saveEmployees(updatedEmployees);
    onComplete(updatedUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-slate-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Change Password</h2>
          <p className="text-slate-500 mt-2">First-time login requires a password change.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-none"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
          >
            Update Password & Access Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;
