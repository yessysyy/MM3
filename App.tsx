
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  ClipboardCheck, 
  Download, 
  LogOut, 
  LogIn, 
  Info, 
  Plus,
  Trash2,
  Edit2,
  Search,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  TrendingUp,
  UserCheck,
  Settings,
  Cloud,
  RefreshCw,
  Database,
  ArrowRight,
  Phone,
  MessageSquare,
  MessageCircle,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  Users2,
  UserRound,
  Upload,
  X,
  FileQuestion,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Percent,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Heart,
  School,
  Award,
  Book,
  Menu as MenuIcon,
  MoreHorizontal,
  CheckCircle2,
  User as UserIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Member, Attendance, User as UserType, AttendanceStatus, Activity, Schedule, Education } from './types';
import { GROUPS, BUSY_STATUSES, ACTIVITY_STATUSES, EDUCATIONS, CATEGORIES, ATTENDANCE_STATUSES, MOCK_USERS, GENDER_OPTIONS, DAYS, DEFAULT_CLOUD_URL } from './constants';

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
  
  const [webAppUrl, setWebAppUrl] = useState<string>(DEFAULT_CLOUD_URL || localStorage.getItem(STORAGE_KEY_WEBAPP_URL) || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [errorSync, setErrorSync] = useState<string | null>(null);

  // Initial Load from Local & Cloud
  useEffect(() => {
    const init = async () => {
      const savedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS);
      const savedAttendance = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      const savedActivities = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      const savedSchedules = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      
      if (savedMembers) setMembers(JSON.parse(savedMembers));
      if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
      if (savedActivities) setActivities(JSON.parse(savedActivities));
      if (savedSchedules) setSchedules(JSON.parse(savedSchedules));

      if (webAppUrl) await fetchFromCloud();
    };
    init();
  }, [webAppUrl]);

  const fetchFromCloud = async () => {
    if (!webAppUrl) return;
    setInitialLoading(true);
    setIsSyncing(true);
    setErrorSync(null);
    try {
      const response = await fetch(webAppUrl);
      if (!response.ok) throw new Error("Gagal mengambil data");
      const data = await response.json();
      setMembers(data.members || []);
      useEffect(() => {
  const local = localStorage.getItem("attendance");
  if (local) {
    setAttendance(JSON.parse(local));
  }
}, []);
      setActivities(data.activities || []);
      setSchedules(data.schedules || []);
      setLastSync(new Date().toLocaleTimeString());
    } catch (error) {
      setErrorSync("Cloud belum siap. Pastikan URL sudah benar!");
    } finally {
      setIsSyncing(false);
      setInitialLoading(false);
    }
  };

  const syncToCloud = useCallback(async (currentData: any) => {
    if (!webAppUrl) return;
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

      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      setLastSync(new Date().toLocaleTimeString());
      setErrorSync(null);
    } catch (error) {
      setErrorSync("Gagal sinkron ke Spreadsheet.");
    } finally {
      setIsSyncing(false);
    }
  }, [webAppUrl]);

  // AUTO-SYNC LOGIC
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
    localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(attendance));
    localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
    localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedules));
    
    if (!initialLoading && webAppUrl) {
      const timeoutId = setTimeout(() => {
        syncToCloud({ members, attendance, activities, schedules });
      }, 5000); 
      return () => clearTimeout(timeoutId);
    }
  }, [members, attendance, activities, schedules, syncToCloud, initialLoading, webAppUrl]);

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
      {view === 'presensi' && <PresensiView participants={members.filter(m => m.activityStatus === 'Aktif')} activities={activities} attendance={attendance} onSubmit={submitAttendance} onBack={() => setView('home')} />}
      
      {view === 'dashboard' && user && (
        <DashboardLayout user={user} activeMenu={activeMenu} onMenuChange={setActiveMenu} onLogout={() => { setUser(null); setView('home'); }} isSyncing={isSyncing} lastSync={lastSync} onManualSync={() => syncToCloud({ members, attendance, activities, schedules })}>
          {activeMenu === 'dashboard' && <OverviewDashboard members={members} attendance={attendance} user={user} />}
          {activeMenu === 'members' && <MemberManagement members={user.role === 'Admin' ? members : members.filter(m => m.group === user.role.replace('Ketua MM ', ''))} user={user} onAdd={(m) => setMembers(p => [...p, { ...m, id: `id-${Date.now()}` } as Member])} onUpdate={(id, u) => setMembers(p => p.map(m => m.id === id ? { ...m, ...u } as Member : m))} onDelete={(id) => confirm('Hapus data?') && setMembers(p => p.filter(m => m.id !== id))} />}
          {activeMenu === 'rekap' && <RekapView members={members} attendance={attendance} activities={activities} user={user} onUpdateAtt={updateAttendance} onDeleteAtt={deleteAttendance} />}
          {activeMenu === 'activities' && <ActivityManagement activities={activities} user={user} onAdd={(a) => setActivities(p => [...p, { ...a, id: `act-${Date.now()}` }])} onUpdate={(id, u) => setActivities(p => p.map(a => a.id === id ? { ...a, ...u } as Activity : a))} onDelete={(id) => confirm('Hapus?') && setActivities(p => p.filter(a => a.id !== id))} />}
          {activeMenu === 'schedule' && <ScheduleManagement schedules={schedules} user={user} onAdd={(s) => setSchedules(p => [...p, { ...s, id: `sch-${Date.now()}` }])} onUpdate={(id, u) => setSchedules(p => p.map(s => s.id === id ? { ...s, ...u } as Schedule : s))} onDelete={(id) => confirm('Hapus?') && setSchedules(p => p.filter(s => s.id !== id))} />}
          {activeMenu === 'download' && <DataManagementView members={members} attendance={attendance} onImportMembers={setMembers} onImportAttendance={setAttendance} />}
          {activeMenu === 'settings' && <SettingsView currentUrl={webAppUrl} onSave={(u) => { setWebAppUrl(u); localStorage.setItem(STORAGE_KEY_WEBAPP_URL, u); fetchFromCloud(); }} />}
        </DashboardLayout>
      )}
    </div>
  );
};

