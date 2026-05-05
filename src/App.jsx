import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "edu_dashboard_v5";

// ─── Paleta Apple light ─────────────────────────────────
const C = {
  bg: "#FFFFFF",
  bg2: "#F5F5F7",
  bg3: "#FAFAFA",
  border: "#E5E5EA",
  border2: "#D1D1D6",
  text: "#1D1D1F",
  text2: "#6E6E73",
  text3: "#86868B",
  blue: "#007AFF",
  green: "#34C759",
  orange: "#FF9500",
  red: "#FF3B30",
  purple: "#AF52DE",
  pink: "#FF2D92",
  yellow: "#FFCC00",
  teal: "#5AC8FA",
};

const COMIDAS_DEFAULT = {
  desayuno: { id: 1, nombre: "Desayuno post-gym", cal: 410, prot: 45, carb: 40, gra: 8.5,
    items: ["Avena 365 ½ cup", "Yogurt griego 0% ½ cup", "Leche whole ½ cup", "Whey 1 scoop"], completado: false, fijo: true },
  lunch: { id: 2, nombre: "Lunch · pollo + arroz + papa", cal: 545, prot: 58, carb: 51, gra: 10.5,
    items: ["Pollo airfryer 170g", "Arroz integral ½ sobre", "Baby Potato Blend ½ bolsa"], completado: false, fijo: false,
    plan: { nombre: "Lunch · pollo + arroz + papa", cal: 545, prot: 58, carb: 51, gra: 10.5,
      items: ["Pollo airfryer 170g", "Arroz integral ½ sobre", "Baby Potato Blend ½ bolsa"] } },
  snack: { id: 3, nombre: "Snack 5pm · manzana", cal: 95, prot: 0, carb: 25, gra: 0,
    items: ["1 manzana mediana"], completado: false, fijo: true },
  cena: { id: 4, nombre: "Cena · igual que lunch", cal: 545, prot: 58, carb: 51, gra: 10.5,
    items: ["Pollo airfryer 170g", "Arroz integral ½ sobre", "Baby Potato Blend ½ bolsa"], completado: false, fijo: false,
    plan: { nombre: "Cena · igual que lunch", cal: 545, prot: 58, carb: 51, gra: 10.5,
      items: ["Pollo airfryer 170g", "Arroz integral ½ sobre", "Baby Potato Blend ½ bolsa"] } },
  noche: { id: 5, nombre: "Antes de dormir · tart cherry", cal: 130, prot: 1, carb: 32, gra: 0,
    items: ["Tart cherry juice 240ml"], completado: false, fijo: true },
};

const DEFAULT_DATA = {
  perfil: { nombre: "Eduardo", pesoActual: 75, pesoMeta: 70, pesoInicial: 76 },
  reto: {
    nombre: "100 Días Hard",
    fechaInicio: null,
    diaActual: 0,
    diasCompletados: [],
    escudosUsados: 0,
    escudosMes: 2,
    mesActualEscudos: new Date().toISOString().slice(0, 7),
  },
  finanzas: {
    ingreso: 6000,
    presupuesto: 1400,
    ahorreMeta: 2000,
    rentaFija: 2600,
    transacciones: [],
    categorias: [
      { id: "comida", nombre: "Comida", color: C.green },
      { id: "transporte", nombre: "Transporte", color: C.orange },
      { id: "salud", nombre: "Salud", color: C.red },
      { id: "social", nombre: "Social", color: C.purple },
      { id: "ropa", nombre: "Ropa", color: C.pink },
      { id: "otros", nombre: "Otros", color: C.text2 },
    ],
  },
  comidas: {
    plan: [COMIDAS_DEFAULT.desayuno, COMIDAS_DEFAULT.lunch, COMIDAS_DEFAULT.snack, COMIDAS_DEFAULT.cena, COMIDAS_DEFAULT.noche],
    metas: { cal: 1900, prot: 180, carb: 200, gra: 60 },
    agua: 0,
    metaAgua: 12,
    suplementos: [
      { id: 1, nombre: "DHA 1000", momento: "con desayuno", completado: false },
      { id: 2, nombre: "Mega Men Sport (2)", momento: "con desayuno", completado: false },
      { id: 3, nombre: "Omega multi", momento: "con desayuno", completado: false },
    ],
  },
  habitos: {
    reglas: [
      { nombre: "Despertar 7am", tipo: "check" },
      { nombre: "Sueño 7+ hrs", tipo: "horas" },
      { nombre: "Journaling", tipo: "check" },
      { nombre: "Sin alcohol", tipo: "check" },
      { nombre: "Lectura", tipo: "check" },
      { nombre: "Nutrición", tipo: "check" },
      { nombre: "Terapia 1hr", tipo: "check" },
      { nombre: "No cel 10:30pm", tipo: "check" },
      { nombre: "No fap", tipo: "check" },
    ],
    hoy: {},
    fechaHoy: new Date().toISOString().slice(0, 10),
  },
  urgentes: [],
  fotosProgreso: [],
  whoop: { historial: [] },
  notasZulma: ["Preguntar sobre grasa baja (29g) en plan v2"],
  compras: [
    { id: 1, item: "Pollo pechuga 2.5 lb", categoria: "Proteína", comprado: false },
    { id: 2, item: "Arroz integral 365 (7 sobres)", categoria: "Carbs", comprado: false },
    { id: 3, item: "WF Baby Potato Blend (4 bolsas)", categoria: "Carbs", comprado: false },
    { id: 4, item: "Avena 365 Rolled Oats 18oz", categoria: "Desayuno", comprado: false },
    { id: 5, item: "Yogurt griego 0% 32oz", categoria: "Desayuno", comprado: false },
    { id: 6, item: "Leche whole ½ gallon", categoria: "Desayuno", comprado: false },
    { id: 7, item: "Manzanas (7 piezas)", categoria: "Snack", comprado: false },
    { id: 8, item: "Tart cherry juice (2 botellas)", categoria: "Noche", comprado: false },
    { id: 9, item: "Whey Double Rich Choc 2lb", categoria: "Suplementos", comprado: false },
  ],
};

