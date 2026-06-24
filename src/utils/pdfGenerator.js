import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportHistoryToPDF = (historicalData, title = 'Reporte de Evolución Médica - SIAT') => {
  const doc = new jsPDF()
  doc.text(title, 14, 15)
  
  const tableColumn = ["Fecha", "Sesiones", "Efectividad", "Notas Médicas"]
  const tableRows = []
  
  historicalData.forEach(row => {
    tableRows.push([
      row.fec_repo,
      row.tot_sesi ? row.tot_sesi.toString() : '0',
      row.fue_efec ? 'Efectiva' : 'No Efectiva',
      row.com_tend || 'Sin notas'
    ])
  })
  
  autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 })
  doc.save('reporte_evolucion_siat.pdf')
}
