import React, { useState, useEffect, useRef } from 'react';
import { parseCSV } from './services/dataService';
import { Ticket, ViewState } from './types';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import { 
  LayoutDashboard, List, Activity, User, Menu, X, Upload, 
  FileSpreadsheet, RefreshCw, AlertTriangle, Link, XCircle 
} from 'lucide-react';

const App: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for Sheet Connection
  const [sheetUrl, setSheetUrl] = useState<string | null>(localStorage.getItem('sheetUrl'));
  const [sheetUrlInput, setSheetUrlInput] = useState<string>(sheetUrl || '');
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const syncIntervalRef = useRef<number | null>(null);

  const fetchFromSheet = async (url: string) => {
    if (!url) return;

    setIsSyncing(true);
    setError(null);

    try {
      const urlWithCacheBust = new URL(url);
      urlWithCacheBust.searchParams.set('_cacheBust', new Date().getTime().toString());
      
      const response = await fetch(urlWithCacheBust.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      const csvText = await response.text();
      
      if (csvText.trim().startsWith('<!DOCTYPE html>')) {
        throw new Error("Received HTML instead of CSV. Check your Google Sheet 'Publish to the web' settings.");
      }

      const parsedTickets = parseCSV(csvText);
      setTickets(parsedTickets);
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error("Sync Error:", e);
      setError(e.message || "An unknown error occurred during sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Effect for handling sheet connection and auto-sync
  useEffect(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    if (sheetUrl) {
      fetchFromSheet(sheetUrl); // Initial fetch
      syncIntervalRef.current = window.setInterval(() => {
        fetchFromSheet(sheetUrl);
      }, 60000); // 60 seconds auto-refresh
    } else {
      // Fallback to local storage if not connected to a sheet
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
        setTickets([]); // Start with empty if no sheet and no local data
      }
    }

    // Cleanup interval on component unmount or when sheetUrl changes
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [sheetUrl]);

  // Manual Mode: Save tickets to local storage
  const saveTicketsToLocal = (newTickets: Ticket[]) => {
    setTickets(newTickets);
    localStorage.setItem('tickets', JSON.stringify(newTickets));
  };
  
  // Manual Mode: Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (sheetUrl) {
        alert("Please disconnect from the Google Sheet before uploading a manual file.");
        return;
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsedTickets = parseCSV(content);
        saveTicketsToLocal(parsedTickets);
        alert(`${parsedTickets.length} tickets loaded successfully!`);
      };
      reader.readAsText(file);
    }
    event.target.value = ''; // Allow re-uploading same file
  };

  const handleConnectSheet = () => {
    if (!sheetUrlInput) {
        alert("Please enter a valid Google Sheet URL.");
        return;
    }
    localStorage.setItem('sheetUrl', sheetUrlInput);
    setSheetUrl(sheetUrlInput);
    setIsSheetModalOpen(false);
  };
  
  const handleDisconnectSheet = () => {
    if (window.confirm("Are you sure you want to disconnect? The current data will remain until you upload a new file or refresh.")) {
        localStorage.removeItem('sheetUrl');
        setSheetUrl(null);
        setSheetUrlInput('');
        setError(null);
        setIsSheetModalOpen(false);
    }
  };

  const renderContent = () => {
    if (isSyncing && tickets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <RefreshCw size={32} className="text-slate-400 animate-spin" />
          <p className="text-slate-500 mt-4">Connecting to Google Sheet...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-xl border border-dashed border-red-200 p-4">
          <AlertTriangle size={32} className="text-red-500" />
          <h3 className="text-lg font-medium text-red-800 mt-4">Connection Failed</h3>
          <p className="text-red-600 mt-1 text-sm max-w-md text-center">{error}</p>
          <button onClick={() => setIsSheetModalOpen(true)} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
            Check Connection Settings
          </button>
        </div>
      );
    }

    if (tickets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-dashed border-slate-300">
          <FileSpreadsheet size={32} className="text-slate-400" />
          <h3 className="text-lg font-medium text-slate-700 mt-4">No Ticket Data</h3>
          <p className="text-slate-500 text-sm">
            {sheetUrl ? "The connected sheet might be empty." : "Connect a Google Sheet or upload a CSV to begin."}
          </p>
        </div>
      );
    }
    
    return view === ViewState.DASHBOARD 
      ? <Dashboard tickets={tickets} /> 
      : <TicketList tickets={tickets} />;
  };
  
  const getStatusIndicator = () => {
    if (error) {
      return <div className="flex items-center gap-2 text-red-500"><AlertTriangle size={16} /><span>Error</span></div>
    }
    if (isSyncing) {
        return <div className="flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /><span>Syncing...</span></div>
    }
    if (sheetUrl && lastUpdated) {
        return <div className="flex items-center gap-2"><RefreshCw size={16} /><span>Updated: {lastUpdated.toLocaleTimeString('id-ID')}</span></div>
    }
    return <div className="flex items-center gap-2"><XCircle size={16} /><span>Disconnected</span></div>
  }

  return (
    <>
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
            <div className="flex items-center gap-4">
               <div className="text-sm font-medium text-slate-500">{getStatusIndicator()}</div>
               <div className="flex items-center gap-2">
                 <button onClick={() => setIsSheetModalOpen(true)} className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors border border-slate-300">
                    <Link size={16} />
                    Connect Sheet
                 </button>
                 <label htmlFor="csv-upload" className={`cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${sheetUrl ? 'bg-slate-400 cursor-not-allowed' : 'hover:bg-indigo-700'}`}>
                   <Upload size={16} />
                   Upload CSV
                 </label>
                 <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={!!sheetUrl} />
               </div>
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

      {/* Sheet Connection Modal */}
      {isSheetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setIsSheetModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">Manage Google Sheet Connection</h3>
               <button onClick={() => setIsSheetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={24} />
               </button>
            </div>
            
            <div>
              <label htmlFor="sheet-url" className="text-sm font-medium text-slate-700 block mb-2">
                Published Google Sheet CSV URL
              </label>
              <input 
                id="sheet-url"
                type="url"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Go to your Google Sheet, click `File &gt; Share &gt; Publish to the web`, select the sheet, choose `Comma-separated values (.csv)`, and copy the generated link here.
              </p>
            </div>

            <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-slate-200">
               {sheetUrl && (
                  <button 
                     onClick={handleDisconnectSheet}
                     className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
                  >
                     Disconnect
                  </button>
               )}
               <button 
                 onClick={handleConnectSheet}
                 className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
               >
                 Save & Sync
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