function uid() { return Date.now() + Math.random(); }
function hoy() { return new Date().toISOString().slice(0, 10); }
function mesActual() { return new Date().toISOString().slice(0, 7); }

function ProgressBar({ value, max, color = C.blue, height = 6 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height, background: C.bg2, borderRadius: 99, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Ring({ pct, size = 64, stroke = 6, color = C.blue }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.bg2} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

function Badge({ label, color = C.blue }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
      background: color + "15", color, padding: "4px 10px", borderRadius: 99 }}>
      {label}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 14, letterSpacing: "-0.01em" }}>
      {children}
    </div>
  );
}

// ─── Iconos SF style ───────────────────────────────────
const Icons = {
  home: (active) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9.5z"
        stroke={active ? C.blue : C.text3} strokeWidth="2" fill={active ? C.blue + "15" : "none"}
        strokeLinejoin="round" />
    </svg>
  ),
  flame: (active) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 2s4 4 4 8a4 4 0 11-8 0c0-1 .5-2 1-3-1 1-2 3-2 5a6 6 0 0012 0c0-5-7-10-7-10z"
        stroke={active ? C.orange : C.text3} strokeWidth="2" fill={active ? C.orange + "20" : "none"}
        strokeLinejoin="round" />
    </svg>
  ),
  dollar: (active) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? C.green : C.text3} strokeWidth="2" fill={active ? C.green + "15" : "none"} />
      <path d="M12 6v12M9 9c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3 1-3 2 1 2 3 2 3-1 3-2"
        stroke={active ? C.green : C.text3} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  fork: (active) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M7 2v8a3 3 0 003 3v9M5 2v6M9 2v6M17 2c-2 0-3 2-3 5v5h6V7c0-3-1-5-3-5zM17 13v9"
        stroke={active ? C.red : C.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? C.red + "10" : "none"} />
    </svg>
  ),
  body: (active) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2.5" stroke={active ? C.purple : C.text3} strokeWidth="2" fill={active ? C.purple + "20" : "none"} />
      <path d="M8 22v-7l-2-5a2 2 0 012-2h8a2 2 0 012 2l-2 5v7"
        stroke={active ? C.purple : C.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? C.purple + "10" : "none"} />
    </svg>
  ),
};

const TABS = [
  { id: "home",   label: "Hoy",      icon: Icons.home,   color: C.blue },
  { id: "reto",   label: "100 Días", icon: Icons.flame,  color: C.orange },
  { id: "dinero", label: "Dinero",   icon: Icons.dollar, color: C.green },
  { id: "comida", label: "Comida",   icon: Icons.fork,   color: C.red },
  { id: "cuerpo", label: "Cuerpo",   icon: Icons.body,   color: C.purple },
];

