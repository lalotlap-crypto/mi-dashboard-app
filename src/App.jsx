import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "edu_dashboard_v8";

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
};

const COMIDAS_DEFAULT = [
  { id: 1, nombre: "Desayuno post-gym", cal: 410, prot: 45, carb: 40, gra: 8.5,
    descripcion: "Avena + yogurt + leche + whey", completado: false },
  { id: 2, nombre: "Just Salad · Caesar + chicken extra", cal: 550, prot: 60, carb: 27, gra: 23,
    descripcion: "Pides Caesar + add-on Oven Roasted Chicken", completado: false },
  { id: 3, nombre: "Snack · whey + manzana", cal: 215, prot: 25, carb: 30, gra: 1.5,
    descripcion: "Whey con agua · manzana mediana", completado: false },
  { id: 4, nombre: "Cena meal prep", cal: 715, prot: 82, carb: 51, gra: 14,
    descripcion: "200g pollo + arroz integral ½ sobre + Baby Potato ½ bolsa", completado: false },
  { id: 5, nombre: "Tart cherry juice", cal: 130, prot: 1, carb: 32, gra: 0,
    descripcion: "240ml antes de dormir", completado: false },
];
COMIDAS_DEFAULT.forEach(c => { c.plan = { ...c, completado: false }; });

const GRUPOS_GYM = ["Push", "Pull", "Brazo", "Pecho/Espalda"];

const DEFAULT_DATA = {
  perfil: { nombre: "Eduardo" },
  reto: {
    nombre: "Días sin fallar",
    diaActual: 0,
    historial: [], // {fecha, completado, falló}
  },
  comidas: {
    plan: COMIDAS_DEFAULT,
    metas: { cal: 2000, prot: 200, carb: 180, gra: 60 },
    aguaTermos: 0,
    metaTermos: 5,
    mlPorTermo: 590,
    suplementos: [
      { id: 1, nombre: "DHA 1000", momento: "con desayuno", completado: false },
      { id: 2, nombre: "Mega Men Sport (2)", momento: "con desayuno", completado: false },
      { id: 3, nombre: "Omega multi", momento: "con desayuno", completado: false },
    ],
  },
  gym: {
    grupoHoy: null,
    ejerciciosHoy: [],
    completado: false,
    fechaHoy: new Date().toISOString().slice(0, 10),
    historial: [],
  },
  pilaresHoy: {
    nutricion: false,
    gym: false,
    sueno: false,
    aguaCel: false,
    journal: false,
    leer: false,
    terapia: false,
  },
  whoop: { historial: [] },
  fotosProgreso: [],
  compras: [
    { id: 1, item: "Pollo pechuga 3 lb", categoria: "Proteína", comprado: false },
    { id: 2, item: "Arroz integral 365 (5 sobres)", categoria: "Carbs", comprado: false },
    { id: 3, item: "WF Baby Potato Blend (3 bolsas)", categoria: "Carbs", comprado: false },
    { id: 4, item: "Avena 365 Rolled Oats 18oz", categoria: "Desayuno", comprado: false },
    { id: 5, item: "Yogurt griego 0% 32oz", categoria: "Desayuno", comprado: false },
    { id: 6, item: "Leche whole ½ gallon", categoria: "Desayuno", comprado: false },
    { id: 7, item: "Manzanas (5 piezas)", categoria: "Snack", comprado: false },
    { id: 8, item: "Tart cherry juice", categoria: "Noche", comprado: false },
    { id: 9, item: "Whey Double Rich Choc 2lb", categoria: "Suplementos", comprado: false },
  ],
  exportados: [],
  fechaSync: new Date().toISOString().slice(0, 10),
};

function uid() { return Date.now() + Math.random(); }
function hoy() { return new Date().toISOString().slice(0, 10); }

