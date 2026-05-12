import { useState, useEffect, useRef } from "react";
import {
  Dumbbell, Utensils, PenLine, BookOpen, Heart, Flame, Target,
  Activity, Camera, Plus, Trash2, FileDown, Loader2, Moon,
  Sparkles, Zap, Check
} from "lucide-react";

const STORAGE_KEY = "eduardo_os_v3";

const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const defaultDay = () => ({
  meals: [],
  workouts: [],
  whoop: null,
  journal: false,
  leer: "",
  terapia: false,
});

const METAS = {
  kcal_max: 2000,
  prote: 200,
};

export default function App() {
  const [data, setData] = useState({ days: {} });
  const [loading, setLoading] = useState({ meal: false, whoop: false });
  const [showPrint, setShowPrint] = useState(false);
  const mealInputRef = useRef(null);
  const whoopInputRef = useRef(null);

  const today = fmtDate(new Date());
  const day = data.days[today] || defaultDay();

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) setData(JSON.parse(r.value));
      } catch (e) {
        // first time
      }
    })();
  }, []);

  const saveDay = async (newDay) => {
    const newData = { ...data, days: { ...data.days, [today]: newDay } };
    setData(newData);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error("Storage error:", e);
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const callClaude = async (file, prompt) => {
    const base64 = await fileToBase64(file);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: file.type, data: base64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
    const result = await response.json();
    const text = result.content.map((c) => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  };

  const onMealPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading((p) => ({ ...p, meal: true }));
    try {
      const parsed = await callClaude(
        file,
        'Extract nutritional info from this image (could be food photo, app screenshot like MyFitnessPal, or food label). Return ONLY valid JSON, no markdown, in this exact format: {"name": "short description in Spanish", "kcal": number, "prote": number, "carbs": number, "fat": number}. Estimate reasonably if not exact.'
      );
      const meal = { id: Date.now(), ...parsed };
      await saveDay({ ...day, meals: [...day.meals, meal] });
    } catch (err) {
      alert("No pude procesar la foto. Intenta de nuevo.");
    } finally {
      setLoading((p) => ({ ...p, meal: false }));
      if (mealInputRef.current) mealInputRef.current.value = "";
    }
  };

  const onWhoopPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading((p) => ({ ...p, whoop: true }));
    try {
      const parsed = await callClaude(
        file,
        'This is a screenshot from the Whoop app. Extract recovery score, sleep duration in hours, sleep performance percentage, HRV, and resting heart rate. Return ONLY valid JSON, no markdown, in this exact format: {"recovery": number, "sleep_hours": number, "sleep_perf": number, "hrv": number, "rhr": number}. Use null for any field not visible.'
      );
      await saveDay({ ...day, whoop: parsed });
    } catch (err) {
      alert("No pude procesar la foto del Whoop. Intenta de nuevo.");
    } finally {
      setLoading((p) => ({ ...p, whoop: false }));
      if (whoopInputRef.current) whoopInputRef.current.value = "";
    }
  };

  const totals = day.meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + (parseFloat(m.kcal) || 0),
      prote: acc.prote + (parseFloat(m.prote) || 0),
      carbs: acc.carbs + (parseFloat(m.carbs) || 0),
      fat: acc.fat + (parseFloat(m.fat) || 0),
    }),
    { kcal: 0, prote: 0, carbs: 0, fat: 0 }
  );

  const addWorkout = () => {
    const w = { id: Date.now(), exercise: "", sets: "", weight: "", notes: "" };
    saveDay({ ...day, workouts: [...day.workouts, w] });
  };
  const updateWorkout = (id, field, value) => {
    saveDay({ ...day, workouts: day.workouts.map((w) => (w.id === id ? { ...w, [field]: value } : w)) });
  };
  const removeWorkout = (id) => saveDay({ ...day, workouts: day.workouts.filter((w) => w.id !== id) });
  const removeMeal = (id) => saveDay({ ...day, meals: day.meals.filter((m) => m.id !== id) });

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
    return <PrintView day={day} totals={totals} dateLabel={dateLabel} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="max-w-md mx-auto px-5 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
            <Sparkles size={12} />
            <span className="uppercase tracking-widest">Personal OS · v3</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Eduardo OS</h1>
          <div className="text-sm text-neutral-400 mt-1.5 capitalize">{dateLabel}</div>
        </header>

        {/* Top stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={Flame}
            label="Calorías"
            value={Math.round(totals.kcal)}
            sub={`/ ${METAS.kcal_max} máx`}
            color="amber"
            warning={totals.kcal > METAS.kcal_max}
          />
          <StatCard
            icon={Zap}
            label="Proteína"
            value={Math.round(totals.prote) + "g"}
            sub={`/ ${METAS.prote}g meta`}
            color="emerald"
            success={totals.prote >= METAS.prote}
          />
          <StatCard
            icon={Activity}
            label="Recovery"
            value={day.whoop?.recovery != null ? day.whoop.recovery + "%" : "—"}
            sub="Whoop"
            color="sky"
          />
          <StatCard
            icon={Moon}
            label="Sueño"
            value={day.whoop?.sleep_hours != null ? day.whoop.sleep_hours + "h" : "—"}
            sub={day.whoop?.sleep_perf != null ? day.whoop.sleep_perf + "% perf" : "Whoop"}
            color="violet"
          />
        </div>

        {/* COMIDA */}
        <Section icon={Utensils} title="Comida" subtitle="Sube foto y se transcribe sola">
          <input ref={mealInputRef} type="file" accept="image/*" capture="environment" onChange={onMealPhoto} className="hidden" />
          <button
            onClick={() => mealInputRef.current?.click()}
            disabled={loading.meal}
            className="w-full bg-neutral-900 border border-dashed border-neutral-700 hover:border-emerald-700 rounded-2xl p-4 mb-3 flex items-center justify-center gap-2 text-sm text-neutral-300 transition-colors disabled:opacity-50"
          >
            {loading.meal ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Leyendo foto...
              </>
            ) : (
              <>
                <Camera size={16} />
                Subir foto de comida o macros
              </>
            )}
          </button>

          {day.meals.length === 0 && (
            <div className="text-xs text-neutral-600 text-center py-2">Aún no hay comidas registradas hoy</div>
          )}

          {day.meals.map((m) => (
            <div key={m.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 mb-2">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-sm font-medium flex-1">{m.name}</div>
                <button onClick={() => removeMeal(m.id)} className="text-neutral-600 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Macro label="kcal" value={Math.round(m.kcal)} />
                <Macro label="prote" value={Math.round(m.prote) + "g"} />
                <Macro label="carbs" value={Math.round(m.carbs) + "g"} />
                <Macro label="grasa" value={Math.round(m.fat) + "g"} />
              </div>
            </div>
          ))}

          {day.meals.length > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3 mt-2">
              <div className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Totales del día</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Macro label="kcal" value={Math.round(totals.kcal)} bold />
                <Macro label="prote" value={Math.round(totals.prote) + "g"} bold />
                <Macro label="carbs" value={Math.round(totals.carbs) + "g"} bold />
                <Macro label="grasa" value={Math.round(totals.fat) + "g"} bold />
              </div>
            </div>
          )}
        </Section>

        {/* ENTRENAMIENTO */}
        <Section icon={Dumbbell} title="Entrenamiento" subtitle="Push, pull, brazo, espalda/bíceps, repeat">
          {day.workouts.length === 0 && (
            <div className="text-xs text-neutral-600 text-center py-2 mb-2">Sin ejercicios todavía</div>
          )}
          {day.workouts.map((w) => (
            <div key={w.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={w.exercise}
                  onChange={(e) => updateWorkout(w.id, "exercise", e.target.value)}
                  placeholder="Ejercicio (ej. press de banca)"
                  className="flex-1 bg-transparent text-sm font-medium border-b border-neutral-800 focus:border-emerald-700 focus:outline-none pb-1 text-neutral-100 placeholder-neutral-600"
                />
                <button onClick={() => removeWorkout(w.id)} className="text-neutral-600 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <SmallInput
                  label="Series x reps"
                  value={w.sets}
                  onChange={(v) => updateWorkout(w.id, "sets", v)}
                  placeholder="4x8"
                />
                <SmallInput
                  label="Peso"
                  value={w.weight}
                  onChange={(v) => updateWorkout(w.id, "weight", v)}
                  placeholder="70kg"
                />
                <SmallInput
                  label="Notas"
                  value={w.notes}
                  onChange={(v) => updateWorkout(w.id, "notes", v)}
                  placeholder="—"
                />
              </div>
            </div>
          ))}
          <button
            onClick={addWorkout}
            className="w-full bg-neutral-900 border border-dashed border-neutral-700 hover:border-emerald-700 rounded-2xl p-3 flex items-center justify-center gap-2 text-sm text-neutral-300 transition-colors"
          >
            <Plus size={16} />
            Agregar ejercicio
          </button>
        </Section>

        {/* RECUPERACIÓN (Whoop) */}
        <Section icon={Heart} title="Recuperación" subtitle="Sube screenshot del Whoop">
          <input ref={whoopInputRef} type="file" accept="image/*" onChange={onWhoopPhoto} className="hidden" />
          <button
            onClick={() => whoopInputRef.current?.click()}
            disabled={loading.whoop}
            className="w-full bg-neutral-900 border border-dashed border-neutral-700 hover:border-sky-700 rounded-2xl p-4 mb-3 flex items-center justify-center gap-2 text-sm text-neutral-300 transition-colors disabled:opacity-50"
          >
            {loading.whoop ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Leyendo Whoop...
              </>
            ) : (
              <>
                <Camera size={16} />
                Subir screenshot del Whoop
              </>
            )}
          </button>
          {day.whoop && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <WhoopMetric label="Recovery" value={day.whoop.recovery != null ? day.whoop.recovery + "%" : "—"} />
                <WhoopMetric label="Sueño" value={day.whoop.sleep_hours != null ? day.whoop.sleep_hours + "h" : "—"} />
                <WhoopMetric label="Sleep perf" value={day.whoop.sleep_perf != null ? day.whoop.sleep_perf + "%" : "—"} />
                <WhoopMetric label="HRV" value={day.whoop.hrv != null ? day.whoop.hrv + " ms" : "—"} />
                <WhoopMetric label="RHR" value={day.whoop.rhr != null ? day.whoop.rhr + " bpm" : "—"} />
              </div>
            </div>
          )}
        </Section>

        {/* MENTALES */}
        <Section icon={PenLine} title="Mente" subtitle="Journal, lectura, terapia">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-4">
            <ToggleRow
              icon={PenLine}
              label="Journal de hoy"
              done={day.journal}
              onClick={() => saveDay({ ...day, journal: !day.journal })}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <BookOpen size={16} className="text-violet-400" />
                <div className="text-sm">Lectura</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={day.leer}
                  onChange={(e) => saveDay({ ...day, leer: e.target.value })}
                  placeholder="0"
                  inputMode="decimal"
                  className="w-16 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:border-violet-700"
                />
                <span className="text-xs text-neutral-500">min</span>
              </div>
            </div>
            <ToggleRow
              icon={Heart}
              label="Terapia de hoy"
              done={day.terapia}
              onClick={() => saveDay({ ...day, terapia: !day.terapia })}
              color="rose"
            />
          </div>
        </Section>

        {/* PDF Export */}
        <button
          onClick={exportPDF}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-medium mb-3 transition-colors"
        >
          <FileDown size={18} />
          Guardar día como PDF
        </button>

        <div className="text-center text-xs text-neutral-600 pt-2 pb-6">v3 · datos guardados automáticamente</div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, warning, success }) {
  const colors = {
    amber: { icon: "text-amber-400", border: warning ? "border-red-900/50" : "border-neutral-800" },
    emerald: { icon: "text-emerald-400", border: success ? "border-emerald-900/50" : "border-neutral-800" },
    sky: { icon: "text-sky-400", border: "border-neutral-800" },
    violet: { icon: "text-violet-400", border: "border-neutral-800" },
  };
  const c = colors[color];
  return (
    <div className={`bg-neutral-900 border ${c.border} rounded-2xl p-4`}>
      <div className={`flex items-center gap-1.5 ${c.icon} mb-2`}>
        <Icon size={14} />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-semibold leading-tight">{value}</div>
      <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-neutral-400" />
        <h3 className="text-sm font-medium uppercase tracking-widest text-neutral-300">{title}</h3>
      </div>
      <div className="text-xs text-neutral-500 mb-3">{subtitle}</div>
      {children}
    </div>
  );
}

