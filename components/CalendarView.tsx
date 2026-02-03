
import React, { useState } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { LeaveRequest, Employee, ShiftType, RequestStatus } from '../types';

interface CalendarViewProps {
  requests: LeaveRequest[];
  employees: Employee[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ requests, employees }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  });

  const getRequestsForDay = (date: Date, shift: ShiftType) => {
    return requests.filter(r => 
      isSameDay(parseISO(r.date), date) && 
      r.shift === shift && 
      r.status === RequestStatus.Approved
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
        <h3 className="font-bold text-slate-700 flex items-center">
          <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Weekly Shift Coverage
        </h3>
        <div className="flex space-x-2">
          <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-slate-600 min-w-[200px] text-center">
            {format(currentWeekStart, 'MMM d')} - {format(days[6], 'MMM d, yyyy')}
          </span>
          <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 divide-x divide-slate-100">
        <div className="col-span-1 py-12 px-4 bg-slate-50 flex flex-col justify-center items-center">
          <div className="h-[120px] flex items-center justify-center font-bold text-xs uppercase text-slate-400 rotate-[-90deg]">Day Shift</div>
          <div className="h-[120px] border-t border-slate-200 w-full flex items-center justify-center font-bold text-xs uppercase text-slate-400 rotate-[-90deg]">Night Shift</div>
        </div>
        
        {days.map(day => (
          <div key={day.toISOString()} className="col-span-1">
            <div className={`py-3 text-center border-b ${isSameDay(day, new Date()) ? 'bg-red-50' : ''}`}>
              <div className="text-xs font-bold text-slate-400 uppercase">{format(day, 'EEE')}</div>
              <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-red-600' : 'text-slate-700'}`}>{format(day, 'd')}</div>
            </div>
            
            <div className="h-[120px] p-2 overflow-y-auto space-y-1">
              {getRequestsForDay(day, ShiftType.Day).map(req => {
                const emp = employees.find(e => e.id === req.employeeId);
                return (
                  <div key={req.id} className="bg-amber-100 text-amber-800 p-1.5 rounded text-[10px] leading-tight font-semibold border border-amber-200 truncate">
                    {emp?.lastName}
                  </div>
                );
              })}
              {getRequestsForDay(day, ShiftType.Day).length === 0 && (
                <div className="text-[10px] text-slate-300 italic text-center pt-8">Full Staff</div>
              )}
            </div>

            <div className="h-[120px] p-2 border-t border-slate-100 overflow-y-auto space-y-1 bg-slate-50/30">
              {getRequestsForDay(day, ShiftType.Night).map(req => {
                const emp = employees.find(e => e.id === req.employeeId);
                return (
                  <div key={req.id} className="bg-indigo-100 text-indigo-800 p-1.5 rounded text-[10px] leading-tight font-semibold border border-indigo-200 truncate">
                    {emp?.lastName}
                  </div>
                );
              })}
              {getRequestsForDay(day, ShiftType.Night).length === 0 && (
                <div className="text-[10px] text-slate-300 italic text-center pt-8">Full Staff</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