function ProgressBar({ value, max, color = C.blue, height = 6 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height, background: C.bg2, borderRadius: 99, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Badge({ label, color = C.blue }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, background: color + "15", color, padding: "4px 10px", borderRadius: 99 }}>
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
  fork: (active) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M7 2v8a3 3 0 003 3v9M5 2v6M9 2v6M17 2c-2 0-3 2-3 5v5h6V7c0-3-1-5-3-5zM17 13v9"
        stroke={active ? C.red : C.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  dumbbell: (active) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 6.5v11M3 9v6M9 8v8M14 8v8M20.5 9v6M17 6.5v11M9 12h5"
        stroke={active ? C.green : C.text3} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  body: (active) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2.5" stroke={active ? C.purple : C.text3} strokeWidth="2" fill={active ? C.purple + "20" : "none"} />
      <path d="M8 22v-7l-2-5a2 2 0 012-2h8a2 2 0 012 2l-2 5v7"
        stroke={active ? C.purple : C.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const TABS = [
  { id: "home",   label: "Hoy",      icon: Icons.home,     color: C.blue },
  { id: "reto",   label: "Reto",     icon: Icons.flame,    color: C.orange },
  { id: "comida", label: "Comida",   icon: Icons.fork,     color: C.red },
  { id: "gym",    label: "Gym",      icon: Icons.dumbbell, color: C.green },
  { id: "cuerpo", label: "Cuerpo",   icon: Icons.body,     color: C.purple },
];

// ─── EXPORT PDF (HTML print) ──────────────────────────
function exportarPDF(data) {
  const fecha = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const calTotal = data.comidas.plan.filter(c => c.completado).reduce((s, c) => s + c.cal, 0);
  const protTotal = data.comidas.plan.filter(c => c.completado).reduce((s, c) => s + c.prot, 0);
  const carbTotal = data.comidas.plan.filter(c => c.completado).reduce((s, c) => s + c.carb, 0);
  const graTotal = data.comidas.plan.filter(c => c.completado).reduce((s, c) => s + c.gra, 0);
  const ml = data.comidas.aguaTermos * data.comidas.mlPorTermo;
  const ultimoWhoop = data.whoop.historial[0];
  const pilaresLabels = {
    nutricion: "Nutrición",
    gym: "Gym 50-60 min",
    sueno: "Sueño 7.5h+",
    aguaCel: "3L agua + cel off 10:30pm",
    journal: "Journal",
    leer: "Leer 20 min",
    terapia: "Terapia 1 hora"
  };
  const pilaresStatus = Object.entries(data.pilaresHoy).map(([k, v]) => `${v ? "✓" : "✗"} ${pilaresLabels[k] || k}`).join("<br>");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Reporte ${hoy()}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1D1D1F; }
  h1 { font-size: 28px; margin-bottom: 4px; letter-spacing: -0.02em; }
  .date { color: #86868B; font-size: 14px; margin-bottom: 32px; text-transform: capitalize; }
  h2 { font-size: 16px; margin-top: 24px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #E5E5EA; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .box { background: #F5F5F7; border-radius: 10px; padding: 14px; }
  .box-l { font-size: 11px; color: #86868B; font-weight: 600; text-transform: uppercase; }
  .box-v { font-size: 24px; font-weight: 700; margin-top: 4px; letter-spacing: -0.02em; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 13px; }
  td { padding: 8px 0; border-bottom: 1px solid #F5F5F7; }
  td:last-child { text-align: right; color: #6E6E73; }
  .meta-bar { background: #F5F5F7; height: 6px; border-radius: 99px; overflow: hidden; margin-top: 4px; }
  .meta-bar-fill { height: 100%; border-radius: 99px; }
  .pilar { padding: 6px 0; font-size: 13px; line-height: 1.9; }
  .ok { color: #34C759; }
  .fail { color: #FF3B30; }
  .footer { margin-top: 40px; text-align: center; color: #86868B; font-size: 11px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>Reporte diario</h1>
<div class="date">${fecha}</div>

<h2>Reto · contador</h2>
<div class="grid">
  <div class="box">
    <div class="box-l">Días sin fallar</div>
    <div class="box-v">${data.reto.diaActual} 🔥</div>
  </div>
  <div class="box">
    <div class="box-l">Total días registrados</div>
    <div class="box-v">${data.reto.historial.length}</div>
  </div>
</div>

<h2>Pilares de hoy</h2>
<div class="pilar">${pilaresStatus.replace(/✓/g, '<span class="ok">✓</span>').replace(/✗/g, '<span class="fail">✗</span>')}</div>

<h2>Nutrición</h2>
<div class="grid">
  <div class="box"><div class="box-l">Calorías</div><div class="box-v">${calTotal} <span style="font-size:13px;color:#86868B;font-weight:400">/ ${data.comidas.metas.cal}</span></div></div>
  <div class="box"><div class="box-l">Proteína</div><div class="box-v">${protTotal}g <span style="font-size:13px;color:#86868B;font-weight:400">/ ${data.comidas.metas.prot}g</span></div></div>
  <div class="box"><div class="box-l">Carbs</div><div class="box-v">${Math.round(carbTotal)}g</div></div>
  <div class="box"><div class="box-l">Grasa</div><div class="box-v">${Math.round(graTotal)}g</div></div>
</div>
<table>
  ${data.comidas.plan.map(c => `<tr><td><span class="${c.completado ? 'ok' : 'fail'}">${c.completado ? '✓' : '○'}</span> <strong>${c.nombre}</strong><br><span style="font-size:11px;color:#86868B">${c.descripcion}</span></td><td>${c.cal} cal · ${c.prot}p · ${c.carb}c · ${c.gra}g</td></tr>`).join('')}
</table>

<h2>Hidratación y suplementos</h2>
<table>
  <tr><td><strong>Agua</strong></td><td>${data.comidas.aguaTermos}/${data.comidas.metaTermos} termos · ${ml}ml</td></tr>
  ${data.comidas.suplementos.map(s => `<tr><td><span class="${s.completado ? 'ok' : 'fail'}">${s.completado ? '✓' : '○'}</span> ${s.nombre}</td><td>${s.momento}</td></tr>`).join('')}
</table>

<h2>Gym</h2>
${data.gym.grupoHoy ? `
<p style="font-size:13px;margin-bottom:8px"><strong>${data.gym.grupoHoy}</strong> · ${data.gym.completado ? '<span class="ok">✓ completado</span>' : '<span class="fail">en progreso</span>'}</p>
<table>
  ${data.gym.ejerciciosHoy.map(e => `<tr><td><span class="${e.completado ? 'ok' : 'fail'}">${e.completado ? '✓' : '○'}</span> ${e.nombre}</td><td>${e.series}×${e.reps} · ${e.peso}kg</td></tr>`).join('')}
</table>
` : '<p style="color:#86868B;font-size:13px">Sin entreno registrado</p>'}

${ultimoWhoop ? `
<h2>Recovery</h2>
<div class="grid">
  <div class="box"><div class="box-l">Recovery</div><div class="box-v">${ultimoWhoop.recovery}%</div></div>
  <div class="box"><div class="box-l">Sueño</div><div class="box-v">${ultimoWhoop.sueno}h</div></div>
  <div class="box"><div class="box-l">Strain</div><div class="box-v">${ultimoWhoop.strain}</div></div>
  <div class="box"><div class="box-l">HRV</div><div class="box-v">${ultimoWhoop.hrv}</div></div>
  ${ultimoWhoop.calories > 0 ? `<div class="box"><div class="box-l">Cal Whoop</div><div class="box-v">${ultimoWhoop.calories}</div></div>` : ''}
  ${ultimoWhoop.garmin > 0 ? `<div class="box"><div class="box-l">Cal Garmin</div><div class="box-v">${ultimoWhoop.garmin}</div></div>` : ''}
</div>
` : ''}

<div class="footer">Generado por tu dashboard · ${new Date().toLocaleString("es")}</div>
<script>window.print();</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

// ─── HOME ──────────────────────────────────────────────
function HomeTab({ data, setData }) {
  const calHoy = data.comidas.plan.filter(c => c.completado).reduce((s, c) => s + c.cal, 0);
  const protHoy = data.comidas.plan.filter(c => c.completado).reduce((s, c) => s + c.prot, 0);
  const ultimoWhoop = data.whoop.historial[0];
  const fechaHoy = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });

  const togglePilar = (key) => {
    setData(prev => ({ ...prev, pilaresHoy: { ...prev.pilaresHoy, [key]: !prev.pilaresHoy[key] } }));
  };

  const pilares = [
    { key: "nutricion", label: "Nutrición", sub: `${calHoy} cal · ${protHoy}g prot` },
    { key: "gym", label: "Gym 50-60 min", sub: data.gym.grupoHoy ? `${data.gym.grupoHoy} · ${data.gym.ejerciciosHoy.filter(e => e.completado).length}/${data.gym.ejerciciosHoy.length} hechos` : "Sin elegir grupo" },
    { key: "sueno", label: "Sueño 7.5h+", sub: ultimoWhoop ? `${ultimoWhoop.sueno}h registrado` : "Sin registrar Whoop" },
    { key: "aguaCel", label: "3L agua + cel off 10:30pm", sub: `${data.comidas.aguaTermos}/${data.comidas.metaTermos} termos` },
    { key: "journal", label: "Journal", sub: "Escribir del día" },
    { key: "leer", label: "Leer 20 min", sub: "Lectura mínima diaria" },
    { key: "terapia", label: "Terapia 1 hora", sub: "Sesión completa" },
  ];

  const completados = pilares.filter(p => data.pilaresHoy[p.key]).length;
  const total = pilares.length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Hola, {data.perfil.nombre}
        </div>
        <div style={{ fontSize: 14, color: C.text2, marginTop: 4, textTransform: "capitalize" }}>{fechaHoy}</div>
      </div>

      <Card style={{ background: `linear-gradient(135deg, ${C.orange}10 0%, ${C.bg} 60%)`, border: `1px solid ${C.orange}30`, padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: C.orange, fontWeight: 600, marginBottom: 4 }}>Días sin fallar</div>
            <div style={{ fontSize: 60, fontWeight: 700, color: C.text, letterSpacing: "-0.04em", lineHeight: 0.95 }}>
              {data.reto.diaActual}
            </div>
            <div style={{ fontSize: 13, color: C.text2, marginTop: 6 }}>
              {data.reto.diaActual === 0 ? "empieza hoy" : "racha activa · sigue así"}
            </div>
          </div>
          <div style={{ fontSize: 56 }}>🔥</div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 6 }}>Calorías</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.blue, letterSpacing: "-0.03em", lineHeight: 1 }}>{calHoy}</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>de {data.comidas.metas.cal}</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 6 }}>Proteína</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.green, letterSpacing: "-0.03em", lineHeight: 1 }}>{protHoy}g</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>de {data.comidas.metas.prot}g</div>
        </Card>
        {ultimoWhoop && (
          <>
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 6 }}>Recovery</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: ultimoWhoop.recovery > 67 ? C.green : ultimoWhoop.recovery > 33 ? C.orange : C.red, letterSpacing: "-0.03em", lineHeight: 1 }}>{ultimoWhoop.recovery}%</div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>strain {ultimoWhoop.strain}</div>
            </Card>
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 6 }}>Sueño</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: C.purple, letterSpacing: "-0.03em", lineHeight: 1 }}>{ultimoWhoop.sueno}h</div>
              <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>HRV {ultimoWhoop.hrv}</div>
            </Card>
          </>
        )}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>Pilares de hoy</SectionTitle>
          <Badge label={`${completados}/${total}`} color={completados === total ? C.green : C.orange} />
        </div>
        {pilares.map((p, idx) => {
          const done = data.pilaresHoy[p.key];
          return (
            <div key={p.key} onClick={() => togglePilar(p.key)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 0", borderBottom: idx < pilares.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: done ? C.text : C.text2, fontWeight: done ? 500 : 400 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{p.sub}</div>
              </div>
              <div style={{ width: 26, height: 26, borderRadius: 13,
                background: done ? C.green : C.bg,
                border: done ? "none" : `1.5px solid ${C.border2}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {done && <span style={{ fontSize: 14, color: "white", fontWeight: 700 }}>✓</span>}
              </div>
            </div>
          );
        })}
      </Card>

      <button onClick={() => exportarPDF(data)}
        style={{ width: "100%", padding: 14, background: C.bg, color: C.blue, border: `1.5px solid ${C.blue}40`, borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
        📄 Exportar reporte de hoy
      </button>

      {completados === total && (
        <Card style={{ background: C.green + "10", border: `1px solid ${C.green}30`, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🔥</div>
          <div style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>Día perfecto · ve a Reto para sumarlo</div>
        </Card>
      )}
    </div>
  );
}

// ─── RETO ─────────────────────────────────────────────
function RetoTab({ data, setData }) {
  const yaRegistrado = data.reto.historial.find(h => h.fecha === hoy());

  const completarDia = () => {
    if (yaRegistrado) return;
    setData(prev => ({
      ...prev,
      reto: {
        ...prev.reto,
        diaActual: prev.reto.diaActual + 1,
        historial: [...prev.reto.historial, { fecha: hoy(), completado: true }],
      }
    }));
  };

  const fallarDia = () => {
    if (yaRegistrado) return;
    if (!confirm(`¿Fallaste hoy? Tu racha de ${data.reto.diaActual} días se reinicia a 0.`)) return;
    setData(prev => ({
      ...prev,
      reto: {
        ...prev.reto,
        diaActual: 0,
        historial: [...prev.reto.historial, { fecha: hoy(), completado: false, falló: true }],
      }
    }));
  };

  const desmarcarHoy = () => {
    if (!confirm("¿Borrar el registro de hoy y recalcular?")) return;
    setData(prev => {
      const sinHoy = prev.reto.historial.filter(h => h.fecha !== hoy());
      let dia = 0;
      const ordenados = [...sinHoy].sort((a, b) => a.fecha.localeCompare(b.fecha));
      for (let i = ordenados.length - 1; i >= 0; i--) {
        if (ordenados[i].completado) dia++;
        else break;
      }
      return { ...prev, reto: { ...prev.reto, diaActual: dia, historial: sinHoy } };
    });
  };

  const reiniciarReto = () => {
    if (!confirm("¿Reiniciar el reto desde cero? Se borra el historial completo.")) return;
    setData(prev => ({
      ...prev,
      reto: { ...prev.reto, diaActual: 0, historial: [] }
    }));
  };

  const dias = data.reto.diaActual;
  const milestones = [7, 14, 30, 50, 75, 100, 150, 200, 365];
  const proximoMilestone = milestones.find(m => m > dias) || dias + 100;
  const ultimoMilestone = [...milestones].reverse().find(m => m <= dias) || 0;

  const totalDias = data.reto.historial.length;
  const exitosos = data.reto.historial.filter(h => h.completado).length;
  const fallas = data.reto.historial.filter(h => h.falló).length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <Card style={{ background: `linear-gradient(135deg, ${C.orange}10 0%, ${C.bg} 60%)`, border: `1px solid ${C.orange}30`, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: C.orange, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{data.reto.nombre}</div>
        <div style={{ fontSize: 96, fontWeight: 700, color: C.text, letterSpacing: "-0.05em", lineHeight: 0.9 }}>
          {dias}
        </div>
        <div style={{ fontSize: 16, color: C.text2, marginTop: 6, fontWeight: 500 }}>días sin fallar 🔥</div>
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: C.text2, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
            <span>{ultimoMilestone}</span>
            <span style={{ color: C.orange, fontWeight: 600 }}>{proximoMilestone - dias} para próximo hito</span>
            <span>{proximoMilestone}</span>
          </div>
          <ProgressBar value={dias - ultimoMilestone} max={proximoMilestone - ultimoMilestone} color={C.orange} height={8} />
        </div>
      </Card>

      <Card>
        <SectionTitle>Hoy · {new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}</SectionTitle>

        {yaRegistrado ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: yaRegistrado.completado ? C.green : C.red }}>
                  {yaRegistrado.completado ? "✓ Día completado" : "✗ Día fallado"}
                </div>
                <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>Ya registrado</div>
              </div>
              <button onClick={desmarcarHoy}
                style={{ padding: "8px 14px", background: C.bg2, color: C.text2, border: "none", borderRadius: 10, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                deshacer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: C.text2, marginBottom: 14, lineHeight: 1.5 }}>
              ¿Cómo te fue hoy? Marca tu día con honestidad.
            </div>
            <button onClick={completarDia}
              style={{ width: "100%", padding: 16, background: C.green, color: "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
              ✓ Completé el día
            </button>
            <button onClick={fallarDia}
              style={{ width: "100%", padding: 14, background: "transparent", color: C.red, border: `1.5px solid ${C.red}40`, borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ✗ Fallé hoy · resetear racha
            </button>
          </>
        )}
      </Card>

      {totalDias > 0 && (
        <Card>
          <SectionTitle>Estadísticas</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div style={{ background: C.bg2, borderRadius: 10, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{totalDias}</div>
              <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginTop: 2 }}>TOTAL DÍAS</div>
            </div>
            <div style={{ background: C.bg2, borderRadius: 10, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{exitosos}</div>
              <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginTop: 2 }}>EXITOSOS</div>
            </div>
            <div style={{ background: C.bg2, borderRadius: 10, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.red }}>{fallas}</div>
              <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginTop: 2 }}>FALLAS</div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Últimos 30 días</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - (29 - i));
            const fechaStr = fecha.toISOString().slice(0, 10);
            const reg = data.reto.historial.find(h => h.fecha === fechaStr);
            const completado = reg?.completado;
            const falla = reg?.falló;
            const esHoy = fechaStr === hoy();
            return (
              <div key={i} style={{
                aspectRatio: 1, borderRadius: 5,
                background: completado ? C.green : falla ? C.red : C.bg2,
                border: esHoy ? `2px dashed ${C.orange}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: completado || falla ? "white" : esHoy ? C.orange : C.text3, fontWeight: 700
              }}>
                {fecha.getDate()}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 11, color: C.text2 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.green, borderRadius: 3, marginRight: 5, verticalAlign: "middle" }} /> Completado</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.red, borderRadius: 3, marginRight: 5, verticalAlign: "middle" }} /> Falla</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: C.bg2, borderRadius: 3, marginRight: 5, verticalAlign: "middle" }} /> Sin marcar</span>
        </div>
      </Card>

      <Card>
        <SectionTitle>Reiniciar reto</SectionTitle>
        <div style={{ fontSize: 12, color: C.text2, marginBottom: 12, lineHeight: 1.5 }}>
          Borra el historial completo y vuelve a Día 0. Ojalá no lo uses.
        </div>
        <button onClick={reiniciarReto}
          style={{ width: "100%", padding: 12, background: "transparent", color: C.text3, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
          Reiniciar todo
        </button>
      </Card>
    </div>
  );
}

