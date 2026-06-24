import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useGlobalContext } from '../context/GlobalState';
import AdminSidebar from './AdminSidebar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { 
  Users, Stethoscope, Link, Building2, Activity, ShieldAlert,
  AlertTriangle, CheckCircle, Moon, Sun, Monitor, Clock, Server, Download
} from 'lucide-react';

import NotificationBell from './NotificationBell';
import AdminKPIs from './admin/AdminKPIs';
import AdminCharts from './admin/AdminCharts';
import AdminActivityLog from './admin/AdminActivityLog';
import EspecialistasTab from './admin/EspecialistasTab';
import AsignacionesTab from './admin/AsignacionesTab';
import CatalogosTab from './admin/CatalogosTab';
import UsuariosTab from './admin/UsuariosTab';
import Topbar from './Topbar'

function AdminDashboard({ onNavigate }) {
  const { userRole, userName, adminActiveTab: activeTab, setAdminActiveTab: setActiveTab } = useGlobalContext();
  const [isDark, setIsDark] = useState(false);
  
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
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    esp_licencia: '',
    esp_telf: '',
    esc_codi: '',
    esp_gner: 'M',
    ins_codi: '' 
  });
  const [asignacion, setAsignacion] = useState({ nin_codi: '', esp_codi: '' });
  const [editingEsp, setEditingEsp] = useState(null);

  // Instituciones state
  const [newInst, setNewInst] = useState({
    ins_codi: '', ins_nomb: '', ins_dire: '', ins_telf: '', ins_pers: ''
  });
  const [editingInst, setEditingInst] = useState(null);

  // Especialidades state
  const [newEspCat, setNewEspCat] = useState({
    esc_codi: '', esc_nomb: '', esc_desc: ''
  });
  const [editingEspCat, setEditingEspCat] = useState(null);

  const [activeCatalogo, setActiveCatalogo] = useState('instituciones');
  
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
    { name: '00:00', uptime: 99.9, latency: 45 },
    { name: '04:00', uptime: 99.9, latency: 42 },
    { name: '08:00', uptime: 100, latency: 60 },
    { name: '12:00', uptime: 100, latency: 85 },
    { name: '16:00', uptime: 99.9, latency: 55 },
    { name: '20:00', uptime: 100, latency: 40 },
  ];

  window.__navigate = onNavigate;

  useEffect(() => {
    if (userRole !== 'ADMIN_INSTITUCION') {
      onNavigate('login');
      return;
    }
    fetchData();
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, [userRole]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);


  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setIsDark(!isDark);
  };

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
        email: '', nombre: '', apellido: '', 
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

  const handleToggleUser = async (usu_codi, targetState) => {
    try {
      setLoading(true);
      await api.patch(`/admin/users/${usu_codi}/estado`, { activo: targetState });
      setMessage(`✅ Estado de usuario actualizado exitosamente.`);
      fetchData();
    } catch (err) {
      setMessage(`❌ Error al cambiar estado del usuario: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
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
      await api.put(`/admin/instituciones/${editingInst.ins_codi}`, editingInst);
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
      await api.post('/admin/especialidades', newEspCat);
      setMessage('✅ Especialidad registrada con éxito.');
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
  const exportEspecialistasToPDF = () => {
    const doc = new jsPDF();
    doc.text('Directorio de Especialistas - SIAT', 14, 15);
    
    const tableColumn = ["Nombre", "Especialidad", "Clínica", "Teléfono", "Estado"];
    const tableRows = [];

    especialistas.forEach(esp => {
      const especialidad = esp.tm_especi?.esc_nomb || 'General';
      const clinica = esp.tm_insti?.ins_nomb || '-';
      const prefix = esp.esp_gner === 'M' ? 'Dr.' : 'Dra.';
      const nombreCompleto = `${prefix} ${esp.esp_nomb} ${esp.esp_apel}`;
      const estado = esp.tm_usuar?.usu_estd !== false ? 'Activo' : 'Inactivo';
      tableRows.push([nombreCompleto, especialidad, clinica, esp.esp_telf || '-', estado]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save('especialistas_siat.pdf');
  };

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



  const exportAsignacionesToPDF = () => {
    const doc = new jsPDF();
    doc.text('Listado de Asignaciones - SIAT', 14, 15);
    const tableColumn = ["Paciente (ID)", "Especialista", "Fecha", "Estado"];
    const tableRows = [];
    asignaciones.forEach(asi => {
      const paciente = `${asi.tm_ninos?.nin_nomb || ''} ${asi.tm_ninos?.nin_apel || ''}`.trim();
      const pacienteInfo = paciente ? `${paciente}\n(ID: ${asi.tm_ninos?.nin_codi || ''})` : 'Desconocido';
      
      const prefix = asi.tm_espec?.esp_gner === 'M' ? 'Dr.' : 'Dra.';
      const especialista = `${prefix} ${asi.tm_espec?.esp_nomb || ''} ${asi.tm_espec?.esp_apel || ''}`.trim();
      const espInfo = especialista ? `${especialista}\n(ID: ${asi.tm_espec?.esp_codi || ''})` : 'Desconocido';
      
      tableRows.push([
        pacienteInfo,
        espInfo,
        new Date(asi.asi_inic).toLocaleDateString(),
        asi.asi_stdo
      ]);
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save('asignaciones_siat.pdf');
  };

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

  const exportEspecialidadesToPDF = () => {
    const doc = new jsPDF();
    doc.text('Directorio de Especialidades - SIAT', 14, 15);
    const tableColumn = ["Código", "Nombre", "Descripción", "Estado"];
    const tableRows = [];
    catalogos.especialidades.forEach(esc => {
      const estado = esc.esc_estd !== false ? 'Activo' : 'Inactivo';
      tableRows.push([esc.esc_codi, esc.esc_nomb, esc.esc_desc || '-', estado]);
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save('especialidades_siat.pdf');
  };

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

  // Mock data for charts
  const mockActivityData = [];

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar / Header Superior */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8 pb-12">
            
            <header className="flex flex-col gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-[#003366] dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                <Building2 className="w-6 h-6 text-[#003366] dark:text-blue-400" />
                {activeTab === 'dashboard' && 'Panel Clínico Institucional'}
                {activeTab === 'especialistas' && 'Directorio de Especialistas'}
                {activeTab === 'asignaciones' && 'Control de Casos y Asignaciones'}
                {activeTab === 'catalogos' && 'Configuración de Parámetros Clínicos'}
                {activeTab === 'infraestructura' && 'Monitoreo de Infraestructura'}
                {activeTab === 'auditoria' && 'Bitácora de Auditoría de Seguridad'}
                {activeTab === 'usuarios' && 'Control de Acceso y Cuentas de Usuario'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {activeTab === 'dashboard' && 'Visión general de la operación clínica, rendimiento de terapias y reportes de incidentes.'}
                {activeTab === 'especialistas' && 'Administración del personal de salud, acreditaciones y especialidades médicas.'}
                {activeTab === 'asignaciones' && 'Vinculación formal entre pacientes pediátricos y el personal clínico.'}
                {activeTab === 'catalogos' && 'Mantenimiento del catálogo de diagnósticos y sedes anexas.'}
                {activeTab === 'infraestructura' && 'Estado operativo de los servicios de telemetría, bases de datos y respuesta de red.'}
                {activeTab === 'auditoria' && 'Registro histórico e inmutable de eventos de seguridad y accesos clínicos.'}
                {activeTab === 'usuarios' && 'Gestión de credenciales, roles, fecha de creación y estado de activación de cuentas vinculadas.'}
              </p>
            </header>

            {message && (
              <div className={`p-4 rounded-lg text-sm font-medium flex items-center gap-2 border ${message.includes('Error') || message.includes('❌') ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-900/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/30'}`}>
                {message.includes('Error') || message.includes('❌') ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                {message.replace(/[✅❌]/g, '')}
              </div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && metricas && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <AdminKPIs metricas={metricas} />
                <AdminCharts metricas={metricas} isDark={isDark} />
                <AdminActivityLog userName={userName} logs={auditLogs} />
              </div>
            )}

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
                activeCatalogo={activeCatalogo}
                setActiveCatalogo={setActiveCatalogo}
                newEspCat={newEspCat}
                setNewEspCat={setNewEspCat}
                editingEspCat={editingEspCat}
                setEditingEspCat={setEditingEspCat}
                editingInst={editingInst}
                setEditingInst={setEditingInst}
                loading={loading}
                handleUpdateInstitucion={handleUpdateInstitucion}
                handleCreateEspecialidad={handleCreateEspecialidad}
                handleUpdateEspecialidad={handleUpdateEspecialidad}
                handleToggleEspecialidad={handleToggleEspecialidad}
              />
            )}

            {/* USUARIOS TAB */}
            {activeTab === 'usuarios' && (
              <UsuariosTab 
                usuarios={usuarios}
                loading={loading}
                handleToggleUser={handleToggleUser}
              />
            )}

            {/* AUDITORIA TAB (Resumen Clínico) */}
            {activeTab === 'auditoria' && (
              <AdminActivityLog userName={userName} logs={auditLogs} />
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

                <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm h-[400px]">
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Latencia de Red (Últimas 24h)</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tiempo de respuesta en la transmisión de datos biométricos</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={mockUptimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} dy={10} />
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

            {/* AUDITORÍA TAB */}
            {activeTab === 'auditoria' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Registro de Auditoría de Seguridad de la Institución</h3>
                      <p className="text-sm text-slate-500">Historial inmutable de eventos críticos.</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                  </div>
                  
                  <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Timestamp</th>
                          <th className="px-4 py-3 font-semibold">Nivel</th>
                          <th className="px-4 py-3 font-semibold">Evento</th>
                          <th className="px-4 py-3 font-semibold">Actor / IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {auditLogs.map((log) => {
                          const levelColors = {
                            INFO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            WARN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                            SUCCESS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                            INCIDENTE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            ASIGNACION: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          };
                          const badgeColor = levelColors[log.aud_tipo] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                          const actorEmail = log.tm_usuar?.usu_crro || "Sistema";
                          const dateStr = new Date(log.aud_time).toLocaleString();

                          return (
                            <tr key={log.aud_codi} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{dateStr}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${badgeColor}`}>{log.aud_tipo}</span></td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{log.aud_desc}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{actorEmail}<br/>{log.aud_ip || 'Interno'}</td>
                            </tr>
                          );
                        })}
                        {auditLogs.length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-slate-500">No hay registros de auditoría recientes.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* UX Confirmation Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800/60">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{modalConfig.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{modalConfig.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  modalConfig.onConfirm();
                  setModalConfig({ ...modalConfig, isOpen: false });
                }}
                className={`px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors ${modalConfig.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

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
