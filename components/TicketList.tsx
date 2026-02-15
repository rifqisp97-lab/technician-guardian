import React, { useState } from 'react';
import { Ticket } from '../types';
import { Search, Filter, AlertCircle, Trash2, Crown, Hash } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onDelete: (ticketId: string) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterOwner, setFilterOwner] = useState('All');

  const uniqueTeams = Array.from(new Set(tickets.map(t => t.team))).sort();
  const uniqueOwners = Array.from(new Set(tickets.map(t => t.ownerGroup || 'Unassigned'))).sort();

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.odp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.inetNo.includes(searchTerm);
    
    const matchesTeam = filterTeam === 'All' || ticket.team === filterTeam;
    const matchesOwner = filterOwner === 'All' || (ticket.ownerGroup || 'Unassigned') === filterOwner;

    return matchesSearch && matchesTeam && matchesOwner;
  });

  const formatDateSafe = (date: Date | null | undefined, includeTime: boolean = false) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '-';
    if (includeTime) {
      return date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
    }
    return date.toLocaleDateString('id-ID');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
      {/* Header & Filters */}
      <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-50">
        <div className="relative w-full xl:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search Ticket, ODP, or Inet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-slate-500" />
             <select
              className="block w-full sm:w-40 pl-3 pr-8 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
            >
              <option value="All">All Owners</option>
              {uniqueOwners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              className="block w-full sm:w-48 pl-3 pr-8 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
            >
              <option value="All">All Teams</option>
              {uniqueTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-auto flex-1">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ticket No</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Owner Group</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reported</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ODP</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration (TTR)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => {
                const isPlatinum = ticket.ownerGroup?.toUpperCase().includes('PLATINUM') || ticket.ownerGroup?.toUpperCase().includes('HVC');
                return (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">{ticket.ticketNo}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Hash size={10} /> {ticket.inetNo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-medium">{ticket.team}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex items-center text-xs font-semibold rounded-full border ${
                        isPlatinum 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isPlatinum && <Crown size={10} className="mr-1 fill-current" />}
                        {ticket.ownerGroup || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{formatDateSafe(ticket.reportedDate)}</div>
                      <div className="text-xs text-slate-500">{formatDateSafe(ticket.reportedDate, true)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 truncate max-w-[200px]" title={ticket.odp}>{ticket.odp}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{ticket.ttrRaw}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.status === 'CLOSE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => onDelete(ticket.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-slate-500 flex flex-col items-center justify-center">
                   <AlertCircle className="w-8 h-8 mb-2 text-slate-400" />
                   <p>No tickets found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-right">
        Showing {filteredTickets.length} of {tickets.length} tickets
      </div>
    </div>
  );
};

export default TicketList;
