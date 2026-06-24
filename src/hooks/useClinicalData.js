import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

export function useClinicalData() {
  const [alertsList, setAlertsList] = useState([])
  const [chartDataList, setChartDataList] = useState([])
  const [loadingClinical, setLoadingClinical] = useState(false)

  const fetchClinicalData = useCallback(async () => {
    try {
      setLoadingClinical(true)
      const [alertsRes, chartRes] = await Promise.all([
        api.get('/reportes/alertas-representante'),
        api.get('/reportes/evolucion-representante')
      ])
      setAlertsList(alertsRes.data.data || [])
      setChartDataList(chartRes.data.data || [])
    } catch (err) {
      console.error('Error al cargar datos clínicos:', err)
    } finally {
      setLoadingClinical(false)
    }
  }, [])

  useEffect(() => {
    fetchClinicalData()
  }, [fetchClinicalData])

  return { alertsList, chartDataList, loadingClinical, fetchClinicalData }
}
