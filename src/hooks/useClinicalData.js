import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useGlobalContext } from "../context/GlobalState";

export function useClinicalData() {
  const { selectedChildId } = useGlobalContext();
  const [alertsList, setAlertsList] = useState([]);
  const [chartDataList, setChartDataList] = useState([]);
  const [loadingClinical, setLoadingClinical] = useState(false);

  const fetchClinicalData = useCallback(async () => {
    try {
      setLoadingClinical(true);
      const query = selectedChildId ? `?nin_codi=${selectedChildId}` : "";
      const [alertsRes, chartRes] = await Promise.all([
        api.get(`/reportes/alertas-representante${query}`),
        api.get(`/reportes/evolucion-representante${query}`),
      ]);
      setAlertsList(alertsRes.data.data || []);
      setChartDataList(chartRes.data.data || []);
    } catch (err) {
      console.error("Error al cargar datos clínicos:", err);
    } finally {
      setLoadingClinical(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchClinicalData();
  }, [fetchClinicalData]);

  return { alertsList, chartDataList, loadingClinical, fetchClinicalData };
}
