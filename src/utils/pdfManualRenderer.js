import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoPath from "../assets/Logo.png";

const BRAND = [20, 44, 89];
const ACCENT = [37, 99, 235];
const TEXT = [51, 65, 85];
const MUTED = [100, 116, 139];

async function loadLogo() {
  try {
    const img = new Image();
    img.src = logoPath;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("Logo no disponible para PDF:", e);
    return null;
  }
}

/**
 * Renderiza un manual de usuario en un PDF limpio y profesional.
 *
 * @param {Array} secciones  Estructura de secciones con bloques: texto, subtitulo,
 *                           lista, pasos, nota, tabla.
 * @param {string} modulo    Nombre del módulo (Representante, Especialista, Administrador).
 * @param {string} filename  Nombre del archivo PDF a descargar.
 */
export async function renderManualPDF(secciones, modulo, filename) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const contentW = pageW - margin * 2;
  const maxY = 282;
  const headerH = 18;
  const bodyY = headerH + 6;
  const lineH = 4.6;

  const logoData = await loadLogo();
  let sectionTitle = "";
  let yy = bodyY;

  const addHeader = () => {
    if (logoData) {
      doc.addImage(logoData, "PNG", pageW - margin - 16, 4, 16, 16);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND);
    doc.text("SIAT — Manual de Usuario", margin, 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`Módulo del ${modulo} | ${sectionTitle}`, margin, 14);
    doc.setDrawColor(225, 228, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, 16.5, pageW - margin, 16.5);
  };

  const addFooter = (num, total) => {
    doc.setDrawColor(225, 228, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, 289, pageW - margin, 289);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`${num} / ${total}`, pageW - margin, 293, { align: "right" });
  };

  const checkPage = (needed) => {
    if (yy + needed > maxY) {
      doc.addPage();
      addHeader();
      yy = bodyY;
    }
  };

  const renderTexto = (valor) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    const lines = doc.splitTextToSize(valor, contentW);
    lines.forEach((line) => {
      checkPage(lineH);
      doc.text(line, margin, yy);
      yy += lineH;
    });
    yy += 1.5;
  };

  const renderSub = (valor) => {
    checkPage(9);
    yy += 1.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND);
    doc.text(valor, margin, yy);
    const w = doc.getTextWidth(valor);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.4);
    doc.line(margin, yy + 1, margin + w, yy + 1);
    yy += 6;
    doc.setTextColor(...TEXT);
  };

  const renderLista = (items, prefix = "•") => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(`${prefix} ${item}`, contentW - 5);
      lines.forEach((line) => {
        checkPage(lineH);
        doc.text(line, margin + 5, yy);
        yy += lineH;
      });
      yy += 0.8;
    });
    yy += 1.5;
  };

  const renderPasos = (items) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT);
    items.forEach((item, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${item}`, contentW - 5);
      lines.forEach((line) => {
        checkPage(lineH);
        doc.text(line, margin + 5, yy);
        yy += lineH;
      });
      yy += 0.8;
    });
    yy += 1.5;
  };

  const renderNota = (bloque) => {
    const label =
      bloque.variante === "warning"
        ? "Importante: "
        : bloque.variante === "danger"
          ? "Advertencia: "
          : bloque.variante === "success"
            ? "Consejo: "
            : "Nota: ";
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(label + bloque.valor, contentW - 5);
    lines.forEach((line) => {
      checkPage(lineH + 1);
      doc.text(line, margin + 5, yy);
      yy += lineH + 1;
    });
    yy += 1.5;
    doc.setTextColor(...TEXT);
  };

  const renderTabla = (bloque) => {
    if (!bloque.filas || !bloque.filas.length) return;
    try {
      const colCount = bloque.encabezados.length;
      const colW = contentW / colCount;
      autoTable(doc, {
        head: [bloque.encabezados],
        body: bloque.filas,
        startY: Math.min(yy, maxY - 12),
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: TEXT,
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: BRAND,
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: "bold",
          lineWidth: 0,
        },
        alternateRowStyles: { fillColor: [247, 249, 252] },
        columnStyles: Object.fromEntries(
          bloque.encabezados.map((_, i) => [i, { cellWidth: colW }]),
        ),
        didDrawPage: () => {
          addHeader();
        },
      });
      yy = doc.lastAutoTable.finalY + 5;
    } catch (e) {
      yy += 3;
    }
  };

  const renderBloque = (bloque) => {
    checkPage(3);
    switch (bloque.tipo) {
      case "texto":
        renderTexto(bloque.valor);
        break;
      case "subtitulo":
        renderSub(bloque.valor);
        break;
      case "lista":
        renderLista(bloque.items);
        break;
      case "pasos":
        renderPasos(bloque.items);
        break;
      case "nota":
        renderNota(bloque);
        break;
      case "tabla":
        renderTabla(bloque);
        break;
      default:
        break;
    }
  };

  const renderTituloSeccion = (sec) => {
    checkPage(14);
    yy += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BRAND);
    doc.text(sec.titulo.toUpperCase(), margin, yy);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.6);
    doc.line(margin, yy + 1.5, pageW - margin, yy + 1.5);
    yy += 6.5;
    doc.setTextColor(...TEXT);
    sectionTitle = sec.titulo;
  };

  // ---- PORTADA ----
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setTextColor(255, 255, 255);
  if (logoData) {
    doc.addImage(logoData, "PNG", pageW / 2 - 18, 48, 36, 36);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("Manual de Usuario", pageW / 2, 118, { align: "center" });
  doc.setFontSize(16);
  doc.setTextColor(216, 224, 240);
  doc.text(`Módulo del ${modulo}`, pageW / 2, 130, { align: "center" });
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.line(pageW / 2 - 30, 138, pageW / 2 + 30, 138);
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "SIAT — Sistema Inteligente de Acompañamiento Terapéutico",
    pageW / 2,
    150,
    { align: "center" },
  );
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 230);
  doc.text(
    `Versión 1.0 — ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
    pageW / 2,
    162,
    { align: "center" },
  );
  doc.text("Funauta — Fundación de Apoyo al Autista", pageW / 2, 178, {
    align: "center",
  });

  // ---- ÍNDICE ----
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BRAND);
  doc.text("Índice de Contenidos", margin, 24);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.5);
  doc.line(margin, 27, pageW - margin, 27);
  let y = 36;
  doc.setFont("helvetica", "normal");
  secciones.forEach((sec, i) => {
    if (y > 275) {
      doc.addPage();
      y = 22;
    }
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(String(i + 1).padStart(2, "0"), margin, y);
    doc.setFont("helvetica", "bold");
    doc.text(sec.titulo, margin + 9, y);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.text(sec.descripcion, margin + 9, y + 4);
    doc.setTextColor(...TEXT);
    y += 11;
  });

  // ---- CONTENIDO ----
  doc.addPage();
  addHeader();
  yy = bodyY;

  secciones.forEach((sec) => {
    renderTituloSeccion(sec);
    sec.contenido.forEach((bloque) => renderBloque(bloque));
    yy += 3;
  });

  // Numeración final de páginas
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    addFooter(p, total);
  }

  doc.save(filename);
}
