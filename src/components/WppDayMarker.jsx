import React from 'react';

const WppDayMarker = ({ timestamp }) => {
  /**
   * Formatea el timestamp a una fecha legible
   * Retorna: "Hoy", "Ayer", o la fecha completa (ej: "15 de octubre de 2025")
   */
  const formatDateMarker = (ts) => {
    if (!ts) return '';

    let date;
    // Manejar tanto timestamps en milisegundos como en segundos
    if (isNaN(new Date(ts).getTime())) {
      date = new Date(Number(ts) * 1000);
    } else {
      date = new Date(ts);
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Comparar solo las fechas (sin hora)
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return 'Hoy';
    } else if (isYesterday) {
      return 'Ayer';
    } else {
      // Formato: "15 de octubre de 2025"
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  return (
    <div className="flex justify-center py-2 pointer-events-none select-none">
      <div className="bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-full shadow-sm">
        <span className="text-xs font-semibold text-gray-600">
          {formatDateMarker(timestamp)}
        </span>
      </div>
    </div>
  );
};

export default WppDayMarker;
