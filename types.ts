export interface Ticket {
  id: string; // From No Tiket
  inputDate: Date;
  team: string;
  ticketNo: string;
  ownerGroup: string;
  inetNo: string;
  reportedDate: Date;
  status: string;
  odp: string;
  ttrRaw: string;
  ttrMinutes: number;
  closeDate: Date | null; // Changed from string to Date | null
  teamClose: string;
}

export interface TeamPerformance {
  teamName: string;
  ticketCount: number;
  avgTTR: number; // in minutes
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  TICKET_LIST = 'TICKET_LIST'
}