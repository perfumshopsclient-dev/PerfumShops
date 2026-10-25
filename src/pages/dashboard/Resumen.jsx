import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { getMostSaledPerfume, getResumen, getStock } from "../../utils/dashboardInformation";

const COLORES = ["#c9a227", "#e6cf7a", "#1b2a5a", "#2a3a78", "#5b2a9e", "#3c4f9a", "#8b7d5c", "#a89460"];
const GENEROS = { F: "Dama", M: "Caballero", U: "Unisex" };

const fmtCOP = (n) => `$ ${n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function KPICard({ titulo, valor, sub, icono }) {
  return (
    <div className="dashboard-card kpi-card">
      <div className="kpi-icon">{icono}</div>
      <div className="kpi-content">
        <p className="kpi-title">{titulo}</p>
        <p className="kpi-value">{valor}</p>
        <p className="kpi-sub">{sub}</p>
      </div>
    </div>
  );
}

function ChartCard({ titulo, children }) {
  return (
    <div className="dashboard-card chart-card">
      <h3 className="chart-title">{titulo}</h3>
      <div className="chart-container">{children}</div>
    </div>
  );
}

function StatTable({ titulo, headers, rows }) {
  return (
    <div className="dashboard-card table-card">
      <h3 className="chart-title">{titulo}</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>{row.map((cell, cellIdx) => <td key={cellIdx}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Resumen() {
  const [perfumesVendidos, setPerfumesVendidos] = useState([]);
  const [resumen, setResumen] = useState();
  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vigente = true;
    Promise.allSettled([getMostSaledPerfume(), getResumen(), getStock()])
      .then(([p, r, s]) => {
        if (!vigente) return;
        if (p.status === "fulfilled") setPerfumesVendidos(p.value);
        if (r.status === "fulfilled") setResumen(r.value);
        if (s.status === "fulfilled") setStock(s.value);
        const fallos = [p, r, s].filter((x) => x.status === "rejected");
        fallos.forEach((f) => console.error("Fallo en Resumen:", f.reason));
        if (fallos.length) setError(true);
      })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  const dias = resumen?.dias ?? [];

  const semanas = resumen?.semanas ?? [];
  const totalVentasSemana = semanas.at(-1)?.ventas ?? 0;
  const totalIngresosSemana = semanas.at(-1)?.ingresos ?? 0;
  const promedioSemanal = semanas.length ? semanas.reduce((a, s) => a + s.ingresos, 0) / semanas.length : 0;
  const promedioMensual = promedioSemanal * 4.33;
  const totalIngresos = resumen?.totales?.ingresos ?? 0;
  const stockBajo = stock.filter((p) => p.cantidad <= p.stock_minimo).length;

  const perfumes = (Array.isArray(perfumesVendidos) ? perfumesVendidos : []).map((p) => ({
    ...p,
    nombre: p.nombre ?? p.nombre_perfume ?? p.perfume?.nombre ?? "Perfume",
    cantidad: Number(p.total_vendido ?? p.cantidad) || 0,
    ingresos: Number(p.ingresos ?? p.total_ingresos) || 0,
  }));
  const totalPerfumesVendidos = perfumes.reduce((total, perfume) => total + perfume.cantidad, 0);
  const datosPastel = perfumes.slice(0, 6).map((p, idx) => ({
    name: p.nombre,
    value: p.cantidad,
    fill: COLORES[idx % COLORES.length]
  }));

  const datosBarrasTop = perfumes.slice(0, 5).map((p, idx) => ({
    nombre: p.nombre,
    cantidad: p.cantidad,
    fill: COLORES[idx % COLORES.length]
  }));

  return (
    <>
        {cargando && <p role="status">Cargando perfumes más vendidos...</p>}
        {error && <p role="alert">No se pudieron cargar los perfumes más vendidos.</p>}
        <section className="dashboard-grid kpi-grid">
          <KPICard titulo="Ventas esta semana" valor={totalVentasSemana} sub="Unidades vendidas" icono="📦" />
          <KPICard titulo="Ingresos semanales" valor={fmtCOP(totalIngresosSemana)} sub="Total facturado" icono="💰" />
          <KPICard titulo="Promedio/semana" valor={fmtCOP(promedioSemanal)} sub="Ingresos promedio" icono="📊" />
          <KPICard titulo="Promedio/mes" valor={fmtCOP(Math.round(promedioMensual))} sub="Proyección mensual" icono="📈" />
          <KPICard titulo="Total perfumes vendidos" valor={totalPerfumesVendidos} sub="Unidades históricas" icono="🌸" />
          <KPICard titulo="Ingresos totales" valor={fmtCOP(totalIngresos)} sub="Acumulado histórico" icono="💎" />
          <KPICard titulo="Stock bajo" valor={stockBajo} sub={stockBajo > 0 ? "Requieren reposición" : "Todo en orden"} icono="📋" />
        </section>

        <section className="dashboard-grid charts-grid">
          <ChartCard titulo="Perfumes más vendidos (Top 5)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosBarrasTop} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e2d6" />
                <XAxis type="number" tick={{ fill: "#6a6f8c", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fill: "#141a33", fontSize: 13, fontFamily: "var(--sans)" }} axisLine={false} tickLine={false} width={140} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e6e2d6", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,.1)" }}
                  formatter={(v) => [v, "Unidades"]}
                />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                  {datosBarrasTop.map((_, idx) => <Cell key={idx} fill={COLORES[idx % COLORES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard titulo="Distribución de ventas (Top 6)">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosPastel}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {datosPastel.map((_, idx) => <Cell key={idx} fill={COLORES[idx % COLORES.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e6e2d6", borderRadius: 10 }}
                  formatter={(v) => [v, "Unidades"]}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard titulo="Ventas por día (semana actual)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dias} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a227" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c9a227" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e2d6" />
                <XAxis dataKey="dia" tick={{ fill: "#6a6f8c", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6a6f8c", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e6e2d6", borderRadius: 10 }}
                  formatter={(v) => [v, "Unidades"]}
                />
                <Area type="monotone" dataKey="ventas" stroke="#c9a227" strokeWidth={2} fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard titulo="Ingresos por día (semana actual)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dias}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e2d6" />
                <XAxis dataKey="dia" tick={{ fill: "#6a6f8c", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6a6f8c", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCOP(v)} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e6e2d6", borderRadius: 10 }}
                  formatter={(v) => [fmtCOP(v), "Ingresos"]}
                />
                <Bar dataKey="ingresos" fill="#1b2a5a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard titulo="Ventas por semana (últimas 4)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={semanas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e2d6" />
                <XAxis dataKey="semana" tick={{ fill: "#6a6f8c", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6a6f8c", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e6e2d6", borderRadius: 10 }}
                  formatter={(v) => [v, "Unidades"]}
                  />
                <Line type="monotone" dataKey="ventas" stroke="#c9a227" strokeWidth={3} dot={{ r: 6, fill: "#c9a227", strokeWidth: 2 }} activeDot={{ r: 8, fill: "#fff", stroke: "#c9a227", strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard titulo="Ingresos por semana (últimas 4)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={semanas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e2d6" />
                <XAxis dataKey="semana" tick={{ fill: "#6a6f8c", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6a6f8c", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCOP(v)} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e6e2d6", borderRadius: 10 }}
                  formatter={(v) => [fmtCOP(v), "Ingresos"]}
                  />
                <Bar dataKey="ingresos" fill="#2a3a78" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="dashboard-grid stats-grid">
          <StatTable
            titulo="Estadísticas de perfumes más vendidos"
            headers={["Perfume", "Género", "Unidades", "Ingresos", "Precio unit. (100ml)", "% Total"]}
            rows={perfumes.map(p => [
              p.nombre,
              GENEROS[p.genero ?? p.perfume?.genero] ?? p.genero ?? p.perfume?.genero ?? "-",
              p.cantidad.toLocaleString(),
              fmtCOP(p.ingresos),
              fmtCOP(Number(p.precio_unitario ?? p.precio) || 0),
              `${(totalPerfumesVendidos ? (p.cantidad / totalPerfumesVendidos) * 100 : 0).toFixed(1)}%`
            ])}
          />
        </section>
    </>
  );
}