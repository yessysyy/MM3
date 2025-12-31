
export type Role = 'Admin' | 'Ketua MM Wonokusumo 1' | 'Ketua MM Wonokusumo 2' | 'Ketua MM Kedung Mangu' | 'Ketua MM Kapas Jaya';

export type Education = 'SD' | 'SMP' | 'SMA' | 'SMK' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3';

export type ActivityStatus = 'Aktif' | 'Pindah' | 'Menikah' | 'Meninggal';

export type BusyStatus = 'Sekolah' | 'Kerja' | 'Kuliah' | 'Kerja Kuliah' | 'Wirausaha';

export type Category = 'SMP' | 'SMA' | 'SMK' | 'Pra-Nikah';

export type Gender = 'Laki-laki' | 'Perempuan';

export interface Member {
  id: string;
  fullName: string;
  gender: Gender;
  whatsapp: string;
  ttl: string;
  address: string;
  fatherName: string;
  motherName: string;
  busyStatus: BusyStatus;
  activityStatus: ActivityStatus;
  education: Education;
  category: Category;
  group: string; // The group (e.g., "Wonokusumo 1")
}

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alfa';

export interface Activity {
  id: string;
  name: string;
  description: string;
}

export interface Schedule {
  id: string;
  day: string;
  date?: string; // Field baru untuk tanggal spesifik
  time: string;
  activityName: string;
  location: string;
}

export interface Attendance {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  activityType: string;
  status: AttendanceStatus;
  feedback?: string;
}

export interface User {
  username: string;
  role: Role;
}
