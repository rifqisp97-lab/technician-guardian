// FIX: Add type definitions for Vite's `import.meta.env` to resolve TypeScript error.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_SHEET_URL: string;
    }
  }
}

import React, { useState, useEffect, useRef } from 'react';
import { parseCSV } from './services/dataService';
import { Ticket, ViewState } from './types';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import { 
  LayoutDashboard, List, Activity, User, Menu, X, 
  FileSpreadsheet, RefreshCw, AlertTriangle
} from 'lucide-react';

const App: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for data fetching
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const sheetUrl = import.meta.env?.VITE_SHEET_URL;

    if (!sheetUrl) {
      setError("Konfigurasi error: VITE_SHEET_URL belum diatur di environment variables.");
      setIsInitialLoading(false);
      return;
    }

    const fetchTickets = async () => {
      // Prevent re-syncing if one is already in progress
      if(isSyncing && !isInitialLoading) return;

      setIsSyncing(true);
      
      try {
        // Clear previous error on new attempt
        setError(null);

        const urlWithCacheBust = new URL(sheetUrl);
        urlWithCacheBust.searchParams.set('_cacheBust', new Date().getTime().toString());
        
        const response = await fetch(urlWithCacheBust.toString());
        if (!response.ok) {
          throw new Error(`Gagal mengambil data: ${response.status} ${response.statusText}`);
        }
        const csvText = await response.text();
        
        if (csvText.trim().startsWith('<!DOCTYPE html>')) {
          throw new Error("Format data salah. Harusnya CSV, tapi yang diterima HTML. Cek lagi pengaturan 'Publikasikan ke web' di Google Sheet, pastikan linknya untuk tab 'Input Mentah'.");
        }

        const parsedTickets = parseCSV(csvText);
        setTickets(parsedTickets);
        setLastUpdated(new Date());
      } catch (e: any) {
        console.error("Sync Error:", e);
        setError(e.message || "Terjadi kesalahan saat sinkronisasi.");
      } finally {
        setIsSyncing(false);
        if (isInitialLoading) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchTickets(); // Ambil data pertama kali
    const intervalId = setInterval(fetchTickets, 30000); // Auto-refresh setiap 30 detik

    return () => clearInterval(intervalId); // Bersihkan interval saat komponen dibongkar
  }, []);

  const renderContent = () => {
    if (isInitialLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <RefreshCw size={32} className="text-slate-400 animate-spin" />
          <p className="text-slate-500 mt-4 font-semibold">Sabar bro, lagi proses...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-xl border border-dashed border-red-200 p-4 text-center">
          <AlertTriangle size={32} className="text-red-500" />
          <h3 className="text-lg font-medium text-red-800 mt-4">Gagal Terhubung</h3>
          <p className="text-red-600 mt-1 text-sm max-w-md">{error}</p>
          <p className="text-slate-500 mt-4 text-xs max-w-md">
            Pastikan variabel <code className="bg-red-100 p-1 rounded">VITE_SHEET_URL</code> sudah benar dan Google Sheet sudah dipublikasikan sebagai CSV dari tab yang benar.
          </p>
        </div>
      );
    }

    if (tickets.length === 0 && !isSyncing) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-dashed border-slate-300">
          <FileSpreadsheet size={32} className="text-slate-400" />
          <h3 className="text-lg font-medium text-slate-700 mt-4">Data Kosong</h3>
          <p className="text-slate-500 text-sm">
            Sheet yang terhubung sepertinya tidak ada isinya.
          </p>
        </div>
      );
    }
    
    return view === ViewState.DASHBOARD 
      ? <Dashboard tickets={tickets} /> 
      : <TicketList tickets={tickets} />;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Sidebar */}
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

      {/* Main Content */}
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
          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
            <RefreshCw size={16} className={isSyncing && !isInitialLoading ? 'animate-spin' : ''} />
            <span>
              {isSyncing && !isInitialLoading
                ? 'Syncing...'
                : lastUpdated
                ? `Updated: ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                : 'Menunggu data...'}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <p className="text-slate-500 mt-1">
                {view === ViewState.DASHBOARD 
                  ? 'Monitoring technician performance and trouble ticket status.' 
                  : 'Browse and filter all ticket data.'}
              </p>
            </div>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;