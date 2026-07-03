import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoPath from '../assets/Logo.png';
import siatLogoPath from '../../siat_tech_variation_2_1782859644790-removebg-preview.png';

let logoData = null;
let logoPromise = null;
let siatLogoData = null;
let siatLogoPromise = null;

const loadLogo = async () => {
  if (logoData) return logoData;
  if (logoPromise) return logoPromise;
  logoPromise = new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoPath;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        logoData = canvas.toDataURL('image/png');
        resolve(logoData);
      };
      img.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return logoPromise;
};

const loadSiatLogo = async () => {
  if (siatLogoData) return siatLogoData;
  if (siatLogoPromise) return siatLogoPromise;
  siatLogoPromise = new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = siatLogoPath;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        siatLogoData = canvas.toDataURL('image/png');
        resolve(siatLogoData);
      };
      img.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return siatLogoPromise;
};

const addLogoToDoc = async (doc, x, y, w, h) => {
  const data = await loadLogo();
  if (data) {
    try { doc.addImage(data, 'PNG', x, y, w, h); } catch {}
  }
};

const addSiatLogoToDoc = async (doc, x, y, w, h) => {
  const data = await loadSiatLogo();
  if (data) {
    try { doc.addImage(data, 'PNG', x, y, w, h); } catch {}
  }
};

const addFooter = (doc, y) => {
  doc.setDrawColor(210, 210, 210);
  doc.line(12, y, doc.internal.pageSize.width - 12, y);
  doc.setFontSize(6);
  doc.setTextColor(180, 180, 180);
  doc.text(new Date().toLocaleDateString('es-ES'), 12, y + 3);
  doc.text('SIAT — Sistema Integrado de Asistencia Terapéutica', doc.internal.pageSize.width / 2, y + 3, { align: 'center' });
};

export const createStyledPdf = async (title, filename, columns, rows, options = {}) => {
  const { landscape = true, pageTitle = title, fontSize = 7 } = options;
  const doc = new jsPDF(landscape ? 'l' : 'p', 'mm', 'letter');

  await addLogoToDoc(doc, doc.internal.pageSize.width - 28, 6, 16, 16);
  await addSiatLogoToDoc(doc, 12, 4, 16, 16);

  doc.setFontSize(14);
  doc.setTextColor(1, 28, 63);
  doc.text(pageTitle, 32, 14);
  doc.setDrawColor(1, 28, 63);
  doc.setLineWidth(0.4);
  doc.line(12, 21, doc.internal.pageSize.width - 12, 21);
  doc.setTextColor(60, 60, 60);

  const totalPages = { current: 1 };
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 26,
    margin: { left: 12, right: 12 },
    styles: { fontSize, cellPadding: 3 },
    headStyles: { fillColor: [1, 28, 63], textColor: [255, 255, 255], fontSize: fontSize + 0.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    tableLineColor: [210, 210, 210],
    tableLineWidth: 0.15,
    didDrawPage: (data) => {
      totalPages.current = data.pageCount;
      addFooter(doc, doc.internal.pageSize.height - 10);
      addLogoToDoc(doc, doc.internal.pageSize.width - 28, 6, 16, 16);
      addSiatLogoToDoc(doc, 12, 4, 16, 16);
    }
  });

  addFooter(doc, doc.lastAutoTable.finalY + 6);
  doc.save(filename);
};

export const exportEspecialistasToPDF = async (especialistas) => {
  const columns = ["Nombre", "Especialidad", "Clínica", "Teléfono", "Licencia", "Email", "Estado"];
  const rows = especialistas.map(esp => {
    const prefix = esp.esp_gner === 'M' ? 'Dr.' : 'Dra.';
    return [
      `${prefix} ${esp.esp_nomb} ${esp.esp_apel}`,
      esp.tm_especi?.esc_nomb || 'General',
      esp.tm_insti?.ins_nomb || '-',
      esp.esp_telf || '-',
      esp.esp_licencia || '-',
      esp.tm_usuar?.usu_crro || '-',
      { content: esp.tm_usuar?.usu_estd !== false ? 'Activo' : 'Inactivo', styles: { textColor: esp.tm_usuar?.usu_estd !== false ? [16, 185, 129] : [239, 68, 68], fontStyle: 'bold' } }
    ];
  });
  await createStyledPdf('Directorio de Especialistas', 'especialistas_siat.pdf', columns, rows, { pageTitle: 'Directorio de Especialistas — SIAT' });
};

