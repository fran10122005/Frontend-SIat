export const aacQuickWords = [
  { label: 'Comer', emoji: '🍽️' },
  { label: 'Beber', emoji: '🥤' },
  { label: 'Baño', emoji: '🚽' },
  { label: 'Ayuda', emoji: '🤝' },
  { label: 'No quiero', emoji: '🛑' },
  { label: 'Abrazo', emoji: '🤗' }
]

export const generateInitialData = () => {
  const data = []
  const now = new Date()
  for (let i = 9; i >= 0; i--) {
    const timeStr = new Date(now.getTime() - i * 5000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const bpmVal = Math.floor(Math.random() * (80 - 70 + 1) + 70)
    const movVal = Number((Math.random() * (2.0 - 0.8) + 0.8).toFixed(1))
    const stressVal = Math.round(Math.random() * 20 + 10)
    data.push({
      time: timeStr.substring(3),
      bpm: bpmVal,
      mov: movVal,
      stress: stressVal,
      calma: 100 - stressVal,
      estres: stressVal
    })
  }
  return data
}
