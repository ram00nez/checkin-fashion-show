export interface Participant {
  id: string;
  nama_anak: string;
  nama_orang_tua: string;
  alamat: string;
  nama_sekolah: string;
  jenis_kelamin: string;
  email: string;
  no_telepon: string;
  no_nametag: string;
  check_in: boolean;
  check_in_time: string | null;
  snack_box_received: boolean;
  snack_box_time: string | null;
  lunch_box_ticket_received: boolean;
  lunch_box_ticket_received_time: string | null;
  nama_perwakilan: string | null;
  nomer_perwakilan: string | null;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface SearchResult {
  participants: Participant[];
  loading: boolean;
  error: string | null;
}