import React, { useState, useEffect } from 'react';
import { parseCSV, generateCSV, getTickets } from './services/dataService';
import { Ticket, ViewState } from './types';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import { LayoutDashboard, List, Activity, User, Menu, X, Upload, Download, Trash2, FileSpreadsheet } from 'lucide-react';

const App: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Load tickets from local storage or use default
    const storedTickets = localStorage.getItem('tickets');
    if (storedTickets) {
      const parsedTickets = JSON.parse(storedTickets, (key, value) => {
        if (key === 'inputDate' || key === 'reportedDate' || key === 'closeDate') {
          return value ? new Date(value) : null;
        }
        return value;
      });
      setTickets(parsedTickets);
    } else {
      setTickets(getTickets()); // Load default tickets if nothing in storage
    }
  }, []);

  const saveTickets = (newTickets: Ticket[]) => {
    setTickets(newTickets);
    localStorage.setItem('tickets', JSON.stringify(newTickets));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsedTickets = parseCSV(content);
        saveTickets(parsedTickets);
        alert(`${parsedTickets.length} tickets loaded successfully!`);
      };
      reader.readAsText(file);
    }
    // Reset file input value to allow re-uploading the same file
    event.target.value = '';
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      const updatedTickets = tickets.filter(t => t.id !== ticketId);
      saveTickets(updatedTickets);
    }
  };
  
  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete ALL ticket data? This action cannot be undone.')) {
      saveTickets([]);
    }
  };

  const handleDownloadCSV = () => {
    if (tickets.length === 0) {
      alert("No data available to download.");
      return;
    }
    const csvContent = generateCSV(tickets);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ticket_data_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    if (tickets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-dashed border-slate-300">
           <FileSpreadsheet size={32} className="text-slate-400" />
           <h3 className="text-lg font-medium text-slate-700 mt-4">No Ticket Data</h3>
           <p className="text-slate-500 text-sm">Upload a CSV file to get started.</p>
        </div>
      );
    }
    
    return view === ViewState.DASHBOARD 
      ? <Dashboard tickets={tickets} /> 
      : <TicketList tickets={tickets} onDelete={handleDeleteTicket} />;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">TechGuard</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setView(ViewState.DASHBOARD); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              view === ViewState.DASHBOARD 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>

          <button 
            onClick={() => { setView(ViewState.TICKET_LIST); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              view === ViewState.TICKET_LIST
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <List size={20} />
            <span className="font-medium">Ticket Data</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">Supervisor</p>
              <p className="text-xs text-slate-400">Admin View</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center md:hidden">
           <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600">
               <Menu size={24} />
            </button>
            <h1 className="font-bold text-slate-800 ml-2">TechGuard</h1>
           </div>
        </header>

        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 justify-between items-center">
           <h2 className="text-xl font-bold text-slate-800">
             {view === ViewState.DASHBOARD ? 'Dashboard Overview' : 'Ticket Management'}
           </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="csv-upload" className="cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                <Upload size={16} />
                Upload CSV
              </label>
              <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />

              <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors border border-slate-300">
                <Download size={16} />
                Download
              </button>

              <button onClick={handleDeleteAll} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors border border-red-200">
                 <Trash2 size={16} />
              </button>
            </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <p className="text-slate-500 mt-1">
                  {view === ViewState.DASHBOARD 
                    ? 'Monitoring technician performance and trouble ticket status.' 
                    : 'Browse and filter all ticket data.'}
                </p>
              </div>
            </div>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