// ─── COMIDA ───────────────────────────────────────────
function ComidaTab({ data, setData }) {
  const [editandoId, setEditandoId] = useState(null);
  const [edit, setEdit] = useState({ nombre: "", desc: "", cal: "", prot: "", carb: "", gra: "" });
  const [editAgua, setEditAgua] = useState(false);
  const [aguaForm, setAguaForm] = useState({ termos: "", ml: "", meta: "" });

  const completadas = data.comidas.plan.filter(c => c.completado);
  const tot = completadas.reduce((s, c) => ({
    cal: s.cal + c.cal, prot: s.prot + c.prot, carb: s.carb + c.carb, gra: s.gra + c.gra
  }), { cal: 0, prot: 0, carb: 0, gra: 0 });

  const toggleComida = (id) => setData(prev => ({ ...prev, comidas: { ...prev.comidas, plan: prev.comidas.plan.map(c => c.id === id ? { ...c, completado: !c.completado } : c) } }));
  const toggleSupp = (id) => setData(prev => ({ ...prev, comidas: { ...prev.comidas, suplementos: prev.comidas.suplementos.map(s => s.id === id ? { ...s, completado: !s.completado } : s) } }));

  const addTermos = (n) => setData(prev => ({ ...prev, comidas: { ...prev.comidas, aguaTermos: Math.max(0, prev.comidas.aguaTermos + n) } }));

  const guardarAgua = () => {
    const nuevoTermos = parseFloat(aguaForm.termos);
    const nuevoMl = parseFloat(aguaForm.ml);
    const nuevaMeta = parseFloat(aguaForm.meta);
    setData(prev => ({
      ...prev,
      comidas: {
        ...prev.comidas,
        aguaTermos: !isNaN(nuevoTermos) ? nuevoTermos : prev.comidas.aguaTermos,
        mlPorTermo: !isNaN(nuevoMl) ? nuevoMl : prev.comidas.mlPorTermo,
        metaTermos: !isNaN(nuevaMeta) ? nuevaMeta : prev.comidas.metaTermos,
      }
    }));
    setEditAgua(false);
  };

  const empezarEdit = (c) => {
    setEditandoId(c.id);
    setEdit({ nombre: c.nombre, desc: c.descripcion || "", cal: String(c.cal), prot: String(c.prot), carb: String(c.carb), gra: String(c.gra) });
  };

  const guardarEdit = () => {
    setData(prev => ({
      ...prev,
      comidas: {
        ...prev.comidas,
        plan: prev.comidas.plan.map(c => c.id === editandoId ? {
          ...c,
          nombre: edit.nombre || c.nombre,
          descripcion: edit.desc,
          cal: parseFloat(edit.cal) || 0,
          prot: parseFloat(edit.prot) || 0,
          carb: parseFloat(edit.carb) || 0,
          gra: parseFloat(edit.gra) || 0,
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
        plan: prev.comidas.plan.map(c => c.id === id && c.plan ? { ...c.plan, completado: c.completado, plan: c.plan } : c)
      }
    }));
  };

  const mlActual = data.comidas.aguaTermos * data.comidas.mlPorTermo;
  const mlMeta = data.comidas.metaTermos * data.comidas.mlPorTermo;

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: C.text2, fontWeight: 600 }}>Calorías</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: C.blue, letterSpacing: "-0.04em", lineHeight: 1 }}>{tot.cal}</div>
            <div style={{ fontSize: 11, color: C.text3 }}>de {data.comidas.metas.cal}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.text2, fontWeight: 600 }}>Proteína</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: C.green, letterSpacing: "-0.04em", lineHeight: 1 }}>{tot.prot}<span style={{ fontSize: 18, color: C.text3 }}>g</span></div>
            <div style={{ fontSize: 11, color: C.text3 }}>de {data.comidas.metas.prot}g</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: C.bg2, borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Carbs</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.orange }}>{Math.round(tot.carb)}<span style={{ fontSize: 11, color: C.text3 }}>g</span></div>
            <ProgressBar value={tot.carb} max={data.comidas.metas.carb} color={C.orange} height={3} />
          </div>
          <div style={{ background: C.bg2, borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 11, color: C.text2, fontWeight: 600, marginBottom: 4 }}>Grasa</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.red }}>{Math.round(tot.gra)}<span style={{ fontSize: 11, color: C.text3 }}>g</span></div>
            <ProgressBar value={tot.gra} max={data.comidas.metas.gra} color={C.red} height={3} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Comidas del día · toca para marcar</SectionTitle>
        {data.comidas.plan.map(c => {
          const isEditando = editandoId === c.id;
          const cambiada = c.plan && (c.nombre !== c.plan.nombre || c.cal !== c.plan.cal);

          if (isEditando) {
            return (
              <div key={c.id} style={{ padding: 14, borderRadius: 14, marginBottom: 10, background: C.bg2, border: `2px solid ${C.blue}` }}>
                <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 10 }}>EDITANDO</div>
                <input value={edit.nombre} onChange={e => setEdit(s => ({ ...s, nombre: e.target.value }))} placeholder="Nombre"
                  style={{ width: "100%", padding: 11, background: C.bg, border: "none", borderRadius: 10, fontSize: 14, marginBottom: 8, outline: "none", fontFamily: "inherit", color: C.text, fontWeight: 500 }} />
                <input value={edit.desc} onChange={e => setEdit(s => ({ ...s, desc: e.target.value }))} placeholder="Descripción"
                  style={{ width: "100%", padding: 11, background: C.bg, border: "none", borderRadius: 10, fontSize: 13, marginBottom: 8, outline: "none", fontFamily: "inherit", color: C.text }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>CAL</div>
                    <input type="number" value={edit.cal} onChange={e => setEdit(s => ({ ...s, cal: e.target.value }))}
                      style={{ width: "100%", padding: 10, background: C.bg, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>PROT (g)</div>
                    <input type="number" value={edit.prot} onChange={e => setEdit(s => ({ ...s, prot: e.target.value }))}
                      style={{ width: "100%", padding: 10, background: C.bg, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>CARB (g)</div>
                    <input type="number" value={edit.carb} onChange={e => setEdit(s => ({ ...s, carb: e.target.value }))}
                      style={{ width: "100%", padding: 10, background: C.bg, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>GRA (g)</div>
                    <input type="number" value={edit.gra} onChange={e => setEdit(s => ({ ...s, gra: e.target.value }))}
                      style={{ width: "100%", padding: 10, background: C.bg, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setEditandoId(null)}
                    style={{ flex: 1, padding: 11, background: C.bg, color: C.text2, border: "none", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Cancelar</button>
                  <button onClick={guardarEdit}
                    style={{ flex: 2, padding: 11, background: C.blue, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Guardar</button>
                </div>
              </div>
            );
          }

          return (
            <div key={c.id} style={{ padding: 14, borderRadius: 14, marginBottom: 10,
              background: c.completado ? C.green + "08" : C.bg2,
              border: `1px solid ${c.completado ? C.green + "30" : C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.completado ? C.green : C.blue }}>{c.cal}cal</span>
                  <button onClick={() => empezarEdit(c)}
                    style={{ padding: "4px 8px", background: C.bg, color: C.blue, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>edit</button>
                  {cambiada && (
                    <button onClick={() => restaurarPlan(c.id)}
                      style={{ padding: "4px 8px", background: C.bg, color: C.orange, border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>↺</button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.text2, paddingLeft: 36, lineHeight: 1.5 }}>
                {c.descripcion} <span style={{ color: C.text3 }}>· {c.prot}p · {c.carb}c · {c.gra}g</span>
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle>Agua · meta {(mlMeta / 1000).toFixed(2)}L</SectionTitle>
          <button onClick={() => { setEditAgua(true); setAguaForm({ termos: String(data.comidas.aguaTermos), ml: String(data.comidas.mlPorTermo), meta: String(data.comidas.metaTermos) }); }}
            style={{ padding: "4px 10px", background: C.bg2, color: C.text2, border: "none", borderRadius: 8, fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            ⚙️ ajustar
          </button>
        </div>

        {editAgua ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>TERMOS HOY</div>
                <input type="number" step="0.5" value={aguaForm.termos} onChange={e => setAguaForm(s => ({ ...s, termos: e.target.value }))}
                  style={{ width: "100%", padding: 10, background: C.bg2, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>ML / TERMO</div>
                <input type="number" value={aguaForm.ml} onChange={e => setAguaForm(s => ({ ...s, ml: e.target.value }))}
                  style={{ width: "100%", padding: 10, background: C.bg2, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.text2, marginBottom: 4, fontWeight: 600 }}>META</div>
                <input type="number" step="0.5" value={aguaForm.meta} onChange={e => setAguaForm(s => ({ ...s, meta: e.target.value }))}
                  style={{ width: "100%", padding: 10, background: C.bg2, border: "none", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditAgua(false)} style={{ flex: 1, padding: 10, background: C.bg2, color: C.text2, border: "none", borderRadius: 10, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Cancelar</button>
              <button onClick={guardarAgua} style={{ flex: 2, padding: 10, background: C.blue, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Guardar</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 28, fontWeight: 700, color: C.blue, letterSpacing: "-0.02em" }}>{data.comidas.aguaTermos}</span>
                <span style={{ fontSize: 14, color: C.text2, fontWeight: 500 }}> / {data.comidas.metaTermos} termos</span>
              </div>
              <span style={{ fontSize: 13, color: C.text2 }}>{(mlActual / 1000).toFixed(2)}L · {data.comidas.mlPorTermo}ml c/u</span>
            </div>
            <ProgressBar value={data.comidas.aguaTermos} max={data.comidas.metaTermos} color={C.blue} height={8} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => addTermos(-1)}
                style={{ padding: "11px 14px", fontSize: 18, fontWeight: 700, background: C.bg2, color: C.text2, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                −
              </button>
              <button onClick={() => addTermos(0.5)}
                style={{ flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 700, background: C.blue + "15", color: C.blue, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                + ½ termo
              </button>
              <button onClick={() => addTermos(1)}
                style={{ flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 700, background: C.blue + "15", color: C.blue, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                + 1 termo
              </button>
              <button onClick={() => addTermos(2)}
                style={{ flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 700, background: C.blue + "15", color: C.blue, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                + 2
              </button>
            </div>
          </>
        )}
      </Card>

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

// ─── GYM ──────────────────────────────────────────────
function GymTab({ data, setData }) {
  const [nuevoEjercicio, setNuevoEjercicio] = useState("");
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [nuevasReps, setNuevasReps] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editEjer, setEditEjer] = useState({ nombre: "", peso: "", reps: "", series: "" });

  const elegirGrupo = (grupo) => {
    setData(prev => ({
      ...prev,
      gym: { ...prev.gym, grupoHoy: grupo, ejerciciosHoy: [], completado: false }
    }));
  };

  const limpiarDia = () => {
    setData(prev => ({
      ...prev,
      gym: { ...prev.gym, grupoHoy: null, ejerciciosHoy: [], completado: false }
    }));
  };

  const addEjercicio = () => {
    if (!nuevoEjercicio.trim()) return;
    const ej = {
      id: uid(),
      nombre: nuevoEjercicio,
      peso: parseFloat(nuevoPeso) || 0,
      reps: parseInt(nuevasReps) || 0,
      series: 4,
      completado: false,
    };
    setData(prev => ({
      ...prev,
      gym: { ...prev.gym, ejerciciosHoy: [...prev.gym.ejerciciosHoy, ej] }
    }));
    setNuevoEjercicio(""); setNuevoPeso(""); setNuevasReps("");
  };

  const toggleEjercicio = (id) => {
    setData(prev => ({
      ...prev,
      gym: { ...prev.gym, ejerciciosHoy: prev.gym.ejerciciosHoy.map(e => e.id === id ? { ...e, completado: !e.completado } : e) }
    }));
  };

  const delEjercicio = (id) => {
    setData(prev => ({
      ...prev,
      gym: { ...prev.gym, ejerciciosHoy: prev.gym.ejerciciosHoy.filter(e => e.id !== id) }
    }));
  };

  const empezarEditEjer = (e) => {
    setEditandoId(e.id);
    setEditEjer({ nombre: e.nombre, peso: String(e.peso), reps: String(e.reps), series: String(e.series) });
  };

  const guardarEditEjer = () => {
    setData(prev => ({
      ...prev,
      gym: {
        ...prev.gym,
        ejerciciosHoy: prev.gym.ejerciciosHoy.map(e => e.id === editandoId ? {
          ...e,
          nombre: editEjer.nombre || e.nombre,
          peso: parseFloat(editEjer.peso) || 0,
          reps: parseInt(editEjer.reps) || 0,
          series: parseInt(editEjer.series) || 4,
        } : e)
      }
    }));
    setEditandoId(null);
  };

  const completarGym = () => {
    setData(prev => ({
      ...prev,
      gym: {
        ...prev.gym,
        completado: true,
        historial: [{ fecha: hoy(), grupo: prev.gym.grupoHoy, ejercicios: prev.gym.ejerciciosHoy }, ...prev.gym.historial.slice(0, 60)]
      }
    }));
  };

  const ejerciciosCompletados = data.gym.ejerciciosHoy.filter(e => e.completado).length;
  const totalEj = data.gym.ejerciciosHoy.length;

  const findPR = (nombre) => {
    let max = 0;
    data.gym.historial.forEach(h => {
      h.ejercicios?.forEach(e => {
        if (e.nombre.toLowerCase() === nombre.toLowerCase() && e.peso > max) max = e.peso;
      });
    });
    return max;
  };

  if (!data.gym.grupoHoy) {
    return (
      <div style={{ animation: "fadeUp 0.35s ease both" }}>
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💪</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 6 }}>¿Qué entrenas hoy?</div>
          <div style={{ fontSize: 13, color: C.text2 }}>Elige el grupo muscular del día</div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {GRUPOS_GYM.map(g => (
            <button key={g} onClick={() => elegirGrupo(g)}
              style={{ padding: "24px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, fontSize: 16, fontWeight: 700, color: C.text, cursor: "pointer", fontFamily: "inherit" }}>
              {g}
            </button>
          ))}
        </div>

        {data.gym.historial.length > 0 && (
          <Card style={{ marginTop: 14 }}>
            <SectionTitle>Últimos entrenos</SectionTitle>
            {data.gym.historial.slice(0, 5).map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < Math.min(4, data.gym.historial.length - 1) ? `1px solid ${C.border}` : "none" }}>
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{h.grupo}</div>
                  <div style={{ fontSize: 11, color: C.text2 }}>{h.ejercicios?.length || 0} ejercicios</div>
                </div>
                <div style={{ fontSize: 11, color: C.text3 }}>{new Date(h.fecha).toLocaleDateString("es", { day: "numeric", month: "short" })}</div>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <Card style={{ background: `linear-gradient(135deg, ${C.green}10 0%, ${C.bg} 60%)`, border: `1px solid ${C.green}30` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Entreno de hoy</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", marginTop: 2 }}>{data.gym.grupoHoy}</div>
            <div style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{ejerciciosCompletados}/{totalEj} ejercicios · {data.gym.completado ? "✓ completado" : "en progreso"}</div>
          </div>
          <button onClick={limpiarDia}
            style={{ padding: "6px 12px", background: C.bg, color: C.text2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
            cambiar
          </button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Agregar ejercicio</SectionTitle>
        <input value={nuevoEjercicio} onChange={e => setNuevoEjercicio(e.target.value)} placeholder="Bench press, curl, etc"
          onKeyDown={e => e.key === "Enter" && addEjercicio()}
          style={{ width: "100%", padding: 12, background: C.bg2, border: "none", borderRadius: 10, fontSize: 14, marginBottom: 8, outline: "none", fontFamily: "inherit", color: C.text, fontWeight: 500 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
          <input type="number" value={nuevoPeso} onChange={e => setNuevoPeso(e.target.value)} placeholder="Peso kg"
            style={{ width: "100%", padding: 10, background: C.bg2, border: "none", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <input type="number" value={nuevasReps} onChange={e => setNuevasReps(e.target.value)} placeholder="Reps"
            style={{ width: "100%", padding: 10, background: C.bg2, border: "none", borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <button onClick={addEjercicio}
            style={{ padding: 10, background: C.green, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
        </div>
        {nuevoEjercicio && findPR(nuevoEjercicio) > 0 && (
          <div style={{ fontSize: 11, color: C.purple, fontWeight: 600 }}>📈 PR anterior: {findPR(nuevoEjercicio)}kg</div>
        )}
      </Card>

      {data.gym.ejerciciosHoy.length > 0 && (
        <Card>
          <SectionTitle>Tu rutina · {ejerciciosCompletados}/{totalEj}</SectionTitle>
          {data.gym.ejerciciosHoy.map(e => {
            const isEditando = editandoId === e.id;
            const pr = findPR(e.nombre);
            const esPR = e.peso > pr && e.peso > 0;

            if (isEditando) {
              return (
                <div key={e.id} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: C.bg2, border: `2px solid ${C.green}` }}>
                  <input value={editEjer.nombre} onChange={ev => setEditEjer(s => ({ ...s, nombre: ev.target.value }))}
                    style={{ width: "100%", padding: 10, background: C.bg, border: "none", borderRadius: 8, fontSize: 13, marginBottom: 6, outline: "none", fontFamily: "inherit", fontWeight: 500 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                    <input type="number" value={editEjer.series} onChange={ev => setEditEjer(s => ({ ...s, series: ev.target.value }))} placeholder="Series"
                      style={{ width: "100%", padding: 8, background: C.bg, border: "none", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                    <input type="number" value={editEjer.reps} onChange={ev => setEditEjer(s => ({ ...s, reps: ev.target.value }))} placeholder="Reps"
                      style={{ width: "100%", padding: 8, background: C.bg, border: "none", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                    <input type="number" value={editEjer.peso} onChange={ev => setEditEjer(s => ({ ...s, peso: ev.target.value }))} placeholder="Peso"
                      style={{ width: "100%", padding: 8, background: C.bg, border: "none", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setEditandoId(null)}
                      style={{ flex: 1, padding: 9, background: C.bg, color: C.text2, border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Cancelar</button>
                    <button onClick={guardarEditEjer}
                      style={{ flex: 2, padding: 9, background: C.green, color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>OK</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: `1px solid ${C.border}`, opacity: e.completado ? 0.6 : 1 }}>
                <div onClick={() => toggleEjercicio(e.id)}
                  style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, cursor: "pointer",
                    background: e.completado ? C.green : C.bg,
                    border: e.completado ? "none" : `1.5px solid ${C.border2}`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {e.completado && <span style={{ fontSize: 13, color: "white", fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => empezarEditEjer(e)}>
                  <div style={{ fontSize: 14, color: e.completado ? C.text2 : C.text, fontWeight: 600, textDecoration: e.completado ? "line-through" : "none" }}>
                    {e.nombre} {esPR && <span style={{ color: C.purple, fontSize: 11 }}>📈 PR</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.text2, marginTop: 1 }}>
                    {e.series}×{e.reps} · {e.peso}kg{pr > 0 && pr !== e.peso && ` · prev ${pr}kg`}
                  </div>
                </div>
                <button onClick={() => delEjercicio(e.id)}
                  style={{ background: "none", border: "none", color: C.text3, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            );
          })}
        </Card>
      )}

      {data.gym.ejerciciosHoy.length >= 3 && !data.gym.completado && (
        <button onClick={completarGym}
          style={{ width: "100%", padding: 14, background: C.green, color: "white", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12, fontFamily: "inherit" }}>
          ✓ Marcar gym como completado
        </button>
      )}

      {data.gym.completado && (
        <Card style={{ background: C.green + "10", border: `1px solid ${C.green}30`, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>💪</div>
          <div style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>Gym completado</div>
        </Card>
      )}
    </div>
  );
}

// ─── CUERPO (grid arreglado) ──────────────────────────
function CuerpoTab({ data, setData }) {
  const fileRef = useRef(null);
  const [whoopForm, setWhoopForm] = useState({ recovery: "", sueno: "", strain: "", hrv: "", calories: "" });
  const [garminCal, setGarminCal] = useState("");

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
      whoop: { historial: [{
        fecha: hoy(), recovery: r, sueno: s,
        strain: parseFloat(whoopForm.strain) || 0,
        hrv: parseFloat(whoopForm.hrv) || 0,
        calories: parseFloat(whoopForm.calories) || 0,
        garmin: parseFloat(garminCal) || 0,
      }, ...prev.whoop.historial] }
    }));
    setWhoopForm({ recovery: "", sueno: "", strain: "", hrv: "", calories: "" });
    setGarminCal("");
  };

  const ultimoWhoop = data.whoop.historial[0];

  // Box uniforme — todas las metrics usan este componente para garantizar mismo tamaño
  const MetricBox = ({ value, label, color, suffix = "" }) => (
    <div style={{
      background: C.bg2,
      borderRadius: 10,
      padding: "12px 8px",
      textAlign: "center",
      minHeight: 64,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {value}{suffix}
      </div>
      <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginTop: 4, letterSpacing: "0.02em" }}>
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.35s ease both" }}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>Recovery · hoy</SectionTitle>
          {ultimoWhoop && <Badge label={`recovery ${ultimoWhoop.recovery}%`} color={ultimoWhoop.recovery > 67 ? C.green : ultimoWhoop.recovery > 33 ? C.orange : C.red} />}
        </div>
        {ultimoWhoop && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
            marginBottom: 10,
          }}>
            <MetricBox value={ultimoWhoop.recovery} suffix="%" label="Recovery" color={C.green} />
            <MetricBox value={ultimoWhoop.sueno} suffix="h" label="Sueño" color={C.blue} />
            <MetricBox value={ultimoWhoop.strain} label="Strain" color={C.orange} />
            <MetricBox value={ultimoWhoop.hrv} label="HRV" color={C.purple} />
            {ultimoWhoop.calories > 0 && (
              <MetricBox value={ultimoWhoop.calories} label="Cal Whoop" color={C.red} />
            )}
            {ultimoWhoop.garmin > 0 && (
              <MetricBox value={ultimoWhoop.garmin} label="Cal Garmin" color={C.red} />
            )}
          </div>
        )}
        <div style={{ fontSize: 10, color: C.text3, marginBottom: 8, fontWeight: 600 }}>NUEVO REGISTRO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
          <input type="number" placeholder="Recovery %" value={whoopForm.recovery} onChange={e => setWhoopForm(f => ({ ...f, recovery: e.target.value }))}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          <input type="number" step="0.1" placeholder="Sueño h" value={whoopForm.sueno} onChange={e => setWhoopForm(f => ({ ...f, sueno: e.target.value }))}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          <input type="number" step="0.1" placeholder="Strain" value={whoopForm.strain} onChange={e => setWhoopForm(f => ({ ...f, strain: e.target.value }))}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          <input type="number" placeholder="HRV" value={whoopForm.hrv} onChange={e => setWhoopForm(f => ({ ...f, hrv: e.target.value }))}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          <input type="number" placeholder="Cal Whoop" value={whoopForm.calories} onChange={e => setWhoopForm(f => ({ ...f, calories: e.target.value }))}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
          <input type="number" placeholder="Cal Garmin" value={garminCal} onChange={e => setGarminCal(e.target.value)}
            style={{ padding: 10, background: C.bg2, border: "none", borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }} />
        </div>
        <button onClick={addWhoop} style={{ width: "100%", padding: 11, background: C.purple, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Guardar registro
        </button>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle>Foto de hoy</SectionTitle>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: "8px 14px", background: C.blue, color: "white", border: "none", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + Subir
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={subirFoto} style={{ display: "none" }} />
        </div>
        {data.fotosProgreso.length === 0 ? (
          <div style={{ fontSize: 13, color: C.text3, textAlign: "center", padding: 28 }}>Sube tu primera foto</div>
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
        // Migra pilares antiguos (4) al shape nuevo (7)
        parsed.pilaresHoy = {
          nutricion: false,
          gym: false,
          sueno: false,
          aguaCel: false,
          journal: false,
          leer: false,
          terapia: false,
          ...(parsed.pilaresHoy || {}),
        };
        if (parsed.fechaSync !== today) {
          parsed.fechaSync = today;
          parsed.comidas = {
            ...parsed.comidas,
            plan: parsed.comidas.plan.map(p => p.plan ? { ...p.plan, completado: false, plan: p.plan } : { ...p, completado: false }),
            aguaTermos: 0,
            suplementos: parsed.comidas.suplementos.map(s => ({ ...s, completado: false })),
          };
          parsed.gym = { ...parsed.gym, grupoHoy: null, ejerciciosHoy: [], completado: false, fechaHoy: today };
          parsed.pilaresHoy = { nutricion: false, gym: false, sueno: false, aguaCel: false, journal: false, leer: false, terapia: false };
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

  const screens = { home: HomeTab, reto: RetoTab, comida: ComidaTab, gym: GymTab, cuerpo: CuerpoTab };
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
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.15s" }}>
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
