import { useState, useEffect } from "react";
import {
  Dumbbell, Utensils, PenLine, BookOpen, Heart, Flame, Target,
  Activity, Plus, Trash2, FileDown, Moon, Sparkles, Zap, Check,
  Wheat, Droplet, Wine
} from "lucide-react";

const STORAGE_KEY = "eduardo_os_v5";
const METAS = { kcal_max: 2000, prote: 200, carbs: 150, grasa: 65 };

const RUTINA_TERAPIA = [
  "3x10 estiramiento atras-adelante",
  "3x10 estiramiento derecha-izquierda",
  "3x10 estiramiento izquierda-derecha",
  "3x10 elevacion de pantorrilla",
  "3x10 jalon con liga para tobillo",
  "5 min pistola de masaje cuadriceps y pantorrilla",
];

const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const defaultWorkout = (titulo) => ({
  titulo: titulo || "",
  kcal: "",
  exercises: [],
});

const defaultDay = () => ({
  meals: [],
  workouts: [defaultWorkout("Gym"), defaultWorkout("")],
  whoop: { recovery: "", sleep_perf: "", strain: "" },
  journal: false,
  leer: "",
  terapia: Array(RUTINA_TERAPIA.length).fill(false),
  noAlcohol: false,
});

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0a0a; }

