import React from "react";

const metrics = [
  {
    title: "Campañas Activas",
    value: 5,
    icon: "💬",
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Mensajes Enviados (Mes)",
    value: "18,420",
    icon: "📈",
    color: "bg-green-100 text-green-700",
  },
  {
    title: "Tasa de Entrega Promedio",
    value: "92.8%",
    icon: "📬",
    color: "bg-purple-100 text-purple-700",
  },
  {
    title: "Próximas Programadas",
    value: 3,
    icon: "📅",
    color: "bg-orange-100 text-orange-700",
  },
];

export default function DashboardMetrics() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((m) => (
        <div
          key={m.title}
          className={`flex items-center p-6 rounded-xl shadow-sm ${m.color} transition hover:scale-105 duration-200`}
        >
          <span className="text-3xl mr-4">{m.icon}</span>
          <div>
            <div className="text-lg font-semibold">{m.title}</div>
            <div className="text-2xl font-bold">{m.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
