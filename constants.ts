
import { Role, BusyStatus, ActivityStatus, Education, Category, AttendanceStatus, Gender } from './types';

export const GROUPS: string[] = [
  'Wonokusumo 1',
  'Wonokusumo 2',
  'Kedung Mangu',
  'Kapas Jaya'
];

/** 
 * URL GOOGLE APPS SCRIPT
 * Link ini digunakan sebagai database pusat. Semua perangkat yang membuka
 * aplikasi ini akan otomatis terhubung ke database yang sama secara real-time.
 */
export const DEFAULT_CLOUD_URL = "https://script.google.com/macros/s/AKfycbxpl2ZqaFgvlEdf-VqCB-Dw2LS6akwJgjL0u5tWrcdaSbE2HHHkvgqMtshLlK8G-B__/exec";

export const ROLES: Role[] = [
  'Admin',
  'Ketua MM Wonokusumo 1',
  'Ketua MM Wonokusumo 2',
  'Ketua MM Kedung Mangu',
  'Ketua MM Kapas Jaya'
];

export const DAYS: string[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu'
];

export const GENDER_OPTIONS: Gender[] = ['Laki-laki', 'Perempuan'];
export const BUSY_STATUSES: BusyStatus[] = ['Sekolah', 'Kerja', 'Kuliah', 'Kerja Kuliah', 'Wirausaha'];
export const ACTIVITY_STATUSES: ActivityStatus[] = ['Aktif', 'Pindah', 'Menikah', 'Meninggal'];
export const EDUCATIONS: Education[] = ['SD', 'SMP', 'SMA', 'SMK', 'D3', 'D4', 'S1', 'S2', 'S3'];
export const CATEGORIES: Category[] = ['SMP', 'SMA', 'SMK', 'Pra-Nikah'];
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['Hadir', 'Izin', 'Sakit', 'Alfa'];

export const MOCK_USERS = [
  { username: 'admin', password: 'dsnew26', role: 'Admin' as Role },
  { username: 'ketua1', password: 'wk1', role: 'Ketua MM Wonokusumo 1' as Role },
  { username: 'ketua2', password: 'wk2', role: 'Ketua MM Wonokusumo 2' as Role },
  { username: 'ketua3', password: 'kemang', role: 'Ketua MM Kedung Mangu' as Role },
  { username: 'ketua4', password: 'kj', role: 'Ketua MM Kapas Jaya' as Role },
];
