import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Langsung tembak link ini
  // 4. Gak usah pake Environment Variable dulu
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1QpguWPnV5inz6QLMTq4FYvYPMUciDK4tQBStTiRQdug/gviz/tq?tqx=out:csv&gid=1283337334';

  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      setError(null);
      
      // 2. Pake library PapaParse buat ubah CSV jadi tabel.
      Papa.parse(sheetUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setData(results.data);
          } else if (results.errors.length) {
             console.error('Parsing Errors:', results.errors);
             setError('ERROR: DATA TIDAK MASUK');
          } else {
            setData([]); // Handle empty but valid CSV
          }
          setLoading(false);
        },
        error: (err) => {
          console.error('PapaParse Error:', err);
          // 5. Kalau gagal ambil data, kasih tulisan gede 'ERROR: DATA TIDAK MASUK'
          setError('ERROR: DATA TIDAK MASUK');
          setLoading(false);
        }
      });
    };

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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <h1 className="text-4xl font-bold text-red-500 text-center p-8 bg-red-50 border-2 border-dashed border-red-200 rounded-lg">
          {error}
        </h1>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Pengawalan Teknisi</h1>
            <p className="text-slate-500 mt-1">Data Tiket Gangguan (Simple Version)</p>
        </div>
        <div className="overflow-x-auto">
          {/* 3. Tampilkan kolom: Nama Team, No Tiket, dan Status. */}
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Team</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">No Tiket</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">{row['Team']}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-indigo-600">{row['No Tiket']}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      row['Status'] === 'CLOSE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {row['Status']}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && !loading && (
          <div className="p-10 text-center text-slate-500">
            <p>Data kosong atau tidak dapat ditampilkan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
