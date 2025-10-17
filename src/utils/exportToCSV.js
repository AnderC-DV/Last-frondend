/**
 * Exporta datos a formato CSV
 * @param {Array} data - Array de objetos a exportar
 * @param {String} filename - Nombre del archivo a descargar
 * @param {Array} columns - Array con estructura [{key, label}] para definir columnas
 */
export const exportToCSV = (data, filename = 'export.csv', columns = null) => {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  // Si no se especifican columnas, usar todas las keys del primer objeto
  let cols = columns;
  if (!cols) {
    cols = Object.keys(data[0]).map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1)
    }));
  }

  // Crear encabezados
  const headers = cols.map(col => `"${col.label}"`).join(',');

  // Crear filas
  const rows = data.map(item => {
    return cols.map(col => {
      let value = item[col.key];

      // Formatear valores especiales
      if (value === null || value === undefined) {
        return '""';
      }

      // Si es una fecha, formatearla
      if (col.key.includes('fecha') || col.key.includes('Fecha')) {
        if (value instanceof Date) {
          value = value.toLocaleDateString('es-CO');
        } else if (typeof value === 'string') {
          const date = new Date(value);
          if (!isNaN(date)) {
            value = date.toLocaleDateString('es-CO');
          }
        }
      }

      // Si es número, no agregar comillas
      if (typeof value === 'number') {
        return value;
      }

      // Escapar comillas internas y envolver en comillas
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  }).join('\n');

  // Combinar headers + filas
  const csv = `${headers}\n${rows}`;

  // Crear blob y descargar
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // \uFEFF = BOM para Excel
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta datos a formato Excel (XLSX)
 * Nota: Utiliza exceljs y file-saver (npm install exceljs file-saver)
 */
export const exportToXLSX = async (data, filename = 'export.xlsx', sheetName = 'Sheet1', columns = null) => {
  try {
    // Importar dinámicamente las librerías
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');

    if (!data || data.length === 0) {
      console.warn('No hay datos para exportar');
      return false;
    }

    // Si no se especifican columnas, usar todas las keys del primer objeto
    let cols = columns;
    if (!cols) {
      cols = Object.keys(data[0]).map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1)
      }));
    }

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Agregar encabezados
    worksheet.columns = cols.map(col => ({
      header: col.label,
      key: col.key,
      width: 15
    }));

    // Formatear encabezados
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' } // Azul
    };

    // Agregar datos formateados
    data.forEach(item => {
      const row = {};
      cols.forEach(col => {
        let value = item[col.key];

        // Formatear fechas
        if (col.key.includes('fecha') || col.key.includes('Fecha')) {
          if (value instanceof Date) {
            value = value.toLocaleDateString('es-CO');
          } else if (typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date)) {
              value = date.toLocaleDateString('es-CO');
            }
          }
        }

        row[col.key] = value;
      });
      worksheet.addRow(row);
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Descargar
    saveAs(blob, filename);
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};
