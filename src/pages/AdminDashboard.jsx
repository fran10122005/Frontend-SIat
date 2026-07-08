import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useGlobalContext } from '../context/GlobalState';
import AdminSidebar from '../components/layout/AdminSidebar';
import * as XLSX from 'xlsx';
import { exportEspecialistasToPDF as expEspPDF, exportAsignacionesToPDF as expAsigPDF, exportEspecialidadesToPDF as expCatPDF } from '../utils/pdfExporter';
import { 
  Building2, FileText, ShieldAlert, Users, Stethoscope, Link2, Clock
} from 'lucide-react';

import AdminKPIs from '../components/admin/AdminKPIs';
import AdminCharts from '../components/admin/AdminCharts';
import AdminActivityLog from '../components/admin/AdminActivityLog';
import InfraestructuraTab from '../components/admin/InfraestructuraTab';

import EspecialistasTab from '../components/admin/EspecialistasTab';
import RepresentantesTab from '../components/admin/RepresentantesTab';
import AsignacionesTab from '../components/admin/AsignacionesTab';
import CatalogosTab from '../components/admin/CatalogosTab';
import UsuariosTab from '../components/admin/UsuariosTab';
import ManualUsuario from '../components/manuals/ManualUsuario';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import Topbar from '../components/layout/Topbar'
import Footer from '../components/layout/Footer';
import LoadingState from '../components/dashboard/LoadingState';

