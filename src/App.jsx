import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "edu_dashboard_v4";

const DEFAULT_DATA = {
  perfil: {
    nombre: "Eduardo",
    pesoActual: 75,
    pesoMeta: 70,
    pesoInicial: 76,
  },
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
      { id: "comida", nombre: "Comida", color: "#34C77B" },
      { id: "transporte", nombre: "Transporte", color: "#F5A623" },
      { id: "salud", nombre: "Salud / Terapia", color: "#FF6B6B" },
      { id: "social", nombre: "Social / Salir", color: "#A78BFA" },
      { id: "ropa", nombre: "Ropa / Personal", color: "#EC4899" },
      { id: "otros", nombre: "Otros", color: "#6B7280" },
    ],
  },
  comidas: {
    plan: [
      { id: 1, nombre: "Desayuno post-gym", cal: 410, prot: 45, carb: 40, gra: 8.5,
        items: ["Avena 365 ½ cup", "Yogurt griego 0% ½ cup", "Leche whole ½ cup", "Whey 1 scoop"], completado: false },
      { id: 2, nombre: "Lunch · pollo + arroz + papa", cal: 545, prot: 58, carb: 51, gra: 10.5,
        items: ["Pollo airfryer 170g", "Arroz integral ½ sobre", "Baby Potato Blend ½ bolsa"], completado: false },
      { id: 3, nombre: "Snack 5pm · manzana", cal: 95, prot: 0, carb: 25, gra: 0,
        items: ["1 manzana mediana"], completado: false },
      { id: 4, nombre: "Cena · igual que lunch", cal: 545, prot: 58, carb: 51, gra: 10.5,
        items: ["Pollo airfryer 170g", "Arroz integral ½ sobre", "Baby Potato Blend ½ bolsa"], completado: false },
      { id: 5, nombre: "Antes de dormir · tart cherry", cal: 130, prot: 1, carb: 32, gra: 0,
        items: ["Tart cherry juice 240ml"], completado: false },
    ],
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

function ProgressBar({ value, max, color = "#5B8DEF", height = 4 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height, background: "#1E2433", borderRadius: 99, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Ring({ pct, size = 64, stroke = 6, color = "#5B8DEF" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2433" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

function Badge({ label, color = "#5B8DEF" }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
      background: color + "22", color, padding: "3px 8px", borderRadius: 99, border: `1px solid ${color}33` }}>
      {label}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#111827", border: "1px solid #1E2A3A", borderRadius: 16, padding: 16, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4B5563", marginBottom: 12 }}>
      {children}
    </div>
  );
}

const TABS = [
  { id: "home",     label: "Hoy",      icon: "◈" },
  { id: "reto",     label: "100 Días", icon: "◉" },
  { id: "habitos",  label: "Hábitos",  icon: "◇" },
  { id: "dinero",   label: "Dinero",   icon: "◎" },
  { id: "comida",   label: "Comida",   icon: "△" },
  { id: "cuerpo",   label: "Cuerpo",   icon: "○" },
];

// ─── HOME ──────────────────────────────────────────────
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
      const newVal = habito.tipo === "horas"
        ? (v === undefined ? 8 : undefined)
        : (v === true ? false : true);
      const nuevoHoy = { ...prev.habitos.hoy };
      if (newVal === undefined || newVal === false) delete nuevoHoy[i];
      else nuevoHoy[i] = newVal;
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
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#F9FAFB", fontFamily: "'DM Serif Display', Georgia, serif", letterSpacing: "-0.02em" }}>
          Hola, {data.perfil.nombre}.
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3, textTransform: "capitalize" }}>{fechaHoy} · FiDi</div>
      </div>

      {/* Reto hero */}
      <Card style={{ background: "linear-gradient(135deg, #2D1F0A 0%, #111827 100%)", border: "1px solid #4A3315", padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "#D88E1A", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{data.reto.nombre}</div>
            <div style={{ fontSize: 56, fontWeight: 700, color: "#F5A623", letterSpacing: "-0.04em", lineHeight: 0.95 }}>
              {diaReto}<span style={{ fontSize: 22, color: "#D88E1A" }}> / 100</span>
            </div>
            <div style={{ fontSize: 12, color: "#D88E1A", marginTop: 6 }}>
              {diaReto === 0 ? "completa todo hoy para empezar 🔥" : `${100 - diaReto} días para terminar`}
            </div>
          </div>
          <div style={{ fontSize: 56, lineHeight: 1 }}>🔥</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <ProgressBar value={diaReto} max={100} color="#F5A623" height={5} />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 10, color: "#4B5563", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Hábitos hoy</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#A78BFA", letterSpacing: "-0.04em", lineHeight: 1 }}>{habitsHoy}/{totalHabits}</div>
          <div style={{ marginTop: 8 }}><ProgressBar value={habitsHoy} max={totalHabits} color="#A78BFA" height={3} /></div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 10, color: "#4B5563", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Peso</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#34C77B", letterSpacing: "-0.04em", lineHeight: 1 }}>{data.perfil.pesoActual}<span style={{ fontSize: 14, color: "#6B7280" }}>kg</span></div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>meta {data.perfil.pesoMeta}kg · {pesoPct}%</div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 10, color: "#4B5563", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Gastado hoy</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#F5A623", letterSpacing: "-0.04em", lineHeight: 1 }}>${gastosHoy}</div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>de ${Math.round(data.finanzas.presupuesto / 30)} diario</div>
        </Card>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 10, color: "#4B5563", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Calorías</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#5B8DEF", letterSpacing: "-0.04em", lineHeight: 1 }}>{calHoy}</div>
          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>de {data.comidas.metas.cal} meta</div>
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Hábitos de hoy</SectionTitle>
          <Badge label="Toca para marcar" color="#A78BFA" />
        </div>
        {data.habitos.reglas.map((h, i) => {
          const val = data.habitos.hoy[i];
          const done = h.tipo === "horas" ? (val !== undefined && val >= 7) : val === true;
          return (
            <div key={i} onClick={() => toggleHabito(i)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 0", borderBottom: "1px solid #1E2A3A", cursor: "pointer", opacity: done ? 1 : 0.6 }}>
              <span style={{ fontSize: 14, color: done ? "#F9FAFB" : "#9CA3AF", fontWeight: done ? 500 : 400 }}>
                {h.nombre}
                {h.tipo === "horas" && val !== undefined && <span style={{ color: "#5B8DEF", marginLeft: 6, fontSize: 12 }}>{val}hrs</span>}
              </span>
              <div style={{ width: 22, height: 22, borderRadius: 7,
                background: done ? "#34C77B" : "#1E2A3A",
                border: done ? "none" : "1px solid #374151",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {done && <span style={{ fontSize: 12, color: "#0D1117" }}>✓</span>}
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Urgente</SectionTitle>
          <button onClick={addUrgente} style={{ background: "none", border: "1px solid #1E2A3A", color: "#5B8DEF", padding: "3px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>+ añadir</button>
        </div>
        {data.urgentes.length === 0 ? (
          <div style={{ fontSize: 12, color: "#4B5563", textAlign: "center", padding: 12 }}>Nada urgente · sigue así 🤙</div>
        ) : data.urgentes.map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1E2A3A" }}>
            <div style={{ width: 6, height: 6, borderRadius: 99, background: "#FF6B6B", flexShrink: 0 }} />
            <input value={u.titulo} onChange={e => editarUrgente(u.id, e.target.value)}
              style={{ flex: 1, fontSize: 13, color: "#F9FAFB", background: "transparent", border: "none", outline: "none", fontFamily: "inherit" }} />
            <span style={{ fontSize: 11, color: "#6B7280" }}>{u.fecha}</span>
            <button onClick={() => delUrgente(u.id)} style={{ background: "none", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 14 }}>×</button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── 100 DÍAS ─────────────────────────────────────────
function RetoTab({ data, setData }) {
  const habitsHoy = data.habitos.reglas.filter((h, i) => {
    const v = data.habitos.hoy[i];
    return h.tipo === "horas" ? (v !== undefined && v >= 7) : v === true;
  }).length;
  const totalHabits = data.habitos.reglas.length;
  const allDone = habitsHoy === totalHabits;
  const yaContado = data.reto.diasCompletados.includes(hoy());

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
      <Card style={{ background: "linear-gradient(135deg, #2D1F0A 0%, #111827 100%)", border: "1px solid #4A3315", padding: 22, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#D88E1A", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{data.reto.nombre}</div>
        <div style={{ fontSize: 90, fontWeight: 700, color: "#F5A623", letterSpacing: "-0.05em", lineHeight: 0.9, fontFamily: "'DM Serif Display', Georgia, serif" }}>
          {data.reto.diaActual}
        </div>
        <div style={{ fontSize: 14, color: "#D88E1A", marginTop: 4, fontWeight: 600 }}>de 100 días</div>
        <div style={{ marginTop: 16 }}>
          <ProgressBar value={data.reto.diaActual} max={100} color="#F5A623" height={6} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "#D88E1A" }}>{data.reto.diaActual}%</span>
          <span style={{ fontSize: 11, color: "#D88E1A" }}>{100 - data.reto.diaActual} días restantes</span>
        </div>
      </Card>

      {/* Estado de hoy */}
      <Card>
        <SectionTitle>Estado de hoy</SectionTitle>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: allDone ? "#34C77B" : "#F5A623", letterSpacing: "-0.04em" }}>
              {habitsHoy}<span style={{ fontSize: 16, color: "#6B7280" }}>/{totalHabits}</span>
            </div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>hábitos completados hoy</div>
          </div>
          {yaContado ? (
            <Badge label="✓ Día contado" color="#34C77B" />
          ) : allDone ? (
            <button onClick={completarDia}
              style={{ padding: "10px 18px", background: "#34C77B", color: "#0D1117", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ✓ Completar día {data.reto.diaActual + 1}
            </button>
          ) : (
            <Badge label={`faltan ${totalHabits - habitsHoy}`} color="#F5A623" />
          )}
        </div>
        <ProgressBar value={habitsHoy} max={totalHabits} color={allDone ? "#34C77B" : "#F5A623"} height={4} />
      </Card>

      {/* Escudos */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Escudos del mes</SectionTitle>
          <span style={{ fontSize: 18, color: "#5B8DEF" }}>
            {Array.from({ length: data.reto.escudosMes }).map((_, i) => (
              <span key={i} style={{ marginLeft: 4, opacity: i < escudosDisponibles ? 1 : 0.25 }}>🛡️</span>
            ))}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, lineHeight: 1.5 }}>
          Si tienes un día imposible (viaje, enfermedad, evento), usa un escudo para que el día cuente sin tener que completar todos los hábitos. Tienes {escudosDisponibles} disponibles este mes.
        </div>
        {!yaContado && escudosDisponibles > 0 && (
          <button onClick={usarEscudo}
            style={{ width: "100%", padding: 10, background: "#1E2A3A", color: "#5B8DEF", border: "1px solid #1E3A5F", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            🛡️ Usar escudo y contar día
          </button>
        )}
      </Card>

      {/* Calendario 100 días */}
      <Card>
        <SectionTitle>Mapa de 100 días</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
          {Array.from({ length: 100 }).map((_, i) => {
            const dia = i + 1;
            const completado = dia <= data.reto.diaActual;
            const esHoy = dia === data.reto.diaActual + 1;
            return (
              <div key={i} style={{
                aspectRatio: 1,
                borderRadius: 4,
                background: completado ? "#34C77B" : esHoy ? "transparent" : "#1E2A3A",
                border: esHoy ? "1.5px dashed #F5A623" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                color: completado ? "#0D1117" : esHoy ? "#F5A623" : "#374151",
                fontWeight: 700
              }}>
                {dia}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 10, color: "#6B7280" }}>
          <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#34C77B", borderRadius: 2, marginRight: 4 }} /> Completado</span>
          <span><span style={{ display: "inline-block", width: 8, height: 8, border: "1px dashed #F5A623", borderRadius: 2, marginRight: 4 }} /> Hoy</span>
          <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#1E2A3A", borderRadius: 2, marginRight: 4 }} /> Pendiente</span>
        </div>
      </Card>

      {/* Reset */}
      <Card>
        <SectionTitle>Zona peligrosa</SectionTitle>
        <button onClick={reiniciarReto}
          style={{ width: "100%", padding: 10, background: "transparent", color: "#FF6B6B", border: "1px solid #4A1818", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Reiniciar reto a día 0
        </button>
      </Card>
    </div>
  );
}

// ─── HÁBITOS (simple, solo de hoy) ─────────────────────
function HabitosTab({ data, setData }) {
  const toggleHabito = (i) => {
    setData(prev => {
      const habito = prev.habitos.reglas[i];
      const v = prev.habitos.hoy[i];
      const newVal = habito.tipo === "horas"
        ? (v === undefined ? 8 : undefined)
        : (v === true ? false : true);
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

  const completados = data.habitos.reglas.filter((h, i) => {
    const v = data.habitos.hoy[i];
    return h.tipo === "horas" ? (v !== undefined && v >= 7) : v === true;
  }).length;
  const total = data.habitos.reglas.length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <Card style={{ textAlign: "center", padding: 22 }}>
        <div style={{ fontSize: 11, color: "#7C5CBF", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Progreso de hoy</div>
        <div style={{ fontSize: 64, fontWeight: 700, color: completados === total ? "#34C77B" : "#A78BFA", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'DM Serif Display', Georgia, serif" }}>
          {completados}<span style={{ fontSize: 24, color: "#4B5563" }}>/{total}</span>
        </div>
        <div style={{ fontSize: 12, color: "#7C5CBF", marginTop: 6 }}>
          {completados === total ? "🔥 Día perfecto · cuéntalo en el reto" : `faltan ${total - completados} para día perfecto`}
        </div>
        <div style={{ marginTop: 14 }}>
          <ProgressBar value={completados} max={total} color={completados === total ? "#34C77B" : "#A78BFA"} height={5} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Tus 9 hábitos · toca para marcar</SectionTitle>
        {data.habitos.reglas.map((h, i) => {
          const val = data.habitos.hoy[i];
          const done = h.tipo === "horas" ? (val !== undefined && val >= 7) : val === true;
          return (
            <div key={i}
              style={{ padding: "12px 0", borderBottom: "1px solid #1E2A3A" }}>
              <div onClick={() => toggleHabito(i)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", opacity: done ? 1 : 0.7 }}>
                <span style={{ fontSize: 15, color: done ? "#F9FAFB" : "#9CA3AF", fontWeight: done ? 500 : 400 }}>{h.nombre}</span>
                <div style={{ width: 26, height: 26, borderRadius: 8,
                  background: done ? "#34C77B" : "#1E2A3A",
                  border: done ? "none" : "1px solid #374151",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {done && <span style={{ fontSize: 14, color: "#0D1117" }}>✓</span>}
                </div>
              </div>
              {h.tipo === "horas" && val !== undefined && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>Horas:</span>
                  <input type="number" step="0.5" value={val} onChange={e => cambiarHoras(i, e.target.value)}
                    style={{ width: 60, padding: "4px 8px", fontSize: 13, background: "#0D1117", border: "1px solid #1E3A5F", borderRadius: 6, color: "#5B8DEF", outline: "none", fontFamily: "inherit" }} />
                  <span style={{ fontSize: 11, color: val >= 7 ? "#34C77B" : "#FF6B6B" }}>{val >= 7 ? "✓ cuenta" : "no cuenta"}</span>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── DINERO ─────────────────────────────────────────────
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
      finanzas: {
        ...prev.finanzas,
        transacciones: [{ id: uid(), fecha: hoy(), monto, categoria: nuevaCat, nota: nuevaNota, color: cat?.color }, ...prev.finanzas.transacciones]
      }
    }));
    setNuevoMonto(""); setNuevaNota(""); setShowForm(false);
  };

  const delTrans = (id) => setData(prev => ({ ...prev, finanzas: { ...prev.finanzas, transacciones: prev.finanzas.transacciones.filter(t => t.id !== id) } }));

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <Card>
        <SectionTitle>Mes actual</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { l: "Ingreso", v: `$${data.finanzas.ingreso.toLocaleString()}`, c: "#34C77B" },
            { l: "Gastado", v: `$${totalGastado.toLocaleString()}`, c: "#F9FAFB" },
            { l: "Ahorro", v: `$${Math.max(0, ahorro).toLocaleString()}`, c: ahorro >= data.finanzas.ahorreMeta ? "#5B8DEF" : "#F5A623" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#0D1117", borderRadius: 12, padding: "11px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, color: "#4B5563", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "#6B7280" }}>Meta ahorro $2,000</span>
          <span style={{ fontSize: 11, color: ahorro >= 2000 ? "#34C77B" : "#F5A623", fontWeight: 600 }}>
            {ahorro >= 2000 ? "✓ logrado" : `faltan $${(2000 - ahorro).toLocaleString()}`}
          </span>
        </div>
        <ProgressBar value={Math.max(0, ahorro)} max={2000} color={ahorro >= 2000 ? "#34C77B" : "#F5A623"} height={5} />
      </Card>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          style={{ width: "100%", padding: 14, background: "#5B8DEF", color: "#0D1117", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12, fontFamily: "inherit" }}>
          + Añadir gasto
        </button>
      ) : (
        <Card>
          <SectionTitle>Nuevo gasto</SectionTitle>
          <input type="number" inputMode="decimal" value={nuevoMonto} onChange={e => setNuevoMonto(e.target.value)} placeholder="$ Monto"
            style={{ width: "100%", padding: 11, background: "#0D1117", border: "1px solid #1E2A3A", borderRadius: 10, color: "#F9FAFB", fontSize: 16, marginBottom: 10, outline: "none", fontFamily: "inherit" }} autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 10 }}>
            {data.finanzas.categorias.map(c => (
              <button key={c.id} onClick={() => setNuevaCat(c.id)}
                style={{ padding: "8px 4px", fontSize: 11, fontWeight: 600,
                  background: nuevaCat === c.id ? c.color + "33" : "#0D1117",
                  color: nuevaCat === c.id ? c.color : "#6B7280",
                  border: `1px solid ${nuevaCat === c.id ? c.color + "66" : "#1E2A3A"}`,
                  borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>{c.nombre}</button>
            ))}
          </div>
          <input value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Nota (opcional)"
            style={{ width: "100%", padding: 11, background: "#0D1117", border: "1px solid #1E2A3A", borderRadius: 10, color: "#F9FAFB", fontSize: 13, marginBottom: 10, outline: "none", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 10, background: "#1E2A3A", color: "#9CA3AF", border: "none", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
            <button onClick={addTransaccion} style={{ flex: 2, padding: 10, background: "#34C77B", color: "#0D1117", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Guardar</button>
          </div>
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Por categoría</SectionTitle>
          <Badge label={`${pctVar}% de $1,400`} color={pctVar > 90 ? "#FF6B6B" : "#34C77B"} />
        </div>
        {porCategoria.map(c => (
          <div key={c.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#D1D5DB" }}>{c.nombre}</span>
              <span style={{ fontSize: 12, color: c.color, fontWeight: 600 }}>${c.total.toLocaleString()}</span>
            </div>
            <ProgressBar value={c.total} max={data.finanzas.presupuesto} color={c.color} height={3} />
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle>Historial</SectionTitle>
        {data.finanzas.transacciones.length === 0 ? (
          <div style={{ fontSize: 12, color: "#4B5563", textAlign: "center", padding: 20 }}>Sin gastos aún</div>
        ) : data.finanzas.transacciones.slice(0, 15).map(t => {
          const cat = data.finanzas.categorias.find(c => c.id === t.categoria);
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #1E2A3A" }}>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: cat?.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#F9FAFB", fontWeight: 500 }}>{cat?.nombre}</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{t.fecha}{t.nota ? ` · ${t.nota}` : ""}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: cat?.color }}>${t.monto}</span>
              <button onClick={() => delTrans(t.id)} style={{ background: "none", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 14 }}>×</button>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── COMIDA ─────────────────────────────────────────────
function ComidaTab({ data, setData }) {
  const completadas = data.comidas.plan.filter(c => c.completado);
  const tot = completadas.reduce((s, c) => ({
    cal: s.cal + c.cal, prot: s.prot + c.prot, carb: s.carb + c.carb, gra: s.gra + c.gra
  }), { cal: 0, prot: 0, carb: 0, gra: 0 });

  const toggleComida = (id) => setData(prev => ({ ...prev, comidas: { ...prev.comidas, plan: prev.comidas.plan.map(c => c.id === id ? { ...c, completado: !c.completado } : c) } }));
  const toggleSupp = (id) => setData(prev => ({ ...prev, comidas: { ...prev.comidas, suplementos: prev.comidas.suplementos.map(s => s.id === id ? { ...s, completado: !s.completado } : s) } }));
  const addAgua = (n) => setData(prev => ({ ...prev, comidas: { ...prev.comidas, agua: Math.min(prev.comidas.agua + n, prev.comidas.metaAgua) } }));

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <Card>
        <SectionTitle>Hoy · plan v2</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 38, fontWeight: 700, color: "#5B8DEF", letterSpacing: "-0.04em", lineHeight: 1 }}>{tot.cal}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>de {data.comidas.metas.cal} kcal</div>
          </div>
          <div style={{ position: "relative" }}>
            <Ring pct={(tot.cal / data.comidas.metas.cal) * 100} size={70} stroke={6} color="#5B8DEF" />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#5B8DEF" }}>
              {Math.round((tot.cal / data.comidas.metas.cal) * 100)}%
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { l: "Proteína", v: tot.prot, m: data.comidas.metas.prot, c: "#34C77B" },
            { l: "Carbs", v: tot.carb, m: data.comidas.metas.carb, c: "#F5A623" },
            { l: "Grasa", v: tot.gra, m: data.comidas.metas.gra, c: "#FF6B6B" },
          ].map((m, i) => (
            <div key={i} style={{ background: "#0D1117", borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 10, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontWeight: 700 }}>{m.l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: m.c }}>{Math.round(m.v)}<span style={{ fontSize: 10, color: "#6B7280", fontWeight: 400 }}>/{m.m}g</span></div>
              <div style={{ marginTop: 6 }}><ProgressBar value={m.v} max={m.m} color={m.c} height={2} /></div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Comidas del día</SectionTitle>
        {data.comidas.plan.map(c => (
          <div key={c.id} onClick={() => toggleComida(c.id)}
            style={{ padding: 12, borderRadius: 12, cursor: "pointer", marginBottom: 8,
              background: c.completado ? "#0D2218" : "#0D1117",
              border: `1px solid ${c.completado ? "#1A4A2E" : "#1E2A3A"}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: c.completado ? "#34C77B" : "#1E2A3A",
                  border: c.completado ? "none" : "1px solid #374151",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {c.completado && <span style={{ fontSize: 11, color: "#0D1117" }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: c.completado ? "#34C77B" : "#F9FAFB", fontWeight: 500 }}>{c.nombre}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.completado ? "#34C77B" : "#5B8DEF", flexShrink: 0 }}>{c.cal}cal</span>
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", paddingLeft: 30, lineHeight: 1.5 }}>
              {c.items.join(" · ")} · <span style={{ color: "#9CA3AF" }}>{c.prot}p · {c.carb}c · {c.gra}g</span>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SectionTitle>Agua · meta 3L</SectionTitle>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#5B8DEF" }}>{data.comidas.agua}/{data.comidas.metaAgua}</span>
        </div>
        <ProgressBar value={data.comidas.agua} max={data.comidas.metaAgua} color="#5B8DEF" height={6} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => addAgua(n)}
              style={{ flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600, background: "#1E2A3A", color: "#5B8DEF", border: "1px solid #1E3A5F", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>
              +{n} vaso{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Suplementos</SectionTitle>
        {data.comidas.suplementos.map(s => (
          <div key={s.id} onClick={() => toggleSupp(s.id)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1E2A3A", cursor: "pointer" }}>
            <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0,
              background: s.completado ? "#34C77B" : "#1E2A3A",
              border: s.completado ? "none" : "1px solid #374151",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s.completado && <span style={{ fontSize: 10, color: "#0D1117" }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: s.completado ? "#34C77B" : "#F9FAFB", fontWeight: 500 }}>{s.nombre}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>{s.momento}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── CUERPO ─────────────────────────────────────────────
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
      whoop: {
        historial: [{ fecha: hoy(), recovery: r, sueno: s, strain: parseFloat(whoopForm.strain) || 0, hrv: parseFloat(whoopForm.hrv) || 0 }, ...prev.whoop.historial]
      }
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
      <Card style={{ background: "linear-gradient(135deg, #0A2E1B 0%, #111827 100%)", border: "1px solid #1A4A2E" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, color: "#5DCAA5", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Peso actual</div>
            {editPeso ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <input type="number" step="0.1" value={pesoTemp} onChange={e => setPesoTemp(e.target.value)} autoFocus
                  style={{ width: 80, fontSize: 28, fontWeight: 700, background: "#0D1117", border: "1px solid #34C77B", borderRadius: 8, color: "#34C77B", padding: "4px 8px", outline: "none", fontFamily: "inherit" }}
                  onKeyDown={e => e.key === "Enter" && guardarPeso()} />
                <button onClick={guardarPeso} style={{ padding: "6px 12px", background: "#34C77B", color: "#0D1117", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>OK</button>
              </div>
            ) : (
              <div onClick={() => { setEditPeso(true); setPesoTemp(String(data.perfil.pesoActual)); }}
                style={{ fontSize: 48, fontWeight: 700, color: "#34C77B", letterSpacing: "-0.04em", lineHeight: 1, cursor: "pointer" }}>
                {data.perfil.pesoActual}<span style={{ fontSize: 18, color: "#5DCAA5" }}>kg</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: "#5DCAA5", marginTop: 6 }}>−{pesoPerdido}kg desde el inicio · meta {data.perfil.pesoMeta}kg</div>
          </div>
          <div style={{ position: "relative" }}>
            <Ring pct={pesoPct} size={68} stroke={6} color="#34C77B" />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#34C77B" }}>{pesoPct}%</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar value={data.perfil.pesoInicial - data.perfil.pesoActual} max={data.perfil.pesoInicial - data.perfil.pesoMeta} color="#34C77B" height={4} />
          <div style={{ fontSize: 10, color: "#5DCAA5", marginTop: 4, textAlign: "center" }}>Toca el peso para actualizar</div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Foto de hoy</SectionTitle>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: "6px 12px", background: "#5B8DEF", color: "#0D1117", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + Subir foto
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={subirFoto} style={{ display: "none" }} />
        </div>
        {data.fotosProgreso.length === 0 ? (
          <div style={{ fontSize: 12, color: "#4B5563", textAlign: "center", padding: 24 }}>Sube tu primera foto · trackea tu progreso visual</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {data.fotosProgreso.slice(0, 9).map(f => (
              <div key={f.id} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 8, overflow: "hidden", background: "#0D1117" }}>
                <img src={f.data} alt={f.fecha} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.8))", padding: "8px 6px 4px", fontSize: 9, color: "#F9FAFB", fontWeight: 600 }}>
                  {new Date(f.fecha).toLocaleDateString("es", { day: "numeric", month: "short" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Whoop · hoy</SectionTitle>
          {ultimoWhoop && <Badge label={`recovery ${ultimoWhoop.recovery}%`} color={ultimoWhoop.recovery > 67 ? "#34C77B" : ultimoWhoop.recovery > 33 ? "#F5A623" : "#FF6B6B"} />}
        </div>
        {ultimoWhoop && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
            {[
              { l: "Recovery", v: `${ultimoWhoop.recovery}%`, c: "#34C77B" },
              { l: "Sueño", v: `${ultimoWhoop.sueno}h`, c: "#5B8DEF" },
              { l: "Strain", v: ultimoWhoop.strain.toFixed(1), c: "#F5A623" },
              { l: "HRV", v: ultimoWhoop.hrv, c: "#A78BFA" },
            ].map((m, i) => (
              <div key={i} style={{ background: "#0D1117", borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 9, color: "#4B5563", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.l}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
          <input type="number" placeholder="Recovery %" value={whoopForm.recovery} onChange={e => setWhoopForm(f => ({ ...f, recovery: e.target.value }))}
            style={{ padding: 8, background: "#0D1117", border: "1px solid #1E2A3A", borderRadius: 8, color: "#F9FAFB", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
          <input type="number" step="0.1" placeholder="Sueño h" value={whoopForm.sueno} onChange={e => setWhoopForm(f => ({ ...f, sueno: e.target.value }))}
            style={{ padding: 8, background: "#0D1117", border: "1px solid #1E2A3A", borderRadius: 8, color: "#F9FAFB", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
          <input type="number" step="0.1" placeholder="Strain" value={whoopForm.strain} onChange={e => setWhoopForm(f => ({ ...f, strain: e.target.value }))}
            style={{ padding: 8, background: "#0D1117", border: "1px solid #1E2A3A", borderRadius: 8, color: "#F9FAFB", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
          <input type="number" placeholder="HRV" value={whoopForm.hrv} onChange={e => setWhoopForm(f => ({ ...f, hrv: e.target.value }))}
            style={{ padding: 8, background: "#0D1117", border: "1px solid #1E2A3A", borderRadius: 8, color: "#F9FAFB", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
        </div>
        <button onClick={addWhoop} style={{ width: "100%", padding: 8, background: "#5B8DEF", color: "#0D1117", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Guardar Whoop de hoy
        </button>
      </Card>

      <Card>
        <SectionTitle>Notas para Zulma</SectionTitle>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <input value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Nueva pregunta..."
            onKeyDown={e => e.key === "Enter" && addNota()}
            style={{ flex: 1, padding: 9, background: "#0D1117", border: "1px solid #1E2A3A", borderRadius: 8, color: "#F9FAFB", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
          <button onClick={addNota} style={{ padding: "8px 14px", background: "#34C77B", color: "#0D1117", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+</button>
        </div>
        {data.notasZulma.map((n, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #1E2A3A" }}>
            <div style={{ width: 5, height: 5, borderRadius: 99, background: "#34C77B", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: "#D1D5DB" }}>{n}</span>
            <button onClick={() => delNota(i)} style={{ background: "none", border: "none", color: "#4B5563", fontSize: 14, cursor: "pointer" }}>×</button>
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle>Compras semanales</SectionTitle>
        {data.compras.map(c => (
          <div key={c.id} onClick={() => setData(prev => ({ ...prev, compras: prev.compras.map(x => x.id === c.id ? { ...x, comprado: !x.comprado } : x) }))}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1E2A3A", cursor: "pointer", opacity: c.comprado ? 0.5 : 1 }}>
            <div style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0,
              background: c.comprado ? "#34C77B" : "#1E2A3A",
              border: c.comprado ? "none" : "1px solid #374151",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {c.comprado && <span style={{ fontSize: 9, color: "#0D1117" }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: c.comprado ? "#6B7280" : "#F9FAFB", textDecoration: c.comprado ? "line-through" : "none" }}>{c.item}</div>
              <div style={{ fontSize: 10, color: "#4B5563" }}>{c.categoria}</div>
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
        // Si cambió el día, resetear hoy
        const today = hoy();
        if (parsed.habitos?.fechaHoy !== today) {
          parsed.habitos = { ...parsed.habitos, hoy: {}, fechaHoy: today };
          parsed.comidas = {
            ...parsed.comidas,
            plan: parsed.comidas.plan.map(p => ({ ...p, completado: false })),
            agua: 0,
            suplementos: parsed.comidas.suplementos.map(s => ({ ...s, completado: false })),
          };
        }
        // Reset de escudos cada mes
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
    <div style={{ minHeight: "100vh", background: "#0D1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 13, color: "#374151", letterSpacing: "0.1em" }}>Cargando…</div>
    </div>
  );

  const screens = { home: HomeTab, reto: RetoTab, habitos: HabitosTab, dinero: DineroTab, comida: ComidaTab, cuerpo: CuerpoTab };
  const Screen = screens[tab];

  return (
    <div style={{ background: "#0D1117", minHeight: "100vh", maxWidth: 430, margin: "0 auto",
      fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input, button { font-family: inherit; }
        ::-webkit-scrollbar { display: none; }
        body { margin: 0; }
      `}</style>

      <div style={{ padding: "20px 16px 100px" }}>
        <Screen data={data} setData={setData} />
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: "#0D1117", borderTop: "1px solid #1E2A3A",
        display: "flex", zIndex: 100 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "10px 0 18px", background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              opacity: tab === t.id ? 1 : 0.35, transition: "opacity 0.15s" }}>
            <span style={{ fontSize: 14, color: tab === t.id ? "#F5A623" : "#6B7280" }}>{t.icon}</span>
            <span style={{ fontSize: 8, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? "#F5A623" : "#6B7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
