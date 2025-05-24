export type UserRole = 'admin' | 'user';

export interface Role {
  id: number;
  name: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserMetadata {
  role: UserRole;
}

export interface User {
  id: string;
  email: string;
  user_metadata: UserMetadata;
  aud: string;
  confirmation_sent_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  email_change: string | null;
  email_change_confirm_status: string | null;
  email_change_token_current: string | null;
  email_change_token_new: string | null;
  is_super_admin: boolean;
  last_sign_in_at: string | null;
  phone: string | null;
  phone_change: string | null;
  phone_change_token: string | null;
  phone_confirmed_at: string | null;
  recovery_sent_at: string | null;
  role: UserRole;
  updated_at: string;
}

export interface SupabaseUser {
  id: string;
  user_metadata: UserMetadata;
  email: string;
  aud: string;
  confirmation_sent_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  email_change: string | null;
  email_change_confirm_status: string | null;
  email_change_token_current: string | null;
  email_change_token_new: string | null;
  is_super_admin: boolean;
  last_sign_in_at: string | null;
  phone: string | null;
  phone_change: string | null;
  phone_change_token: string | null;
  phone_confirmed_at: string | null;
  recovery_sent_at: string | null;
  role: UserRole;
  updated_at: string;
}

export interface Participant {
  id: string;
  nama_anak: string;
  nama_orang_tua: string;
  email: string;
  alamat: string;
  nama_sekolah: string;
  jenis_kelamin: string;
  no_nametag: string | null;
  check_in: boolean;
  check_in_time: string | null;
  status: string;
  snack_box_received: boolean;
  snack_box_time: string | null;
  lunch_box_ticket_received: boolean;
  lunch_box_ticket_received_time: string | null;
  created_at: string;
  updated_at: string;
  representative_name: string | null;
  representative_phone: string | null;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export interface AdminStats {
  totalParticipants: number;
  checkedIn: number;
  notCheckedIn: number;
}
