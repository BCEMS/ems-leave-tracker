
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Employee, CertLevel, AdminLevel } from '../types';
import { INITIAL_ADMIN_CREDENTIALS } from '../constants';

interface LoginProps {
  onLogin: (user: Employee) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Setup initial admin if not exists
  useEffect(() => {
    const employees = db.getEmployees();
    if (!employees.find(e => e.username === INITIAL_ADMIN_CREDENTIALS.username)) {
      const admin: Employee = {
        id: '0',
        username: INITIAL_ADMIN_CREDENTIALS.username,
        passwordHash: INITIAL_ADMIN_CREDENTIALS.password,
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@bradleyems.gov',
        hireDate: '2020-01-01',
        certLevel: CertLevel.Paramedic,
        adminLevel: AdminLevel.Director,
        forcePasswordChange: false
      };
      db.saveEmployees([admin]);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employees = db.getEmployees();
    const found = employees.find(e => e.username.toLowerCase() === username.toLowerCase());

    if (found && found.passwordHash === password) {
      db.setCurrentUser(found);
      onLogin(found);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-red-700 p-8 text-center">
          <div className="inline-block bg-white p-3 rounded-full mb-4 shadow-lg">
            <svg className="w-12 h-12 text-red-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1h3a1 1 0 110 2h-3v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H5a1 1 0 110-2h3V6H5a1 1 0 010-2h3V3a1 1 0 011-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">EMS Login</h2>
          <p className="text-red-100 mt-1 opacity-80">Bradley County Emergency Services</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              placeholder="e.g. smith1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 italic">
            Default password for first-time users is "password1"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