export const exportAsignacionesToPDF = async (asignaciones) => {
  const columns = ["ID Paciente", "Paciente", "ID Especialista", "Especialista", "Fecha de Ingreso", "Estado"];
  const rows = asignaciones.map(asi => [
    asi.tm_ninos?.nin_codi || 'N/A',
    `${asi.tm_ninos?.nin_nomb || ''} ${asi.tm_ninos?.nin_apel || ''}`.trim() || 'Desconocido',
    asi.tm_espec?.esp_codi || 'N/A',
    `${asi.tm_espec?.esp_gner === 'M' ? 'Dr.' : 'Dra.'} ${asi.tm_espec?.esp_nomb || ''} ${asi.tm_espec?.esp_apel || ''}`.trim() || 'Desconocido',
    new Date(asi.asi_inic).toLocaleDateString('es-ES'),
    { content: asi.asi_stdo, styles: { textColor: asi.asi_stdo === 'Activo' ? [16, 185, 129] : [100, 100, 100], fontStyle: 'bold' } }
  ]);
  await createStyledPdf('Listado de Asignaciones', 'asignaciones_siat.pdf', columns, rows, { pageTitle: 'Control de Casos y Asignaciones — SIAT' });
};

export const exportEspecialidadesToPDF = async (especialidades) => {
  const columns = ["Código", "Nombre", "Descripción", "Estado"];
  const rows = especialidades.map(esc => [
    esc.esc_codi,
    esc.esc_nomb,
    esc.esc_desc || '-',
    { content: esc.esc_estd !== false ? 'Activa' : 'Inactiva', styles: { textColor: esc.esc_estd !== false ? [16, 185, 129] : [239, 68, 68], fontStyle: 'bold' } }
  ]);
  await createStyledPdf('Catálogo de Especialidades', 'especialidades_siat.pdf', columns, rows, { pageTitle: 'Catálogo de Especialidades — SIAT' });
};

export const exportHistoryToPDF = async (historicalData, title = 'Reporte de Evolución Médica') => {
  const columns = ["Fecha", "Sesiones", "Efectividad", "Notas Médicas"];
  const rows = historicalData.map(row => [
    row.fec_repo,
    row.tot_sesi ? row.tot_sesi.toString() : '0',
    { content: row.fue_efec ? 'Efectiva' : 'No Efectiva', styles: { textColor: row.fue_efec ? [16, 185, 129] : [239, 68, 68], fontStyle: 'bold' } },
    row.com_tend || 'Sin notas'
  ]);
  await createStyledPdf(title, 'reporte_evolucion_siat.pdf', columns, rows, { pageTitle: `${title} — SIAT` });
};

