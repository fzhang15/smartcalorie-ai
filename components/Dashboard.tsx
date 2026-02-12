import React, { useMemo, useState, useEffect, useRef } from 'react';
import { UserProfile, MealLog, ExerciseLog, DailyImpactRecord, WaterLog } from '../types';
import { CALORIES_PER_KG_FAT, EXERCISE_LABELS, kgToLbs, formatWaterAmount } from '../constants';
import { Plus, TrendingUp, TrendingDown, Scale, History, Utensils, ChevronLeft, ChevronRight, Calendar, Trash2, Clock, Activity, BarChart3, PenLine, Droplets } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import ImpactHistoryModal from './ImpactHistoryModal';
import MealLogDetail from './MealLogDetail';
import CalorieGauge from './CalorieGauge';

const MiniMetric: React.FC<{icon:React.ReactNode;label:string;value:string;progress:number;color:string}> = ({icon,label,value,progress,color}) => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-10 h-10 relative flex items-center justify-center">
      <svg width="40" height="40" className="absolute inset-0 transform -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
        <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${16*2*Math.PI}`} strokeDashoffset={`${16*2*Math.PI*(1-Math.min(progress,1))}`} strokeLinecap="round" className="progress-ring-circle"/>
      </svg>
      <div className="relative z-10">{icon}</div>
    </div>
    <span className="text-[10px] text-gray-500 font-medium leading-none">{label}</span>
    <span className="text-xs text-white font-semibold leading-none">{value}</span>
  </div>
);

interface DashboardProps {
  profile: UserProfile; logs: MealLog[]; exerciseLogs: ExerciseLog[]; waterLogs: WaterLog[]; impactHistory: DailyImpactRecord[];
  onOpenLogger: () => void; onOpenExerciseLogger: () => void; onOpenWaterTracker: () => void;
  onUpdateWeight: (suggestedWeight: number) => void; onEditProfile: () => void; onReset: () => void;
  onDeleteLog: (logId: string) => void; onDeleteExerciseLog: (logId: string) => void; onDeleteWaterLog: (logId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({profile,logs,exerciseLogs,waterLogs,impactHistory,onOpenLogger,onOpenExerciseLogger,onOpenWaterTracker,onUpdateWeight,onEditProfile,onReset,onDeleteLog,onDeleteExerciseLog,onDeleteWaterLog}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showImpactHistory, setShowImpactHistory] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarToggleRef = useRef<HTMLButtonElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMealLog, setSelectedMealLog] = useState<MealLog | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (calendarToggleRef.current?.contains(t)) return;
      if (calendarRef.current && !calendarRef.current.contains(t)) setShowCalendar(false);
    };
    if (showCalendar) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showCalendar]);

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(t); }, []);

  const isToday = (d: Date) => { const t = new Date(); return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear(); };
  const isSameDay = (a: Date, b: Date) => a.getDate()===b.getDate()&&a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear();
  const effectiveBmr = Math.round(profile.bmr * (profile.calibrationFactor || 1.0));
  const getTimeBasedBMR = () => { const h=currentTime.getHours(),m=currentTime.getMinutes(); return Math.round(effectiveBmr*((h+m/60)/24)); };
  const navigateDate = (n: number) => { const d=new Date(viewDate); d.setDate(viewDate.getDate()+n); setViewDate(d); };
  const selectDate = (d: Date) => { setViewDate(d); setShowCalendar(false); };
  const toggleCalendar = () => { if(showCalendar){setShowCalendar(false)}else{setCalendarMonth(new Date(viewDate));setShowCalendar(true)} };
  const isFutureDate = (d: Date) => { const t=new Date();t.setHours(23,59,59,999);return d>t; };

  const earliestDataDate = useMemo(() => {
    const d: number[] = [];
    if(logs.length>0) d.push(Math.min(...logs.map(l=>l.timestamp)));
    if(exerciseLogs.length>0) d.push(Math.min(...exerciseLogs.map(l=>l.timestamp)));
    if(profile.createdAt) d.push(profile.createdAt);
    if(!d.length) return null;
    const e=new Date(Math.min(...d));e.setHours(0,0,0,0);return e;
  }, [logs, exerciseLogs, profile.createdAt]);

  const isBeforeEarliest = (d: Date) => { if(!earliestDataDate)return false;const c=new Date(d);c.setHours(0,0,0,0);return c<earliestDataDate; };
  const isAtEarliest = () => earliestDataDate ? isSameDay(viewDate, earliestDataDate) : false;
  const hasLogsOn = (d: Date) => { const s=new Date(d);s.setHours(0,0,0,0);const e=new Date(d);e.setHours(23,59,59,999); return logs.some(l=>l.timestamp>=s.getTime()&&l.timestamp<=e.getTime())||exerciseLogs.some(l=>l.timestamp>=s.getTime()&&l.timestamp<=e.getTime()); };

  const renderCalendar = () => {
    const dim = new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,0).getDate();
    const fd = new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),1).getDay();
    const today = new Date();
    const days: React.ReactNode[] = [];
    for(let i=0;i<fd;i++) days.push(<div key={`e${i}`} className="w-11 h-12"/>);
    for(let day=1;day<=dim;day++){
      const dt=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),day);
      const sel=isSameDay(dt,viewDate),td=isSameDay(dt,today),dis=isFutureDate(dt)||isBeforeEarliest(dt),hl=hasLogsOn(dt);
      days.push(<button key={day} onClick={()=>!dis&&selectDate(dt)} disabled={dis} className="w-11 h-12 flex flex-col items-center justify-center">
        <span className={`w-10 h-10 rounded-full text-sm font-medium transition-all flex items-center justify-center ${sel?'bg-brand-500 text-white shadow-md':td?'bg-brand-100 text-brand-600 font-bold':dis?'text-gray-300 cursor-not-allowed':'text-gray-700 hover:bg-gray-100'}`}>{day}</span>
        {hl&&!dis&&<span className="w-1 h-1 rounded-full bg-brand-500 -mt-0.5"/>}
      </button>);
    }
    return (
      <div ref={calendarRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-elevated border border-gray-100 p-6 z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[340px]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={()=>{const m=new Date(calendarMonth);m.setMonth(m.getMonth()-1);setCalendarMonth(m)}} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"><ChevronLeft size={20}/></button>
          <span className="font-semibold text-gray-800">{calendarMonth.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span>
          <button onClick={()=>{const m=new Date(calendarMonth);m.setMonth(m.getMonth()+1);setCalendarMonth(m)}} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"><ChevronRight size={20}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(l=><div key={l} className="w-11 h-8 flex items-center justify-center text-xs font-medium text-gray-400">{l}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center"><button onClick={()=>selectDate(new Date())} className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100">Go to Today</button></div>
      </div>
    );
  };

  const dml = logs.filter(l=>isSameDay(new Date(l.timestamp),viewDate));
  const del = exerciseLogs.filter(l=>isSameDay(new Date(l.timestamp),viewDate));
  const dwl = waterLogs.filter(l=>isSameDay(new Date(l.timestamp),viewDate));
  const wim = dwl.reduce((a,l)=>a+l.amountMl,0), wgm=profile.dailyWaterGoalMl||2500, wu=profile.waterUnit||'ml';
  const ecb = del.reduce((a,l)=>a+l.caloriesBurned,0);
  const bmrSF = isToday(viewDate)?getTimeBasedBMR():effectiveBmr;
  const tcb = bmrSF+ecb, dt = effectiveBmr;

  const isRegDay = profile.createdAt ? isSameDay(new Date(profile.createdAt),viewDate) : false;
  const vc = isRegDay&&profile.createdAt?(()=>{const c=new Date(profile.createdAt);return Math.round((effectiveBmr/24)*(c.getHours()+c.getMinutes()/60))})():0;

  const aci = dml.reduce((a,l)=>a+l.totalCalories,0);
  const tci = aci+vc;
  const nc = tci-(isToday(viewDate)?tcb:profile.bmr+ecb);
  const pwc = (tci-bmrSF-ecb)/CALORIES_PER_KG_FAT;

  const md = useMemo(()=>{let p=0,c=0,f=0;dml.forEach(l=>l.items.forEach(i=>{p+=i.protein;c+=i.carbs;f+=i.fat}));return [{name:'Protein',value:p,color:'#22c55e'},{name:'Carbs',value:c,color:'#eab308'},{name:'Fat',value:f,color:'#ef4444'}].filter(i=>i.value>0)},[dml]);

  const pw = useMemo(()=>{
    const lu=profile.lastWeightUpdate||Date.now();
    const ci=logs.filter(l=>l.timestamp>lu).reduce((a,l)=>a+l.totalCalories,0);
    const ce=exerciseLogs.filter(l=>l.timestamp>lu).reduce((a,l)=>a+l.caloriesBurned,0);
    const h=Math.max(0,(Date.now()-lu)/(1000*60*60));
    return profile.weight+(ci-Math.round((effectiveBmr/24)*h)-ce)/CALORIES_PER_KG_FAT;
  },[logs,exerciseLogs,profile.weight,profile.lastWeightUpdate,effectiveBmr,currentTime]);

  const fd = viewDate.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});

  return (
    <div className="pb-32">
      <div className="bg-white p-6 pb-4 pt-8 rounded-b-[2rem] shadow-card">
        <div className="flex justify-between items-start mb-5">
          <button onClick={onEditProfile} className="flex items-center gap-3 hover:bg-gray-50 p-2 -m-2 rounded-2xl transition-colors">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg ${profile.avatarColor||'bg-brand-500'}`}>{profile.name.charAt(0).toUpperCase()}</div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{profile.name}</h1>
              <p className="text-[11px] text-gray-400 font-medium">Tap to edit profile</p>
            </div>
          </button>
          <button onClick={onReset} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Profile"><Trash2 size={18}/></button>
        </div>

        <div className="flex items-center justify-between mb-5 bg-gray-50 p-1 rounded-2xl relative">
          <button onClick={()=>navigateDate(-1)} disabled={isAtEarliest()} className={`p-2.5 rounded-xl transition-all ${isAtEarliest()?'text-gray-300 cursor-not-allowed':'text-gray-500 hover:bg-white hover:text-brand-600 hover:shadow-sm'}`}><ChevronLeft size={18}/></button>
          <button ref={calendarToggleRef} onClick={toggleCalendar} className="flex items-center gap-2 font-semibold text-gray-700 hover:bg-white px-4 py-2 rounded-xl transition-all hover:shadow-sm">
            <Calendar size={15} className="text-brand-500"/>{isToday(viewDate)?"Today":fd}
          </button>
          {showCalendar&&renderCalendar()}
          <div className="flex gap-1">
            {!isToday(viewDate)&&<button onClick={()=>setViewDate(new Date())} className="px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100">Today</button>}
            <button onClick={()=>navigateDate(1)} disabled={isToday(viewDate)} className={`p-2.5 rounded-xl transition-all ${isToday(viewDate)?'text-gray-300 cursor-not-allowed':'text-gray-500 hover:bg-white hover:text-brand-600 hover:shadow-sm'}`}><ChevronRight size={18}/></button>
          </div>
        </div>

        <div className="bg-gray-900 text-white rounded-[1.25rem] p-5 shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800"/>
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -translate-y-1/2 translate-x-1/2"/>
          <div className="relative z-10">
            <div className="flex flex-col items-center">
              <CalorieGauge netCalories={nc} bmr={effectiveBmr} eaten={tci} burned={tcb}/>
            </div>
            <div className={`mt-3 pt-3 border-t border-white/10 grid ${profile.waterTrackingEnabled?'grid-cols-4':'grid-cols-3'} gap-2`}>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 relative flex items-center justify-center">
                  <svg width="44" height="44" className="absolute inset-0 transform -rotate-90">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${18*2*Math.PI}`} strokeDashoffset={`${18*2*Math.PI*(1-Math.min(tci/dt,1))}`} strokeLinecap="round" className="progress-ring-circle"/>
                  </svg>
                  <Utensils size={14} className="relative z-10 text-green-400"/>
                </div>
                <span className="text-[10px] text-gray-500 font-medium leading-none">Eaten</span>
                <div className="text-center leading-none">
                  <span className="text-sm text-white font-bold">{tci}</span>
                  <span className="text-[9px] text-gray-500 font-normal"> / {dt}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 relative flex items-center justify-center">
                  <svg width="44" height="44" className="absolute inset-0 transform -rotate-90">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray={`${18*2*Math.PI}`} strokeDashoffset={`${18*2*Math.PI*(1-Math.min(bmrSF/effectiveBmr,1))}`} strokeLinecap="round" className="progress-ring-circle"/>
                  </svg>
                  <Clock size={14} className="relative z-10 text-orange-400"/>
                </div>
                <span className="text-[10px] text-gray-500 font-medium leading-none">Burned</span>
                <div className="text-center leading-none">
                  <span className="text-sm text-orange-400 font-bold">{tcb}</span>
                  <span className="text-[9px] text-gray-500 font-normal"> kcal</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 relative flex items-center justify-center">
                  <svg width="44" height="44" className="absolute inset-0 transform -rotate-90">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#eab308" strokeWidth="3" strokeDasharray={`${18*2*Math.PI}`} strokeDashoffset={`${18*2*Math.PI*(1-Math.min(ecb/(profile.dailyExerciseGoal||300),1))}`} strokeLinecap="round" className="progress-ring-circle"/>
                  </svg>
                  <Activity size={14} className="relative z-10 text-yellow-400"/>
                </div>
                <span className="text-[10px] text-gray-500 font-medium leading-none">Exercise</span>
                <div className="text-center leading-none">
                  <span className="text-sm text-white font-bold">{ecb}</span>
                  <span className="text-[9px] text-gray-500 font-normal"> kcal</span>
                </div>
              </div>
              {profile.waterTrackingEnabled&&(
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-11 h-11 relative flex items-center justify-center">
                    <svg width="44" height="44" className="absolute inset-0 transform -rotate-90">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
                      <circle cx="22" cy="22" r="18" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${18*2*Math.PI}`} strokeDashoffset={`${18*2*Math.PI*(1-Math.min(wim/wgm,1))}`} strokeLinecap="round" className="progress-ring-circle"/>
                    </svg>
                    <Droplets size={14} className="relative z-10 text-blue-400"/>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium leading-none">Water</span>
                  <div className="text-center leading-none">
                    <span className="text-sm text-white font-bold">{formatWaterAmount(wim,wu)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-3 grid grid-cols-2 gap-3">
        <button onClick={()=>setShowImpactHistory(true)} className="bg-white p-4 rounded-2xl shadow-card hover:shadow-card-hover flex flex-col items-center text-center active:scale-[0.97] transition-all relative group">
          <div className={`p-2.5 rounded-xl mb-2 ${pwc>0?'bg-red-50 text-red-500':'bg-green-50 text-green-500'}`}>{pwc>0?<TrendingUp size={18}/>:<TrendingDown size={18}/>}</div>
          <p className="text-[11px] text-gray-400 font-medium">Daily Impact</p>
          <p className="text-lg font-bold text-gray-900 tracking-tight">{pwc>0?'+':''}{profile.weightUnit==='lbs'?kgToLbs(pwc).toFixed(3):pwc.toFixed(3)} <span className="text-xs font-normal text-gray-400">{profile.weightUnit||'kg'}</span></p>
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity"><BarChart3 size={12} className="text-gray-300"/></div>
          <p className="text-[10px] text-brand-500 font-medium mt-1">Tap for history</p>
        </button>
        <button onClick={()=>onUpdateWeight(pw)} className="bg-white p-4 rounded-2xl shadow-card hover:shadow-card-hover flex flex-col items-center text-center active:scale-[0.97] transition-all">
          <div className="p-2.5 rounded-xl mb-2 bg-accent-50 text-accent-500"><Scale size={18}/></div>
          <p className="text-[11px] text-gray-400 font-medium">{Math.abs(pw-profile.weight)>0.001?'Predicted Weight':'Current Weight'}</p>
          <p className="text-lg font-bold text-gray-900 tracking-tight">{profile.weightUnit==='lbs'?kgToLbs(pw).toFixed(1):pw.toFixed(1)} <span className="text-xs font-normal text-gray-400">{profile.weightUnit||'kg'}</span></p>
          {Math.abs(pw-profile.weight)>0.001&&<p className="text-[10px] text-accent-500 font-medium mt-1">Tap to calibrate</p>}
        </button>
      </div>

      <div className="px-6 pt-6 pb-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-lg tracking-tight flex items-center gap-2"><History size={18} className="text-brand-500"/>{isToday(viewDate)?"Today's Meals":"Meals"}</h3>
          {md.length>0&&<div className="flex items-center gap-3">{md.map((m,i)=><span key={i} className="text-[10px] font-semibold" style={{color:m.color}}>{m.name[0]}:{Math.round(m.value)}g</span>)}<div className="h-5 w-5"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={md} dataKey="value" innerRadius={0} outerRadius={8} stroke="none">{md.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart></ResponsiveContainer></div></div>}
        </div>
        {dml.length===0?(
          <div className="text-center py-12 bg-gray-50/80 rounded-2xl border border-dashed border-gray-200">
            <div className="flex justify-center mb-3"><div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center"><Utensils size={24} className="text-gray-300"/></div></div>
            <p className="text-gray-500 font-medium mb-1">{isToday(viewDate)?"What did you eat today?":"No meals logged"}</p>
            <p className="text-gray-400 text-sm mb-4">{isToday(viewDate)?"Snap a photo or describe your meal":"No meals recorded for this date"}</p>
            {isToday(viewDate)&&<button onClick={onOpenLogger} className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold text-sm rounded-xl hover:bg-brand-600 transition-colors shadow-sm"><Plus size={16}/>Log Meal</button>}
          </div>
        ):(
          <div className="space-y-3">
            {dml.slice().reverse().map(log=>(
              <div key={log.id} className="bg-white p-4 rounded-2xl shadow-card hover:shadow-card-hover flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 cursor-pointer active:scale-[0.98] transition-all" onClick={()=>setSelectedMealLog(log)}>
                {log.imageUrl?<img src={log.imageUrl} className="w-[4.5rem] h-[4.5rem] rounded-xl object-cover bg-gray-100 flex-shrink-0" alt="meal"/>:log.description?<div className="w-[4.5rem] h-[4.5rem] rounded-xl bg-brand-50 flex items-center justify-center text-brand-400 flex-shrink-0"><PenLine size={24}/></div>:<div className="w-[4.5rem] h-[4.5rem] rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0"><Utensils size={24}/></div>}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 capitalize">{log.mealType}</p>
                        <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{log.items.map(i=>i.name).join(', ')}</p>
                    </div>
                    <span className="font-bold text-brand-600 text-lg ml-2">{log.totalCalories}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-green-50 text-green-600">P: {log.items.reduce((a,b)=>a+b.protein,0)}g</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-600">C: {log.items.reduce((a,b)=>a+b.carbs,0)}g</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-50 text-red-500">F: {log.items.reduce((a,b)=>a+b.fat,0)}g</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {del.length>0&&(
        <div className="px-6 pt-6">
          <h3 className="font-bold text-gray-900 text-lg tracking-tight flex items-center gap-2 mb-4"><Activity size={18} className="text-orange-500"/>Exercise</h3>
          <div className="space-y-2">
            {del.map(log=>(
              <div key={log.id} className="bg-orange-50 p-3.5 rounded-2xl border border-orange-100 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-xl text-orange-600"><Activity size={16}/></div>
                  <div><p className="font-medium text-gray-900">{EXERCISE_LABELS[log.type]}</p><p className="text-xs text-gray-500">{log.durationMinutes} minutes</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-600">-{log.caloriesBurned}</span>
                  <button onClick={()=>onDeleteExerciseLog(log.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.waterTrackingEnabled&&dwl.length>0&&(
        <div className="px-6 pt-6 pb-6">
          <h3 className="font-bold text-gray-900 text-lg tracking-tight flex items-center gap-2 mb-4"><Droplets size={18} className="text-blue-500"/>Water</h3>
          <div className="space-y-2">
            {dwl.slice().reverse().map(log=>(
              <div key={log.id} className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Droplets size={16}/></div>
                  <div><p className="font-medium text-gray-900">{formatWaterAmount(log.amountMl, wu)}</p><p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</p></div>
                </div>
                <button onClick={()=>onDeleteWaterLog(log.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showImpactHistory&&<ImpactHistoryModal profile={profile} logs={logs} exerciseLogs={exerciseLogs} impactHistory={impactHistory} onClose={()=>setShowImpactHistory(false)}/>}
      {selectedMealLog&&<MealLogDetail log={selectedMealLog} onClose={()=>setSelectedMealLog(null)} onDelete={onDeleteLog} onImageClick={(url)=>{setSelectedMealLog(null);setSelectedImage(url)}}/>}
      {selectedImage&&(
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center animate-in fade-in duration-200 cursor-pointer" onClick={()=>setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" alt="Meal preview"/>
        </div>
      )}

      {isToday(viewDate)&&(
        <div className="fixed bottom-10 left-0 right-0 flex justify-center gap-3 z-40 pointer-events-none">
          <button onClick={onOpenLogger} className={`bg-brand-600 text-white rounded-full p-4 shadow-2xl shadow-brand-500/40 hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-2 ${profile.waterTrackingEnabled?'px-4':'px-5'}`}><Utensils size={20}/><span className="font-semibold">Meal</span></button>
          <button onClick={onOpenExerciseLogger} className={`bg-orange-500 text-white rounded-full p-4 shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-2 ${profile.waterTrackingEnabled?'px-4':'px-5'}`}><Activity size={20}/><span className="font-semibold">Exercise</span></button>
          {profile.waterTrackingEnabled&&<button onClick={onOpenWaterTracker} className="bg-blue-500 text-white rounded-full p-4 shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-2 px-4"><Droplets size={20}/><span className="font-semibold">Water</span></button>}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
