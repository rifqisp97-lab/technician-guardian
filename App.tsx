import React, { useState, useEffect } from 'react';
import { RefreshCw, LayoutDashboard, List } from 'lucide-react';

import { Ticket, ViewState } from './types';
import { parseCSV } from './services/dataService';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';

const App: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTLoCcEfftUyKSABbsKr55EUMbm_w8SbVGNkZg-7PvQB-eMXRND8--yqukA3rKsXghhGqwtbL8eS81f/pub?gid=1283337334&single=true&output=csv';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) {
        throw new Error(`Gagal memuat data (Error: ${response.status}). Pastikan link Google Sheet benar dan telah dipublikasikan sebagai CSV.`);
      }
      const csvText = await response.text();
      if (csvText.trim().toLowerCase().includes('<!doctype html>')) {
        throw new Error('Gagal, yang diterima adalah halaman HTML, bukan file CSV. Cek kembali link Google Sheet.');
      }
      
      const parsedTickets = parseCSV(csvText);
      setTickets(parsedTickets);
      setLastUpdated(new Date());

    } catch (err: any) {
      console.error('Fetch or Parse Error:', err);
      setError(err.message || 'Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto text-slate-400 animate-spin" />
          <p className="mt-4 text-lg font-semibold text-slate-600">Sabar bro, lagi narik data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="text-center p-8 bg-white border border-red-200 rounded-lg shadow-md max-w-lg">
          <h1 className="text-2xl font-bold text-red-600">Oops, Ada Masalah!</h1>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-screen-2xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Technician Guardian</h1>
            <p className="text-slate-500 mt-1 text-sm">
              {lastUpdated ? `Last updated: ${lastUpdated.toLocaleString('id-ID')}` : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button
                onClick={() => setView(ViewState.DASHBOARD)}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  view === ViewState.DASHBOARD ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-pressed={view === ViewState.DASHBOARD}
              >
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button
                onClick={() => setView(ViewState.TICKET_LIST)}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  view === ViewState.TICKET_LIST ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                 aria-pressed={view === ViewState.TICKET_LIST}
              >
                <List size={16} /> Ticket List
              </button>
            </div>
            <button
              onClick={fetchData}
              className="p-2.5 bg-white text-slate-500 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        <main>
          {view === ViewState.DASHBOARD && <Dashboard tickets={tickets} />}
          {view === ViewState.TICKET_LIST && <TicketList tickets={tickets} />}
        </main>
      </div>
    </div>
  );
};

export default App;