function Macro({ label, value, bold }) {
  return (
    <div>
      <div className={`${bold ? "text-base font-semibold" : "text-sm"} text-neutral-100`}>{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

function SmallInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs text-neutral-500 block mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-emerald-700 text-neutral-100 placeholder-neutral-600"
      />
    </div>
  );
}

function WhoopMetric({ label, value }) {
  return (
    <div>
      <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, done, onClick, color = "sky" }) {
  const colors = {
    sky: "bg-sky-500 border-sky-500",
    rose: "bg-rose-500 border-rose-500",
    emerald: "bg-emerald-500 border-emerald-500",
  };
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <Icon size={16} className={done ? `text-${color}-400` : "text-neutral-400"} />
        <div className="text-sm">{label}</div>
      </div>
      <button
        onClick={onClick}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${done ? colors[color] : "border-neutral-700 bg-neutral-900"}`}
      >
        {done && <Check size={14} className="text-neutral-950" strokeWidth={3} />}
      </button>
    </div>
  );
}

function PrintView({ day, totals, dateLabel }) {
  return (
    <div className="min-h-screen bg-white text-black p-8" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="max-w-2xl mx-auto">
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="text-xs uppercase tracking-widest text-gray-600">Eduardo OS · resumen del día</div>
          <h1 className="text-3xl font-bold mt-1 capitalize">{dateLabel}</h1>
        </div>

        <h2 className="text-lg font-bold mb-3 uppercase tracking-wider">Comida</h2>
        {day.meals.length === 0 ? (
          <div className="text-sm text-gray-500 mb-6">Sin registros</div>
        ) : (
          <>
            <table className="w-full text-sm mb-3 border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-1">Comida</th>
                  <th className="text-right py-1">kcal</th>
                  <th className="text-right py-1">prote</th>
                  <th className="text-right py-1">carbs</th>
                  <th className="text-right py-1">grasa</th>
                </tr>
              </thead>
              <tbody>
                {day.meals.map((m) => (
                  <tr key={m.id} className="border-b border-gray-300">
                    <td className="py-1.5">{m.name}</td>
                    <td className="text-right">{Math.round(m.kcal)}</td>
                    <td className="text-right">{Math.round(m.prote)}g</td>
                    <td className="text-right">{Math.round(m.carbs)}g</td>
                    <td className="text-right">{Math.round(m.fat)}g</td>
                  </tr>
                ))}
                <tr className="font-bold border-t-2 border-black">
                  <td className="py-2">Total</td>
                  <td className="text-right">{Math.round(totals.kcal)}</td>
                  <td className="text-right">{Math.round(totals.prote)}g</td>
                  <td className="text-right">{Math.round(totals.carbs)}g</td>
                  <td className="text-right">{Math.round(totals.fat)}g</td>
                </tr>
              </tbody>
            </table>
            <div className="mb-6"></div>
          </>
        )}

        <h2 className="text-lg font-bold mb-3 uppercase tracking-wider">Entrenamiento</h2>
        {day.workouts.length === 0 ? (
          <div className="text-sm text-gray-500 mb-6">Sin registros</div>
        ) : (
          <table className="w-full text-sm mb-6 border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1">Ejercicio</th>
                <th className="text-left py-1">Series</th>
                <th className="text-left py-1">Peso</th>
                <th className="text-left py-1">Notas</th>
              </tr>
            </thead>
            <tbody>
              {day.workouts.map((w) => (
                <tr key={w.id} className="border-b border-gray-300">
                  <td className="py-1.5">{w.exercise || "—"}</td>
                  <td>{w.sets || "—"}</td>
                  <td>{w.weight || "—"}</td>
                  <td>{w.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="text-lg font-bold mb-3 uppercase tracking-wider">Recuperación (Whoop)</h2>
        {!day.whoop ? (
          <div className="text-sm text-gray-500 mb-6">Sin registros</div>
        ) : (
          <div className="grid grid-cols-5 gap-3 mb-6 text-sm">
            <div><div className="text-xs text-gray-600">Recovery</div><div className="font-semibold">{day.whoop.recovery ?? "—"}%</div></div>
            <div><div className="text-xs text-gray-600">Sueño</div><div className="font-semibold">{day.whoop.sleep_hours ?? "—"}h</div></div>
            <div><div className="text-xs text-gray-600">Sleep perf</div><div className="font-semibold">{day.whoop.sleep_perf ?? "—"}%</div></div>
            <div><div className="text-xs text-gray-600">HRV</div><div className="font-semibold">{day.whoop.hrv ?? "—"} ms</div></div>
            <div><div className="text-xs text-gray-600">RHR</div><div className="font-semibold">{day.whoop.rhr ?? "—"} bpm</div></div>
          </div>
        )}

        <h2 className="text-lg font-bold mb-3 uppercase tracking-wider">Mente</h2>
        <div className="text-sm mb-6">
          Journal: {day.journal ? "✓ hecho" : "—"} · Lectura: {day.leer ? `${day.leer} min` : "—"} · Terapia: {day.terapia ? "✓ hecho" : "—"}
        </div>

        <div className="text-xs text-gray-500 pt-4 border-t border-gray-300">Generado el {new Date().toLocaleString("es-MX")}</div>
      </div>
    </div>
  );
}