.os-app { min-height: 100vh; background: #0a0a0a; color: #f5f5f5; font-family: system-ui, -apple-system, sans-serif; }
.os-container { max-width: 28rem; margin: 0 auto; padding: 24px 20px; }

.os-header { margin-bottom: 24px; }
.os-eyebrow { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #737373; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.15em; }
.os-title { font-size: 36px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; }
.os-date { font-size: 14px; color: #a3a3a3; margin-top: 6px; text-transform: capitalize; }

.os-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.os-stat { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 16px; }
.os-stat-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.os-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
.os-stat-value { font-size: 24px; font-weight: 600; line-height: 1.1; }
.os-stat-sub { font-size: 11px; color: #737373; margin-top: 2px; }
.os-stat-bar { margin-top: 10px; height: 4px; background: #262626; border-radius: 2px; overflow: hidden; }
.os-stat-bar-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
.os-bar-amber { background: #fbbf24; }
.os-bar-emerald { background: #34d399; }
.os-bar-sky { background: #38bdf8; }
.os-bar-violet { background: #a78bfa; }
.os-bar-rose { background: #fb7185; }
.os-bar-over { background: #f87171; }

.os-alcohol-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 11px 14px; margin-bottom: 24px; }
.os-alcohol-left { display: flex; align-items: center; gap: 9px; }
.os-alcohol-txt { font-size: 13px; color: #a3a3a3; }
.os-alcohol-streak { color: #f5f5f5; font-weight: 600; }
.os-alcohol-chk { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #404040; background: #171717; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; padding: 0; }
.os-alcohol-chk.on { background: #0891b2; border-color: #0891b2; }

.os-whoop-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.os-whoop-summary-card { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 14px; }
.os-whoop-summary-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.os-whoop-summary-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
.os-whoop-summary-value { font-size: 22px; font-weight: 600; line-height: 1.1; }
.os-whoop-summary-sub { font-size: 11px; color: #737373; margin-top: 2px; }

.os-balance-card { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 16px; margin-bottom: 24px; }
.os-balance-header { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
.os-balance-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #fbbf24; }
.os-balance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; }
.os-balance-sub { font-size: 10px; color: #737373; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.os-balance-value { font-size: 16px; font-weight: 600; color: #f5f5f5; }
.os-balance-deficit { color: #34d399; }
.os-balance-surplus { color: #f87171; }

.os-amber { color: #fbbf24; }
.os-emerald { color: #34d399; }
.os-sky { color: #38bdf8; }
.os-violet { color: #a78bfa; }
.os-rose { color: #fb7185; }
.os-neutral { color: #a3a3a3; }

.os-section { margin-bottom: 24px; }
.os-section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.os-section-title { font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: #d4d4d4; }
.os-section-sub { font-size: 11px; color: #737373; margin-bottom: 12px; }

.os-card { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 12px; margin-bottom: 12px; }
.os-card-pad { padding: 16px; }

.os-input { width: 100%; background: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 8px 12px; font-size: 14px; color: #f5f5f5; font-family: inherit; outline: none; transition: border-color 0.15s; }
.os-input::placeholder { color: #525252; }
.os-input:focus { border-color: #047857; }
.os-input-row { margin-bottom: 8px; }

.os-meal-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
.os-meal-grid .os-input { text-align: center; padding: 6px 4px; font-size: 13px; }

.os-btn-primary { width: 100%; background: #059669; color: white; border: none; border-radius: 8px; padding: 8px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.15s; font-family: inherit; }
.os-btn-primary:hover { background: #10b981; }
.os-btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }

.os-btn-dashed { width: 100%; background: #0a0a0a; color: #d4d4d4; border: 1px dashed #404040; border-radius: 10px; padding: 9px; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: border-color 0.15s; font-family: inherit; margin-top: 4px; }
.os-btn-dashed:hover { border-color: #047857; }

.os-empty { text-align: center; font-size: 11px; color: #525252; padding: 8px 0; }

.os-meal-item { background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 12px; margin-bottom: 8px; }
.os-meal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 10px; }
.os-meal-name { font-size: 14px; font-weight: 500; flex: 1; }
.os-delete { background: none; border: none; color: #525252; cursor: pointer; padding: 4px; display: flex; align-items: center; }
.os-delete:hover { color: #f87171; }

.os-macros { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center; }
.os-macro-value { font-size: 14px; color: #f5f5f5; }
.os-macro-value-bold { font-size: 16px; font-weight: 600; color: #f5f5f5; }
.os-macro-label { font-size: 11px; color: #737373; margin-top: 2px; }

.os-totals { background: rgba(6, 78, 59, 0.25); border: 1px solid rgba(6, 95, 70, 0.4); border-radius: 12px; padding: 12px; margin-top: 8px; }
.os-totals-label { font-size: 11px; color: #34d399; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }

.os-wk-block { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 14px; margin-bottom: 12px; }
.os-wk-block-num { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #737373; margin-bottom: 8px; }
.os-wk-top { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; margin-bottom: 12px; }
.os-wk-kcal-wrap { width: 110px; }
.os-small-label { font-size: 11px; color: #737373; display: block; margin-bottom: 4px; }
.os-small-input { width: 100%; background: #0a0a0a; border: 1px solid #262626; border-radius: 6px; padding: 7px 8px; font-size: 13px; color: #f5f5f5; outline: none; font-family: inherit; }
.os-small-input:focus { border-color: #047857; }
.os-small-input::placeholder { color: #525252; }

.os-ex-row { display: grid; grid-template-columns: 1fr 70px 70px auto; gap: 6px; align-items: center; margin-bottom: 6px; }
.os-ex-row .os-small-input { padding: 6px 8px; }

.os-whoop-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.os-whoop-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #737373; margin-bottom: 4px; }
.os-whoop-wrap { position: relative; }
.os-whoop-input { width: 100%; background: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 8px 10px; font-size: 16px; font-weight: 600; color: #f5f5f5; outline: none; padding-right: 32px; font-family: inherit; }
.os-whoop-input:focus { border-color: #0369a1; }
.os-whoop-suffix { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; color: #737373; pointer-events: none; }

.os-mente { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 16px; }
.os-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.os-toggle-left { display: flex; align-items: center; gap: 12px; flex: 1; }
.os-toggle-label { font-size: 14px; }
.os-toggle-btn { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #404040; background: #171717; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; padding: 0; }
.os-toggle-btn.os-done-sky { background: #0ea5e9; border-color: #0ea5e9; }

.os-mente-row { margin-top: 16px; }
.os-leer-input { width: 100%; background: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 8px 12px; font-size: 14px; color: #f5f5f5; outline: none; font-family: inherit; }
.os-leer-input:focus { border-color: #6d28d9; }
.os-leer-input::placeholder { color: #525252; }

.os-tp-card { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 8px 16px; }
.os-tp-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #1f1f1f; cursor: pointer; }
.os-tp-row:last-child { border-bottom: none; }
.os-tp-check { width: 24px; height: 24px; border-radius: 7px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 2px solid #404040; background: transparent; transition: all 0.15s; }
.os-tp-check.on { background: #f43f5e; border-color: #f43f5e; }
.os-tp-text { font-size: 14px; color: #f5f5f5; }
.os-tp-text.on { color: #737373; text-decoration: line-through; }

.os-pdf-btn { width: 100%; background: #059669; color: white; border: none; border-radius: 16px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s; font-family: inherit; margin-bottom: 12px; }
.os-pdf-btn:hover { background: #10b981; }

.os-footer { text-align: center; font-size: 11px; color: #525252; padding-bottom: 24px; }

.os-print { min-height: 100vh; background: white; color: black; padding: 32px; font-family: system-ui, -apple-system, sans-serif; }
.os-print-container { max-width: 42rem; margin: 0 auto; }
.os-print-header { border-bottom: 2px solid black; padding-bottom: 16px; margin-bottom: 24px; }
.os-print-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563; }
.os-print-title { font-size: 28px; font-weight: 700; text-transform: capitalize; margin-top: 4px; }
.os-print-h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
.os-print-table { width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 24px; }
.os-print-table th { text-align: left; padding: 4px 8px 4px 0; border-bottom: 1px solid black; }
.os-print-table td { padding: 6px 8px 6px 0; border-bottom: 1px solid #d1d5db; }
.os-print-right { text-align: right; }
.os-print-total { font-weight: 700; border-top: 2px solid black; }
.os-print-total td { border-bottom: none; padding: 8px 8px 8px 0; }
.os-print-empty { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
.os-print-whoop { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; font-size: 13px; }
.os-print-whoop-label { font-size: 11px; color: #4b5563; }
.os-print-whoop-value { font-weight: 600; }
.os-print-mente { font-size: 13px; margin-bottom: 24px; }
.os-print-recap { background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
.os-print-recap-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; border-bottom: 1px solid #d1d5db; padding-bottom: 8px; }
.os-print-recap-block { margin-bottom: 14px; }
.os-print-recap-block:last-child { margin-bottom: 0; }
.os-print-recap-h { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; margin-bottom: 6px; }
.os-print-recap-row { display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0; }
.os-print-recap-row .os-print-ok { color: #047857; font-weight: 600; }
.os-print-recap-row .os-print-bad { color: #b91c1c; font-weight: 600; }
.os-print-footer { font-size: 11px; color: #6b7280; padding-top: 16px; border-top: 1px solid #d1d5db; }
`;

export default function App() {
  const [data, setData] = useState({ days: {} });
  const [showPrint, setShowPrint] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: "", kcal: "", prote: "", carbs: "", fat: "" });

  const today = fmtDate(new Date());
  const day = data.days[today] || defaultDay();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const saveDay = (newDay) => {
    const newData = { ...data, days: { ...data.days, [today]: newDay } };
    setData(newData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error("Storage error:", e);
    }
  };

  const addMeal = () => {
    if (!newMeal.name) return;
    const meal = {
      id: Date.now(),
      name: newMeal.name,
      kcal: parseFloat(newMeal.kcal) || 0,
      prote: parseFloat(newMeal.prote) || 0,
      carbs: parseFloat(newMeal.carbs) || 0,
      fat: parseFloat(newMeal.fat) || 0,
    };
    saveDay({ ...day, meals: [...day.meals, meal] });
    setNewMeal({ name: "", kcal: "", prote: "", carbs: "", fat: "" });
  };
  const removeMeal = (id) => saveDay({ ...day, meals: day.meals.filter((m) => m.id !== id) });

  const updateBlock = (idx, field, value) => {
    const workouts = day.workouts.map((w, i) => (i === idx ? { ...w, [field]: value } : w));
    saveDay({ ...day, workouts });
  };
  const addExercise = (idx) => {
    const workouts = day.workouts.map((w, i) =>
      i === idx ? { ...w, exercises: [...w.exercises, { id: Date.now(), nombre: "", sets: "", peso: "" }] } : w
    );
    saveDay({ ...day, workouts });
  };
  const updateExercise = (idx, exId, field, value) => {
    const workouts = day.workouts.map((w, i) =>
      i === idx ? { ...w, exercises: w.exercises.map((e) => (e.id === exId ? { ...e, [field]: value } : e)) } : w
    );
    saveDay({ ...day, workouts });
  };
  const removeExercise = (idx, exId) => {
    const workouts = day.workouts.map((w, i) =>
      i === idx ? { ...w, exercises: w.exercises.filter((e) => e.id !== exId) } : w
    );
    saveDay({ ...day, workouts });
  };

  const updateWhoop = (field, value) => {
    const whoop = { ...(day.whoop || {}), [field]: value };
    saveDay({ ...day, whoop });
  };

  const toggleTerapia = (i) => {
    const base = Array.isArray(day.terapia) ? day.terapia : Array(RUTINA_TERAPIA.length).fill(false);
    const terapia = base.map((v, k) => (k === i ? !v : v));
    saveDay({ ...day, terapia });
  };
  const terapiaArr = Array.isArray(day.terapia) ? day.terapia : Array(RUTINA_TERAPIA.length).fill(false);
  const terapiaDone = terapiaArr.filter(Boolean).length;

  let rachaNoAlcohol = 0;
  {
    let d = new Date();
    while (true) {
      const k = fmtDate(d);
      const dd = data.days[k];
      if (dd && dd.noAlcohol) {
        rachaNoAlcohol++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
  }

  const totals = day.meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + (parseFloat(m.kcal) || 0),
      prote: acc.prote + (parseFloat(m.prote) || 0),
      carbs: acc.carbs + (parseFloat(m.carbs) || 0),
      fat: acc.fat + (parseFloat(m.fat) || 0),
    }),
    { kcal: 0, prote: 0, carbs: 0, fat: 0 }
  );

  const kcalQuemadas = day.workouts.reduce((s, w) => s + (parseFloat(w.kcal) || 0), 0);

  const dateLabel = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const exportPDF = () => {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowPrint(false), 500);
    }, 100);
  };

  if (showPrint) {
    return (
      <>
        <style>{CSS}</style>
        <PrintView day={day} totals={totals} dateLabel={dateLabel} kcalQuemadas={kcalQuemadas} terapiaArr={terapiaArr} rachaNoAlcohol={rachaNoAlcohol} />
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="os-app">
        <div className="os-container">
          <header className="os-header">
            <div className="os-eyebrow"><Sparkles size={12} /> Personal OS</div>
            <h1 className="os-title">Eduardo OS</h1>
            <div className="os-date">{dateLabel}</div>
          </header>

          <div className="os-stats">
            <StatCard icon={Flame} label="Calorías" value={Math.round(totals.kcal)} sub={"/ " + METAS.kcal_max + " máx"} color="amber" current={totals.kcal} target={METAS.kcal_max} isMax />
            <StatCard icon={Zap} label="Proteína" value={Math.round(totals.prote) + "g"} sub={"/ " + METAS.prote + "g meta"} color="emerald" current={totals.prote} target={METAS.prote} />
            <StatCard icon={Wheat} label="Carbs" value={Math.round(totals.carbs) + "g"} sub={"/ " + METAS.carbs + "g meta"} color="sky" current={totals.carbs} target={METAS.carbs} />
            <StatCard icon={Droplet} label="Grasa" value={Math.round(totals.fat) + "g"} sub={"/ " + METAS.grasa + "g meta"} color="rose" current={totals.fat} target={METAS.grasa} />
          </div>

          {kcalQuemadas > 0 ? (
            <div className="os-balance-card">
              <div className="os-balance-header">
                <Flame size={14} className="os-amber" />
                <span className="os-balance-label">Balance energético</span>
              </div>
              <div className="os-balance-grid">
                <div>
                  <div className="os-balance-sub">Comido</div>
                  <div className="os-balance-value">{Math.round(totals.kcal)}</div>
                </div>
                <div>
                  <div className="os-balance-sub">Quemado</div>
                  <div className="os-balance-value">{Math.round(kcalQuemadas)}</div>
                </div>
                <div>
                  <div className="os-balance-sub">{totals.kcal < kcalQuemadas ? "Déficit" : "Superávit"}</div>
                  <div className={"os-balance-value " + (totals.kcal < kcalQuemadas ? "os-balance-deficit" : "os-balance-surplus")}>
                    {Math.abs(Math.round(totals.kcal - kcalQuemadas))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="os-whoop-summary">
            <div className="os-whoop-summary-card">
              <div className="os-whoop-summary-header os-violet">
                <Activity size={14} />
                <span className="os-whoop-summary-label">Recovery</span>
              </div>
              <div className="os-whoop-summary-value">{day.whoop?.recovery ? day.whoop.recovery + "%" : "—"}</div>
              <div className="os-whoop-summary-sub">Whoop</div>
            </div>
            <div className="os-whoop-summary-card">
              <div className="os-whoop-summary-header os-violet">
                <Moon size={14} />
                <span className="os-whoop-summary-label">Sueño</span>
              </div>
              <div className="os-whoop-summary-value">{day.whoop?.sleep_perf ? day.whoop.sleep_perf + "%" : "—"}</div>
              <div className="os-whoop-summary-sub">calidad</div>
            </div>
          </div>

          <Section icon={Utensils} title="Comida" subtitle="Agrega cada comida con sus macros">
            <div className="os-card">
              <input
                value={newMeal.name}
                onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                placeholder="Nombre (ej. Avena post-gym)"
                className="os-input os-input-row"
              />
              <div className="os-meal-grid">
                <input type="number" inputMode="decimal" value={newMeal.kcal} onChange={(e) => setNewMeal({ ...newMeal, kcal: e.target.value })} placeholder="kcal" className="os-input" />
                <input type="number" inputMode="decimal" value={newMeal.prote} onChange={(e) => setNewMeal({ ...newMeal, prote: e.target.value })} placeholder="prote" className="os-input" />
                <input type="number" inputMode="decimal" value={newMeal.carbs} onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })} placeholder="carbs" className="os-input" />
                <input type="number" inputMode="decimal" value={newMeal.fat} onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })} placeholder="grasa" className="os-input" />
              </div>
              <button onClick={addMeal} disabled={!newMeal.name} className="os-btn-primary">
                <Plus size={14} /> Agregar comida
              </button>
            </div>

            {day.meals.length === 0 && <div className="os-empty">Aún no hay comidas registradas hoy</div>}

            {day.meals.map((m) => (
              <div key={m.id} className="os-meal-item">
                <div className="os-meal-header">
                  <div className="os-meal-name">{m.name}</div>
                  <button onClick={() => removeMeal(m.id)} className="os-delete"><Trash2 size={14} /></button>
                </div>
                <div className="os-macros">
                  <Macro label="kcal" value={Math.round(m.kcal)} />
                  <Macro label="prote" value={Math.round(m.prote) + "g"} />
                  <Macro label="carbs" value={Math.round(m.carbs) + "g"} />
                  <Macro label="grasa" value={Math.round(m.fat) + "g"} />
                </div>
              </div>
            ))}

            {day.meals.length > 0 && (
              <div className="os-totals">
                <div className="os-totals-label">Totales del día</div>
                <div className="os-macros">
                  <Macro label="kcal" value={Math.round(totals.kcal)} bold />
                  <Macro label="prote" value={Math.round(totals.prote) + "g"} bold />
                  <Macro label="carbs" value={Math.round(totals.carbs) + "g"} bold />
                  <Macro label="grasa" value={Math.round(totals.fat) + "g"} bold />
                </div>
              </div>
            )}
          </Section>

          <Section icon={Dumbbell} title="Entrenamiento" subtitle="Hasta 2 entrenos al día — gym, F45, SoulCycle, Solidcore...">
            {day.workouts.map((w, idx) => (
              <div key={idx} className="os-wk-block">
                <div className="os-wk-block-num">Entrenamiento {idx + 1}</div>
                <div className="os-wk-top">
                  <div>
                    <label className="os-small-label">Título</label>
                    <input
                      value={w.titulo}
                      onChange={(e) => updateBlock(idx, "titulo", e.target.value)}
                      placeholder={idx === 0 ? "Gym Push / Pull..." : "F45 / SoulCycle / Solidcore"}
                      className="os-small-input"
                    />
                  </div>
                  <div className="os-wk-kcal-wrap">
                    <label className="os-small-label">Cal quemadas</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={w.kcal}
                      onChange={(e) => updateBlock(idx, "kcal", e.target.value)}
                      placeholder="kcal"
                      className="os-small-input"
                    />
                  </div>
                </div>

                {w.exercises.length === 0 && <div className="os-empty">Sin ejercicios todavía</div>}
                {w.exercises.map((e) => (
                  <div key={e.id} className="os-ex-row">
                    <input value={e.nombre} onChange={(ev) => updateExercise(idx, e.id, "nombre", ev.target.value)} placeholder="Ejercicio" className="os-small-input" />
                    <input value={e.sets} onChange={(ev) => updateExercise(idx, e.id, "sets", ev.target.value)} placeholder="4x8" className="os-small-input" />
                    <input value={e.peso} onChange={(ev) => updateExercise(idx, e.id, "peso", ev.target.value)} placeholder="70kg" className="os-small-input" />
                    <button onClick={() => removeExercise(idx, e.id)} className="os-delete"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => addExercise(idx)} className="os-btn-dashed">
                  <Plus size={14} /> Agregar ejercicio
                </button>
              </div>
            ))}
          </Section>

          <Section icon={Heart} title="Recuperación" subtitle="Captura al final del día (Whoop)">
            <div className="os-card os-card-pad">
              <div className="os-whoop-grid">
                <WhoopField label="Recovery" suffix="%" value={day.whoop?.recovery || ""} onChange={(v) => updateWhoop("recovery", v)} />
                <WhoopField label="Sueño" suffix="%" value={day.whoop?.sleep_perf || ""} onChange={(v) => updateWhoop("sleep_perf", v)} />
                <WhoopField label="Strain" suffix="" value={day.whoop?.strain || ""} onChange={(v) => updateWhoop("strain", v)} step="0.1" />
              </div>
            </div>
          </Section>

          <Section icon={PenLine} title="Mente" subtitle="Journal, lectura">
            <div className="os-mente">
              <div className="os-toggle-row">
                <div className="os-toggle-left">
                  <PenLine size={16} className={day.journal ? "os-sky" : "os-neutral"} />
                  <div className="os-toggle-label">Journal de hoy</div>
                </div>
                <button
                  onClick={() => saveDay({ ...day, journal: !day.journal })}
                  className={"os-toggle-btn " + (day.journal ? "os-done-sky" : "")}
                  aria-label="Toggle journal"
                >
                  {day.journal && <Check size={14} color="#0a0a0a" strokeWidth={3} />}
                </button>
              </div>

              <div className="os-mente-row">
                <div className="os-toggle-left" style={{ marginBottom: 8 }}>
                  <BookOpen size={16} className="os-violet" />
                  <div className="os-toggle-label">Lectura</div>
                </div>
                <input
                  value={day.leer}
                  onChange={(e) => saveDay({ ...day, leer: e.target.value })}
                  placeholder="Título de lo que leíste (ej. The Economist — ...)"
                  className="os-leer-input"
                />
              </div>
            </div>
          </Section>

          <Section icon={Heart} title="Terapia" subtitle={"Rutina de tobillo — " + terapiaDone + "/" + RUTINA_TERAPIA.length + " hecho"}>
            <div className="os-tp-card">
              {RUTINA_TERAPIA.map((ej, i) => {
                const on = terapiaArr[i];
                return (
                  <div key={i} className="os-tp-row" onClick={() => toggleTerapia(i)}>
                    <div className={"os-tp-check " + (on ? "on" : "")}>
                      {on && <Check size={14} color="#fff" strokeWidth={3} />}
                    </div>
                    <span className={"os-tp-text " + (on ? "on" : "")}>{ej}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          <div className="os-alcohol-line">
            <div className="os-alcohol-left">
              <Wine size={15} className="os-neutral" />
              <span className="os-alcohol-txt">
                Sin alcohol · <span className="os-alcohol-streak">{rachaNoAlcohol} {rachaNoAlcohol === 1 ? "dia" : "dias"}</span>
              </span>
            </div>
            <button
              onClick={() => saveDay({ ...day, noAlcohol: !day.noAlcohol })}
              className={"os-alcohol-chk " + (day.noAlcohol ? "on" : "")}
              aria-label="Toggle no alcohol"
            >
              {day.noAlcohol && <Check size={14} color="#fff" strokeWidth={3} />}
            </button>
          </div>

          <button onClick={exportPDF} className="os-pdf-btn">
            <FileDown size={18} /> Guardar día como PDF
          </button>

          <div className="os-footer">datos guardados en este dispositivo</div>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, current, target, isMax }) {
  const pct = target ? Math.min(100, (current / target) * 100) : 0;
  const over = isMax && current > target;
  const barColor = over ? "os-bar-over" : "os-bar-" + color;
  return (
    <div className="os-stat">
      <div className={"os-stat-header os-" + color}>
        <Icon size={14} />
        <span className="os-stat-label">{label}</span>
      </div>
      <div className="os-stat-value">{value}</div>
      <div className="os-stat-sub">{sub}</div>
      {target ? (
        <div className="os-stat-bar">
          <div className={"os-stat-bar-fill " + barColor} style={{ width: pct + "%" }}></div>
        </div>
      ) : null}
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="os-section">
      <div className="os-section-head">
        <Icon size={16} className="os-neutral" />
        <h3 className="os-section-title">{title}</h3>
      </div>
      <div className="os-section-sub">{subtitle}</div>
      {children}
    </div>
  );
}

function Macro({ label, value, bold }) {
  return (
    <div>
      <div className={bold ? "os-macro-value-bold" : "os-macro-value"}>{value}</div>
      <div className="os-macro-label">{label}</div>
    </div>
  );
}

function WhoopField({ label, value, onChange, suffix, step = "1" }) {
  return (
    <div>
      <div className="os-whoop-label">{label}</div>
      <div className="os-whoop-wrap">
        <input
          type="number"
          step={step}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="os-whoop-input"
        />
        {suffix && <span className="os-whoop-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

function PrintView({ day, totals, dateLabel, kcalQuemadas, terapiaArr, rachaNoAlcohol }) {
  const RT = [
    "3x10 estiramiento atras-adelante",
    "3x10 estiramiento derecha-izquierda",
    "3x10 estiramiento izquierda-derecha",
    "3x10 elevacion de pantorrilla",
    "3x10 jalon con liga para tobillo",
    "5 min pistola de masaje",
  ];
  const terapiaDone = terapiaArr.filter(Boolean).length;
  return (
    <div className="os-print">
      <div className="os-print-container">
        <div className="os-print-header">
          <div className="os-print-eyebrow">Eduardo OS · resumen del día</div>
          <h1 className="os-print-title">{dateLabel}</h1>
        </div>

        <h2 className="os-print-h2">Comida</h2>
        {day.meals.length === 0 ? (
          <div className="os-print-empty">Sin registros</div>
        ) : (
          <table className="os-print-table">
            <thead>
              <tr>
                <th>Comida</th>
                <th className="os-print-right">kcal</th>
                <th className="os-print-right">prote</th>
                <th className="os-print-right">carbs</th>
                <th className="os-print-right">grasa</th>
              </tr>
            </thead>
            <tbody>
              {day.meals.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td className="os-print-right">{Math.round(m.kcal)}</td>
                  <td className="os-print-right">{Math.round(m.prote)}g</td>
                  <td className="os-print-right">{Math.round(m.carbs)}g</td>
                  <td className="os-print-right">{Math.round(m.fat)}g</td>
                </tr>
              ))}
              <tr className="os-print-total">
                <td>Total</td>
                <td className="os-print-right">{Math.round(totals.kcal)}</td>
                <td className="os-print-right">{Math.round(totals.prote)}g</td>
                <td className="os-print-right">{Math.round(totals.carbs)}g</td>
                <td className="os-print-right">{Math.round(totals.fat)}g</td>
              </tr>
            </tbody>
          </table>
        )}

        <h2 className="os-print-h2">Entrenamiento</h2>
        {day.workouts.every((w) => !w.titulo && w.exercises.length === 0 && !w.kcal) ? (
          <div className="os-print-empty">Sin registros</div>
        ) : (
          day.workouts.map((w, idx) =>
            (w.titulo || w.exercises.length > 0 || w.kcal) ? (
              <table key={idx} className="os-print-table">
                <thead>
                  <tr>
                    <th>{w.titulo || "Entrenamiento " + (idx + 1)}{w.kcal ? "  (" + Math.round(parseFloat(w.kcal)) + " kcal)" : ""}</th>
                    <th>Series</th>
                    <th>Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {w.exercises.length === 0 ? (
                    <tr><td colSpan={3} style={{ color: "#6b7280" }}>Sin ejercicios</td></tr>
                  ) : (
                    w.exercises.map((e) => (
                      <tr key={e.id}>
                        <td>{e.nombre || "—"}</td>
                        <td>{e.sets || "—"}</td>
                        <td>{e.peso || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : null
          )
        )}

        <h2 className="os-print-h2">Recuperación (Whoop)</h2>
        {!day.whoop || (!day.whoop.recovery && !day.whoop.sleep_perf && !day.whoop.strain) ? (
          <div className="os-print-empty">Sin registros</div>
        ) : (
          <div className="os-print-whoop">
            <div><div className="os-print-whoop-label">Recovery</div><div className="os-print-whoop-value">{day.whoop.recovery || "—"}%</div></div>
            <div><div className="os-print-whoop-label">Sueño</div><div className="os-print-whoop-value">{day.whoop.sleep_perf || "—"}%</div></div>
            <div><div className="os-print-whoop-label">Strain</div><div className="os-print-whoop-value">{day.whoop.strain || "—"}</div></div>
          </div>
        )}

        <h2 className="os-print-h2">Terapia (tobillo)</h2>
        <div className="os-print-mente">
          {terapiaDone}/{RT.length} ejercicios — {RT.map((t, i) => (terapiaArr[i] ? "✓" : "✗") + " " + t).join("  ·  ")}
        </div>

        <h2 className="os-print-h2">Mente</h2>
        <div className="os-print-mente">
          Journal: {day.journal ? "✓ hecho" : "—"} · Lectura: {day.leer ? day.leer : "—"}
        </div>

        <div className="os-print-recap">
          <div className="os-print-recap-title">Recap del día</div>

          <div className="os-print-recap-block">
            <div className="os-print-recap-h">Sin alcohol</div>
            <div className="os-print-recap-row">
              <span>Racha</span>
              <span className={day.noAlcohol ? "os-print-ok" : "os-print-bad"}>
                {rachaNoAlcohol} {rachaNoAlcohol === 1 ? "día" : "días"} {day.noAlcohol ? "✓ hoy" : "✗ hoy"}
              </span>
            </div>
          </div>

          {kcalQuemadas > 0 ? (
            <div className="os-print-recap-block">
              <div className="os-print-recap-h">Balance energético</div>
              <div className="os-print-recap-row"><span>Comido</span><span>{Math.round(totals.kcal)} kcal</span></div>
              <div className="os-print-recap-row"><span>Quemado</span><span>{Math.round(kcalQuemadas)} kcal</span></div>
              <div className="os-print-recap-row">
                <span>{totals.kcal < kcalQuemadas ? "Déficit" : "Superávit"}</span>
                <span className={totals.kcal < kcalQuemadas ? "os-print-ok" : "os-print-bad"}>
                  {Math.abs(Math.round(totals.kcal - kcalQuemadas))} kcal
                </span>
              </div>
            </div>
          ) : null}

          <div className="os-print-recap-block">
            <div className="os-print-recap-h">Macros vs meta</div>
            <div className="os-print-recap-row">
              <span>Calorías</span>
              <span className={totals.kcal <= 2000 ? "os-print-ok" : "os-print-bad"}>
                {Math.round(totals.kcal)} / 2000 {totals.kcal <= 2000 ? "✓" : "✗"}
              </span>
            </div>
            <div className="os-print-recap-row">
              <span>Proteína</span>
              <span className={totals.prote >= 200 ? "os-print-ok" : "os-print-bad"}>
                {Math.round(totals.prote)}g / 200g {totals.prote >= 200 ? "✓" : "✗"}
              </span>
            </div>
            <div className="os-print-recap-row"><span>Carbs</span><span>{Math.round(totals.carbs)}g / 150g</span></div>
            <div className="os-print-recap-row"><span>Grasa</span><span>{Math.round(totals.fat)}g / 65g</span></div>
          </div>

          <div className="os-print-recap-block">
            <div className="os-print-recap-h">Disciplina</div>
            <div className="os-print-recap-row">
              <span>Entrenó</span>
              <span className={day.workouts.some((w) => w.exercises.length > 0 || w.titulo) ? "os-print-ok" : "os-print-bad"}>
                {day.workouts.some((w) => w.exercises.length > 0 || w.titulo) ? "✓" : "✗ Sin entreno"}
              </span>
            </div>
            <div className="os-print-recap-row">
              <span>Terapia</span>
              <span className={terapiaDone === RT.length ? "os-print-ok" : "os-print-bad"}>
                {terapiaDone}/{RT.length} {terapiaDone === RT.length ? "✓" : ""}
              </span>
            </div>
            <div className="os-print-recap-row">
              <span>Journal</span>
              <span className={day.journal ? "os-print-ok" : "os-print-bad"}>{day.journal ? "✓" : "✗"}</span>
            </div>
            <div className="os-print-recap-row">
              <span>Lectura</span>
              <span className={day.leer ? "os-print-ok" : "os-print-bad"}>{day.leer ? "✓" : "✗"}</span>
            </div>
          </div>
        </div>

        <div className="os-print-footer">Generado el {new Date().toLocaleString("es-MX")}</div>
      </div>
    </div>
  );
}
