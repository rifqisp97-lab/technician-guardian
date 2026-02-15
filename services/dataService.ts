import Papa from 'papaparse';
import { Ticket } from '../types';

const parseDate = (dateStr: string): Date => {
  if (!dateStr || dateStr.trim() === '') return new Date(NaN); // Return invalid date if empty
  
  const [datePart, timePart] = dateStr.split(' ');
  const normalizedDatePart = datePart.replace(/-/g, '/');
  const [day, month, year] = normalizedDatePart.split('/').map(Number);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
     const fallback = new Date(dateStr);
     return fallback;
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
  const parsed = parseDate(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

const parseTTR = (ttrStr: string): number => {
  if (!ttrStr) return 0;
  
  const hourMatch = ttrStr.match(/(\d+)\s*jam/i);
  const minMatch = ttrStr.match(/(\d+)\s*menit/i);
  
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  
  return (hours * 60) + minutes;
};

export const parseCSV = (csvContent: string): Ticket[] => {
  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim().replace(/\s+/g, '').toLowerCase(),
  });

  if (!Array.isArray(data)) {
    return [];
  }

  const tickets: Ticket[] = data.map((row: any) => {
    const ticketNo = row.notiket || '';
    return {
      id: ticketNo || Math.random().toString(36).substr(2, 9),
      inputDate: parseDate(row.tanggalinput),
      team: row.team || 'N/A',
      ticketNo: ticketNo,
      ownerGroup: row.ownergrub || '',
      inetNo: row.noinet || '',
      reportedDate: parseDate(row.reporteddate),
      status: row.status || 'UNKNOWN',
      odp: row.odp || '',
      ttrRaw: row.ttr || '',
      ttrMinutes: parseTTR(row.ttr),
      closeDate: parseCloseDate(row.jamclose),
      teamClose: row.teamclose || ''
    };
  }).filter(ticket => ticket.ticketNo && ticket.team !== 'N/A'); // Filter out rows without a ticket number or team

  return tickets;
};