// --- Sub-Views ---
const HomeView: React.FC<{ onNavigate: (v: any) => void, schedules: Schedule[], isSyncing: boolean, error?: string | null }> = ({ onNavigate, schedules, isSyncing, error }) => {
  const [showSchedule, setShowSchedule] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 text-center bg-teal-50/20 relative">
      <div className="mb-8 md:mb-12 space-y-4 max-w-2xl">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] border shadow-sm ${error ? 'bg-red-50 text-red-600 border-red-200' : 'bg-teal-100/50 text-teal-700 border-teal-200'}`}>
          {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : (error ? <AlertCircle size={12} /> : <Cloud size={12} />)} 
          {error ? 'Gagal Sinkron' : 'Portal Remaja LDII PC Semampir'}
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-teal-950 uppercase tracking-tight leading-tight">Sistem Informasi</h1>
        <p className="text-slate-500 max-w-xl mx-auto font-medium text-sm md:text-base">Manajemen Database & Presensi Terpadu</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl">
        <HomeCard icon={<Info size={28} className="text-teal-600" />} title="Info Rutinan" desc="Cek jadwal pengajian mingguan." onClick={() => setShowSchedule(true)} />
        <HomeCard icon={<ClipboardCheck size={28} className="text-white" />} title="Presensi Online" desc="Isi kehadiranmu secara mandiri." onClick={() => onNavigate('presensi')} featured />
        <HomeCard icon={<LogIn size={28} className="text-teal-600" />} title="Akses Pengurus" desc="Dashboard Admin & Ketua Remaja." onClick={() => onNavigate('login')} />
      </div>

      {showSchedule && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowSchedule(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
            <div className="text-center mb-6 md:mb-8">
              <div className="inline-block p-4 bg-teal-50 text-teal-600 rounded-3xl mb-4"><Calendar size={32} /></div>
              <h2 className="text-2xl font-black text-teal-950 uppercase">Jadwal Rutinan</h2>
            </div>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {schedules.length > 0 ? schedules.map(s => (
                <div key={s.id} className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-between">
                  <div className="text-left">
                    <h4 className="font-black text-teal-900 text-sm">{s.activityName}</h4>
                    <p className="text-[10px] font-bold text-teal-600/70">
                      {s.date ? `${s.date} (${s.day})` : s.day} • {s.time} WIB
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1 justify-end"><MapPin size={10}/> {s.location || 'Masjid'}</p>
                  </div>
                </div>
              )) : <p className="text-center text-slate-400 font-bold italic py-10">Belum ada jadwal rutin yang diatur.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HomeCard: React.FC<{ icon: React.ReactNode, title: string, desc: string, onClick: () => void, featured?: boolean }> = ({ icon, title, desc, onClick, featured }) => (
  <button onClick={onClick} className={`p-6 md:p-8 text-left rounded-[1.5rem] md:rounded-[2rem] transition-all duration-300 transform active:scale-95 md:hover:-translate-y-2 flex flex-col items-start ${featured ? 'bg-teal-600 text-white shadow-xl shadow-teal-500/20' : 'bg-white hover:shadow-lg border border-teal-100 hover:border-teal-300 shadow-sm'}`}>
    <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-2xl ${featured ? 'bg-white/20' : 'bg-teal-50'}`}>{icon}</div>
    <h3 className={`text-lg md:text-xl font-bold mb-2 ${featured ? 'text-white' : 'text-teal-950'}`}>{title}</h3>
    <p className={`text-xs md:text-sm font-medium leading-relaxed ${featured ? 'text-teal-50' : 'text-slate-400'}`}>{desc}</p>
    <div className={`mt-6 md:mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${featured ? 'text-teal-100' : 'text-teal-600'}`}>Buka <ArrowRight size={14} /></div>
  </button>
);

