import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Users, LayoutDashboard, ClipboardCheck, Download, LogOut, LogIn, Info, Plus,
  Trash2, Edit2, Search, FileSpreadsheet, FileText, Calendar, Layers, TrendingUp,
  UserCheck, Settings, Cloud, RefreshCw, Database, ArrowRight, Phone, MessageSquare,
  MessageCircle, XCircle, Clock, MapPin, AlertCircle, Users2, UserRound, Upload, X,
  FileQuestion, Filter, BarChart3, PieChart as PieChartIcon, Percent, ChevronRight,
  GraduationCap, BookOpen, Heart, School, Award, Book, Menu as MenuIcon,
  MoreHorizontal, CheckCircle2, User as UserIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Member, Attendance, User as UserType, AttendanceStatus, Activity, Schedule } from './types';
import { MOCK_USERS, ATTENDANCE_STATUSES, DEFAULT_CLOUD_URL } from './constants';

const STORAGE_KEY_MEMBERS = 'simm_members_db_v1';
const STORAGE_KEY_ATTENDANCE = 'simm_attendance_db_v1';
const STORAGE_KEY_ACTIVITIES = 'simm_activities_db_v1';
const STORAGE_KEY_SCHEDULE = 'simm_schedule_db_v1';
const STORAGE_KEY_WEBAPP_URL = 'simm_webapp_url_v1';

