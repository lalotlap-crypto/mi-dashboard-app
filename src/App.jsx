import { useState, useEffect } from "react";
import {
  Dumbbell, Utensils, PenLine, BookOpen, Heart, Flame, Target,
  Activity, Plus, Trash2, FileDown, Moon, Sparkles, Zap, Check,
  Wheat, Droplet
} from "lucide-react";

const STORAGE_KEY = "eduardo_os_v4";
const METAS = { kcal_max: 2000, prote: 200, carbs: 150, grasa: 65 };

const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const defaultDay = () => ({
  meals: [],
  workouts: [],
  whoop: { recovery: "", sleep_hours: "", sleep_perf: "", hrv: "", rhr: "" },
  journal: false,
  leer: "",
  terapia: false,
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

.os-whoop-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.os-whoop-summary-card { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 14px; }
.os-whoop-summary-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.os-whoop-summary-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
.os-whoop-summary-value { font-size: 22px; font-weight: 600; line-height: 1.1; }
.os-whoop-summary-sub { font-size: 11px; color: #737373; margin-top: 2px; }

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

.os-btn-dashed { width: 100%; background: #171717; color: #d4d4d4; border: 1px dashed #404040; border-radius: 16px; padding: 12px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: border-color 0.15s; font-family: inherit; }
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

.os-workout-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.os-workout-name { flex: 1; background: transparent; border: none; border-bottom: 1px solid #262626; padding: 4px 0; font-size: 14px; font-weight: 500; color: #f5f5f5; outline: none; font-family: inherit; }
.os-workout-name:focus { border-bottom-color: #047857; }
.os-workout-name::placeholder { color: #525252; }

.os-workout-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.os-small-label { font-size: 11px; color: #737373; display: block; margin-bottom: 4px; }
.os-small-input { width: 100%; background: #0a0a0a; border: 1px solid #262626; border-radius: 6px; padding: 6px 8px; font-size: 13px; color: #f5f5f5; outline: none; font-family: inherit; }
.os-small-input:focus { border-color: #047857; }
.os-small-input::placeholder { color: #525252; }

.os-whoop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.os-whoop-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #737373; margin-bottom: 4px; }
.os-whoop-wrap { position: relative; }
.os-whoop-input { width: 100%; background: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 8px 12px; font-size: 16px; font-weight: 600; color: #f5f5f5; outline: none; padding-right: 40px; font-family: inherit; }
.os-whoop-input:focus { border-color: #0369a1; }
.os-whoop-suffix { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 11px; color: #737373; pointer-events: none; }

.os-mente { background: #171717; border: 1px solid #262626; border-radius: 16px; padding: 16px; }
.os-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.os-toggle-row + .os-toggle-row, .os-mente-row + .os-toggle-row, .os-toggle-row + .os-mente-row { margin-top: 16px; }
.os-toggle-left { display: flex; align-items: center; gap: 12px; flex: 1; }
.os-toggle-label { font-size: 14px; }
.os-toggle-btn { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #404040; background: #171717; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; padding: 0; }
.os-toggle-btn.os-done-sky { background: #0ea5e9; border-color: #0ea5e9; }
.os-toggle-btn.os-done-rose { background: #f43f5e; border-color: #f43f5e; }

.os-mente-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
.os-reading-input { width: 64px; background: #0a0a0a; border: 1px solid #262626; border-radius: 8px; padding: 4px 8px; font-size: 14px; text-align: right; color: #f5f5f5; outline: none; font-family: inherit; }
.os-reading-input:focus { border-color: #6d28d9; }
.os-reading-suffix { font-size: 11px; color: #737373; }

.os-pdf-btn { width: 100%; background: #059669; color: white; border: none; border-radius: 16px; padding: 16px; font-size: 16px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s; font-family: inherit; margin-bottom: 12px; }
.os-pdf-btn:hover { background: #10b981; }

.os-footer { text-align: center; font-size: 11px; color: #525252; padding-bottom: 24px; }

/* Print */
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
.os-print-whoop { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; font-size: 13px; }
.os-print-whoop-label { font-size: 11px; color: #4b5563; }
.os-print-whoop-value { font-weight: 600; }
.os-print-mente { font-size: 13px; margin-bottom: 24px; }
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
  const updateWhoop = (field, value) => {
    const whoop = { ...(day.whoop || {}), [field]: value };
    saveDay({ ...day, whoop });
  };
  const addWorkout = () => {
    const w = { id: Date.now(), exercise: "", sets: "", weight: "", notes: "" };
    saveDay({ ...day, workouts: [...day.workouts, w] });
  };
  const updateWorkout = (id, field, value) => {
    saveDay({ ...day, workouts: day.workouts.map((w) => (w.id === id ? { ...w, [field]: value } : w)) });
  };
  const removeWorkout = (id) => saveDay({ ...day, workouts: day.workouts.filter((w) => w.id !== id) });

  const totals = day.meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + (parseFloat(m.kcal) || 0),
      prote: acc.prote + (parseFloat(m.prote) || 0),
      carbs: acc.carbs + (parseFloat(m.carbs) || 0),
      fat: acc.fat + (parseFloat(m.fat) || 0),
    }),
    { kcal: 0, prote: 0, carbs: 0, fat: 0 }
  );

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
        <PrintView day={day} totals={totals} dateLabel={dateLabel} />
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
              <div className="os-whoop-summary-value">{day.whoop?.sleep_hours ? day.whoop.sleep_hours + "h" : "—"}</div>
              <div className="os-whoop-summary-sub">{day.whoop?.sleep_perf ? day.whoop.sleep_perf + "% perf" : "Whoop"}</div>
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

          <Section icon={Dumbbell} title="Entrenamiento" subtitle="Push, pull, brazo, espalda/bíceps, repeat">
            {day.workouts.length === 0 && <div className="os-empty">Sin ejercicios todavía</div>}
            {day.workouts.map((w) => (
              <div key={w.id} className="os-meal-item">
                <div className="os-workout-header">
                  <input
                    value={w.exercise}
                    onChange={(e) => updateWorkout(w.id, "exercise", e.target.value)}
                    placeholder="Ejercicio"
                    className="os-workout-name"
                  />
                  <button onClick={() => removeWorkout(w.id)} className="os-delete"><Trash2 size={14} /></button>
                </div>
                <div className="os-workout-grid">
                  <div>
                    <label className="os-small-label">Series x reps</label>
                    <input value={w.sets} onChange={(e) => updateWorkout(w.id, "sets", e.target.value)} placeholder="4x8" className="os-small-input" />
                  </div>
                  <div>
                    <label className="os-small-label">Peso</label>
                    <input value={w.weight} onChange={(e) => updateWorkout(w.id, "weight", e.target.value)} placeholder="70kg" className="os-small-input" />
                  </div>
                  <div>
                    <label className="os-small-label">Notas</label>
                    <input value={w.notes} onChange={(e) => updateWorkout(w.id, "notes", e.target.value)} placeholder="—" className="os-small-input" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addWorkout} className="os-btn-dashed">
              <Plus size={16} /> Agregar ejercicio
            </button>
          </Section>

          <Section icon={Heart} title="Recuperación" subtitle="Captura los números de tu Whoop">
            <div className="os-card os-card-pad">
              <div className="os-whoop-grid">
                <WhoopField label="Recovery" suffix="%" value={day.whoop?.recovery || ""} onChange={(v) => updateWhoop("recovery", v)} />
                <WhoopField label="Sueño" suffix="h" value={day.whoop?.sleep_hours || ""} onChange={(v) => updateWhoop("sleep_hours", v)} step="0.1" />
                <WhoopField label="Sleep perf" suffix="%" value={day.whoop?.sleep_perf || ""} onChange={(v) => updateWhoop("sleep_perf", v)} />
                <WhoopField label="HRV" suffix="ms" value={day.whoop?.hrv || ""} onChange={(v) => updateWhoop("hrv", v)} />
                <WhoopField label="RHR" suffix="bpm" value={day.whoop?.rhr || ""} onChange={(v) => updateWhoop("rhr", v)} />
              </div>
            </div>
          </Section>

          <Section icon={PenLine} title="Mente" subtitle="Journal, lectura, terapia">
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
                <div className="os-toggle-left">
                  <BookOpen size={16} className="os-violet" />
                  <div className="os-toggle-label">Lectura</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={day.leer}
                    onChange={(e) => saveDay({ ...day, leer: e.target.value })}
                    placeholder="0"
                    className="os-reading-input"
                  />
                  <span className="os-reading-suffix">min</span>
                </div>
              </div>

              <div className="os-toggle-row">
                <div className="os-toggle-left">
                  <Heart size={16} className={day.terapia ? "os-rose" : "os-neutral"} />
                  <div className="os-toggle-label">Terapia de hoy</div>
                </div>
                <button
                  onClick={() => saveDay({ ...day, terapia: !day.terapia })}
                  className={"os-toggle-btn " + (day.terapia ? "os-done-rose" : "")}
                  aria-label="Toggle terapia"
                >
                  {day.terapia && <Check size={14} color="#0a0a0a" strokeWidth={3} />}
                </button>
              </div>
            </div>
          </Section>

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

function PrintView({ day, totals, dateLabel }) {
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
        {day.workouts.length === 0 ? (
          <div className="os-print-empty">Sin registros</div>
        ) : (
          <table className="os-print-table">
            <thead>
              <tr>
                <th>Ejercicio</th>
                <th>Series</th>
                <th>Peso</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {day.workouts.map((w) => (
                <tr key={w.id}>
                  <td>{w.exercise || "—"}</td>
                  <td>{w.sets || "—"}</td>
                  <td>{w.weight || "—"}</td>
                  <td>{w.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="os-print-h2">Recuperación (Whoop)</h2>
        {!day.whoop || !day.whoop.recovery ? (
          <div className="os-print-empty">Sin registros</div>
        ) : (
          <div className="os-print-whoop">
            <div><div className="os-print-whoop-label">Recovery</div><div className="os-print-whoop-value">{day.whoop.recovery || "—"}%</div></div>
            <div><div className="os-print-whoop-label">Sueño</div><div className="os-print-whoop-value">{day.whoop.sleep_hours || "—"}h</div></div>
            <div><div className="os-print-whoop-label">Sleep perf</div><div className="os-print-whoop-value">{day.whoop.sleep_perf || "—"}%</div></div>
            <div><div className="os-print-whoop-label">HRV</div><div className="os-print-whoop-value">{day.whoop.hrv || "—"} ms</div></div>
            <div><div className="os-print-whoop-label">RHR</div><div className="os-print-whoop-value">{day.whoop.rhr || "—"} bpm</div></div>
          </div>
        )}

        <h2 className="os-print-h2">Mente</h2>
        <div className="os-print-mente">
          Journal: {day.journal ? "✓ hecho" : "—"} · Lectura: {day.leer ? day.leer + " min" : "—"} · Terapia: {day.terapia ? "✓ hecho" : "—"}
        </div>

        <div className="os-print-footer">Generado el {new Date().toLocaleString("es-MX")}</div>
      </div>
    </div>
  );
}