const PresensiView: React.FC<{ participants: Member[], activities: Activity[], attendance: Attendance[], onSubmit: (r: any) => void, onBack: () => void }> = ({ participants, activities, attendance, onSubmit, onBack }) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [act, setAct] = useState(activities[0]?.name || 'Rutin');
  const [status, setStatus] = useState<AttendanceStatus>('Hadir');
  const [feedback, setFeedback] = useState('');
  
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => 
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.group.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [participants, searchTerm]);

  const isDuplicateToday = useMemo(() => {
    if (!selectedMemberId) return false;
    return attendance.some(a => a.memberId === selectedMemberId && a.date === today && a.activityType === act);
  }, [selectedMemberId, today, act, attendance]);

  const selectedMember = useMemo(() => 
    participants.find(p => p.id === selectedMemberId), 
    [participants, selectedMemberId]
  );

  const isEvent = useMemo(() => act.toLowerCase().includes('event') || act.toLowerCase().includes('kegiatan') || act.toLowerCase().includes('gathering'), [act]);
  const needsReason = status === 'Izin' || status === 'Sakit';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicateToday) return;
    if (!selectedMemberId) {
      alert('Silakan pilih nama Anda!');
      return;
    }
    if (needsReason && !feedback.trim()) {
      alert(`Silakan isi alasan ${status} terlebih dahulu.`);
      return;
    }
    onSubmit({ memberId: selectedMemberId, activityType: act, status, feedback });
  };

  return (
    <div className="min-h-screen bg-teal-600 p-4 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl p-6 md:p-14 border animate-in zoom-in-95 duration-500">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-block p-4 bg-teal-50 text-teal-600 rounded-3xl mb-4"><ClipboardCheck size={32} /></div>
          <h2 className="text-2xl md:text-3xl font-black text-teal-950 uppercase">Presensi Online</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Cari & Pilih Nama Anda</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Ketik nama untuk mencari..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-teal-900 focus:border-teal-400 outline-none transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="h-48 overflow-y-auto border-2 border-slate-50 rounded-2xl bg-slate-50/30 custom-scrollbar p-2 space-y-2">
              {filteredParticipants.length > 0 ? filteredParticipants.map(p => {
                const already = attendance.some(a => a.memberId === p.id && a.date === today && a.activityType === act);
                const isSelected = selectedMemberId === p.id;
                
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={already}
                    onClick={() => {
                      setSelectedMemberId(p.id);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all active:scale-95 ${
                      isSelected 
                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' 
                        : already 
                          ? 'bg-slate-100 opacity-60 grayscale cursor-not-allowed' 
                          : 'bg-white hover:bg-teal-50 border border-transparent hover:border-teal-200'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-teal-950'}`}>{p.fullName}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>{p.group}</span>
                    </div>
                    {already && <div className="flex items-center gap-1.5 px-2 py-1 bg-white/20 rounded-lg text-[8px] font-black uppercase text-red-500"><XCircle size={10} /> Sudah Absen</div>}
                    {isSelected && <CheckCircle2 size={18} className="text-teal-100" />}
                  </button>
                );
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                  <UserIcon size={32} className="opacity-20 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest italic">Nama tidak ditemukan</p>
                </div>
              )}
            </div>
          </div>

          {selectedMemberId && (
             <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center justify-between animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-teal-600 font-black border shadow-sm">{selectedMember?.fullName[0]}</div>
                   <div>
                      <p className="text-[8px] font-bold text-teal-600 uppercase">Terpilih:</p>
                      <h4 className="text-xs font-black text-teal-950">{selectedMember?.fullName}</h4>
                   </div>
                </div>
                <button type="button" onClick={() => setSelectedMemberId('')} className="p-2 text-slate-400 hover:text-red-500"><X size={18}/></button>
             </div>
          )}

          {isDuplicateToday && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in shake duration-300">
               <XCircle size={20} className="shrink-0" />
               <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-tight">Sistem Menolak!</p>
                  <p className="text-[10px] font-medium opacity-80">Anda sudah melakukan presensi untuk kegiatan {act} hari ini.</p>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Kegiatan</label>
              <select className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-teal-900 outline-none focus:border-teal-400" value={act} onChange={(e) => setAct(e.target.value)}>
                {activities.length > 0 ? activities.map(a => <option key={a.id} value={a.name}>{a.name}</option>) : <option value="Rutin">Rutin</option>}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Status Kehadiran</label>
              <div className="grid grid-cols-2 gap-2">
                {ATTENDANCE_STATUSES.map(s => (
                  <button key={s} type="button" disabled={isDuplicateToday} onClick={() => { setStatus(s); if(s === 'Hadir' || s === 'Alfa') setFeedback(''); }} className={`py-3 rounded-xl font-black text-[10px] uppercase border transition-all ${isDuplicateToday ? 'opacity-50 cursor-not-allowed' : ''} ${status === s ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {!isDuplicateToday && (needsReason || isEvent) && (
            <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
              <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest px-1 flex items-center gap-2">
                {needsReason ? <><FileQuestion size={14} /> Berikan Alasan {status}</> : <><MessageCircle size={14} /> Kesan & Pesan Kegiatan</>}
              </label>
              <textarea className={`w-full p-4 border rounded-2xl outline-none font-semibold text-slate-700 h-24 md:h-28 transition-all ${needsReason ? 'bg-amber-50 border-amber-100 focus:border-amber-400' : 'bg-teal-50 border-teal-100 focus:border-teal-400'}`} placeholder={needsReason ? "Berikan alasan singkat..." : "Tuliskan kesan atau saran Anda untuk kegiatan ini..."} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>
          )}

          <div className="pt-4 md:pt-6 space-y-4">
            <button 
              type="submit" 
              disabled={isDuplicateToday || !selectedMemberId}
              className={`w-full py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black text-base md:text-lg shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 ${isDuplicateToday || !selectedMemberId ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white shadow-teal-500/20 hover:bg-teal-700 hover:scale-[1.01]'}`}
            >
              {isDuplicateToday ? <><XCircle size={20}/> Sudah Presensi</> : !selectedMemberId ? 'Pilih Nama Anda' : 'Kirim Presensi'}
            </button>
            <button type="button" onClick={onBack} className="w-full text-slate-300 font-bold text-[10px] uppercase tracking-widest hover:text-slate-500 transition-colors">Batal & Kembali</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{ user: UserType, activeMenu: MenuState, onMenuChange: (m: MenuState) => void, onLogout: () => void, isSyncing: boolean, lastSync: string | null, onManualSync: () => void, children: React.ReactNode }> = ({ user, activeMenu, onMenuChange, onLogout, isSyncing, lastSync, onManualSync, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col shrink-0 text-slate-400 p-6">
        <div className="mb-10 text-white flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-teal-500/20">M</div>
          <h1 className="font-bold text-lg tracking-tight uppercase">Dashboard</h1>
        </div>
        <nav className="space-y-1">
          <SideBtn active={activeMenu === 'dashboard'} onClick={() => onMenuChange('dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SideBtn active={activeMenu === 'members'} onClick={() => onMenuChange('members')} icon={<Users size={18} />} label="Database" />
          <SideBtn active={activeMenu === 'rekap'} onClick={() => onMenuChange('rekap')} icon={<ClipboardCheck size={18} />} label="Rekapitulasi" />
          <SideBtn active={activeMenu === 'activities'} onClick={() => onMenuChange('activities')} icon={<Layers size={18} />} label="Kegiatan" />
          <SideBtn active={activeMenu === 'schedule'} onClick={() => onMenuChange('schedule')} icon={<Calendar size={18} />} label="Jadwal" />
          <SideBtn active={activeMenu === 'download'} onClick={() => onMenuChange('download')} icon={<Download size={18} />} label="Manajemen File" />
          {user.role === 'Admin' && <SideBtn active={activeMenu === 'settings'} onClick={() => onMenuChange('settings')} icon={<Settings size={18} />} label="Cloud Setup" />}
        </nav>
        <button onClick={onLogout} className="mt-auto flex items-center gap-3 text-red-400 font-bold text-xs uppercase tracking-widest px-4 py-3 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut size={16} /> Keluar
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="px-4 md:px-8 py-3 md:py-4 bg-white/80 backdrop-blur-md border-b flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-slate-900 shadow-md">M</div>
            <button onClick={onManualSync} disabled={isSyncing} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${isSyncing ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600 hover:bg-teal-100 border'}`}>
              {isSyncing ? <RefreshCw size={10} className="animate-spin" /> : <Cloud size={10} />}
              <span className="hidden sm:inline">{isSyncing ? 'Sinkronisasi...' : (lastSync ? `Update: ${lastSync}` : 'Sync Sekarang')}</span>
              <span className="sm:hidden font-black">{isSyncing ? '...' : (lastSync ? lastSync : 'Sync')}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-right">
              <h4 className="text-[10px] md:text-xs font-bold text-slate-900 max-w-[80px] md:max-w-none truncate">{user.username}</h4>
              <p className="text-[7px] md:text-[8px] text-slate-400 uppercase font-black tracking-widest">{user.role === 'Admin' ? 'Administrator' : 'Ketua Remaja'}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">{user.username[0].toUpperCase()}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-8">
          <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-1 py-2 flex justify-around items-center z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <MobileNavBtn active={activeMenu === 'dashboard'} onClick={() => { onMenuChange('dashboard'); setMobileMenuOpen(false); }} icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <MobileNavBtn active={activeMenu === 'members'} onClick={() => { onMenuChange('members'); setMobileMenuOpen(false); }} icon={<Users size={20} />} label="Database" />
          <MobileNavBtn active={activeMenu === 'rekap'} onClick={() => { onMenuChange('rekap'); setMobileMenuOpen(false); }} icon={<ClipboardCheck size={20} />} label="Rekap" />
          <MobileNavBtn active={activeMenu === 'schedule'} onClick={() => { onMenuChange('schedule'); setMobileMenuOpen(false); }} icon={<Calendar size={20} />} label="Jadwal" />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`flex flex-col items-center gap-1 p-2 transition-all ${mobileMenuOpen ? 'text-teal-600' : 'text-slate-400'}`}>
            <div className={`p-1 rounded-lg ${mobileMenuOpen ? 'bg-teal-50' : ''}`}><MoreHorizontal size={20} /></div>
            <span className="text-[8px] font-black uppercase tracking-widest">Lainnya</span>
          </button>
        </nav>

        {/* Mobile Overlay Menu - Centered Modal Style */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[45] bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
                <div className="flex justify-between items-center mb-6 px-2">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Menu Tambahan</h3>
                   <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={20}/></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <MobileOverlayBtn active={activeMenu === 'activities'} onClick={() => { onMenuChange('activities'); setMobileMenuOpen(false); }} icon={<Layers size={20}/>} label="Kegiatan" />
                   <MobileOverlayBtn active={activeMenu === 'download'} onClick={() => { onMenuChange('download'); setMobileMenuOpen(false); }} icon={<Download size={20}/>} label="File" />
                   {user.role === 'Admin' && <MobileOverlayBtn active={activeMenu === 'settings'} onClick={() => { onMenuChange('settings'); setMobileMenuOpen(false); }} icon={<Settings size={20}/>} label="Cloud" />}
                   <button onClick={onLogout} className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-xs uppercase transition-all active:scale-95 border border-red-100">
                      <LogOut size={18} /> Keluar
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MobileNavBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-all active:scale-90 ${active ? 'text-teal-600' : 'text-slate-400'}`}>
    <div className={`p-1 rounded-lg ${active ? 'bg-teal-50' : ''}`}>{icon}</div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const MobileOverlayBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 p-4 rounded-2xl font-bold text-xs uppercase transition-all active:scale-95 ${active ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
    {icon} {label}
  </button>
);

const SideBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all font-bold text-xs ${active ? 'bg-teal-600 text-white shadow-xl shadow-teal-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>{icon} {label}</button>
);

const OverviewDashboard: React.FC<{ members: Member[], attendance: Attendance[], user: UserType }> = ({ members, attendance, user }) => {
  const groupName = user.role.replace('Ketua MM ', '');
  const filteredMembers = user.role === 'Admin' ? members : members.filter(m => m.group === groupName);
  
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const presentToday = attendance.filter(a => a.date === today && a.status === 'Hadir' && (user.role === 'Admin' || members.find(m => m.id === a.memberId)?.group === groupName)).length;
    const activeOnly = filteredMembers.filter(m => m.activityStatus === 'Aktif');
    const eduStats = EDUCATIONS.reduce((acc, edu) => {
      acc[edu] = activeOnly.filter(m => m.education === edu).length;
      return acc;
    }, {} as Record<string, number>);

    return {
      activeTotal: activeOnly.length,
      male: activeOnly.filter(m => m.gender === 'Laki-laki').length,
      female: activeOnly.filter(m => m.gender === 'Perempuan').length,
      today: presentToday,
      smpCat: activeOnly.filter(m => m.category === 'SMP').length,
      smaCat: activeOnly.filter(m => m.category === 'SMA').length,
      smkCat: activeOnly.filter(m => m.category === 'SMK').length,
      praNikahCat: activeOnly.filter(m => m.category === 'Pra-Nikah').length,
      educations: eduStats
    };
  }, [members, attendance, user, groupName, filteredMembers]);

  return (
    <div className="space-y-6 md:space-y-10 pb-4">
      <section>
        <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Layers size={14} className="text-teal-500" /> Dashboard Ringkasan (Aktif)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <DashCard label="MUDA-MUDI AKTIF" value={stats.activeTotal.toString()} icon={<Users size={20} />} color="teal" />
          <DashCard label="LAKI-LAKI" value={stats.male.toString()} icon={<UserRound size={20} />} color="blue" />
          <DashCard label="PEREMPUAN" value={stats.female.toString()} icon={<UserRound size={20} />} color="pink" />
          <DashCard label="HADIR HARI INI" value={stats.today.toString()} icon={<UserCheck size={20} />} color="emerald" />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10">
        <section>
          <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Database size={14} className="text-teal-500" /> Kategori Kelompok
          </h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <CategoryCard label="SMP" value={stats.smpCat} icon={<BookOpen size={18} />} color="indigo" />
            <CategoryCard label="SMA" value={stats.smaCat} icon={<GraduationCap size={18} />} color="blue" />
            <CategoryCard label="SMK" value={stats.smkCat} icon={<School size={18} />} color="amber" />
            <CategoryCard label="Pra-Nikah" value={stats.praNikahCat} icon={<Heart size={18} />} color="rose" />
          </div>
        </section>

        <section>
          <h2 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <GraduationCap size={14} className="text-teal-500" /> Pendidikan Terakhir
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {EDUCATIONS.slice(0, 6).map((edu) => (
              <div key={edu} className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 flex items-center gap-3">
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                    <Book size={16} />
                 </div>
                 <div>
                    <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{edu}</p>
                    <p className="text-sm md:text-base font-black text-slate-800">{stats.educations[edu] || 0}</p>
                 </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-teal-600" /> Keaktifan Per Kelompok
          </h3>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GROUPS.map(g => ({ name: g, val: attendance.filter(a => members.find(m => m.id === a.memberId)?.group === g).length }))}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8}} />
                <Tooltip cursor={{fill: '#f0fdfa'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px'}} />
                <Bar dataKey="val" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[1.5rem] md:rounded-[2.5rem] border shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-900 mb-2 font-black uppercase text-[10px] tracking-widest text-slate-400">Gender (Aktif)</h3>
          <div className="h-40 md:h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ name: 'Laki-laki', value: stats.male }, { name: 'Perempuan', value: stats.female }]} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  <Cell fill="#0ea5e9" />
                  <Cell fill="#ec4899" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div> L
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
              <div className="w-2 h-2 rounded-full bg-pink-500"></div> P
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-5 md:p-6 rounded-[1.25rem] md:rounded-[2rem] border shadow-sm flex items-center justify-between transition-all md:hover:-translate-y-1">
    <div>
      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl md:text-2xl font-black text-slate-800">{value}</p>
    </div>
    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-${color}-50 text-${color}-600`}>{icon}</div>
  </div>
);

const CategoryCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border border-slate-100 flex items-center gap-3 md:gap-4 transition-all hover:border-teal-100">
    <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-${color}-50 text-${color}-600`}>{icon}</div>
    <div>
      <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-base md:text-lg font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const MemberManagement: React.FC<{ members: Member[], user: UserType, onAdd: (m: any) => void, onUpdate: (id: string, u: any) => void, onDelete: (id: string) => void }> = ({ members, user, onAdd, onUpdate, onDelete }) => {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const filtered = members.filter(m => (m.fullName || '').toLowerCase().includes(search.toLowerCase()));
  const current = members.find(m => m.id === editing);

  const handleSubmit = (e: any) => { 
    e.preventDefault(); 
    const fd = new FormData(e.currentTarget); 
    const data = Object.fromEntries(fd.entries()); 
    if (user.role !== 'Admin') data.group = user.role.replace('Ketua MM ', ''); 
    if (editing) onUpdate(editing, data); else onAdd(data); 
    setShow(false); setEditing(null); 
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl md:rounded-2xl shadow-sm border gap-4">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
          <input type="text" placeholder="Cari nama..." className="bg-slate-50 pl-10 pr-4 py-2 md:py-2.5 rounded-xl outline-none text-xs md:text-sm font-semibold border focus:border-teal-400 w-full" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setEditing(null); setShow(true); }} className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10">
          <Plus size={16} /> <span className="sm:inline">Tambah Anggota</span>
        </button>
      </div>
      
      <div className="bg-white rounded-[1.25rem] md:rounded-[2rem] border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-teal-50/50 border-b">
              <tr className="text-[8px] md:text-[10px] font-bold uppercase text-slate-400">
                <th className="px-4 md:px-6 py-3 md:py-4 text-center w-12">No</th>
                <th className="px-4 md:px-6 py-3 md:py-4">Biodata</th>
                <th className="px-4 md:px-6 py-3 md:py-4">Kelompok</th>
                <th className="px-4 md:px-6 py-3 md:py-4">Status</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-50">
              {filtered.map((m, i) => (
                <tr key={m.id} className="hover:bg-teal-50/20">
                  <td className="px-4 md:px-6 py-3 md:py-4 text-center text-xs font-bold text-slate-300">{i + 1}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="font-bold text-teal-950 text-xs md:text-sm">{m.fullName}</div>
                    <div className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">{m.gender} • {m.category}</div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-teal-600 uppercase tracking-wider">{m.group}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-[8px] md:text-[9px] font-bold uppercase ${m.activityStatus === 'Aktif' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-500'}`}>
                      {m.activityStatus}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right flex justify-end gap-1 md:gap-2">
                    <button onClick={() => { setEditing(m.id); setShow(true); }} className="p-2 md:p-2.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-600 hover:text-white transition-all">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => onDelete(m.id)} className="p-2 md:p-2.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-bold italic">Tidak ada data anggota.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl animate-in zoom-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-black text-teal-950 uppercase">{editing ? 'Edit' : 'Tambah'} Anggota</h3>
              <button onClick={() => setShow(false)} className="p-2 text-slate-300 hover:text-red-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              <InputRow label="Nama Lengkap" name="fullName" def={current?.fullName} required />
              <InputRow label="No WhatsApp" name="whatsapp" def={current?.whatsapp} required />
              <InputRow label="TTL" name="ttl" def={current?.ttl} />
              <SelectRow label="Gender" name="gender" opts={GENDER_OPTIONS} def={current?.gender} />
              <div className="sm:col-span-2">
                <textarea name="address" defaultValue={current?.address} className="w-full p-4 bg-slate-50 border rounded-xl md:rounded-2xl outline-none focus:border-teal-400 text-xs md:text-sm h-24 md:h-28" placeholder="Alamat lengkap..." />
              </div>
              <InputRow label="Ayah" name="fatherName" def={current?.fatherName} />
              <InputRow label="Ibu" name="motherName" def={current?.motherName} />
              <SelectRow label="Pendidikan" name="education" opts={EDUCATIONS} def={current?.education} />
              <SelectRow label="Kategori" name="category" opts={CATEGORIES} def={current?.category} />
              <SelectRow label="Keaktifan" name="activityStatus" opts={ACTIVITY_STATUSES} def={current?.activityStatus} />
              {user.role === 'Admin' ? (
                <SelectRow label="Kelompok" name="group" opts={GROUPS} def={current?.group} />
              ) : (
                <div className="p-4 bg-teal-50 rounded-xl font-bold text-[10px] text-teal-700 uppercase flex items-center gap-2">
                  <MapPin size={12}/> {user.role.replace('Ketua MM ', '')}
                </div>
              )}
              <div className="sm:col-span-2 flex justify-end gap-3 pt-6 md:pt-8 border-t">
                <button type="button" onClick={() => setShow(false)} className="px-4 py-2 font-bold text-[10px] uppercase text-slate-400">Batal</button>
                <button type="submit" className="flex-1 sm:flex-none px-10 py-3 md:py-3.5 bg-teal-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-teal-500/20">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const RekapView: React.FC<{ members: Member[], attendance: Attendance[], activities: Activity[], user: UserType, onUpdateAtt: (id: string, u: any) => void, onDeleteAtt: (id: string) => void }> = ({ members, attendance, activities, user, onUpdateAtt, onDeleteAtt }) => {
  const [filterMode, setFilterMode] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedActivity, setSelectedActivity] = useState('All');
  
  // State for Editing
  const [editingAttId, setEditingAttId] = useState<string | null>(null);
  const currentEditingAtt = useMemo(() => attendance.find(a => a.id === editingAttId), [attendance, editingAttId]);

  const groupName = user.role.replace('Ketua MM ', '');

  const filtered = useMemo(() => {
    return attendance.filter(a => {
      const m = members.find(mem => mem.id === a.memberId);
      const isCorrectGroup = user.role === 'Admin' || m?.group === groupName;
      const isCorrectActivity = selectedActivity === 'All' || a.activityType === selectedActivity;
      
      let isCorrectTime = false;
      const aDate = new Date(a.date);
      if (filterMode === 'daily') isCorrectTime = a.date === date;
      else if (filterMode === 'monthly') isCorrectTime = (aDate.getMonth() + 1) === selectedMonth && aDate.getFullYear() === selectedYear;
      else if (filterMode === 'yearly') isCorrectTime = aDate.getFullYear() === selectedYear;

      return isCorrectGroup && isCorrectActivity && isCorrectTime;
    });
  }, [attendance, members, user.role, groupName, selectedActivity, filterMode, date, selectedMonth, selectedYear]);

  const globalStats = useMemo(() => {
    const total = filtered.length;
    const hadir = filtered.filter(a => a.status === 'Hadir').length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { total, hadir, percentage };
  }, [filtered]);

  const individualStats = useMemo(() => {
    const relevantMembers = (user.role === 'Admin' ? members : members.filter(m => m.group === groupName)).filter(m => m.activityStatus === 'Aktif');
    return relevantMembers.map(m => {
      const mAtt = filtered.filter(a => a.memberId === m.id);
      const mHadir = mAtt.filter(a => a.status === 'Hadir').length;
      const mPercentage = mAtt.length > 0 ? Math.round((mHadir / mAtt.length) * 100) : 0;
      return { ...m, totalAtt: mAtt.length, hadirCount: mHadir, percentage: mPercentage };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [filtered, members, user.role, groupName]);

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAttId) return;
    const fd = new FormData(e.currentTarget);
    const updatedData = {
      date: fd.get('date') as string,
      status: fd.get('status') as AttendanceStatus,
      feedback: fd.get('feedback') as string,
      activityType: fd.get('activityType') as string
    };
    onUpdateAtt(editingAttId, updatedData);
    setEditingAttId(null);
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 md:p-6 rounded-[1.25rem] md:rounded-[2rem] border shadow-sm space-y-4 md:space-y-6">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 w-full">
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 w-full sm:w-auto">
              {(['daily', 'monthly', 'yearly'] as const).map((m) => (
                <button key={m} onClick={() => setFilterMode(m)} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filterMode === m ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>{m === 'daily' ? 'Harian' : m === 'monthly' ? 'Bulan' : 'Tahun'}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 w-full">
              {filterMode === 'daily' && <div className="flex flex-col gap-1"><label className="text-[8px] font-bold text-slate-400 uppercase">Tgl</label><input type="date" className="p-2.5 bg-slate-50 border rounded-xl text-[10px] font-bold w-full" value={date} onChange={(e) => setDate(e.target.value)} /></div>}
              {(filterMode === 'monthly' || filterMode === 'yearly') && <div className="flex flex-col gap-1"><label className="text-[8px] font-bold text-slate-400 uppercase">Thn</label><select className="p-2.5 bg-slate-50 border rounded-xl text-[10px] font-bold w-full" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>{[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}</select></div>}
              {filterMode === 'monthly' && <div className="flex flex-col gap-1"><label className="text-[8px] font-bold text-slate-400 uppercase">Bln</label><select className="p-2.5 bg-slate-50 border rounded-xl text-[10px] font-bold w-full" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>{monthNames.map((m, i) => <option key={m} value={i+1}>{m}</option>)}</select></div>}
              <div className="flex flex-col gap-1 col-span-2 sm:col-span-1"><label className="text-[8px] font-bold text-slate-400 uppercase">Giat</label><select className="p-2.5 bg-slate-50 border rounded-xl text-[10px] font-bold w-full" value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}><option value="All">Semua</option>{activities.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}</select></div>
            </div>
          </div>
          <button className="w-full xl:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
            <Download size={14} /> <span className="sm:inline">Download CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-teal-50">
          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center justify-between col-span-2 sm:col-span-1">
            <div><p className="text-[8px] font-bold text-teal-600 uppercase mb-0.5">Kehadiran</p><p className="text-base font-black text-teal-900">{globalStats.percentage}%</p></div>
            <PieChartIcon size={16} className="text-teal-600" />
          </div>
          <DashCardMini label="HADIR" value={filtered.filter(a => a.status === 'Hadir').length} color="emerald" icon={<UserCheck size={14}/>} />
          <DashCardMini label="IZIN/S" value={filtered.filter(a => a.status === 'Izin' || a.status === 'Sakit').length} color="amber" icon={<Info size={14}/>} />
          <DashCardMini label="ALFA" value={filtered.filter(a => a.status === 'Alfa').length} color="red" icon={<XCircle size={14}/>} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[1.25rem] md:rounded-[2rem] border overflow-hidden shadow-sm">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-slate-50/5 flex justify-between items-center"><h3 className="text-xs md:text-sm font-bold text-teal-900">Tabel Presensi</h3><span className="text-[9px] font-bold text-slate-300 uppercase">{filtered.length} Data</span></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-teal-50/30">
                  <tr className="text-[8px] md:text-[10px] font-bold uppercase text-slate-400">
                    <th className="px-4 md:px-6 py-3">Peserta</th>
                    <th className="px-4 md:px-6 py-3">Grup</th>
                    <th className="px-4 md:px-6 py-3">Status</th>
                    <th className="px-4 md:px-6 py-3">Ket</th>
                    <th className="px-4 md:px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50">
                  {filtered.length > 0 ? filtered.map(a => {
                    const member = members.find(m => m.id === a.memberId);
                    return (
                      <tr key={a.id} className="hover:bg-teal-50/10">
                        <td className="px-4 md:px-6 py-3"><div className="text-xs font-bold text-teal-950">{member?.fullName || 'N/A'}</div><div className="text-[8px] text-slate-400 font-bold">{a.date}</div></td>
                        <td className="px-4 md:px-6 py-3 text-[10px] font-bold text-teal-600 uppercase">{member?.group || 'N/A'}</td>
                        <td className="px-4 md:px-6 py-3"><span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase ${a.status === 'Hadir' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-500'}`}>{a.status}</span></td>
                        <td className="px-4 md:px-6 py-3 text-[9px] text-slate-400 italic max-w-[100px] truncate">{a.feedback || '-'}</td>
                        <td className="px-4 md:px-6 py-3 text-right flex justify-end gap-2">
                           <button onClick={() => setEditingAttId(a.id)} className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-600 hover:text-white transition-all"><Edit2 size={12}/></button>
                           <button onClick={() => onDeleteAtt(a.id)} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12}/></button>
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan={5} className="py-12 text-center text-slate-300 font-bold italic text-xs">Belum ada data.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[1.25rem] md:rounded-[2rem] border shadow-sm p-4 md:p-6 space-y-6">
          <h3 className="text-xs md:text-sm font-bold text-teal-900 flex items-center gap-2"><Percent size={18} className="text-teal-600" /> Keaktifan (Aktif)</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {individualStats.map(stat => (
              <div key={stat.id}>
                <div className="flex justify-between items-center mb-1"><div className="text-[10px] font-bold text-slate-700">{stat.fullName}</div><div className="text-[9px] font-black text-teal-600">{stat.percentage}%</div></div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${stat.percentage >= 80 ? 'bg-teal-500' : 'bg-amber-400'}`} style={{ width: `${stat.percentage}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Attendance Modal */}
      {editingAttId && currentEditingAtt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <form onSubmit={handleUpdateSubmit} className="bg-white w-full max-md rounded-[2rem] p-6 md:p-10 shadow-2xl animate-in zoom-in overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-teal-950 uppercase tracking-tight">Edit Presensi</h3>
                 <button type="button" onClick={() => setEditingAttId(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={24}/></button>
              </div>

              <div className="space-y-5">
                 <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 mb-4">
                    <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest mb-1">Peserta</p>
                    <p className="text-sm font-black text-teal-950">{members.find(m => m.id === currentEditingAtt.memberId)?.fullName || 'N/A'}</p>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] px-1">Tanggal Kegiatan</label>
                    <input type="date" name="date" required defaultValue={currentEditingAtt.date} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-400 font-bold text-sm text-teal-900 shadow-inner" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] px-1">Giat</label>
                       <select name="activityType" defaultValue={currentEditingAtt.activityType} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-400 font-bold text-xs text-teal-900 shadow-inner">
                          {activities.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                          <option value="Rutin">Rutin</option>
                       </select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] px-1">Status</label>
                       <select name="status" defaultValue={currentEditingAtt.status} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-400 font-bold text-xs text-teal-900 shadow-inner">
                          {ATTENDANCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] px-1">Keterangan / Feedback</label>
                    <textarea name="feedback" defaultValue={currentEditingAtt.feedback} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-400 font-medium text-xs text-slate-700 shadow-inner h-24 resize-none" placeholder="Tulis alasan atau keterangan tambahan..."></textarea>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setEditingAttId(null)} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Batal</button>
                    <button type="submit" className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition-all">Simpan Perubahan</button>
                 </div>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

const DashCardMini = ({ label, value, color, icon }: any) => (
  <div className={`p-3 bg-${color}-50/50 rounded-xl border border-${color}-100 flex items-center gap-2`}>
    <div className={`p-1.5 rounded-lg bg-${color}-100 text-${color}-600 shrink-0`}>{icon}</div>
    <div className="min-w-0"><p className={`text-[7px] font-bold text-${color}-600 uppercase truncate`}>{label}</p><p className="text-sm font-black text-slate-800">{value}</p></div>
  </div>
);

const ActivityManagement: React.FC<{ activities: Activity[], user: UserType, onAdd: any, onUpdate: any, onDelete: any }> = ({ activities, user, onAdd, onUpdate, onDelete }) => {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const current = activities.find(a => a.id === editing);
  const isAdmin = user.role === 'Admin';
  const handleSubmit = (e: any) => { 
    e.preventDefault(); const fd = new FormData(e.currentTarget); const data = { name: fd.get('name'), description: fd.get('description') };
    if (editing) onUpdate(editing, data); else onAdd(data); setShow(false); setEditing(null); 
  };
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl md:rounded-2xl shadow-sm border">
        <h3 className="text-sm md:text-lg font-bold text-teal-950 px-2">Kelola Kegiatan</h3>
        {isAdmin && <button onClick={() => { setEditing(null); setShow(true); }} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-teal-500/10"><Plus size={14} /> Tambah</button>}
      </div>
      <div className="bg-white rounded-xl md:rounded-[2rem] border overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[500px]"><thead className="bg-teal-50/5 border-b"><tr className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400"><th className="px-6 py-4">Nama</th><th className="px-6 py-4">Keterangan</th>{isAdmin && <th className="px-6 py-4 text-right">Aksi</th>}</tr></thead><tbody className="divide-y divide-teal-50">{activities.map(a => (<tr key={a.id} className="hover:bg-teal-50/20"><td className="px-6 py-4 font-bold text-xs md:text-sm text-teal-900">{a.name}</td><td className="px-6 py-4 text-[10px] md:text-xs text-slate-400">{a.description || '-'}</td>{isAdmin && (<td className="px-6 py-4 text-right flex justify-end gap-2"><button onClick={() => { setEditing(a.id); setShow(true); }} className="p-2 text-teal-600 bg-teal-50 rounded-lg"><Edit2 size={12} /></button><button onClick={() => onDelete(a.id)} className="p-2 text-red-400 bg-red-50 rounded-lg"><Trash2 size={12} /></button></td>)}</tr>))}</tbody></table>
      </div>
      {show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[1.5rem] p-6 md:p-10 shadow-2xl animate-in zoom-in">
            <h3 className="text-lg font-black mb-6 text-teal-950 uppercase">{editing ? 'Edit' : 'Tambah'} Kegiatan</h3>
            <InputRow label="Nama Kegiatan" name="name" def={current?.name} required />
            <div className="space-y-1 mt-4">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Keterangan</label>
              <textarea name="description" defaultValue={current?.description} className="w-full p-4 bg-slate-50 border rounded-xl outline-none text-xs h-24" />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setShow(false)} className="px-4 py-2 text-[10px] font-bold uppercase text-slate-300">Batal</button>
              <button type="submit" className="flex-1 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-teal-500/20">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const ScheduleManagement: React.FC<{ schedules: Schedule[], user: UserType, onAdd: any, onUpdate: any, onDelete: any }> = ({ schedules, user, onAdd, onUpdate, onDelete }) => {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const current = schedules.find(s => s.id === editing);
  const isAdmin = user.role === 'Admin';
  
  const handleSubmit = (e: any) => { 
    e.preventDefault(); 
    const fd = new FormData(e.currentTarget); 
    const d = { 
      day: fd.get('day'), 
      date: fd.get('date'), 
      time: fd.get('time'), 
      activityName: fd.get('activityName'), 
      location: fd.get('location') 
    }; 
    if (editing) onUpdate(editing, d); else onAdd(d); 
    setShow(false); setEditing(null); 
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl md:rounded-2xl shadow-sm border">
        <h3 className="text-sm md:text-lg font-bold text-teal-950 px-2">Jadwal Rutinan</h3>
        {isAdmin && <button onClick={() => { setEditing(null); setShow(true); }} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-teal-500/10"><Plus size={14} /> Tambah</button>}
      </div>
      <div className="bg-white rounded-xl md:rounded-[2rem] border overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead className="bg-teal-50/5 border-b">
            <tr className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400">
              <th className="px-6 py-4">Waktu & Tanggal</th>
              <th className="px-6 py-4">Giat</th>
              <th className="px-6 py-4">Lokasi</th>
              {isAdmin && <th className="px-6 py-4 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-50">
            {schedules.map(s => (
              <tr key={s.id} className="hover:bg-teal-50/20">
                <td className="px-6 py-4">
                   <div className="font-bold text-xs text-teal-700">{s.day} / {s.time}</div>
                   {s.date && <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5"><Calendar size={10}/> {s.date}</div>}
                </td>
                <td className="px-6 py-4 font-bold text-xs text-teal-900">{s.activityName}</td>
                <td className="px-6 py-4 text-[10px] text-slate-400">{s.location || '-'}</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setEditing(s.id); setShow(true); }} className="p-2 text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-600 hover:text-white transition-all"><Edit2 size={12} /></button>
                    <button onClick={() => onDelete(s.id)} className="p-2 text-red-400 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                  </td>
                )}
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr><td colSpan={4} className="py-12 text-center text-slate-300 font-bold italic text-xs">Belum ada jadwal.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[1.5rem] p-6 md:p-10 shadow-2xl animate-in zoom-in">
            <h3 className="text-lg font-black mb-6 text-teal-950 uppercase">{editing ? 'Edit' : 'Tambah'} Jadwal</h3>
            <div className="grid grid-cols-2 gap-4">
              <SelectRow label="Hari" name="day" opts={DAYS} def={current?.day} />
              <InputRow label="Jam" name="time" def={current?.time || '18:00'} type="time" />
              <div className="col-span-2">
                 <InputRow label="Tanggal (Opsional)" name="date" def={current?.date} type="date" />
              </div>
              <div className="col-span-2"><InputRow label="Nama Kegiatan" name="activityName" def={current?.activityName} required /></div>
              <div className="col-span-2"><InputRow label="Lokasi" name="location" def={current?.location} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setShow(false)} className="px-4 py-2 text-[10px] font-bold uppercase text-slate-300">Batal</button>
              <button type="submit" className="flex-1 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-teal-500/20">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const DataManagementView: React.FC<{ members: Member[], attendance: Attendance[], onImportMembers: (m: Member[]) => void, onImportAttendance: (a: Attendance[]) => void }> = ({ members, attendance, onImportMembers, onImportAttendance }) => {
  const memberInputRef = useRef<HTMLInputElement>(null);
  const attendanceInputRef = useRef<HTMLInputElement>(null);
  const exportCSV = (data: any[], fileName: string, headers: string[]) => {
    if (!data || data.length === 0) return alert("Tidak ada data.");
    const csv = [headers.join(','), ...data.map(item => headers.map(h => {
      let v = item[h] || "";
      if (typeof v === 'string' && (v.includes(',') || v.includes('\n'))) return `"${v.replace(/"/g, '""')}"`;
      return v;
    }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${fileName}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`; a.click();
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
      <input type="file" ref={memberInputRef} className="hidden" accept=".csv" onChange={(e) => {/* Import logic */}} />
      <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border shadow-sm flex flex-col items-center">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><FileSpreadsheet size={32} /></div>
        <h3 className="text-lg md:text-xl font-black mb-6 text-teal-950 uppercase">Data Anggota</h3>
        <div className="space-y-3 w-full">
          <button onClick={() => exportCSV(members, "DB_ANGGOTA", ["fullName", "gender", "whatsapp", "group"])} className="w-full py-3 md:py-4 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Ekspor CSV</button>
          <button className="w-full py-3 md:py-4 bg-white border-2 border-teal-600 text-teal-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"><Upload size={14}/> Impor CSV</button>
        </div>
      </div>
      <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border shadow-sm flex flex-col items-center">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner"><FileText size={32} /></div>
        <h3 className="text-lg md:text-xl font-black mb-6 text-teal-950 uppercase">Data Presensi</h3>
        <div className="space-y-3 w-full">
          <button onClick={() => exportCSV(attendance, "REKAP_HADIR", ["date", "memberId", "status"])} className="w-full py-3 md:py-4 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Ekspor CSV</button>
          <button className="w-full py-3 md:py-4 bg-white border-2 border-teal-600 text-teal-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"><Upload size={14}/> Impor CSV</button>
        </div>
      </div>
    </div>
  );
};

const SettingsView: React.FC<{ currentUrl: string, onSave: (u: string) => void }> = ({ currentUrl, onSave }) => {
  const [u, setU] = useState(currentUrl);
  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] border max-w-lg shadow-sm">
      <div className="flex items-center gap-3 mb-6 text-teal-600 font-black"><Database size={20} /> Cloud Setup</div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">WebApp Deployment URL</p>
      <input type="text" className="w-full p-4 bg-slate-50 border rounded-xl mb-8 font-mono text-[9px] md:text-[10px] outline-none shadow-inner" value={u} onChange={(e) => setU(e.target.value)} placeholder="https://..." />
      <button onClick={() => onSave(u)} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition-all">Update Cloud</button>
    </div>
  );
};

const InputRow = ({ label, name, def, required, placeholder, type = "text" }: any) => (
  <div className="space-y-1">
    <label className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
    <input type={type} name={name} required={required} defaultValue={def} placeholder={placeholder} className="w-full p-3 md:p-3.5 bg-slate-50 border rounded-xl text-xs md:text-sm font-semibold outline-none focus:border-teal-400 shadow-sm" />
  </div>
);

const SelectRow = ({ label, name, opts, def }: any) => (
  <div className="space-y-1">
    <label className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
    <select name={name} required defaultValue={def} className="w-full p-3 md:p-3.5 bg-slate-50 border rounded-xl text-xs md:text-sm font-semibold outline-none focus:border-teal-400 shadow-sm">
      <option value="">-- Pilih --</option>
      {opts.map((o: any) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const LoginView = ({ onLogin, onBack }: any) => (
  <div className="min-h-screen bg-teal-600 flex items-center justify-center p-4">
    <form onSubmit={onLogin} className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl w-full max-w-sm border animate-in slide-in-from-bottom-8 duration-500">
      <div className="text-center mb-8 md:mb-10">
        <div className="inline-block p-4 md:p-5 bg-teal-50 text-teal-600 rounded-[1.5rem] md:rounded-[2rem] mb-4 shadow-sm"><LogIn size={32} /></div>
        <h2 className="text-2xl font-black text-teal-950 uppercase">Login Pengurus</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Sistem Informasi Muda-Mudi</p>
      </div>
      <div className="space-y-4 md:space-y-5">
        <input name="username" placeholder="Username" className="w-full p-4 md:p-5 bg-slate-50 border rounded-xl md:rounded-2xl outline-none font-bold text-sm focus:border-teal-400 shadow-inner" required />
        <input name="password" type="password" placeholder="Password" className="w-full p-4 md:p-5 bg-slate-50 border rounded-xl md:rounded-2xl outline-none font-bold text-sm focus:border-teal-400 shadow-inner" required />
        <button type="submit" className="w-full py-4 md:py-5 bg-teal-600 text-white rounded-2xl md:rounded-3xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-teal-500/30 active:scale-95 transition-all">MASUK</button>
        <button type="button" onClick={onBack} className="w-full text-slate-300 font-bold text-[10px] uppercase tracking-widest transition-colors hover:text-slate-400">Kembali</button>
      </div>
    </form>
  </div>
);

export default App;
