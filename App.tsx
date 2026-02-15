import React, { useState, useEffect, useRef } from 'react';
import { getTickets, parseCSV, generateCSV } from './services/dataService';
import { Ticket, ViewState } from './types';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import { LayoutDashboard, List, Activity, User, Upload, Download, Trash2, Menu, X, AlertTriangle, Link as LinkIcon, RefreshCw, FileSpreadsheet } from 'lucide-react';

const STORAGE_KEY = 'techguard_tickets_v1';
const SHEET_URL_KEY = 'techguard_sheet_url';

const App: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Sheet Modal State
  const [sheetModal, setSheetModal] = useState<{
    isOpen: boolean;
    url: string;
  }>({
    isOpen: false,
    url: ''
  });

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to save to local storage
  const saveToStorage = (data: Ticket[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to storage", e);
    }
  };

  const syncSheetData = async (url: string) => {
    if (!url) return;
    setIsSyncing(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal mengambil data');
      const text = await response.text();
      
      // Basic validation if it's HTML instead of CSV (common mistake)
      if (text.trim().startsWith('<!DOCTYPE html>') || text.includes('<html')) {
         throw new Error('Link salah. Pastikan format CSV (File > Share > Publish to web > CSV).');
      }

      const parsedTickets = parseCSV(text);
      if (parsedTickets.length > 0) {
        setTickets(parsedTickets);
        saveToStorage(parsedTickets);
      } else {
        alert("Data CSV kosong atau format tidak dikenali. Pastikan Sheet 'Input Mentah' yang dipilih.");
      }
    } catch (error: any) {
      console.error("Sync Error:", error);
      alert(`Sync Error: ${error.message || 'Gagal koneksi ke Google Sheet'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // 1. Load Local Data First (Instant UI)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedData = JSON.parse(stored, (key, value) => {
           if (['inputDate', 'reportedDate', 'closeDate'].includes(key) && value) {
             return new Date(value);
           }
           return value;
        });

        // Sanitize data: Ensure mandatory Date fields are valid Date objects
        const sanitizedData = Array.isArray(parsedData) ? parsedData.map((t: any) => ({
             ...t,
             inputDate: (t.inputDate instanceof Date && !isNaN(t.inputDate.getTime())) ? t.inputDate : new Date(),
             reportedDate: (t.reportedDate instanceof Date && !isNaN(t.reportedDate.getTime())) ? t.reportedDate : new Date(),
             closeDate: (t.closeDate instanceof Date && !isNaN(t.closeDate.getTime())) ? t.closeDate : null
        })) : [];

        if (sanitizedData.length > 0) {
          setTickets(sanitizedData);
        } else {
          loadDefaultData();
        }
      } catch (e) {
        console.error("Error parsing stored tickets", e);
        loadDefaultData();
      }
    } else {
      loadDefaultData();
    }

    // 2. Check for Sheet URL and Auto-Sync (Background)
    const savedUrl = localStorage.getItem(SHEET_URL_KEY);
    if (savedUrl) {
      setSheetModal(prev => ({ ...prev, url: savedUrl }));
      syncSheetData(savedUrl);
    }
  }, []);

  const loadDefaultData = () => {
    const data = getTickets();
    setTickets(data);
    saveToStorage(data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsedTickets = parseCSV(content);
        setTickets(parsedTickets);
        saveToStorage(parsedTickets); 
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (tickets.length === 0) {
      alert("Tidak ada data untuk di-export.");
      return;
    }
    const csvContent = generateCSV(tickets);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `technician_tickets_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- ACTIONS WITH CUSTOM MODAL ---

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleReset = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Semua Data?',
      message: 'PERINGATAN: Dashboard akan menjadi KOSONG. Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      onConfirm: () => {
        const emptyData: Ticket[] = [];
        setTickets(emptyData);
        saveToStorage(emptyData);
        closeConfirmModal();
      }
    });
  };

  const handleDeleteTicket = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Tiket?',
      message: 'Apakah anda yakin ingin menghapus tiket ini dari daftar?',
      type: 'warning',
      onConfirm: () => {
        setTickets(currentTickets => {
          const updatedTickets = currentTickets.filter(t => t.id !== id);
          saveToStorage(updatedTickets);
          return updatedTickets;
        });
        closeConfirmModal();
      }
    });
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // --- SHEET MODAL HANDLERS ---
  const saveSheetUrl = () => {
    if (sheetModal.url.trim()) {
      localStorage.setItem(SHEET_URL_KEY, sheetModal.url.trim());
      syncSheetData(sheetModal.url.trim());
      setSheetModal(prev => ({...prev, isOpen: false}));
    } else {
      localStorage.removeItem(SHEET_URL_KEY);
      setSheetModal(prev => ({...prev, isOpen: false}));
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* --- GOOGLE SHEET MODAL --- */}
      {sheetModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-emerald-50 border-b border-emerald-100 flex gap-4 items-center">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 h-fit">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-900">Connect Google Sheet</h3>
                <p className="text-sm text-emerald-700">Auto-sync data dari spreadsheet.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Google Sheet Published CSV Link</label>
                 <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                    value={sheetModal.url}
                    onChange={(e) => setSheetModal(prev => ({...prev, url: e.target.value}))}
                 />
                 <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
                   <p className="font-bold text-slate-700">Cara mengambil link:</p>
                   <ol className="list-decimal pl-4 space-y-1">
                     <li>Buka Google Sheet, klik <b>File</b> {'>'} <b>Share</b> {'>'} <b>Publish to web</b>.</li>
                     <li>
                        Pada dropdown "Entire Document", <span className="text-red-600 font-bold">Ganti menjadi "Input Mentah"</span> (atau nama sheet yg diinginkan).
                     </li>
                     <li>Pilih format <b>Comma-separated values (.csv)</b>.</li>
                     <li>Klik Publish dan Copy linknya ke sini.</li>
                   </ol>
                 </div>
               </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={() => setSheetModal(prev => ({...prev, isOpen: false}))}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={saveSheetUrl}
                disabled={isSyncing}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {isSyncing ? <RefreshCw className="animate-spin" size={16}/> : null}
                {isSyncing ? 'Syncing...' : 'Simpan & Sync'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM CONFIRMATION MODAL --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
            <div className={`p-6 ${confirmModal.type === 'danger' ? 'bg-red-50' : 'bg-amber-50'} border-b ${confirmModal.type === 'danger' ? 'border-red-100' : 'border-amber-100'} flex gap-4`}>
              <div className={`p-3 rounded-full ${confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'} h-fit`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${confirmModal.type === 'danger' ? 'text-red-900' : 'text-amber-900'}`}>
                  {confirmModal.title}
                </h3>
                <p className={`mt-2 text-sm ${confirmModal.type === 'danger' ? 'text-red-800' : 'text-amber-800'}`}>
                  {confirmModal.message}
                </p>
              </div>
            </div>
            <div className="p-4 bg-white flex justify-end gap-3">
              <button 
                onClick={closeConfirmModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${
                  confirmModal.type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

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

        <div className="p-4 border-t border-slate-800">
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
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center md:hidden">
           <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600">
               <Menu size={24} />
            </button>
            <h1 className="font-bold text-slate-800 ml-2">TechGuard</h1>
           </div>
        </header>

        {/* Desktop Header / Toolbar */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-4 justify-between items-center">
           <h2 className="text-xl font-bold text-slate-800">
             {view === ViewState.DASHBOARD ? 'Dashboard Overview' : 'Ticket Management'}
           </h2>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setSheetModal(prev => ({...prev, isOpen: true}))}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                title="Connect Google Sheet"
              >
                {isSyncing ? <RefreshCw size={16} className="animate-spin text-emerald-600"/> : <LinkIcon size={16} />}
                Connect Sheet
              </button>
              
              <div className="h-6 w-px bg-slate-300 mx-1"></div>

              <button 
                onClick={triggerFileUpload}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                title="Import CSV"
              >
                <Upload size={16} />
                Import
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                title="Export CSV"
              >
                <Download size={16} />
                Export
              </button>
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                title="Clear All Data"
              >
                <Trash2 size={16} />
                Delete All
              </button>
           </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Toolbar (visible only on small screens) */}
            <div className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2">
               <button onClick={() => setSheetModal(prev => ({...prev, isOpen: true}))} className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg">
                 {isSyncing ? <RefreshCw size={14} className="animate-spin text-emerald-600"/> : <LinkIcon size={14} />} 
                 Sheet
               </button>
               <button onClick={triggerFileUpload} className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg">
                 <Upload size={14} /> Import
               </button>
               <button onClick={handleExport} className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg">
                 <Download size={14} /> Export
               </button>
               <button onClick={handleReset} className="flex-shrink-0 flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg cursor-pointer">
                 <Trash2 size={14} /> Clear All
               </button>
            </div>

            <div className="mb-6 flex justify-between items-end">
              <div>
                <p className="text-slate-500 mt-1">
                  {view === ViewState.DASHBOARD 
                    ? 'Monitoring technician performance and trouble ticket status.' 
                    : 'Manage and clean up ticket data.'}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                 <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Last Updated</p>
                 <p className="text-sm text-slate-700 font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {tickets.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-dashed border-slate-300">
                  <div className="bg-slate-50 p-4 rounded-full mb-4">
                     <Upload size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700">Data Kosong</h3>
                  <p className="text-slate-500 mb-4 text-sm max-w-md text-center">Belum ada data tiket. Silakan import file CSV atau gunakan data default.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setSheetModal(prev => ({...prev, isOpen: true}))} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
                       <LinkIcon size={16} /> Connect Sheet
                    </button>
                    <button onClick={triggerFileUpload} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                       Import CSV
                    </button>
                    <button onClick={loadDefaultData} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">
                       Load Default
                    </button>
                  </div>
               </div>
            ) : (
              view === ViewState.DASHBOARD ? (
                <Dashboard tickets={tickets} />
              ) : (
                <TicketList tickets={tickets} onDelete={handleDeleteTicket} />
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;