export const exportDashboardReport = async ({
  userName = 'Usuario',
  userRole = '',
  paciente = '',
  kpis = [],
  alerts = [],
  fechaInicio = '',
  fechaFin = '',
  titulo = 'Reporte del Dashboard'
}) => {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 12;

  const addPageHeader = async () => {
    await addLogoToDoc(doc, pageW - margin - 16, 8, 14, 14);
    await addSiatLogoToDoc(doc, margin, 6, 16, 16);
    doc.setFontSize(10);
    doc.setTextColor(1, 28, 63);
    doc.text('SIAT — Sistema Integrado de Asistencia Terapéutica', margin + 20, 12);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 12, { align: 'right' });
    doc.setDrawColor(210, 210, 210);
    doc.line(margin, 15, pageW - margin, 15);
  };

  const checkPage = (needed) => {
    if (y + needed > pageH - 20) {
      addFooter(doc, pageH - 14);
      doc.addPage();
      addPageHeader();
      y = 24;
    }
  };

  await addPageHeader();
  doc.setFontSize(18);
  doc.setTextColor(1, 28, 63);
  doc.text(titulo, margin, 28);
  doc.setDrawColor(1, 28, 63);
  doc.setLineWidth(0.6);
  doc.line(margin, 32, pageW - margin, 32);

  let y = 40;

  // ── Información del Reporte ──
  doc.setFillColor(240, 244, 248);
  doc.roundedRect(margin, y, pageW - margin * 2, paciente ? 24 : 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  let infoY = y + 4;
  doc.text(`Generado por: ${userName}`, margin + 4, infoY);
  doc.text(`Rol: ${userRole === 'ADMIN_INSTITUCION' ? 'Admin Institucional' : userRole === 'ESPECIALISTA' ? 'Especialista' : 'Representante'}`, margin + 90, infoY);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 150, infoY);
  infoY += 5;
  if (paciente) doc.text(`Paciente / Niño: ${paciente}`, margin + 4, infoY);
  if (fechaInicio && fechaFin) doc.text(`Período: ${fechaInicio} — ${fechaFin}`, margin + 90, infoY);
  y += paciente ? 30 : 24;

  // ── Resumen Ejecutivo ──
  checkPage(8);
  doc.setFontSize(12);
  doc.setTextColor(1, 28, 63);
  doc.text('Resumen Ejecutivo', margin, y);
  y += 2;
  doc.setDrawColor(1, 28, 63);
  doc.setLineWidth(0.2);
  doc.line(margin, y, margin + 40, y);
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const resumenLines = [
    `Reporte generado desde el panel de ${userRole === 'ADMIN_INSTITUCION' ? 'Administración Institucional' : userRole === 'ESPECIALISTA' ? 'Especialista Clínico' : 'Representante'}.`,
    `Total de indicadores monitoreados: ${kpis.length}. ${alerts.length > 0 ? `Alertas registradas en el período: ${alerts.length}.` : 'Sin alertas registradas en el período.'}`,
    `Este documento constituye un resumen ejecutivo de la operación y no reemplaza los registros clínicos detallados del sistema.`
  ];
  resumenLines.forEach(line => {
    checkPage(4);
    const split = doc.splitTextToSize(line, pageW - margin * 2);
    doc.text(split, margin, y);
    y += split.length * 3.5 + 1;
  });
  y += 3;

  // ── Indicadores Clave (KPIs) ──
  if (kpis.length > 0) {
    checkPage(30);
    doc.setFontSize(12);
    doc.setTextColor(1, 28, 63);
    doc.text('Indicadores Clave (KPIs)', margin, y);
    y += 2;
    doc.setDrawColor(1, 28, 63);
    doc.setLineWidth(0.2);
    doc.line(margin, y, margin + 50, y);
    y += 6;

    // KPIs in a 2-column grid
    const kpiPerRow = 2;
    const kpiW = (pageW - margin * 2 - 4) / kpiPerRow;
    for (let i = 0; i < kpis.length; i += kpiPerRow) {
      checkPage(16);
      for (let j = 0; j < kpiPerRow && i + j < kpis.length; j++) {
        const k = kpis[i + j];
        const x = margin + j * (kpiW + 4);
        doc.setFillColor(1, 28, 63);
        doc.roundedRect(x, y, kpiW, 12, 1.5, 1.5, 'F');
        doc.setFontSize(7);
        doc.setTextColor(180, 200, 230);
        doc.text(k.label, x + 3, y + 4);
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.text(k.value, x + 3, y + 10);
        doc.setFont('Helvetica', 'normal');
      }
      y += 16;
    }
    y += 4;
  }

  // ── Alertas Recientes ──
  if (alerts.length > 0) {
    const showAlerts = alerts.slice(0, 15);
    checkPage(20);
    doc.setFontSize(12);
    doc.setTextColor(1, 28, 63);
    doc.text('Alertas Recientes', margin, y);
    y += 2;
    doc.setDrawColor(180, 50, 50);
    doc.setLineWidth(0.2);
    doc.line(margin, y, margin + 40, y);
    y += 5;

    const alertCols = ['#', 'Hora', 'Descripción'];
    const alertRows = showAlerts.map((a, i) => [
      (i + 1).toString(),
      a.time || new Date(a.ale_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      a.message || a.ale_meto?.replace(/_/g, ' ') || 'Alerta registrada'
    ]);
    autoTable(doc, {
      head: [alertCols],
      body: alertRows,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: [180, 50, 50], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      tableLineColor: [210, 210, 210],
      tableLineWidth: 0.1,
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 30 } },
    });
    y = doc.lastAutoTable.finalY + 8;

    if (alerts.length > 15) {
      checkPage(6);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`* Mostrando 15 de ${alerts.length} alertas registradas.`, margin, y);
      y += 5;
    }
  }

  // ── Notas ──
  checkPage(16);
  doc.setFontSize(12);
  doc.setTextColor(1, 28, 63);
  doc.text('Notas', margin, y);
  y += 2;
  doc.setDrawColor(1, 28, 63);
  doc.setLineWidth(0.2);
  doc.line(margin, y, margin + 20, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  const notasTxt = 'Este reporte fue generado automáticamente por SIAT. Los datos aquí presentados reflejan el estado del sistema al momento de la exportación. Para mayor detalle, consulte el panel en línea.';
  const splitNotas = doc.splitTextToSize(notasTxt, pageW - margin * 2);
  doc.text(splitNotas, margin, y);
  y += splitNotas.length * 3.5 + 4;

  // ── Firma Digital ──
  checkPage(12);
  doc.setDrawColor(210, 210, 210);
  doc.line(margin, y, pageW - margin, y);
  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(`Reporte generado por: ${userName}`, margin, y);
  doc.text(`ID de exportación: EXP-${Date.now().toString(36).toUpperCase()}`, margin, y + 3);
  doc.text(`© ${new Date().getFullYear()} SIAT — Funauta. Todos los derechos reservados.`, margin, y + 6);

  addFooter(doc, Math.max(y + 10, pageH - 14));
  doc.save(`reporte_${Date.now()}.pdf`);
};
