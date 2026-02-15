import React, { useMemo, useState, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, LabelList
} from 'recharts';
import { Ticket } from '../types';
import { Clock, CheckCircle, Users, Activity, Trophy, AlertTriangle, Calendar, CalendarDays, ChevronDown, Crown, Layers, Medal, Target } from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
}

const Dashboard: React.FC<DashboardProps> = ({ tickets }) => {
  // State for filters
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [classificationView, setClassificationView] = useState<'OPEN' | 'CLOSED'>('OPEN');
  
  // Refs for custom picker triggers
  const dateInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const closedTickets = tickets.filter(t => t.status === 'CLOSE');
    const closedCount = closedTickets.length;
    const uniqueTeams = new Set(tickets.map(t => t.team)).size;

    // --- CLASSIFICATION BREAKDOWN (OPEN vs CLOSED) ---
    const getGroupCounts = (ticketList: Ticket[]) => {
      const groups = ticketList.reduce((acc, t) => {
          const group = t.ownerGroup || 'Unassigned';
          acc[group] = (acc[group] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(groups)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4); // Top 4
    };

    const openTicketsList = tickets.filter(t => t.status !== 'CLOSE');
    const openClassification = getGroupCounts(openTicketsList);
    const closedClassification = getGroupCounts(closedTickets);

    // --- DAILY STATS ---
    const targetDate = new Date(selectedDate);
    const isSameDay = (d: any) => {
      if (!d || !(d instanceof Date) || isNaN(d.getTime())) return false;
      return d.getDate() === targetDate.getDate() && 
      d.getMonth() === targetDate.getMonth() && 
      d.getFullYear() === targetDate.getFullYear();
    };

    const totalOpenBacklog = openTicketsList.length;
    
    // Calculate Date Range for Open Tickets
    let openDateDisplay = "Tidak ada data";
    if (totalOpenBacklog > 0) {
      const dates = openTicketsList
        .map(t => t.reportedDate)
        .filter(d => d && !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      if (dates.length > 0) {
        const uniqueDateStrings = Array.from(new Set(dates.map(d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }))));
        if (uniqueDateStrings.length === 1) {
          openDateDisplay = uniqueDateStrings[0];
        } else {
          const min = dates[0];
          const max = dates[dates.length - 1];
          openDateDisplay = `${min.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${max.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
        }
      }
    } else {
      openDateDisplay = "Clear";
    }

    const closeDaily = tickets.filter(t => t.status === 'CLOSE' && isSameDay(t.closeDate)).length;
    
    // --- MONTHLY STATS ---
    const [yearStr, monthStr] = selectedMonth.split('-');
    const targetYear = parseInt(yearStr);
    const targetMonthIndex = parseInt(monthStr) - 1;

    const isSameMonth = (d: any) => {
      if (!d || !(d instanceof Date) || isNaN(d.getTime())) return false;
      return d.getMonth() === targetMonthIndex && 
      d.getFullYear() === targetYear;
    };

    const incomingMonthly = tickets.filter(t => isSameMonth(t.reportedDate)).length; 
    const closeMonthly = tickets.filter(t => t.status === 'CLOSE' && isSameMonth(t.closeDate)).length;

    return { 
      totalTickets, 
      closedCount, 
      uniqueTeams,
      openClassification,
      closedClassification,
      totalOpenBacklog,
      openDateDisplay,
      closeDaily,
      incomingMonthly,
      closeMonthly
    };
  }, [tickets, selectedDate, selectedMonth]);

  const teamPerformance = useMemo(() => {
    const map = new Map<string, { 
      count: number; 
      closed: number; 
      open: number; 
      totalTTR: number; 
      notComply: number;
      regular: number;
      platinum: number; 
    }>();
    
    tickets.forEach(t => {
      const current = map.get(t.team) || { count: 0, closed: 0, open: 0, totalTTR: 0, notComply: 0, regular: 0, platinum: 0 };
      const isClosed = t.status === 'CLOSE';
      const isNotComply = t.ttrMinutes > 2160; // > 36 hours
      
      const group = (t.ownerGroup || '').toUpperCase();
      const isRegular = group.includes('REGULER');
      
      map.set(t.team, {
        count: current.count + 1,
        closed: current.closed + (isClosed ? 1 : 0),
        open: current.open + (isClosed ? 0 : 1),
        totalTTR: current.totalTTR + t.ttrMinutes,
        notComply: current.notComply + (isNotComply ? 1 : 0),
        regular: current.regular + (isRegular ? 1 : 0),
        platinum: current.platinum + (!isRegular ? 1 : 0)
      });
    });

    return Array.from(map.entries()).map(([name, val]) => {
      // Progress: How many tickets closed vs assigned (Volume metric)
      const progressScore = val.count > 0 ? Math.round((val.closed / val.count) * 100) : 0;
      
      return {
        name: name,
        displayName: name.replace(' & ', '\n& '),
        tickets: val.count,
        closed: val.closed,
        open: val.open,
        notComply: val.notComply,
        regular: val.regular,
        platinum: val.platinum,
        progressScore
      };
    }).sort((a, b) => b.closed - a.closed);
  }, [tickets]);

  // Calculate Grand Totals for Footer
  const totalStats = useMemo(() => {
    return teamPerformance.reduce((acc, curr) => ({
        tickets: acc.tickets + curr.tickets,
        open: acc.open + curr.open,
        closed: acc.closed + curr.closed,
        notComply: acc.notComply + curr.notComply,
        regular: acc.regular + curr.regular,
        platinum: acc.platinum + curr.platinum
    }), { tickets: 0, open: 0, closed: 0, notComply: 0, regular: 0, platinum: 0 });
  }, [teamPerformance]);

  const maxClosedCount = Math.max(...teamPerformance.map(t => t.closed));

  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    tickets.forEach(t => {
      if (!t.reportedDate || !(t.reportedDate instanceof Date) || isNaN(t.reportedDate.getTime())) return;
      const dateKey = t.reportedDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
      map.set(dateKey, (map.get(dateKey) || 0) + 1);
    });
    
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); 
  }, [tickets]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Progress */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4 z-10 relative">
             <div className="flex flex-col">
               <div 
                 className="text-sm font-bold text-slate-500 uppercase cursor-pointer flex items-center gap-1 hover:text-indigo-600 transition-colors"
                 onClick={() => dateInputRef.current?.showPicker()}
               >
                 Harian (Daily) <ChevronDown size={14}/>
               </div>
               <div className="text-xs text-slate-400 font-medium mt-1">
                 {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
               </div>
               <input 
                 ref={dateInputRef}
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-0"
               />
             </div>
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg pointer-events-none">
               <Calendar size={20} />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10 pointer-events-none">
             <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">Total Sisa</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.totalOpenBacklog}</p>
                </div>
                <p className="text-[10px] text-amber-700 leading-tight mt-1 font-semibold flex items-center gap-1">
                   {stats.openDateDisplay}
                </p>
             </div>
             <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Closed</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.closeDaily}</p>
                <p className="text-[10px] text-emerald-400 leading-tight mt-1">Hari Ini</p>
             </div>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div className="flex flex-col">
               <div 
                  className="text-sm font-bold text-slate-500 uppercase cursor-pointer flex items-center gap-1 hover:text-indigo-600 transition-colors"
                  onClick={() => monthInputRef.current?.showPicker()}
               >
                 Bulanan (Month) <ChevronDown size={14}/>
               </div>
               <div className="text-xs text-slate-400 font-medium mt-1">
                 {new Date(selectedMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
               </div>
               <input 
                 ref={monthInputRef}
                 type="month" 
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(e.target.value)}
                 className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-0"
               />
             </div>
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg pointer-events-none">
               <CalendarDays size={20} />
             </div>
          </div>
           <div className="grid grid-cols-2 gap-4 relative z-10 pointer-events-none">
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tiket Masuk</p>
                <p className="text-2xl font-bold text-slate-800">{stats.incomingMonthly}</p>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">Bulan Ini</p>
             </div>
             <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Closed</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.closeMonthly}</p>
                <p className="text-[10px] text-emerald-400 leading-tight mt-1">Bulan Ini</p>
             </div>
          </div>
        </div>

        {/* Completion Rate (Reverted from Service Quality) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Completion</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats.totalTickets > 0 
                  ? Math.round((stats.closedCount / stats.totalTickets) * 100) 
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${stats.totalTickets > 0 ? (stats.closedCount / stats.totalTickets) * 100 : 0}%` }}></div>
          </div>
        </div>

        {/* Classification Split View */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
               <button 
                 onClick={() => setClassificationView('OPEN')}
                 className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                   classificationView === 'OPEN' 
                   ? 'bg-white text-amber-600 shadow-sm' 
                   : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 Open
               </button>
               <button 
                 onClick={() => setClassificationView('CLOSED')}
                 className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                   classificationView === 'CLOSED' 
                   ? 'bg-white text-emerald-600 shadow-sm' 
                   : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 Closed
               </button>
            </div>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <Layers size={20} />
            </div>
          </div>
          
          <div className="space-y-2 flex-1">
             <p className="text-xs font-semibold text-slate-400 mb-2">
               {classificationView === 'OPEN' ? 'Ticket Composition (Sisa)' : 'Ticket Composition (Selesai)'}
             </p>
             
             {(classificationView === 'OPEN' ? stats.openClassification : stats.closedClassification).length > 0 ? (
               (classificationView === 'OPEN' ? stats.openClassification : stats.closedClassification).map(([group, count]) => (
                 <div key={group} className="flex justify-between items-center text-sm">
                    <span className={`truncate max-w-[120px] font-medium ${group.includes('PLATINUM') || group.includes('HVC') ? 'text-purple-600' : 'text-slate-600'}`}>
                      {group}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      classificationView === 'OPEN' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {count}
                    </span>
                 </div>
               ))
             ) : (
                <div className="flex flex-col items-center justify-center h-20 text-slate-300">
                   <p className="text-xs italic">No Data</p>
                </div>
             )}
          </div>
          
          <div className="pt-3 mt-auto border-t border-slate-100 flex justify-between items-center">
             <span className="text-xs text-slate-500">Active Teams</span>
             <span className="font-bold text-slate-800">{stats.uniqueTeams}</span>
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Team Performance Report</h3>
            <p className="text-xs text-slate-500 mt-1">Detailed breakdown sorted by closed tickets</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-white text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-12 text-center">No</th>
                <th className="px-6 py-4">Technician Team</th>
                <th className="px-6 py-4 text-left">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Composition</span>
                  <span className="block text-slate-600 text-[10px]">(Owner Group)</span>
                </th>
                <th className="px-6 py-4 text-center">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Open</span>
                  <span className="block text-slate-600">(Sisa)</span>
                </th>
                <th className="px-6 py-4 text-center">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Closed</span>
                  <span className="block text-slate-600">(Selesai)</span>
                </th>
                <th className="px-6 py-4 text-center">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Score %</span>
                  <span className="block text-slate-600 text-[10px]">(Progress)</span>
                </th>
                <th className="px-6 py-4 text-center">
                  <span className="block text-xs font-bold text-slate-400 uppercase">Not Comply</span>
                  <span className="block text-slate-600 text-[10px]">(> 36 Hours)</span>
                </th>
                <th className="px-6 py-4 text-right">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {teamPerformance.map((team, index) => {
                const isTop = team.closed === maxClosedCount && maxClosedCount > 0;
                
                return (
                  <tr key={team.name} className={`hover:bg-slate-50 transition-colors ${isTop ? 'bg-indigo-50/20' : ''}`}>
                    <td className="px-6 py-4 text-center font-medium text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{team.name}</div>
                      <div className="text-xs text-slate-500">Total: {team.tickets} Tickets</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                         {team.regular > 0 && (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                             {team.regular} Reguler
                           </span>
                         )}
                         {team.platinum > 0 && (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                             {team.platinum} HVC/Other
                           </span>
                         )}
                         {team.regular === 0 && team.platinum === 0 && (
                           <span className="text-slate-300 text-xs">-</span>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-bold ${team.open > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                        {team.open}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="inline-block px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700">
                        {team.closed}
                      </span>
                    </td>
                    {/* Progress Score (Previous Score %) */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-xs font-bold text-slate-700">{team.progressScore}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-1.5 rounded-full ${team.progressScore >= 80 ? 'bg-emerald-500' : team.progressScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${team.progressScore}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {team.notComply > 0 ? (
                        <div className="flex items-center justify-center gap-1 text-red-600 font-bold">
                           <AlertTriangle size={14} />
                           {team.notComply}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isTop && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                          <Trophy size={14} />
                          Champion
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* FOOTER TOTALS */}
            <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
              <tr>
                <td className="px-6 py-4 text-center"></td>
                <td className="px-6 py-4 text-right text-sm uppercase tracking-wide">Grand Total</td>
                 <td className="px-6 py-4 text-left text-xs text-slate-500 font-normal">
                   <div className="flex gap-2">
                     <span className="font-bold text-slate-600">{totalStats.regular} Reg</span>
                     <span className="font-bold text-purple-600">{totalStats.platinum} Oth</span>
                   </div>
                 </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full">{totalStats.open}</span>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className="bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full">{totalStats.closed}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  {/* Avg Progress */}
                  <span className="text-indigo-600">{totalStats.tickets > 0 ? Math.round((totalStats.closed/totalStats.tickets)*100) : 0}%</span>
                </td>
                <td className="px-6 py-4 text-center">
                   {totalStats.notComply > 0 && <span className="text-red-600">{totalStats.notComply}</span>}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Volume Side-by-Side Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Workload Distribution</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
               <div className="flex items-center gap-1">
                 <div className="w-3 h-3 rounded-sm bg-emerald-500"></div> Closed
               </div>
               <div className="flex items-center gap-1">
                 <div className="w-3 h-3 rounded-sm bg-amber-400"></div> Open
               </div>
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 60 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="displayName" 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end" 
                  height={80} 
                  tick={{fontSize: 11, fill: '#64748b'}} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fill: '#64748b'}}
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                {/* Side by Side Bars with Labels */}
                <Bar 
                  dataKey="closed" 
                  fill="#10B981" 
                  name="Closed" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                >
                  <LabelList dataKey="closed" position="top" fill="#10B981" fontSize={10} fontWeight="bold" />
                </Bar>
                <Bar 
                  dataKey="open" 
                  fill="#fbbf24" 
                  name="Open" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                >
                  <LabelList dataKey="open" position="top" fill="#d97706" fontSize={10} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Trend Line */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Daily Incoming Tickets</h3>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10, fill: '#64748b'}} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#64748b'}}
                />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;