type MenuState = 'dashboard' | 'members' | 'rekap' | 'activities' | 'schedule' | 'download' | 'settings';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'login' | 'dashboard' | 'presensi'>('home');
  const [user, setUser] = useState<UserType | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeMenu, setActiveMenu] = useState<MenuState>('dashboard');
  
  const [webAppUrl, setWebAppUrl] = useState<string>(localStorage.getItem(STORAGE_KEY_WEBAPP_URL) || DEFAULT_CLOUD_URL || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [errorSync, setErrorSync] = useState<string | null>(null);

  // KUNCI: Mencegah auto-sync mengirim data kosong saat baru refresh
  const [isInitialized, setIsInitialized] = useState(false);

  // --- 1. Fungsi Mengambil Data dari Cloud ---
  const fetchFromCloud = useCallback(async () => {
    if (!webAppUrl) {
      setIsInitialized(true);
      return;
    }
    
    setInitialLoading(true);
    setIsSyncing(true);
    setErrorSync(null);

    try {
      const response = await fetch(webAppUrl);
      if (!response.ok) throw new Error("Gagal mengambil data dari Cloud");
      const data = await response.json();
      
      if (data.members) setMembers(data.members);
      if (data.attendance) setAttendance(data.attendance);
      if (data.activities) setActivities(data.activities);
      if (data.schedules) setSchedules(data.schedules);
      
      setLastSync(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Fetch error:", error);
      setErrorSync("Cloud tidak merespon. Menggunakan data lokal.");
    } finally {
      setIsSyncing(false);
      setInitialLoading(false);
      setIsInitialized(true); // Izinkan sinkronisasi setelah ini
    }
  }, [webAppUrl]);

  // --- 2. Inisialisasi Awal ---
  useEffect(() => {
    const init = async () => {
      // Ambil data lokal dulu supaya tidak blank
      const savedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS);
      const savedAttendance = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      const savedActivities = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      const savedSchedules = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      
      if (savedMembers) setMembers(JSON.parse(savedMembers));
      if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
      if (savedActivities) setActivities(JSON.parse(savedActivities));
      if (savedSchedules) setSchedules(JSON.parse(savedSchedules));

      // Baru kemudian tarik dari Cloud
      await fetchFromCloud();
    };
    init();
  }, [fetchFromCloud]);

  // --- 3. Fungsi Sinkronisasi (Kirim ke Cloud) ---
  const syncToCloud = useCallback(async (currentData: any) => {
    // PROTEKSI: Jika belum selesai loading awal, jangan kirim data (menghindari timpa data kosong)
    if (!webAppUrl || !isInitialized) return;

    setIsSyncing(true);
    try {
      const enrichedAttendance = currentData.attendance.map((att: any) => {
        const member = currentData.members.find((m: any) => m.id === att.memberId);
        return {
          ...att,
          fullName: member ? member.fullName : 'N/A',
          group: member ? member.group : 'N/A',
          activityType: att.activityType || 'Rutin'
        };
      });

      const payload = {
        ...currentData,
        attendance: enrichedAttendance
      };

      // Gunakan text/plain untuk menghindari masalah CORS di Google Apps Script
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      setLastSync(new Date().toLocaleTimeString());
      setErrorSync(null);
    } catch (error) {
      setErrorSync("Gagal sinkron ke Cloud.");
    } finally {
      setIsSyncing(false);
    }
  }, [webAppUrl, isInitialized]);

  // --- 4. Auto-Sync Logic ---
  useEffect(() => {
    // JANGAN eksekusi apapun jika inisialisasi belum selesai
    if (!isInitialized) return;

    // Simpan ke Local Storage (Selalu)
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendance));
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedules));
    
    // Kirim ke Cloud dengan Debounce (tunggu 5 detik setelah perubahan terakhir)
    const timeoutId = setTimeout(() => {
      syncToCloud({ members, attendance, activities, schedules });
    }, 5000); 

    return () => clearTimeout(timeoutId);
  }, [members, attendance, activities, schedules, syncToCloud, isInitialized]);

  // --- Handler Functions ---
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const u = fd.get('username') as string;
    const p = fd.get('password') as string;
    const found = MOCK_USERS.find(user => user.username === u && user.password === p);
    if (found) {
      setUser({ username: found.username, role: found.role });
      setView('dashboard');
    } else alert('Login Gagal! Periksa username/password.');
  };

  const submitAttendance = (record: Omit<Attendance, 'id' | 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    const isDuplicate = attendance.some(a => a.memberId === record.memberId && a.date === today && a.activityType === record.activityType);
    
    if (isDuplicate) {
      alert('Sistem Menolak: Anda sudah melakukan presensi hari ini.');
      return;
    }

    const newAttendance: Attendance = {
      ...record,
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: today
    };

    setAttendance(prev => [...prev, newAttendance]);
    alert('Alhamdulillah, presensi berhasil dicatat!');
    setView('home');
  };

  const updateAttendance = (id: string, updated: Partial<Attendance>) => {
    setAttendance(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
  };

  const deleteAttendance = (id: string) => {
    if (confirm('Hapus data presensi ini?')) {
      setAttendance(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDFA] text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden">
      {initialLoading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-teal-800 font-semibold tracking-wide px-6 text-center">Menghubungkan Database Cloud...</p>
        </div>
      )}

      {view === 'home' && <HomeView onNavigate={setView} schedules={schedules} isSyncing={isSyncing} error={errorSync} />}
      {view === 'login' && <LoginView onLogin={handleLogin} onBack={() => setView('home')} />}
      {view === 'presensi' && (
        <PresensiView 
          participants={members.filter(m => m.activityStatus === 'Aktif')} 
          activities={activities} 
          attendance={attendance} 
          onSubmit={submitAttendance} 
          onBack={() => setView('home')} 
        />
      )}
      
      {view === 'dashboard' && user && (
        <DashboardLayout 
          user={user} 
          activeMenu={activeMenu} 
          onMenuChange={setActiveMenu} 
          onLogout={() => { setUser(null); setView('home'); }} 
          isSyncing={isSyncing} 
          lastSync={lastSync} 
          onManualSync={() => syncToCloud({ members, attendance, activities, schedules })}
        >
          {activeMenu === 'dashboard' && <OverviewDashboard members={members} attendance={attendance} user={user} />}
          {activeMenu === 'members' && (
             <MemberManagement 
               members={user.role === 'Admin' ? members : members.filter(m => m.group === user.role.replace('Ketua MM ', ''))} 
               user={user} 
               onAdd={(m) => setMembers(p => [...p, { ...m, id: `id-${Date.now()}` } as Member])} 
               onUpdate={(id, u) => setMembers(p => p.map(m => m.id === id ? { ...m, ...u } as Member : m))} 
               onDelete={(id) => confirm('Hapus data?') && setMembers(p => p.filter(m => m.id !== id))} 
             />
          )}
          {activeMenu === 'rekap' && <RekapView members={members} attendance={attendance} activities={activities} user={user} onUpdateAtt={updateAttendance} onDeleteAtt={deleteAttendance} />}
          {activeMenu === 'activities' && (
            <ActivityManagement 
              activities={activities} 
              user={user} 
              onAdd={(a) => setActivities(p => [...p, { ...a, id: `act-${Date.now()}` }])} 
              onUpdate={(id, u) => setActivities(p => p.map(a => a.id === id ? { ...a, ...u } as Activity : a))} 
              onDelete={(id) => confirm('Hapus?') && setActivities(p => p.filter(a => a.id !== id))} 
            />
          )}
          {activeMenu === 'schedule' && (
            <ScheduleManagement 
              schedules={schedules} 
              user={user} 
              onAdd={(s) => setSchedules(p => [...p, { ...s, id: `sch-${Date.now()}` }])} 
              onUpdate={(id, u) => setSchedules(p => p.map(s => s.id === id ? { ...s, ...u } as Schedule : s))} 
              onDelete={(id) => confirm('Hapus?') && setSchedules(p => p.filter(s => s.id !== id))} 
            />
          )}
          {activeMenu === 'download' && <DataManagementView members={members} attendance={attendance} onImportMembers={setMembers} onImportAttendance={setAttendance} />}
          {activeMenu === 'settings' && (
            <SettingsView 
              currentUrl={webAppUrl} 
              onSave={(u) => { 
                setWebAppUrl(u); 
                localStorage.setItem(STORAGE_KEY_WEBAPP_URL, u); 
                setIsInitialized(false); // Reset init supaya download ulang dari URL baru
                fetchFromCloud(); 
              }} 
            />
          )}
        </DashboardLayout>
      )}
    </div>
  );
};

// Sisa komponen (HomeView, PresensiView, DashboardLayout, dll) tetap menggunakan struktur yang Anda miliki 
// namun pastikan mereka menerima props yang dikirim dari App di atas.
export default App;