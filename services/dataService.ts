import { Ticket } from '../types';

// Default data to ensure the app has content on first load or after data is cleared.
const DEFAULT_CSV_DATA = `No;Tanggal Input;Team;No Tiket;Ownergrub;No Inet;Reported Date;Status;ODP;TTR;Jam Close;Team Close
1;01/07/2024 08:15;TEKNISI_A & TEKNISI_B;IN12345678;OWNERGRUB REGULER;123456789012;01/07/2024 08:00;OPEN;ODP-ABC-123;1 jam 30 menit;;
2;01/07/2024 09:00;TEKNISI_C & TEKNISI_D;IN23456789;OWNERGRUB PLATINUM;234567890123;01/07/2024 08:45;OPEN;ODP-DEF-456;45 menit;;
3;01/07/2024 10:30;TEKNISI_A & TEKNISI_B;IN34567890;OWNERGRUB REGULER;345678901234;01/07/2024 10:15;CLOSE;ODP-GHI-789;2 jam 15 menit;01/07/2024 12:45;TEKNISI_A & TEKNISI_B
4;02/07/2024 11:00;TEKNISI_E & TEKNISI_F;IN45678901;OWNERGRUB HVC;456789012345;02/07/2024 10:30;OPEN;ODP-JKL-101;;;
5;02/07/2024 14:00;TEKNISI_C & TEKNISI_D;IN56789012;OWNERGRUB REGULER;567890123456;02/07/2024 13:45;CLOSE;ODP-MNO-112;3 jam 0 menit;02/07/2024 16:45;TEKNISI_C & TEKNISI_D
6;03/07/2024 08:45;TEKNISI_A & TEKNISI_B;IN67890123;OWNERGRUB PLATINUM;678901234567;03/07/2024 08:30;OPEN;ODP-PQR-131;36 jam 5 menit;;
7;03/07/2024 09:15;TEKNISI_E & TEKNISI_F;IN78901234;OWNERGRUB REGULER;789012345678;03/07/2024 09:00;OPEN;ODP-STU-142;;;
`;


const parseDate = (dateStr: string): Date => {
  if (!dateStr || dateStr.trim() === '') return new Date();
  
  // Format: dd/mm/yyyy HH:mm or dd-mm-yyyy HH:mm or just dd/mm/yyyy
  const [datePart, timePart] = dateStr.split(' ');
  
  // Handle different separators (- or /)
  // Convert 04-02-2026 to 04/02/2026 so split('/') works for both
  const normalizedDatePart = datePart.replace(/-/g, '/');
  
  const [day, month, year] = normalizedDatePart.split('/').map(Number);
  
  // Basic validation to prevent Invalid Date
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
     // If standard parsing fails, return current date or try ISO fallback
     const fallback = new Date(dateStr);
     return isNaN(fallback.getTime()) ? new Date() : fallback;
  }
  
  if (!timePart) {
      return new Date(year, month - 1, day);
  }
  
  const timeParts = timePart.split(':').map(Number);
  const hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  
  return new Date(year, month - 1, day, hour, minute);
};

const parseCloseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Handle different separators here too
  const datePart = dateStr.split(' ')[0];
  const normalizedDatePart = datePart.replace(/-/g, '/');
  
  const [day, month, year] = normalizedDatePart.split('/').map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
      // Try fallback
      const fallback = new Date(dateStr);
      return isNaN(fallback.getTime()) ? null : fallback;
  }
  
  return new Date(year, month - 1, day);
}

const parseTTR = (ttrStr: string): number => {
  if (!ttrStr) return 0;
  
  const hourMatch = ttrStr.match(/(\d+)\s*jam/i);
  const minMatch = ttrStr.match(/(\d+)\s*menit/i);
  
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  
  return (hours * 60) + minutes;
};

// Helper to determine likely separator
const detectDelimiter = (lines: string[]): string => {
  if (lines.length === 0) return ';';
  const header = lines[0];
  const commas = (header.match(/,/g) || []).length;
  const semicolons = (header.match(/;/g) || []).length;
  return semicolons >= commas ? ';' : ',';
};

export const parseCSV = (csvContent: string): Ticket[] => {
  const lines = csvContent.split('\n');
  const tickets: Ticket[] = [];

  // Filter out empty lines
  const validLines = lines.filter(l => l.trim().length > 0);
  
  if (validLines.length === 0) return [];

  // Detect header and delimiter
  let startIndex = 0;
  // Try to find the header row by looking for 'No Tiket' (case insensitive)
  const headerIndex = validLines.findIndex(l => l.toLowerCase().includes('no tiket'));
  if (headerIndex !== -1) {
    startIndex = headerIndex + 1;
  }
  
  // Use header row (or first row) to detect delimiter
  const delimiter = detectDelimiter(validLines.slice(headerIndex !== -1 ? headerIndex : 0, startIndex + 5));

  for (let i = startIndex; i < validLines.length; i++) {
    const line = validLines[i].trim();
    if (!line) continue;

    const parts = line.split(delimiter);
    if (parts.length < 5) continue; 

    // Mapping based on standard CSV:
    // 0:No, 1:Tanggal Input, 2:Team, 3:No Tiket, 4:Ownergrub, 5:No Inet, 6:Reported Date, 
    // 7:Status, 8:ODP, 9:TTR, 10:Jam Close, 11:Team Close

    tickets.push({
      id: parts[3] || Math.random().toString(36).substr(2, 9),
      inputDate: parseDate(parts[1]),
      team: parts[2],
      ticketNo: parts[3],
      ownerGroup: parts[4],
      inetNo: parts[5],
      reportedDate: parseDate(parts[6]),
      status: parts[7],
      odp: parts[8],
      ttrRaw: parts[9],
      ttrMinutes: parseTTR(parts[9]),
      closeDate: parseCloseDate(parts[10]),
      teamClose: parts[11]
    });
  }

  return tickets;
};

export const getTickets = (): Ticket[] => {
  return parseCSV(DEFAULT_CSV_DATA);
};

export const generateCSV = (tickets: Ticket[]): string => {
  const header = "No;Tanggal Input;Team;No Tiket;Ownergrub;No Inet;Reported Date;Status;ODP;TTR;Jam Close;Team Close";
  
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  
  const rows = tickets.map((t, index) => {
    return [
      index + 1,
      formatDate(t.inputDate),
      t.team,
      t.ticketNo,
      t.ownerGroup,
      t.inetNo,
      formatDate(t.reportedDate),
      t.status,
      `"${t.odp.replace(/"/g, '""')}"`,
      t.ttrRaw,
      formatDate(t.closeDate),
      t.teamClose
    ].join(';');
  });

  return [header, ...rows].join('\n');
};