// ─── HOME ───────────────────────────────────────────────
function HomeTab({ data, setData }) {
  const gastosHoy = data.finanzas.transacciones.filter(t => t.fecha === hoy()).reduce((s, t) => s + t.monto, 0);

  const habitsHoy = data.habitos.reglas.filter((h, i) => {
    const v = data.habitos.hoy[i];
    return h.tipo === "horas" ? (v !== undefined && v >= 7) : v === true;
  }).length;
  const totalHabits = data.habitos.reglas.length;

  const pesoPct = Math.round(((data.perfil.pesoInicial - data.perfil.pesoActual) / (data.perfil.pesoInicial - data.perfil.pesoMeta)) * 100);
  const calHoy = data.comidas.plan.filter(c => c.completado).reduce((s, c) => s + c.cal, 0);

  const toggleHabito = (i) => {
    setData(prev => {
      const habito = prev.habitos.reglas[i];
      const v = prev.habitos.hoy[i];
      const newVal = habito.tipo === "horas" ? (v === undefined ? 8 : undefined) : (v === true ? false : true);
      const nuevoHoy = { ...prev.habitos.hoy };
      if (newVal === undefined || newVal === false) delete nuevoHoy[i];
      else nuevoHoy[i] = newVal;
      return { ...prev, habitos: { ...prev.habitos, hoy: nuevoHoy } };
    });
  };

  const cambiarHoras = (i, val) => {
    const num = parseFloat(val);
    setData(prev => {
      const nuevoHoy = { ...prev.habitos.hoy };
      if (isNaN(num)) delete nuevoHoy[i];
      else nuevoHoy[i] = num;
      return { ...prev, habitos: { ...prev.habitos, hoy: nuevoHoy } };
    });
  };

  const editarUrgente = (id, nuevo) => setData(prev => ({ ...prev, urgentes: prev.urgentes.map(u => u.id === id ? { ...u, titulo: nuevo } : u) }));
  const addUrgente = () => setData(prev => ({ ...prev, urgentes: [...prev.urgentes, { id: uid(), titulo: "Nuevo deadline", fecha: "—" }] }));
  const delUrgente = (id) => setData(prev => ({ ...prev, urgentes: prev.urgentes.filter(u => u.id !== id) }));

  const fechaHoy = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  const diaReto = data.reto.diaActual;

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Hola, {data.perfil.nombre}
        </div>
        <div style={{ fontSize: 14, color: C.text2, marginTop: 4, textTransform: "capitalize" }}>{fechaHoy}</div>
      </div>

      {/* Reto hero */}
      <Card style={{ background: `linear-gradient(135deg, ${C.orange}10 0%, ${C.bg} 60%)`, border: `1px solid ${C.orange}30`, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: C.orange, fontWeight: 600, marginBottom: 4 }}>{data.reto.nombre}</div>
            <div style={{ fontSize: 60, fontWeight: 700, color: C.text, letterSpacing: "-0.04em", lineHeight: 0.95 }}>
              {diaReto}<span style={{ fontSize: 24, color: C.text2, fontWeight: 600 }}> / 100</span>
            </div>
            <div style={{ fontSize: 13, color: C.text2, marginTop: 6 }}>
              {diaReto === 0 ? "completa todo hoy para empezar" : `${100 - diaReto} días restantes`}
            </div>
          </div>
          <div style={{ fontSize: 56 }}>🔥</div>
        </div>
        <div style={{ marginTop: 16 }}>
          <ProgressBar value={diaReto} max={100} color={C.orange} height={8} />
        </div>
      </Card>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 6 }}>Hábitos hoy</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.purple, letterSpacing: "-0.03em", lineHeight: 1 }}>{habitsHoy}<span style={{ fontSize: 16, color: C.text3 }}>/{totalHabits}</span></div>
          <div style={{ marginTop: 10 }}><ProgressBar value={habitsHoy} max={totalHabits} color={C.purple} height={4} /></div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 6 }}>Peso</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.green, letterSpacing: "-0.03em", lineHeight: 1 }}>{data.perfil.pesoActual}<span style={{ fontSize: 14, color: C.text3 }}>kg</span></div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 6 }}>meta {data.perfil.pesoMeta}kg · {pesoPct}%</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 6 }}>Gastado hoy</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.orange, letterSpacing: "-0.03em", lineHeight: 1 }}>${gastosHoy}</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 6 }}>de ${Math.round(data.finanzas.presupuesto / 30)} diario</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 6 }}>Calorías</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.blue, letterSpacing: "-0.03em", lineHeight: 1 }}>{calHoy}</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 6 }}>de {data.comidas.metas.cal}</div>
        </Card>
      </div>

      {/* Hábitos hoy */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>Hábitos de hoy</SectionTitle>
          <Badge label={`${habitsHoy}/${totalHabits}`} color={C.purple} />
        </div>
        {data.habitos.reglas.map((h, i) => {
          const val = data.habitos.hoy[i];
          const done = h.tipo === "horas" ? (val !== undefined && val >= 7) : val === true;
          return (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < data.habitos.reglas.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div onClick={() => toggleHabito(i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <span style={{ fontSize: 15, color: done ? C.text : C.text2, fontWeight: done ? 500 : 400 }}>
                  {h.nombre}
                  {h.tipo === "horas" && val !== undefined && <span style={{ color: C.blue, marginLeft: 8, fontSize: 13, fontWeight: 600 }}>{val}h</span>}
                </span>
                <div style={{ width: 26, height: 26, borderRadius: 13,
                  background: done ? C.green : C.bg,
                  border: done ? "none" : `1.5px solid ${C.border2}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  transition: "all 0.15s" }}>
                  {done && <span style={{ fontSize: 14, color: C.bg, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
              {h.tipo === "horas" && val !== undefined && (
                <div style={{ marginTop: 8, paddingLeft: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.text2 }}>Horas:</span>
                  <input type="number" step="0.5" value={val} onChange={e => cambiarHoras(i, e.target.value)}
                    style={{ width: 70, padding: "6px 10px", fontSize: 14, background: C.bg2, border: "none", borderRadius: 8, color: C.blue, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
                  <span style={{ fontSize: 11, color: val >= 7 ? C.green : C.red, fontWeight: 600 }}>{val >= 7 ? "✓ cuenta para reto" : "no cuenta"}</span>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* Urgentes */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Urgente</SectionTitle>
          <button onClick={addUrgente} style={{ background: C.bg2, border: "none", color: C.blue, padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>+ añadir</button>
        </div>
        {data.urgentes.length === 0 ? (
          <div style={{ fontSize: 13, color: C.text3, textAlign: "center", padding: 16 }}>Nada urgente · sigue así 🤙</div>
        ) : data.urgentes.map((u, idx) => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: idx < data.urgentes.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ width: 8, height: 8, borderRadius: 99, background: C.red, flexShrink: 0 }} />
            <input value={u.titulo} onChange={e => editarUrgente(u.id, e.target.value)}
              style={{ flex: 1, fontSize: 14, color: C.text, background: "transparent", border: "none", outline: "none", fontFamily: "inherit" }} />
            <span style={{ fontSize: 12, color: C.text2 }}>{u.fecha}</span>
            <button onClick={() => delUrgente(u.id)} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── 100 DÍAS ──────────────────────────────────────────
function RetoTab({ data, setData }) {
  const habitsHoy = data.habitos.reglas.filter((h, i) => {
    const v = data.habitos.hoy[i];
    return h.tipo === "horas" ? (v !== undefined && v >= 7) : v === true;
  }).length;
  const totalHabits = data.habitos.reglas.length;
  const allDone = habitsHoy === totalHabits;
  const yaContado = data.reto.diasCompletados.includes(hoy()) || data.reto.diasCompletados.includes(hoy() + "_shield");

  const completarDia = () => {
    if (!allDone || yaContado) return;
    setData(prev => ({
      ...prev,
      reto: {
        ...prev.reto,
        diaActual: prev.reto.diaActual + 1,
        diasCompletados: [...prev.reto.diasCompletados, hoy()],
        fechaInicio: prev.reto.fechaInicio || hoy(),
      }
    }));
  };

  const usarEscudo = () => {
    if (data.reto.escudosUsados >= data.reto.escudosMes) return;
    setData(prev => ({
      ...prev,
      reto: {
        ...prev.reto,
        diaActual: prev.reto.diaActual + 1,
        diasCompletados: [...prev.reto.diasCompletados, hoy() + "_shield"],
        escudosUsados: prev.reto.escudosUsados + 1,
        fechaInicio: prev.reto.fechaInicio || hoy(),
      }
    }));
  };

  const reiniciarReto = () => {
    if (!confirm("¿Seguro? Se reinicia a Día 0.")) return;
    setData(prev => ({
      ...prev,
      reto: { ...prev.reto, diaActual: 0, diasCompletados: [], fechaInicio: null, escudosUsados: 0 }
    }));
  };

  const escudosDisponibles = data.reto.escudosMes - data.reto.escudosUsados;

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      {/* Hero */}
      <Card style={{ background: `linear-gradient(135deg, ${C.orange}10 0%, ${C.bg} 60%)`, border: `1px solid ${C.orange}30`, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: C.orange, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{data.reto.nombre}</div>
        <div style={{ fontSize: 96, fontWeight: 700, color: C.text, letterSpacing: "-0.05em", lineHeight: 0.9 }}>
          {data.reto.diaActual}
        </div>
        <div style={{ fontSize: 16, color: C.text2, marginTop: 6, fontWeight: 500 }}>de 100 días</div>
        <div style={{ marginTop: 20 }}>
          <ProgressBar value={data.reto.diaActual} max={100} color={C.orange} height={10} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>{data.reto.diaActual}%</span>
          <span style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>{100 - data.reto.diaActual} restantes</span>
        </div>
      </Card>

      {/* Estado */}
      <Card>
        <SectionTitle>Estado de hoy</SectionTitle>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, color: allDone ? C.green : C.orange, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {habitsHoy}<span style={{ fontSize: 16, color: C.text3 }}>/{totalHabits}</span>
            </div>
            <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>hábitos completados</div>
          </div>
          {yaContado ? (
            <Badge label="✓ Día contado" color={C.green} />
          ) : allDone ? (
            <button onClick={completarDia}
              style={{ padding: "12px 20px", background: C.green, color: "white", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ✓ Completar día {data.reto.diaActual + 1}
            </button>
          ) : (
            <Badge label={`faltan ${totalHabits - habitsHoy}`} color={C.orange} />
          )}
        </div>
        <ProgressBar value={habitsHoy} max={totalHabits} color={allDone ? C.green : C.orange} height={6} />
      </Card>

      {/* Escudos */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Escudos del mes</SectionTitle>
          <span style={{ fontSize: 22 }}>
            {Array.from({ length: data.reto.escudosMes }).map((_, i) => (
              <span key={i} style={{ marginLeft: 4, opacity: i < escudosDisponibles ? 1 : 0.2, filter: i < escudosDisponibles ? "none" : "grayscale(1)" }}>🛡️</span>
            ))}
          </span>
        </div>
        <div style={{ fontSize: 13, color: C.text2, marginBottom: 14, lineHeight: 1.5 }}>
          Para días imposibles (viaje, enfermedad). Tienes <b style={{ color: C.text }}>{escudosDisponibles}</b> disponibles este mes.
        </div>
        {!yaContado && escudosDisponibles > 0 && (
          <button onClick={usarEscudo}
            style={{ width: "100%", padding: 12, background: C.bg2, color: C.blue, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            🛡️ Usar escudo y contar día
          </button>
        )}
      </Card>

      {/* Mapa 100 días */}
      <Card>
        <SectionTitle>Mapa de 100 días</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }}>
          {Array.from({ length: 100 }).map((_, i) => {
            const dia = i + 1;
            const completado = dia <= data.reto.diaActual;
            const esHoy = dia === data.reto.diaActual + 1;
            return (
              <div key={i} style={{
                aspectRatio: 1, borderRadius: 5,
                background: completado ? C.green : esHoy ? C.bg : C.bg2,
                border: esHoy ? `2px dashed ${C.orange}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: completado ? "white" : esHoy ? C.orange : C.text3, fontWeight: 700
              }}>
                {dia}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 11, color: C.text2 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.green, borderRadius: 3, marginRight: 5, verticalAlign: "middle" }} /> Completado</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, border: `1.5px dashed ${C.orange}`, borderRadius: 3, marginRight: 5, verticalAlign: "middle" }} /> Hoy</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.bg2, borderRadius: 3, marginRight: 5, verticalAlign: "middle" }} /> Pendiente</span>
        </div>
      </Card>

      {/* Reset */}
      <Card>
        <SectionTitle>Zona peligrosa</SectionTitle>
        <button onClick={reiniciarReto}
          style={{ width: "100%", padding: 12, background: "transparent", color: C.red, border: `1px solid ${C.red}40`, borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Reiniciar reto a día 0
        </button>
      </Card>
    </div>
  );
}

// ─── DINERO ────────────────────────────────────────────
function DineroTab({ data, setData }) {
  const [showForm, setShowForm] = useState(false);
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [nuevaCat, setNuevaCat] = useState("comida");
  const [nuevaNota, setNuevaNota] = useState("");

  const renta = data.finanzas.rentaFija;
  const gastoVariable = data.finanzas.transacciones.reduce((s, t) => s + t.monto, 0);
  const totalGastado = renta + gastoVariable;
  const ahorro = data.finanzas.ingreso - totalGastado;
  const pctVar = Math.round((gastoVariable / data.finanzas.presupuesto) * 100);

  const porCategoria = data.finanzas.categorias.map(c => ({
    ...c, total: data.finanzas.transacciones.filter(t => t.categoria === c.id).reduce((s, t) => s + t.monto, 0)
  }));

  const addTransaccion = () => {
    const monto = parseFloat(nuevoMonto);
    if (isNaN(monto) || monto <= 0) return;
    const cat = data.finanzas.categorias.find(c => c.id === nuevaCat);
    setData(prev => ({
      ...prev,
      finanzas: { ...prev.finanzas, transacciones: [{ id: uid(), fecha: hoy(), monto, categoria: nuevaCat, nota: nuevaNota, color: cat?.color }, ...prev.finanzas.transacciones] }
    }));
    setNuevoMonto(""); setNuevaNota(""); setShowForm(false);
  };

  const delTrans = (id) => setData(prev => ({ ...prev, finanzas: { ...prev.finanzas, transacciones: prev.finanzas.transacciones.filter(t => t.id !== id) } }));

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <Card>
        <SectionTitle>Mes actual</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { l: "Ingreso", v: `$${data.finanzas.ingreso.toLocaleString()}`, c: C.green },
            { l: "Gastado", v: `$${totalGastado.toLocaleString()}`, c: C.text },
            { l: "Ahorro", v: `$${Math.max(0, ahorro).toLocaleString()}`, c: ahorro >= data.finanzas.ahorreMeta ? C.blue : C.orange },
          ].map((s, i) => (
            <div key={i} style={{ background: C.bg2, borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.c, letterSpacing: "-0.02em" }}>{s.v}</div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 4, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.text2 }}>Meta ahorro $2,000</span>
          <span style={{ fontSize: 12, color: ahorro >= 2000 ? C.green : C.orange, fontWeight: 600 }}>
            {ahorro >= 2000 ? "✓ logrado" : `faltan $${(2000 - ahorro).toLocaleString()}`}
          </span>
        </div>
        <ProgressBar value={Math.max(0, ahorro)} max={2000} color={ahorro >= 2000 ? C.green : C.orange} height={6} />
      </Card>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          style={{ width: "100%", padding: 16, background: C.blue, color: "white", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12, fontFamily: "inherit" }}>
          + Añadir gasto
        </button>
      ) : (
        <Card>
          <SectionTitle>Nuevo gasto</SectionTitle>
          <input type="number" inputMode="decimal" value={nuevoMonto} onChange={e => setNuevoMonto(e.target.value)} placeholder="$ Monto"
            style={{ width: "100%", padding: 14, background: C.bg2, border: "none", borderRadius: 12, color: C.text, fontSize: 18, marginBottom: 10, outline: "none", fontFamily: "inherit", fontWeight: 600 }} autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
            {data.finanzas.categorias.map(c => (
              <button key={c.id} onClick={() => setNuevaCat(c.id)}
                style={{ padding: "10px 6px", fontSize: 12, fontWeight: 600,
                  background: nuevaCat === c.id ? c.color + "20" : C.bg2,
                  color: nuevaCat === c.id ? c.color : C.text2,
                  border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>
                {c.nombre}
              </button>
            ))}
          </div>
          <input value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Nota (opcional)"
            style={{ width: "100%", padding: 12, background: C.bg2, border: "none", borderRadius: 12, color: C.text, fontSize: 14, marginBottom: 10, outline: "none", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, background: C.bg2, color: C.text2, border: "none", borderRadius: 12, fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Cancelar</button>
            <button onClick={addTransaccion} style={{ flex: 2, padding: 12, background: C.green, color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Guardar</button>
          </div>
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>Por categoría</SectionTitle>
          <Badge label={`${pctVar}% de $1,400`} color={pctVar > 90 ? C.red : C.green} />
        </div>
        {porCategoria.map(c => (
          <div key={c.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: C.text }}>{c.nombre}</span>
              <span style={{ fontSize: 13, color: c.color, fontWeight: 600 }}>${c.total.toLocaleString()}</span>
            </div>
            <ProgressBar value={c.total} max={data.finanzas.presupuesto} color={c.color} height={4} />
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle>Historial</SectionTitle>
        {data.finanzas.transacciones.length === 0 ? (
          <div style={{ fontSize: 13, color: C.text3, textAlign: "center", padding: 24 }}>Sin gastos aún</div>
        ) : data.finanzas.transacciones.slice(0, 15).map((t, idx) => {
          const cat = data.finanzas.categorias.find(c => c.id === t.categoria);
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: idx < Math.min(14, data.finanzas.transacciones.length - 1) ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 10, height: 10, borderRadius: 99, background: cat?.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{cat?.nombre}</div>
                <div style={{ fontSize: 12, color: C.text2 }}>{t.fecha}{t.nota ? ` · ${t.nota}` : ""}</div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: cat?.color }}>${t.monto}</span>
              <button onClick={() => delTrans(t.id)} style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── COMIDA (con edición de lunch/cena) ────────────────
function ComidaTab({ data, setData }) {
  const [editandoId, setEditandoId] = useState(null);
  const [edit, setEdit] = useState({ nombre: "", cal: "", prot: "", carb: "", gra: "" });

  const completadas = data.comidas.plan.filter(c => c.completado);
  const tot = completadas.reduce((s, c) => ({
    cal: s.cal + c.cal, prot: s.prot + c.prot, carb: s.carb + c.carb, gra: s.gra + c.gra
  }), { cal: 0, prot: 0, carb: 0, gra: 0 });

  const toggleComida = (id) => setData(prev => ({ ...prev, comidas: { ...prev.comidas, plan: prev.comidas.plan.map(c => c.id === id ? { ...c, completado: !c.completado } : c) } }));
  const toggleSupp = (id) => setData(prev => ({ ...prev, comidas: { ...prev.comidas, suplementos: prev.comidas.suplementos.map(s => s.id === id ? { ...s, completado: !s.completado } : s) } }));
  const addAgua = (n) => setData(prev => ({ ...prev, comidas: { ...prev.comidas, agua: Math.min(prev.comidas.agua + n, prev.comidas.metaAgua) } }));

  const empezarEdit = (c) => {
    setEditandoId(c.id);
    setEdit({ nombre: c.nombre, cal: String(c.cal), prot: String(c.prot), carb: String(c.carb), gra: String(c.gra) });
  };

  const guardarEdit = () => {
    setData(prev => ({
      ...prev,
      comidas: {
        ...prev.comidas,
        plan: prev.comidas.plan.map(c => c.id === editandoId ? {
          ...c,
          nombre: edit.nombre || c.nombre,
          cal: parseFloat(edit.cal) || 0,
          prot: parseFloat(edit.prot) || 0,
          carb: parseFloat(edit.carb) || 0,
          gra: parseFloat(edit.gra) || 0,
          items: edit.nombre !== c.plan?.nombre ? [edit.nombre] : c.items,
        } : c)
      }
    }));
    setEditandoId(null);
  };

  const restaurarPlan = (id) => {
    setData(prev => ({
      ...prev,
      comidas: {
        ...prev.comidas,
        plan: prev.comidas.plan.map(c => c.id === id && c.plan ? { ...c, ...c.plan, completado: c.completado } : c)
      }
    }));
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      {/* Macros hero */}
      <Card>
        <SectionTitle>Hoy · plan</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 42, fontWeight: 700, color: C.text, letterSpacing: "-0.04em", lineHeight: 1 }}>{tot.cal}</div>
            <div style={{ fontSize: 13, color: C.text2, marginTop: 3 }}>de {data.comidas.metas.cal} kcal</div>
          </div>
          <div style={{ position: "relative" }}>
            <Ring pct={(tot.cal / data.comidas.metas.cal) * 100} size={76} stroke={7} color={C.blue} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.blue }}>
              {Math.round((tot.cal / data.comidas.metas.cal) * 100)}%
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { l: "Proteína", v: tot.prot, m: data.comidas.metas.prot, c: C.green },
            { l: "Carbs", v: tot.carb, m: data.comidas.metas.carb, c: C.orange },
            { l: "Grasa", v: tot.gra, m: data.comidas.metas.gra, c: C.red },
          ].map((m, i) => (
            <div key={i} style={{ background: C.bg2, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 4 }}>{m.l}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: m.c, letterSpacing: "-0.02em" }}>{Math.round(m.v)}<span style={{ fontSize: 11, color: C.text3, fontWeight: 500 }}>/{m.m}g</span></div>
              <div style={{ marginTop: 7 }}><ProgressBar value={m.v} max={m.m} color={m.c} height={3} /></div>
            </div>
          ))}
        </div>
      </Card>

      {/* Comidas */}
      <Card>
        <SectionTitle>Comidas del día</SectionTitle>
        {data.comidas.plan.map(c => {
          const isEditando = editandoId === c.id;
          const editable = !c.fijo;
          const cambiada = !c.fijo && c.plan && c.nombre !== c.plan.nombre;

          if (isEditando) {
            return (
              <div key={c.id} style={{ padding: 14, borderRadius: 14, marginBottom: 10, background: C.bg2, border: `2px solid ${C.blue}` }}>
                <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 10 }}>EDITANDO COMIDA</div>
                <input value={edit.nombre} onChange={e => setEdit(s => ({ ...s, nombre: e.target.value }))} placeholder="Qué comiste"
                  style={{ width: "100%", padding: 12, background: C.bg, border: "none", borderRadius: 10, fontSize: 15, marginBottom: 8, outline: "none", fontFamily: "inherit", color: C.text, fontWeight: 500 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>CALORÍAS</div>
                    <input type="number" value={edit.cal} onChange={e => setEdit(s => ({ ...s, cal: e.target.value }))}
                      style={{ width: "100%", padding: 10, background: C.bg, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>PROTEÍNA (g)</div>
                    <input type="number" value={edit.prot} onChange={e => setEdit(s => ({ ...s, prot: e.target.value }))}
                      style={{ width: "100%", padding: 10, background: C.bg, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>CARBS (g)</div>
                    <input type="number" value={edit.carb} onChange={e => setEdit(s => ({ ...s, carb: e.target.value }))}
                      style={{ width: "100%", padding: 10, background: C.bg, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>GRASA (g)</div>
                    <input type="number" value={edit.gra} onChange={e => setEdit(s => ({ ...s, gra: e.target.value }))}
                      style={{ width: "100%", padding: 10, background: C.bg, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setEditandoId(null)}
                    style={{ flex: 1, padding: 11, background: C.bg, color: C.text2, border: "none", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                    Cancelar
                  </button>
                  <button onClick={guardarEdit}
                    style={{ flex: 2, padding: 11, background: C.blue, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Guardar
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={c.id} style={{ padding: 14, borderRadius: 14, marginBottom: 10,
              background: c.completado ? C.green + "08" : C.bg2,
              border: `1px solid ${c.completado ? C.green + "30" : C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div onClick={() => toggleComida(c.id)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, cursor: "pointer" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                    background: c.completado ? C.green : C.bg,
                    border: c.completado ? "none" : `1.5px solid ${C.border2}`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {c.completado && <span style={{ fontSize: 13, color: "white", fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: c.completado ? C.green : C.text, fontWeight: 600 }}>{c.nombre}</div>
                    {cambiada && <span style={{ fontSize: 10, color: C.orange, fontWeight: 600 }}>· editado</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.completado ? C.green : C.blue }}>{c.cal}cal</span>
                  {editable && (
                    <button onClick={() => empezarEdit(c)}
                      style={{ padding: "4px 8px", background: C.bg, color: C.blue, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      editar
                    </button>
                  )}
                  {cambiada && (
                    <button onClick={() => restaurarPlan(c.id)}
                      style={{ padding: "4px 8px", background: C.bg, color: C.orange, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      ↺
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.text2, paddingLeft: 36, lineHeight: 1.5 }}>
                {c.items.join(" · ")} <span style={{ color: C.text3 }}>· {c.prot}p · {c.carb}c · {c.gra}g</span>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Agua */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Agua · meta 3L</SectionTitle>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.blue }}>{data.comidas.agua}/{data.comidas.metaAgua}</span>
        </div>
        <ProgressBar value={data.comidas.agua} max={data.comidas.metaAgua} color={C.blue} height={8} />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => addAgua(n)}
              style={{ flex: 1, padding: "11px 0", fontSize: 14, fontWeight: 700, background: C.blue + "15", color: C.blue, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
              +{n} vaso{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </Card>

      {/* Suplementos */}
      <Card>
        <SectionTitle>Suplementos</SectionTitle>
        {data.comidas.suplementos.map((s, idx) => (
          <div key={s.id} onClick={() => toggleSupp(s.id)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: idx < data.comidas.suplementos.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0,
              background: s.completado ? C.green : C.bg,
              border: s.completado ? "none" : `1.5px solid ${C.border2}`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s.completado && <span style={{ fontSize: 12, color: "white", fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: s.completado ? C.green : C.text, fontWeight: 500 }}>{s.nombre}</div>
              <div style={{ fontSize: 12, color: C.text2 }}>{s.momento}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── CUERPO ────────────────────────────────────────────
function CuerpoTab({ data, setData }) {
  const fileRef = useRef(null);
  const [editPeso, setEditPeso] = useState(false);
  const [pesoTemp, setPesoTemp] = useState("");
  const [nuevaNota, setNuevaNota] = useState("");
  const [whoopForm, setWhoopForm] = useState({ recovery: "", sueno: "", strain: "", hrv: "" });

  const pesoPct = Math.round(((data.perfil.pesoInicial - data.perfil.pesoActual) / (data.perfil.pesoInicial - data.perfil.pesoMeta)) * 100);
  const pesoPerdido = (data.perfil.pesoInicial - data.perfil.pesoActual).toFixed(1);

  const guardarPeso = () => {
    const num = parseFloat(pesoTemp);
    if (isNaN(num)) { setEditPeso(false); return; }
    setData(prev => ({ ...prev, perfil: { ...prev.perfil, pesoActual: num } }));
    setEditPeso(false);
  };

  const subirFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setData(prev => ({ ...prev, fotosProgreso: [{ id: uid(), fecha: hoy(), data: ev.target.result }, ...prev.fotosProgreso] }));
    };
    reader.readAsDataURL(file);
  };

  const addWhoop = () => {
    const r = parseFloat(whoopForm.recovery), s = parseFloat(whoopForm.sueno);
    if (isNaN(r) || isNaN(s)) return;
    setData(prev => ({
      ...prev,
      whoop: { historial: [{ fecha: hoy(), recovery: r, sueno: s, strain: parseFloat(whoopForm.strain) || 0, hrv: parseFloat(whoopForm.hrv) || 0 }, ...prev.whoop.historial] }
    }));
    setWhoopForm({ recovery: "", sueno: "", strain: "", hrv: "" });
  };

  const addNota = () => {
    if (!nuevaNota.trim()) return;
    setData(prev => ({ ...prev, notasZulma: [nuevaNota.trim(), ...prev.notasZulma] }));
    setNuevaNota("");
  };

  const delNota = (i) => setData(prev => ({ ...prev, notasZulma: prev.notasZulma.filter((_, idx) => idx !== i) }));

  const ultimoWhoop = data.whoop.historial[0];

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      {/* Peso hero */}
      <Card style={{ background: `linear-gradient(135deg, ${C.green}10 0%, ${C.bg} 60%)`, border: `1px solid ${C.green}30` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 6 }}>Peso actual</div>
            {editPeso ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <input type="number" step="0.1" value={pesoTemp} onChange={e => setPesoTemp(e.target.value)} autoFocus
                  style={{ width: 90, fontSize: 32, fontWeight: 700, background: C.bg, border: `2px solid ${C.green}`, borderRadius: 10, color: C.green, padding: "6px 10px", outline: "none", fontFamily: "inherit" }}
                  onKeyDown={e => e.key === "Enter" && guardarPeso()} />
                <button onClick={guardarPeso} style={{ padding: "8px 14px", background: C.green, color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>OK</button>
              </div>
            ) : (
              <div onClick={() => { setEditPeso(true); setPesoTemp(String(data.perfil.pesoActual)); }}
                style={{ fontSize: 56, fontWeight: 700, color: C.text, letterSpacing: "-0.04em", lineHeight: 1, cursor: "pointer" }}>
                {data.perfil.pesoActual}<span style={{ fontSize: 22, color: C.text2 }}>kg</span>
              </div>
            )}
            <div style={{ fontSize: 13, color: C.text2, marginTop: 6 }}>−{pesoPerdido}kg · meta {data.perfil.pesoMeta}kg</div>
          </div>
          <div style={{ position: "relative" }}>
            <Ring pct={pesoPct} size={72} stroke={6} color={C.green} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.green }}>{pesoPct}%</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <ProgressBar value={data.perfil.pesoInicial - data.perfil.pesoActual} max={data.perfil.pesoInicial - data.perfil.pesoMeta} color={C.green} height={6} />
        </div>
      </Card>

      {/* Fotos */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>Foto de hoy</SectionTitle>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: "8px 14px", background: C.blue, color: "white", border: "none", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + Subir foto
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={subirFoto} style={{ display: "none" }} />
        </div>
        {data.fotosProgreso.length === 0 ? (
          <div style={{ fontSize: 13, color: C.text3, textAlign: "center", padding: 28 }}>Sube tu primera foto · trackea tu progreso visual</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {data.fotosProgreso.slice(0, 9).map(f => (
              <div key={f.id} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 10, overflow: "hidden", background: C.bg2 }}>
                <img src={f.data} alt={f.fecha} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "10px 8px 6px", fontSize: 10, color: "white", fontWeight: 600 }}>
                  {new Date(f.fecha).toLocaleDateString("es", { day: "numeric", month: "short" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Whoop */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>Whoop · hoy</SectionTitle>
          {ultimoWhoop && <Badge label={`recovery ${ultimoWhoop.recovery}%`} color={ultimoWhoop.recovery > 67 ? C.green : ultimoWhoop.recovery > 33 ? C.orange : C.red} />}
        </div>
        {ultimoWhoop && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
            {[
              { l: "Recovery", v: `${ultimoWhoop.recovery}%`, c: C.green },
              { l: "Sueño", v: `${ultimoWhoop.sueno}h`, c: C.blue },
              { l: "Strain", v: ultimoWhoop.strain.toFixed(1), c: C.orange },
              { l: "HRV", v: ultimoWhoop.hrv, c: C.purple },
            ].map((m, i) => (
              <div key={i} style={{ background: C.bg2, borderRadius: 10, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: m.c, letterSpacing: "-0.02em" }}>{m.v}</div>
                <div style={{ fontSize: 10, color: C.text2, marginTop: 2, fontWeight: 600 }}>{m.l}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          <input type="number" placeholder="Recovery %" value={whoopForm.recovery} onChange={e => setWhoopForm(f => ({ ...f, recovery: e.target.value }))}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          <input type="number" step="0.1" placeholder="Sueño h" value={whoopForm.sueno} onChange={e => setWhoopForm(f => ({ ...f, sueno: e.target.value }))}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          <input type="number" step="0.1" placeholder="Strain" value={whoopForm.strain} onChange={e => setWhoopForm(f => ({ ...f, strain: e.target.value }))}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          <input type="number" placeholder="HRV" value={whoopForm.hrv} onChange={e => setWhoopForm(f => ({ ...f, hrv: e.target.value }))}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
        </div>
        <button onClick={addWhoop} style={{ width: "100%", padding: 11, background: C.blue, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Guardar Whoop de hoy
        </button>
      </Card>

      {/* Notas Zulma */}
      <Card>
        <SectionTitle>Notas para Zulma</SectionTitle>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <input value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Nueva pregunta..."
            onKeyDown={e => e.key === "Enter" && addNota()}
            style={{ flex: 1, padding: 11, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <button onClick={addNota} style={{ padding: "10px 16px", background: C.green, color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+</button>
        </div>
        {data.notasZulma.map((n, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < data.notasZulma.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ width: 6, height: 6, borderRadius: 99, background: C.green, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: C.text }}>{n}</span>
            <button onClick={() => delNota(i)} style={{ background: "none", border: "none", color: C.text3, fontSize: 16, cursor: "pointer" }}>×</button>
          </div>
        ))}
      </Card>

      {/* Compras */}
      <Card>
        <SectionTitle>Compras semanales</SectionTitle>
        {data.compras.map((c, idx) => (
          <div key={c.id} onClick={() => setData(prev => ({ ...prev, compras: prev.compras.map(x => x.id === c.id ? { ...x, comprado: !x.comprado } : x) }))}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: idx < data.compras.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: c.comprado ? C.green : C.bg,
              border: c.comprado ? "none" : `1.5px solid ${C.border2}`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {c.comprado && <span style={{ fontSize: 11, color: "white", fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: c.comprado ? C.text3 : C.text, textDecoration: c.comprado ? "line-through" : "none", fontWeight: 500 }}>{c.item}</div>
              <div style={{ fontSize: 11, color: C.text3 }}>{c.categoria}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── APP ────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [data, setDataRaw] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = hoy();
        if (parsed.habitos?.fechaHoy !== today) {
          parsed.habitos = { ...parsed.habitos, hoy: {}, fechaHoy: today };
          // Reset comidas: las fijas y las que tengan plan vuelven al plan
          parsed.comidas = {
            ...parsed.comidas,
            plan: parsed.comidas.plan.map(p => p.fijo ? { ...p, completado: false } : (p.plan ? { ...p, ...p.plan, completado: false } : { ...p, completado: false })),
            agua: 0,
            suplementos: parsed.comidas.suplementos.map(s => ({ ...s, completado: false })),
          };
        }
        if (parsed.reto?.mesActualEscudos !== mesActual()) {
          parsed.reto = { ...parsed.reto, escudosUsados: 0, mesActualEscudos: mesActual() };
        }
        setDataRaw({ ...DEFAULT_DATA, ...parsed });
      }
    } catch (_) {}
    setLoaded(true);
  }, []);

  const setData = useCallback((updater) => {
    setDataRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  }, []);

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 14, color: C.text3 }}>Cargando…</div>
    </div>
  );

  const screens = { home: HomeTab, reto: RetoTab, dinero: DineroTab, comida: ComidaTab, cuerpo: CuerpoTab };
  const Screen = screens[tab];

  return (
    <div style={{ background: C.bg3, minHeight: "100vh", maxWidth: 430, margin: "0 auto",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif", color: C.text }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input, button, textarea { font-family: inherit; }
        ::-webkit-scrollbar { display: none; }
        body { margin: 0; background: ${C.bg3}; }
      `}</style>

      <div style={{ padding: "20px 16px 110px" }}>
        <Screen data={data} setData={setData} />
      </div>

      {/* Bottom nav — más grande */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100,
        paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: "10px 0 6px", background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                transition: "all 0.15s" }}>
              {t.icon(active)}
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500,
                color: active ? t.color : C.text3, letterSpacing: "-0.01em" }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
