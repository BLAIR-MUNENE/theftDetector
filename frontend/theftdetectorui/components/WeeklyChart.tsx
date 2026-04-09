"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = { data: number[] };

export default function WeeklyChart({ data }: Props) {
  const labels = ["-6d", "-5d", "-4d", "-3d", "-2d", "-1d", "Today"];
  const chartData = labels.map((day, i) => ({ day, alerts: data[i] ?? 0 }));

  return (
    <div className="h-56 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-xl sm:h-64 sm:p-4">
      <p className="font-label mb-3 text-sm font-medium uppercase tracking-wide text-muted">Alerts - 7 days</p>
      <div className="h-[165px] w-full min-w-0 sm:h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: "rgb(110 120 145)", fontSize: 11 }} axisLine={{ stroke: "rgba(45,50,70,0.8)" }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "rgb(110 120 145)", fontSize: 11 }} axisLine={{ stroke: "rgba(45,50,70,0.8)" }} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(18,20,26,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
              labelStyle={{ color: "rgb(220,222,232)" }}
              itemStyle={{ color: "rgb(255,107,0)" }}
              cursor={{ fill: "rgba(255,107,0,0.06)" }}
            />
            <Bar dataKey="alerts" fill="rgb(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
