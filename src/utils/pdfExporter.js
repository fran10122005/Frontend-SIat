import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoPath from '../../Logo.png';
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

const addHeader = async (doc, title, pageNum, totalPages) => {
  await addLogoToDoc(doc, doc.internal.pageSize.width - 28, 6, 16, 16);
  await addSiatLogoToDoc(doc, 12, 4, 16, 16);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`SIAT — ${title}`, 32, 12);
  if (pageNum && totalPages) {
    doc.text(`${pageNum} / ${totalPages}`, doc.internal.pageSize.width - 12, 12, { align: 'right' });
  }
  doc.setDrawColor(210, 210, 210);
  doc.line(12, 14, doc.internal.pageSize.width - 12, 14);
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