function AdminDashboard({ onNavigate }) {
  const { userRole, userName, adminActiveTab: activeTab, setAdminActiveTab: setActiveTab, isDark, showToast } = useGlobalContext();
  
  const [especialistas, setEspecialistas] = useState([]);
  const [ninos, setNinos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [catalogos, setCatalogos] = useState({ especialidades: [], instituciones: [] });
  const [usuarios, setUsuarios] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
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
  
  // Clinical Invitation States
  const [showRegModal, setShowRegModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState(() => {
    const saved = localStorage.getItem('reportSchedule')
    return saved ? JSON.parse(saved) : { enabled: false, frequency: 'weekly', day: 'monday', email: '' }
  });
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

  const mountedRef = useRef(true);

  useEffect(() => {
    if (userRole !== 'ADMIN_INSTITUCION') {
      onNavigate('login');
      return;
    }
    mountedRef.current = true;
    const controller = new AbortController();
    fetchData(controller);
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [userRole]);

  const fetchData = async (controller) => {
    try {
      const [espRes, ninosRes, asignacionesRes, metricasRes, catRes, usersRes, auditRes] = await Promise.all([
        api.get('/admin/especialistas', { signal: controller?.signal }),
        api.get('/admin/ninos', { signal: controller?.signal }),
        api.get('/admin/asignaciones', { signal: controller?.signal }),
        api.get('/admin/metricas', { signal: controller?.signal }),
        api.get('/admin/catalogos', { signal: controller?.signal }),
        api.get('/admin/users', { signal: controller?.signal }),
        api.get('/admin/auditoria', { signal: controller?.signal }),
      ]);
      if (!mountedRef.current) return;
      setEspecialistas(espRes.data.data);
      setNinos(ninosRes.data.data);
      setAsignaciones(asignacionesRes.data.data);
      setMetricas(metricasRes.data.data);
      setUsuarios(usersRes.data.data);
      setAuditLogs(auditRes.data.data || []);
      setRepresentantes(usersRes.data.data.filter(u => u.rol_codi === 'ROL_REP').map(u => ({
        ...u.tm_repre,
        usu_codi: u.usu_codi,
        usu_crro: u.usu_crro,
        usu_estd: u.usu_estd,
        tm_ninos: u.tm_repre?.tm_ninos || null,
      })));
      const catData = catRes.data.data;
      setCatalogos(catData);
      if (catData.instituciones && catData.instituciones.length > 0) {
        setNewEsp(prev => ({ ...prev, ins_codi: catData.instituciones[0].ins_codi }));
        setEditingInst(catData.instituciones[0]);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('API Error:', err.response || err);
      showToast(`Error cargando datos del panel: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleCreateEspecialista = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Mapear los campos del formulario a los que espera el backend
      const payload = {
        nombre: newEsp.esp_nomb,
        apellido: newEsp.esp_apel,
        email: newEsp.usu_crro,
        password: newEsp.usu_clve || undefined,
        esp_licencia: newEsp.esp_licencia || undefined,
        esp_telf: newEsp.esp_telf || undefined,
        esc_codi: newEsp.esc_codi,
        esp_gner: newEsp.esp_gner || 'M',
        ins_codi: newEsp.ins_codi || undefined,
      };
      await api.post('/admin/especialistas', payload);
      showToast('✅ Especialista creado con éxito. Contraseña por defecto: SiatDoc2026*');
      setNewEsp({ 
        usu_crro: '', esp_nomb: '', esp_apel: '', usu_clve: '',
        esp_codi: '', esp_licencia: '', esp_telf: '', 
        esc_codi: '', esp_gner: 'M',
        ins_codi: catalogos.instituciones && catalogos.instituciones.length > 0 ? catalogos.instituciones[0].ins_codi : ''
      });
      fetchData();
    } catch (err) {
      showToast(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post('/admin/asignar', asignacion);
      showToast('✅ Paciente asignado al especialista exitosamente.');
      setAsignacion({ nin_codi: '', esp_codi: '' });
      fetchData(); 
    } catch (err) {
      showToast(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post('/ninos/invite-representative', formData);
      const respData = res.data.data;
      setGeneratedLink(respData.invitationUrl);
      setShowRegModal(false);
      setShowLinkModal(true);
      showToast('✅ Invitación clínica de niño y representante creada con éxito');
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
      showToast(`❌ Error: ${err.response?.data?.error || err.message}`);
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
          showToast(`✅ Especialista ${!currentState ? 'activado' : 'desactivado'} exitosamente.`);
          fetchData();
        } catch (err) {
          showToast(`❌ Error al cambiar estado: ${err.response?.data?.error || err.message}`);
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
          showToast(`✅ Estado de usuario actualizado exitosamente.`);
          fetchData();
        } catch (err) {
          showToast(`❌ Error al cambiar estado del usuario: ${err.response?.data?.error || err.message}`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleResetPassword = async (esp_codi, email) => {
    try {
      await api.post(`/admin/especialistas/${esp_codi}/password`, {});
      showToast(`✅ Contraseña restablecida para ${email}. Nueva contraseña: SiatDoc2026*`);
    } catch (err) {
      showToast(`❌ Error al restablecer contraseña: ${err.response?.data?.error || err.message}`);
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
          showToast(`✅ Asignación marcada como ${nextState}.`);
          fetchData();
        } catch (err) {
          showToast(`❌ Error al modificar asignación: ${err.response?.data?.error || err.message}`);
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
      showToast('✅ Especialista actualizado con éxito.');
      setEditingEsp(null);
      fetchData();
    } catch (err) {
      showToast(`❌ Error al actualizar: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInstitucion = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const codi = editingInst?.ins_codi || catalogos.instituciones?.[0]?.ins_codi;
      const body = {
        ins_codi: codi,
        ins_nomb: editingInst.ins_nomb,
        ins_dire: editingInst.ins_dire,
        ins_telf: editingInst.ins_telf,
        ins_pers: editingInst.ins_pers || '',
        ins_emai: editingInst.ins_emai || '',
        ins_web: editingInst.ins_web || '',
        ins_esta: 'Activa',
      };
      console.log('PUT institucion — body enviado:', JSON.stringify(body));
      await api.put(`/admin/instituciones/${codi}`, body);
      showToast('✅ Institución actualizada con éxito.');
      setEditingInst(null);
      fetchData();
    } catch (err) {
      const errResp = err.response?.data;
      const errMsg = errResp?.error || err.message || 'Error desconocido';
      showToast(`❌ Error al actualizar: ${errMsg}`);
      console.error('PUT institucion error — full response:', JSON.stringify(errResp, null, 2));
      console.error('PUT institucion error — status:', err.response?.status);
      console.error('PUT institucion error — body sent:', JSON.stringify(body, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEspecialidad = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const esc_codi = `E${Date.now().toString(36).toUpperCase()}`;
      await api.post('/admin/especialidades', { ...newEspCat, esc_codi });
      showToast(`✅ Especialidad registrada con éxito. Código: ${esc_codi}`);
      setNewEspCat({ esc_codi: '', esc_nomb: '', esc_desc: '' });
      fetchData();
    } catch (err) {
      showToast(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEspecialidad = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/admin/especialidades/${editingEspCat.esc_codi}`, editingEspCat);
      showToast('✅ Especialidad actualizada con éxito.');
      setEditingEspCat(null);
      fetchData();
    } catch (err) {
      showToast(`❌ Error al actualizar: ${err.response?.data?.error || err.message}`);
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
          showToast(`✅ Especialidad ${!nextState ? 'activada' : 'desactivada'} exitosamente.`);
          fetchData();
        } catch (err) {
          showToast(`❌ Error al cambiar estado: ${err.response?.data?.error || err.message}`);
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
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          especialistas: especialistas.length,
          representantes: representantes.length,
          asignaciones: asignaciones.filter(a => a.asi_stdo === 'Activo').length,
          usuarios: usuarios.length,
        }}
      />

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
                  {activeTab === 'representantes' && 'Gestión de Representantes Legales'}
                  {activeTab === 'historial_clinico' && 'Historial Clínico Global'}
                  {activeTab === 'asignaciones' && 'Control de Casos y Asignaciones'}
                  {activeTab === 'catalogos' && 'Configuración de Mi Fundación'}
                  {activeTab === 'infraestructura' && 'Monitoreo de Infraestructura'}
                  {activeTab === 'usuarios' && 'Control de Acceso y Cuentas de Usuario'}
                  {activeTab === 'manual' && 'Manual de Usuario'}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {activeTab === 'dashboard' && 'Visión general de la operación clínica, rendimiento de terapias y reportes de incidentes.'}
                  {activeTab === 'especialistas' && 'Administración del personal de salud, acreditaciones y especialidades médicas.'}
                  {activeTab === 'representantes' && 'Listado de padres, madres y tutores legales vinculados a los pacientes.'}
                  {activeTab === 'historial_clinico' && 'Registro de incidentes, crisis y alertas fisiológicas de todos los pacientes.'}
                  {activeTab === 'asignaciones' && 'Vinculación formal entre pacientes pediátricos y el personal clínico.'}
                  {activeTab === 'catalogos' && 'Datos de la institución: RIF, dirección y contacto principal.'}
                  {activeTab === 'infraestructura' && 'Estado operativo de los servicios de telemetría, bases de datos y respuesta de red.'}
                  {activeTab === 'usuarios' && 'Gestión de credenciales, roles, fecha de creación y estado de activación de cuentas vinculadas.'}
                  {activeTab === 'manual' && 'Guía de referencia completa del módulo de administrador SIAT.'}
                </p>
              </div>
              {activeTab === 'dashboard' && (
                <div className="flex gap-2">
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
                    <FileText className="w-4 h-4" /> Exportar
                  </button>
                  <button onClick={() => setShowScheduleModal(true)} className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded-lg shadow-sm border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center gap-2 text-sm shrink-0">
                    <Clock className="w-4 h-4" /> Programar
                  </button>
                </div>
              )}
            </header>

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (metricas ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <AdminKPIs metricas={metricas} />

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button onClick={() => setActiveTab('especialistas')} className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                    <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gestionar</p><p className="text-sm font-bold text-slate-900 dark:text-white">Especialistas</p></div>
                  </button>
                  <button onClick={() => setActiveTab('asignaciones')} className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Link2 className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
                    <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Crear</p><p className="text-sm font-bold text-slate-900 dark:text-white">Asignaciones</p></div>
                  </button>
                  <button onClick={() => setActiveTab('usuarios')} className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                    <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Administrar</p><p className="text-sm font-bold text-slate-900 dark:text-white">Usuarios</p></div>
                  </button>
                  <button onClick={() => setActiveTab('catalogos')} className="flex items-center gap-3 p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg"><Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
                    <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Configurar</p><p className="text-sm font-bold text-slate-900 dark:text-white">Institución</p></div>
                  </button>
                </div>

                {/* Recent Alerts */}
                {auditLogs.filter(l => l.aud_tipo === 'INCIDENTE' || l.aud_tipo === 'WARN').length > 0 && (
                  <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alertas Recientes</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {auditLogs.filter(l => l.aud_tipo === 'INCIDENTE' || l.aud_tipo === 'WARN').slice(0, 5).map(log => (
                        <div key={log.aud_codi} className="px-6 py-3 flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${log.aud_tipo === 'INCIDENTE' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{log.aud_desc}</p>
                          <span className="text-xs text-slate-400 shrink-0">{new Date(log.aud_time).toLocaleDateString('es-ES')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                handleResetPassword={handleResetPassword}
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

            {/* REPRESENTANTES TAB */}
            {activeTab === 'representantes' && (
              <RepresentantesTab
                representantes={representantes}
                loading={loading}
                onRefresh={fetchData}
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
              <InfraestructuraTab isDark={isDark} mockUptimeData={mockUptimeData} />
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
                    showToast('📋 Enlace copiado al portapapeles');
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

      {/* MODAL: Programar Reporte */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5" /> Programar Reporte</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-white/80 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Configura el envío automático del reporte del dashboard por correo electrónico.</p>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={scheduleConfig.enabled} onChange={e => setScheduleConfig({...scheduleConfig, enabled: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Activar reporte automático</span>
              </label>

              {scheduleConfig.enabled && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Frecuencia</label>
                    <select value={scheduleConfig.frequency} onChange={e => setScheduleConfig({...scheduleConfig, frequency: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>
                  {scheduleConfig.frequency === 'weekly' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Día de la semana</label>
                      <select value={scheduleConfig.day} onChange={e => setScheduleConfig({...scheduleConfig, day: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        {['lunes','martes','miércoles','jueves','viernes','sábado','domingo'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Correo destino</label>
                    <input type="email" value={scheduleConfig.email} onChange={e => setScheduleConfig({...scheduleConfig, email: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="admin@fundacion.org" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold">Cancelar</button>
                <button onClick={() => {
                  setShowScheduleModal(false)
                  localStorage.setItem('reportSchedule', JSON.stringify(scheduleConfig))
                  if (scheduleConfig.enabled && scheduleConfig.email) {
                    api.post('/admin/reportes/programados', scheduleConfig)
                      .then(() => showToast('✅ Reporte programado exitosamente.'))
                      .catch(() => showToast('⚠️ Configuración guardada localmente. El envío automático estará disponible cuando el backend esté conectado.'))
                  } else {
                    showToast('📋 Configuración guardada.')
                  }
                }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">Guardar Configuración</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
