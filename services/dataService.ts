import { Ticket } from '../types';

const DEFAULT_CSV_DATA = `No;Tanggal Input;Team;No Tiket;Ownergrub;No Inet;Reported Date;Status;ODP;TTR;Jam Close;Team Close
;04/02/2026 13:25;FAHMY & DINUR;INC45895835;REGULER;1,11103E+11;03/02/2026 15:31;CLOSE;ODP-DAR-FAG/117 FAG/D010/117.01;23 jam 13 menit;04/02/2026;DINUR
;04/02/2026 13:25;FAHMY & DINUR;INC45923435;REGULER;1,11103E+11;04/02/2026 11:02;CLOSE;ODP-DAR-FAG/002;5 jam 32 menit;04/02/2026;DINUR & FAHMY
;04/02/2026 13:25;FAHMY & DINUR;INC45922627;REGULER;1,11103E+11;04/02/2026 10:42;CLOSE;ODP-DAR-FF/18 FF/D02/24.06;5 jam 52 menit;04/02/2026;DINUR & FAHMY
;04/02/2026 13:25;FAISAL & ZULFAHMI;INC45916660;REGULER;1,11103E+11;04/02/2026 08:31;CLOSE;ODP-DAR-FT/46 FT/D04/46.01;0 jam 35 menit;04/02/2026;ZULFAHMI & @ FAISAL
;04/02/2026 13:25;FAISAL & ZULFAHMI;INC45892082;REGULER;1,11103E+11;03/02/2026 14:15;CLOSE;ODP-DAR-FAW/37;18 jam 51 menit;04/02/2026;ZULFAHMI & @ FAISAL
;04/02/2026 13:25;FAISAL & ZULFAHMI;INC45915053;REGULER;1,11103E+11;04/02/2026 07:38;CLOSE;ODP-DAR-FAW/09 FAW/D01/09.01;1 jam 28 menit;04/02/2026;ZULFAHMI & @ FAISAL
;04/02/2026 13:25;FAISAL & ZULFAHMI;INC45893652;REGULER;1,11103E+11;03/02/2026 14:44;CLOSE;ODP-DAR-FT/37 FT/D04/12.01;18 jam 22 menit;04/02/2026;ZULFAHMI & @ FAISAL
;04/02/2026 08:59;FAISAL & ZULFAHMI;INC45917185;REGULER;1,11103E+11;04/02/2026 08:55;CLOSE;ODP-DAR-FJ/79;0 jam 11 menit;;
;04/02/2026 13:25;FAISAL & ZULFAHMI;INC45916492;REGULER;1,11103E+11;04/02/2026 08:32;CLOSE;ODP-DAR-FB/141 FB/D09/141.01;0 jam 34 menit;04/02/2026;ZULFAHMI & @ FAISAL
;04/02/2026 13:25;FAISAL & ZULFAHMI;INC45915266;REGULER;1,11103E+11;04/02/2026 07:52;CLOSE;ODP-DAR-FJ/040 FJ/D02/040.01;6 jam 52 menit;04/02/2026;ZULFAHMI & @ FAISAL
;04/02/2026 13:25;FAISAL & ZULFAHMI;INC45918241;REGULER;1,11103E+11;04/02/2026 09:11;CLOSE;ODP-DAR-FT/5;7 jam 24 menit;04/02/2026;ZULFAHMI & @ FAISAL
;04/02/2026 13:25;NUZUL & LATIF;INC45907275;REGULER;1,11103E+11;03/02/2026 22:06;CLOSE;ODP-DAR-FAD/74 FAD/D04/74.01;11 jam 0 menit;04/02/2026;Latif & Nuzul
;04/02/2026 13:25;NUZUL & LATIF;INC45905512;REGULER;1,11103E+11;03/02/2026 20:49;CLOSE;ODP-DAR-FZ/70 FZ/D03/70.01;12 jam 17 menit;04/02/2026;Latif & Nuzul
;04/02/2026 13:25;NUZUL & LATIF;INC45905350;REGULER;1,11103E+11;03/02/2026 20:35;CLOSE;ODP-DAR-FU/06 FU/D01/06.01;12 jam 31 menit;04/02/2026;Latif & Nuzul
;04/02/2026 13:25;NUZUL & LATIF;INC45889385;REGULER;1,11103E+11;03/02/2026 13:19;CLOSE;ODP-DAR-FZ/91;19 jam 47 menit;04/02/2026;Latif & Nuzul
42;04/02/2026 14:39;NUZUL & LATIF;INC45933712;REGULER;1,11103E+11;04/02/2026 14:36;CLOSE;ODP-DAR-FAZ/33;0 jam 8 menit;04/02/2026;Latif & Nuzul
40;04/02/2026 14:39;NUZUL & LATIF;INC45931240;REGULER;1,11103E+11;04/02/2026 13:45;CLOSE;ODP-DAR-FAJ/13;2 jam 49 menit;04/02/2026;Latif & Nuzul
45;04/02/2026 16:19;NUZUL & LATIF;INC45936703;REGULER;1,11103E+11;04/02/2026 15:33;CLOSE;ODP-DAR-FAN/14;1 jam 1 menit;04/02/2026;Latif & Nuzul
;04/02/2026 13:25;SYAHRIL & MUHAMMAD;INC45879156;REGULER;1,11103E+11;03/02/2026 09:46;CLOSE;ODP-DAR-FAH/125;23 jam 20 menit;04/02/2026;SYAHRIL & MUHAMMAD
;04/02/2026 13:25;SYAHRIL & MUHAMMAD;INC45879146;REGULER;1,11103E+11;03/02/2026 09:46;CLOSE;ODP-DAR-FAH/125;23 jam 20 menit;04/02/2026;SYAHRIL & MUHAMMAD
;04/02/2026 13:25;SYAHRIL & MUHAMMAD;INC45894938;REGULER;1,11103E+11;03/02/2026 15:11;CLOSE;ODP-DAR-FAH/125;17 jam 55 menit;04/02/2026;SYAHRIL & MUHAMMAD
;04/02/2026 13:25;SYAHRIL & MUHAMMAD;INC45887613;REGULER;1,11103E+11;03/02/2026 12:41;CLOSE;ODP-DAR-FF/01;20 jam 25 menit;04/02/2026;SYAHRIL & MUHAMMAD
;04/02/2026 13:25;SYAHRIL & MUHAMMAD;INC45875518;REGULER;1,11103E+11;03/02/2026 08:21;CLOSE;ODP-DAR-FAG/109 FAG/D010/109.01;24 jam 45 menit;04/02/2026;SYAHRIL & MUHAMMAD
;04/02/2026 13:25;SYAHRIL & MUHAMMAD;INC45907700;REGULER;1,11103E+11;03/02/2026 22:34;CLOSE;ODP-DAR-FRB/25 FRB/D03/25.01;16 jam 10 menit;04/02/2026;SYAHRIL & MUHAMMAD
;04/02/2026 13:25;SYAHRIL & MUHAMMAD;INC45906311;REGULER;1,11103E+11;03/02/2026 21:14;CLOSE;ODP-DAR-FRB/03;19 jam 20 menit;04/02/2026;SYAHRIL & MUHAMMAD
;04/02/2026 13:25;SYAHRIL & MUHAMMAD;INC45910018;REGULER;1,11103E+11;04/02/2026 01:24;CLOSE;ODP-DAR-FRB/149 FRB/D09/149.01;15 jam 10 menit;04/02/2026;SYAHRIL & MUHAMMAD
;04/02/2026 13:25;ULUL & AZMY;INC45904166;REGULER;1,11101E+11;03/02/2026 19:58;CLOSE;ODP-DAR-FS/52 FS/D04/52.01;13 jam 8 menit;04/02/2026;ULUL & AZMI
;04/02/2026 13:25;ULUL & AZMY;INC45891141;REGULER;1,11103E+11;03/02/2026 13:57;CLOSE;ODP-DAR-FW/92 FW/D04/92.01;19 jam 9 menit;04/02/2026;ULUL & AZMI
;04/02/2026 13:25;ULUL & AZMY;INC45906207;REGULER;1,11103E+11;03/02/2026 21:18;CLOSE;ODP-DAR-FS/80 FS/D06/80.01;11 jam 48 menit;04/02/2026;ULUL & AZMI
;04/02/2026 13:25;ULUL & AZMY;INC45889773;REGULER;1,11103E+11;03/02/2026 13:28;CLOSE;ODP-DAR-FAU/43;19 jam 38 menit;04/02/2026;ULUL & AZMI
;04/02/2026 09:00;ULUL & AZMY;INC45904965;REGULER;1,11101E+11;03/02/2026 20:22;CLOSE;ODP-DAR-FS/66;18 jam 22 menit;04/02/2026;ULUL & AZMI
;04/02/2026 13:25;ULUL & AZMY;INC45876565;REGULER;1,11103E+11;03/02/2026 08:48;CLOSE;ODP-DAR-FAT/40;31 jam 46 menit;04/02/2026;ULUL & AZMI
39;04/02/2026 14:39;ULUL & AZMY;INC45930382;REGULER;1,11103E+11;04/02/2026 13:33;CLOSE;ODP-DAR-FAE/85;3 jam 2 menit;04/02/2026;ULUL & AZMI`;

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

    // Handle CSV quoting if commas are used (simple regex for now, better handled by library but keeping zero-dep)
    // If we use simple split, commas inside fields will break it. 
    // For now assuming the Google Sheet output is standard.
    
    // If delimiter is comma, we might have issues with numbers like "1,200". 
    // But Indonesia locale usually outputs semi-colon if there are decimals.
    
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

export const generateCSV = (tickets: Ticket[]): string => {
  const header = "No;Tanggal Input;Team;No Tiket;Ownergrub;No Inet;Reported Date;Status;ODP;TTR;Jam Close;Team Close";
  const rows = tickets.map((t, idx) => {
    // Format dates back to dd/mm/yyyy HH:mm
    const formatDate = (d: Date | null | undefined) => {
       if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
       return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    };
    const formatCloseDate = (d: Date | null) => (d && d instanceof Date && !isNaN(d.getTime())) ? `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}` : '';

    return [
      idx + 1,
      formatDate(t.inputDate),
      t.team,
      t.ticketNo,
      t.ownerGroup,
      t.inetNo,
      formatDate(t.reportedDate),
      t.status,
      t.odp,
      t.ttrRaw,
      formatCloseDate(t.closeDate),
      t.teamClose
    ].join(';');
  });
  
  return [header, ...rows].join('\n');
};

export const getTickets = (): Ticket[] => {
  return parseCSV(DEFAULT_CSV_DATA);
};