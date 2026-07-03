import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useGlobalContext } from '../context/GlobalState';
import AdminSidebar from '../components/layout/AdminSidebar';
import * as XLSX from 'xlsx';
import { exportEspecialistasToPDF as expEspPDF, exportAsignacionesToPDF as expAsigPDF, exportEspecialidadesToPDF as expCatPDF } from '../utils/pdfExporter';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { 
  Building2, Activity, AlertTriangle, CheckCircle, FileText, Server, Monitor
} from 'lucide-react';

import AdminKPIs from '../components/admin/AdminKPIs';
import AdminCharts from '../components/admin/AdminCharts';
import AdminActivityLog from '../components/admin/AdminActivityLog';

import EspecialistasTab from '../components/admin/EspecialistasTab';
import AsignacionesTab from '../components/admin/AsignacionesTab';
import CatalogosTab from '../components/admin/CatalogosTab';
import UsuariosTab from '../components/admin/UsuariosTab';
import ManualUsuario from '../components/manuals/ManualUsuario';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Topbar from '../components/layout/Topbar'
import Footer from '../components/layout/Footer';
import LoadingState from '../components/dashboard/LoadingState';

function AdminDashboard({ onNavigate }) {
  const { userRole, userName, adminActiveTab: activeTab, setAdminActiveTab: setActiveTab, isDark } = useGlobalContext();
  
  const [especialistas, setEspecialistas] = useState([]);
  const [ninos, setNinos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [catalogos, setCatalogos] = useState({ especialidades: [], instituciones: [] });
  const [usuarios, setUsuarios] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // UX State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
  
  // Forms state
  const [newEsp, setNewEsp] = useState({
    esp_nomb: '',
    esp_apel: '',
    usu_crro: '',
    usu_clve: '',
    esp_licencia: '',
    esp_telf: '',
    esc_codi: '',
    esp_gner: 'M',
    ins_codi: '' 
  });
  const [asignacion, setAsignacion] = useState({ nin_codi: '', esp_codi: '' });
  const [editingEsp, setEditingEsp] = useState(null);

  const [editingInst, setEditingInst] = useState(null);

  // Especialidades state
  const [newEspCat, setNewEspCat] = useState({
    esc_codi: '', esc_nomb: '', esc_desc: ''
  });
  const [editingEspCat, setEditingEspCat] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Clinical Invitation States
  const [showRegModal, setShowRegModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [formData, setFormData] = useState({
    nin_nomb: '',
    nin_apel: '',
    nin_fnac: '',
    nin_gner: 'M',
    nin_nivd: 'Nivel 1',
    rep_nomb: '',
    rep_apel: '',
    usu_crro: ''
  });

  const mockUptimeData = [
    { name: '00:00', uptime: 99.9, latencia: 45 },
    { name: '04:00', uptime: 99.9, latencia: 42 },
    { name: '08:00', uptime: 100, latencia: 60 },
    { name: '12:00', uptime: 100, latencia: 85 },
    { name: '16:00', uptime: 99.9, latencia: 55 },
    { name: '20:00', uptime: 100, latencia: 40 },
  ];

  window.__navigate = onNavigate;

  useEffect(() => {
    if (userRole !== 'ADMIN_INSTITUCION') {
      onNavigate('login');
      return;
    }
    fetchData();
  }, [userRole]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  const fetchData = async () => {
    try {
      const [espRes, ninosRes, asignacionesRes, metricasRes, catRes, usersRes, auditRes] = await Promise.all([
        api.get('/admin/especialistas'),
        api.get('/admin/ninos'),
        api.get('/admin/asignaciones'),
        api.get('/admin/metricas'),
        api.get('/admin/catalogos'),
        api.get('/admin/users'),
        api.get('/admin/auditoria')
      ]);
      setEspecialistas(espRes.data.data);
      setNinos(ninosRes.data.data);
      setAsignaciones(asignacionesRes.data.data);
      setMetricas(metricasRes.data.data);
      setUsuarios(usersRes.data.data);
      setAuditLogs(auditRes.data.data || []);
      const catData = catRes.data.data;
      setCatalogos(catData);
      if (catData.instituciones && catData.instituciones.length > 0) {
        setNewEsp(prev => ({ ...prev, ins_codi: catData.instituciones[0].ins_codi }));
        setEditingInst(catData.instituciones[0]);
      }
    } catch (err) {
      console.error('API Error:', err.response || err);
      setMessage(`Error cargando datos del panel: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleCreateEspecialista = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.post('/admin/especialistas', newEsp);
      setMessage('✅ Especialista creado con éxito. Contraseña por defecto: SiatDoc2026*');
      setNewEsp({ 
        usu_crro: '', esp_nomb: '', esp_apel: '', usu_clve: '',
        esp_codi: '', esp_licencia: '', esp_telf: '', 
        esc_codi: '', ins_codi: catalogos.instituciones && catalogos.instituciones.length > 0 ? catalogos.instituciones[0].ins_codi : ''
      });
      fetchData();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.post('/admin/asignar', asignacion);
      setMessage('✅ Paciente asignado al especialista exitosamente.');
      setAsignacion({ nin_codi: '', esp_codi: '' });
      fetchData(); 
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/ninos/invite-representative', formData);
      const respData = res.data.data;
      setGeneratedLink(respData.invitationUrl);
      setShowRegModal(false);
      setShowLinkModal(true);
      setMessage('✅ Invitación clínica de niño y representante creada con éxito');
      setFormData({
        nin_nomb: '',
        nin_apel: '',
        nin_fnac: '',
        nin_gner: 'M',
        nin_nivd: 'Nivel 1',
        rep_nomb: '',
        rep_apel: '',
        usu_crro: ''
      });
      fetchData();
    } catch (err) {
      console.error(err);
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = (esp_codi, currentState) => {
    setModalConfig({
      isOpen: true,
      title: currentState ? 'Desactivar Especialista' : 'Activar Especialista',
      message: `¿Estás seguro de que deseas ${currentState ? 'desactivar' : 'activar'} a este especialista?`,
      type: currentState ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          await api.patch(`/admin/especialistas/${esp_codi}/estado`, { activo: !currentState });
          setMessage(`✅ Especialista ${!currentState ? 'activado' : 'desactivado'} exitosamente.`);
          fetchData();
        } catch (err) {
          setMessage(`❌ Error al cambiar estado: ${err.response?.data?.error || err.message}`);
        }
      }
    });
  };

  const handleToggleUser = (usu_codi, currentState) => {
    setModalConfig({
      isOpen: true,
      title: currentState ? 'Desactivar Usuario' : 'Activar Usuario',
      message: `¿Estás seguro de que deseas <b>${currentState ? 'desactivar' : 'activar'}</b> a este usuario?`,
      type: currentState ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          setLoading(true);
          await api.patch(`/admin/users/${usu_codi}/estado`, { activo: !currentState });
          setMessage(`✅ Estado de usuario actualizado exitosamente.`);
          fetchData();
        } catch (err) {
          setMessage(`❌ Error al cambiar estado del usuario: ${err.response?.data?.error || err.message}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleToggleAsignacion = (asi_codi, currentState) => {
    const nextState = currentState === 'Activo' ? 'Inactivo' : 'Activo';
    setModalConfig({
      isOpen: true,
      title: currentState === 'Activo' ? 'Desvincular Paciente' : 'Reactivar Asignación',
      message: `¿Deseas cambiar el estado de esta asignación a ${nextState}?`,
      type: currentState === 'Activo' ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          await api.patch(`/admin/asignaciones/${asi_codi}/estado`, { estado: nextState });
          setMessage(`✅ Asignación marcada como ${nextState}.`);
          fetchData();
        } catch (err) {
          setMessage(`❌ Error al modificar asignación: ${err.response?.data?.error || err.message}`);
        }
      }
    });
  };

  const handleUpdateEsp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/especialistas/${editingEsp.esp_codi}`, {
        esp_nomb: editingEsp.esp_nomb,
        esp_apel: editingEsp.esp_apel,
        usu_crro: editingEsp.usu_crro
      });
      setMessage('✅ Especialista actualizado con éxito.');
      setEditingEsp(null);
      fetchData();
    } catch (err) {
      setMessage(`❌ Error al actualizar: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInstitucion = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const codi = editingInst?.ins_codi || catalogos.instituciones?.[0]?.ins_codi;
      await api.put(`/admin/instituciones/${codi}`, {
        ins_codi: editingInst.ins_codi,
        ins_nomb: editingInst.ins_nomb,
        ins_dire: editingInst.ins_dire,
        ins_telf: editingInst.ins_telf,
        ins_pers: editingInst.ins_pers
      });
      setMessage('✅ Institución actualizada con éxito.');
      setEditingInst(null);
      fetchData();
    } catch (err) {
      setMessage(`❌ Error al actualizar: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEspecialidad = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const esc_codi = `ESP-${Date.now()}`;
      await api.post('/admin/especialidades', { ...newEspCat, esc_codi });
      setMessage(`✅ Especialidad registrada con éxito. Código: ${esc_codi}`);
      setNewEspCat({ esc_codi: '', esc_nomb: '', esc_desc: '' });
      fetchData();
    } catch (err) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEspecialidad = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/especialidades/${editingEspCat.esc_codi}`, editingEspCat);
      setMessage('✅ Especialidad actualizada con éxito.');
      setEditingEspCat(null);
      fetchData();
    } catch (err) {
      setMessage(`❌ Error al actualizar: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEspecialidad = (esc_codi, currentState) => {
    const nextState = currentState !== false;
    setModalConfig({
      isOpen: true,
      title: nextState ? 'Desactivar Especialidad' : 'Activar Especialidad',
      message: `¿Estás seguro de que deseas ${nextState ? 'desactivar' : 'activar'} esta especialidad?`,
      type: nextState ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          await api.patch(`/admin/especialidades/${esc_codi}/estado`, { activo: !nextState });
          setMessage(`✅ Especialidad ${!nextState ? 'activada' : 'desactivada'} exitosamente.`);
          fetchData();
        } catch (err) {
          setMessage(`❌ Error al cambiar estado: ${err.response?.data?.error || err.message}`);
        }
      }
    });
  };

  // Export Functions
  const exportEspecialistasToPDF = () => expEspPDF(especialistas);
  const exportEspecialistasToExcel = () => {
    const data = especialistas.map(esp => ({
      'Código': esp.esp_codi,
      'Nombre': `${esp.esp_gner === 'M' ? 'Dr.' : 'Dra.'} ${esp.esp_nomb} ${esp.esp_apel}`,
      'Especialidad': esp.tm_especi?.esc_nomb || 'General',
      'Clínica': esp.tm_insti?.ins_nomb || '-',
      'Teléfono': esp.esp_telf || '-',
      'Licencia': esp.esp_licencia || '-',
      'Email': esp.tm_usuar?.usu_crro || '-',
      'Estado': esp.tm_usuar?.usu_estd !== false ? 'Activo' : 'Inactivo'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Especialistas");
    XLSX.writeFile(workbook, "especialistas_siat.xlsx");
  };

  const exportAsignacionesToPDF = () => expAsigPDF(asignaciones);
  const exportAsignacionesToExcel = () => {
    const data = asignaciones.map(asi => ({
      'ID Paciente': asi.tm_ninos?.nin_codi || 'N/A',
      'Paciente': `${asi.tm_ninos?.nin_nomb || ''} ${asi.tm_ninos?.nin_apel || ''}`.trim() || 'Desconocido',
      'ID Especialista': asi.tm_espec?.esp_codi || 'N/A',
      'Especialista': `${asi.tm_espec?.esp_gner === 'M' ? 'Dr.' : 'Dra.'} ${asi.tm_espec?.esp_nomb || ''} ${asi.tm_espec?.esp_apel || ''}`.trim() || 'Desconocido',
      'Fecha': new Date(asi.asi_inic).toLocaleDateString(),
      'Estado': asi.asi_stdo
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asignaciones");
    XLSX.writeFile(workbook, "asignaciones_siat.xlsx");
  };

  const exportEspecialidadesToPDF = () => expCatPDF(catalogos.especialidades);

  const exportEspecialidadesToExcel = () => {
    const data = catalogos.especialidades.map(esc => ({
      'Código': esc.esc_codi,
      'Nombre': esc.esc_nomb,
      'Descripción': esc.esc_desc || '-',
      'Estado': esc.esc_estd !== false ? 'Activo' : 'Inactivo'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Especialidades");
    XLSX.writeFile(workbook, "especialidades_siat.xlsx");
  };

  const exportUsuariosToPDF = async () => {
    const { createStyledPdf } = await import('../utils/pdfExporter')
    const getName = (user) => {
      if (user.rol_codi === 'ROL_ESP' && user.tm_espec) return `${user.tm_espec.esp_gner === 'M' ? 'Dr.' : 'Dra.'} ${user.tm_espec.esp_nomb} ${user.tm_espec.esp_apel}`
      if (user.rol_codi === 'ROL_REP' && user.tm_repre) return `${user.tm_repre.rep_nomb} ${user.tm_repre.rep_apel}`
      if (user.rol_codi === 'ROL_ADM' && user.tm_admin) return `${user.tm_admin.adm_nomb} ${user.tm_admin.adm_apel}`
      return 'Administrador Global / Director'
    }
    const getRol = (codi) => codi === 'ROL_ADM' ? 'Administrador' : codi === 'ROL_ESP' ? 'Especialista' : codi === 'ROL_REP' ? 'Representante' : 'Otro'
    const columns = ['Nombre', 'Correo', 'Rol', 'Creación', 'Último Acceso', 'Estado']
    const rows = usuarios.map(u => [
      getName(u),
      u.usu_crro || '-',
      getRol(u.rol_codi),
      u.usu_crea ? new Date(u.usu_crea).toLocaleDateString('es-ES') : '-',
      u.usu_logi ? new Date(u.usu_logi).toLocaleDateString('es-ES') : 'Nunca',
      { content: u.usu_estd !== false ? 'Activo' : 'Inactivo', styles: { textColor: u.usu_estd !== false ? [16, 185, 129] : [239, 68, 68], fontStyle: 'bold' } }
    ])
    await createStyledPdf('Usuarios del Sistema', 'usuarios_siat.pdf', columns, rows, { pageTitle: 'Usuarios del Sistema — SIAT' })
  }

  const exportUsuariosToExcel = () => {
    const getName = (user) => {
      if (user.rol_codi === 'ROL_ESP' && user.tm_espec) return `${user.tm_espec.esp_gner === 'M' ? 'Dr.' : 'Dra.'} ${user.tm_espec.esp_nomb} ${user.tm_espec.esp_apel}`
      if (user.rol_codi === 'ROL_REP' && user.tm_repre) return `${user.tm_repre.rep_nomb} ${user.tm_repre.rep_apel}`
      if (user.rol_codi === 'ROL_ADM' && user.tm_admin) return `${user.tm_admin.adm_nomb} ${user.tm_admin.adm_apel}`
      return 'Administrador Global / Director'
    }
    const getRol = (codi) => codi === 'ROL_ADM' ? 'Administrador' : codi === 'ROL_ESP' ? 'Especialista' : codi === 'ROL_REP' ? 'Representante' : 'Otro'
    const data = usuarios.map(u => ({
      'Nombre': getName(u),
      'Correo': u.usu_crro || '-',
      'Rol': getRol(u.rol_codi),
      'Creación': u.usu_crea ? new Date(u.usu_crea).toLocaleDateString('es-ES') : '-',
      'Último Acceso': u.usu_logi ? new Date(u.usu_logi).toLocaleDateString('es-ES') : 'Nunca',
      'Estado': u.usu_estd !== false ? 'Activo' : 'Inactivo'
    }))
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios")
    XLSX.writeFile(workbook, "usuarios_siat.xlsx")
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar / Header Superior */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8 pb-12">
            
            <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                  <Building2 className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  {activeTab === 'dashboard' && 'Panel Clínico Institucional'}
                  {activeTab === 'especialistas' && 'Directorio de Especialistas'}
                  {activeTab === 'asignaciones' && 'Control de Casos y Asignaciones'}
                  {activeTab === 'catalogos' && 'Configuración de Mi Fundación'}
                  {activeTab === 'infraestructura' && 'Monitoreo de Infraestructura'}
                  {activeTab === 'usuarios' && 'Control de Acceso y Cuentas de Usuario'}
                  {activeTab === 'manual' && 'Manual de Usuario'}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {activeTab === 'dashboard' && 'Visión general de la operación clínica, rendimiento de terapias y reportes de incidentes.'}
                  {activeTab === 'especialistas' && 'Administración del personal de salud, acreditaciones y especialidades médicas.'}
                  {activeTab === 'asignaciones' && 'Vinculación formal entre pacientes pediátricos y el personal clínico.'}
                  {activeTab === 'catalogos' && 'Datos de la institución: RIF, dirección y contacto principal.'}
                  {activeTab === 'infraestructura' && 'Estado operativo de los servicios de telemetría, bases de datos y respuesta de red.'}
                  {activeTab === 'usuarios' && 'Gestión de credenciales, roles, fecha de creación y estado de activación de cuentas vinculadas.'}
                  {activeTab === 'manual' && 'Guía de referencia completa del módulo de administrador SIAT.'}
                </p>
              </div>
              {activeTab === 'dashboard' && (
                <button
                  onClick={async () => {
                    try {
                      const { exportDashboardReport } = await import('../utils/pdfExporter')
                      const alertsFromLogs = auditLogs
                        .filter(log => log.aud_tipo === 'INCIDENTE' || log.aud_tipo === 'WARN')
                        .slice(0, 20)
                        .map(log => ({
                          time: new Date(log.aud_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                          message: log.aud_desc
                        }))
                      const totalCrisis = metricas?.totalCrisis || 0
                      await exportDashboardReport({
                        userName,
                        userRole,
                        kpis: [
                          { label: 'Especialistas', value: especialistas.length.toString() },
                          { label: 'Pacientes', value: ninos.length.toString() },
                          { label: 'Asignaciones Activas', value: asignaciones.filter(a => a.asi_stdo === 'Activo').length.toString() },
                          { label: 'Usuarios del Sistema', value: usuarios.length.toString() },
                          ...(totalCrisis > 0 ? [{ label: 'Incidentes (Mes)', value: totalCrisis.toString() }] : []),
                        ],
                        alerts: alertsFromLogs,
                        titulo: 'Reporte del Dashboard — Administración',
                      })
                    } catch (err) {
                      console.error('Error al exportar:', err)
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-2 text-sm shrink-0"
                >
                  <FileText className="w-4 h-4" /> Exportar Dashboard
                </button>
              )}
            </header>

            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium flex items-center gap-2 border ${message.includes('Error') || message.includes('❌') ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-900/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/30'}`}>
                {message.includes('Error') || message.includes('❌') ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                {message.replace(/[✅❌]/g, '')}
              </div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (metricas ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <AdminKPIs metricas={metricas} />
                <AdminCharts metricas={metricas} isDark={isDark} />
                <AdminActivityLog userName={userName} logs={auditLogs} />
              </div>
            ) : (
              <LoadingState variant="dashboard" role="ADMIN_INSTITUCION" />
            ))}

            {/* ESPECIALISTAS TAB */}
            {activeTab === 'especialistas' && (
              <EspecialistasTab
                especialistas={especialistas}
                catalogos={catalogos}
                newEsp={newEsp}
                setNewEsp={setNewEsp}
                editingEsp={editingEsp}
                setEditingEsp={setEditingEsp}
                loading={loading}
                handleCreateEspecialista={handleCreateEspecialista}
                handleUpdateEsp={handleUpdateEsp}
                handleToggleActivo={handleToggleActivo}
                exportEspecialistasToPDF={exportEspecialistasToPDF}
                exportEspecialistasToExcel={exportEspecialistasToExcel}
                newEspCat={newEspCat}
                setNewEspCat={setNewEspCat}
                editingEspCat={editingEspCat}
                setEditingEspCat={setEditingEspCat}
                handleCreateEspecialidad={handleCreateEspecialidad}
                handleUpdateEspecialidad={handleUpdateEspecialidad}
                handleToggleEspecialidad={handleToggleEspecialidad}
              />
            )}

            {/* ASIGNACIONES TAB */}
            {activeTab === 'asignaciones' && (
              <AsignacionesTab
                asignacion={asignacion}
                setAsignacion={setAsignacion}
                ninos={ninos}
                especialistas={especialistas}
                asignaciones={asignaciones}
                loading={loading}
                handleAssign={handleAssign}
                handleToggleAsignacion={handleToggleAsignacion}
                exportAsignacionesToPDF={exportAsignacionesToPDF}
                exportAsignacionesToExcel={exportAsignacionesToExcel}
                onRegisterClick={() => setShowRegModal(true)}
              />
            )}

            {/* CATALOGOS TAB */}
            {activeTab === 'catalogos' && (
              <CatalogosTab
                catalogos={catalogos}
                editingInst={editingInst}
                setEditingInst={setEditingInst}
                loading={loading}
                handleUpdateInstitucion={handleUpdateInstitucion}
                exportEspecialidadesToPDF={exportEspecialidadesToPDF}
                exportEspecialidadesToExcel={exportEspecialidadesToExcel}
              />
            )}

            {/* USUARIOS TAB */}
            {activeTab === 'usuarios' && (
              <UsuariosTab 
                usuarios={usuarios}
                loading={loading}
                handleToggleUser={handleToggleUser}
                exportUsuariosToPDF={exportUsuariosToPDF}
                exportUsuariosToExcel={exportUsuariosToExcel}
              />
            )}

            {/* MANUAL TAB */}
            {activeTab === 'manual' && (
              <ManualUsuario />
            )}



            {/* INFRAESTRUCTURA TAB */}
            {activeTab === 'infraestructura' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <Server className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado API Core</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">Operativo (100%)</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nodos Edge (Telemetría)</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">Activos</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Latencia Promedio</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">48 ms</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm h-[300px] lg:h-[400px]">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Latencia de Red (Últimas 24h)</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tiempo de respuesta en la transmisión de datos biométricos</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={mockUptimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#fff', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '12px' }} 
                      />
                      <Line type="monotone" dataKey="latencia" stroke="#8B5CF6" strokeWidth={3} dot={{r: 4, fill: '#8B5CF6'}} name="Latencia (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>
          <Footer />
        </div>
      </main>

      <ConfirmDialog
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm || (() => {})}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      {/* MODAL: Registrar Niño & Invitar Representante */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#034EA1] text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Registrar Niño e Invitar Representante</h3>
              <button onClick={() => setShowRegModal(false)} className="text-white/80 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b pb-1">Información del Paciente (Niño)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombres</label>
                  <input required type="text" value={formData.nin_nomb} onChange={e => setFormData({...formData, nin_nomb: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Juanito" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellidos</label>
                  <input required type="text" value={formData.nin_apel} onChange={e => setFormData({...formData, nin_apel: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Pérez" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">F. Nacimiento</label>
                  <input required type="date" value={formData.nin_fnac} onChange={e => setFormData({...formData, nin_fnac: e.target.value})} className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Género</label>
                  <select value={formData.nin_gner} onChange={e => setFormData({...formData, nin_gner: e.target.value})} className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nivel TEA</label>
                  <select value={formData.nin_nivd} onChange={e => setFormData({...formData, nin_nivd: e.target.value})} className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    <option value="Nivel 1">Nivel 1 (Leve)</option>
                    <option value="Nivel 2">Nivel 2 (Moderado)</option>
                    <option value="Nivel 3">Nivel 3 (Severo)</option>
                  </select>
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b pb-1 pt-2">Información de la Invitación (Representante)</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombres Padre/Madre</label>
                  <input required type="text" value={formData.rep_nomb} onChange={e => setFormData({...formData, rep_nomb: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Carlos" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellidos Padre/Madre</label>
                  <input required type="text" value={formData.rep_apel} onChange={e => setFormData({...formData, rep_apel: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Pérez" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Correo Electrónico (Representante)</label>
                <input required type="email" value={formData.usu_crro} onChange={e => setFormData({...formData, usu_crro: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="correo@repre.com" />
                <p className="text-[10px] text-slate-400 mt-1">El sistema pre-registrará al representante y le enviará un enlace de activación por correo.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowRegModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{loading ? 'Procesando...' : 'Crear Registro'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Enlace de Activación Generado (Demo Fallback) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">¡Invitación Clínica Creada!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Se ha generado el token de activación clínico. Copie el siguiente enlace y envíelo al representante para que configure su cuenta:
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs select-all break-all text-left max-h-[80px] overflow-y-auto">
                {generatedLink}
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    setMessage('📋 Enlace copiado al portapapeles');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"
                >
                  Copiar Enlace
                </button>
                <button 
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-sm font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
