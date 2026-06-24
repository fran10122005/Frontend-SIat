import React, { useState } from 'react';
import { Search, ToggleLeft, ToggleRight, User, AlertTriangle, ShieldCheck, Mail, Calendar, Clock } from 'lucide-react';

export default function UsuariosTab({
  usuarios,
  loading,
  handleToggleUser
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener el nombre del usuario según su rol
  const getUserName = (user) => {
    if (user.rol_codi === 'ROL_ESP' && user.tm_espec) {
      return `${user.tm_espec.esp_gner === 'M' ? 'Dr.' : 'Dra.'} ${user.tm_espec.esp_nomb} ${user.tm_espec.esp_apel}`;
    }
    if (user.rol_codi === 'ROL_REP' && user.tm_repre) {
      return `${user.tm_repre.rep_nomb} ${user.tm_repre.rep_apel}`;
    }
    if (user.rol_codi === 'ROL_ADM' && user.tm_admin) {
      return `${user.tm_admin.adm_nomb} ${user.tm_admin.adm_apel}`;
    }
    return 'Administrador Global / Director';
  };

  const getRoleBadge = (rolCodi) => {
    switch (rolCodi) {
      case 'ROL_ADM':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-200/50 dark:border-amber-900/30">Administrador</span>;
      case 'ROL_ESP':
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-200/50 dark:border-indigo-900/30">Especialista</span>;
      case 'ROL_REP':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-200/50 dark:border-blue-900/30">Representante</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-400 rounded-full text-xs font-semibold uppercase tracking-wider">Otro</span>;
    }
  };

  // Filtrar los usuarios
  const filteredUsers = usuarios.filter(user => {
    const name = getUserName(user).toLowerCase();
    const email = user.usu_crro.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = name.includes(search) || email.includes(search);
    const matchesRole = roleFilter === 'ALL' || user.rol_codi === roleFilter;
    return matchesSearch && matchesRole;
  });

  const confirmToggle = (user) => {
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (selectedUser) {
      await handleToggleUser(selectedUser.usu_codi, !selectedUser.usu_estd);
      setShowConfirmModal(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Controles de búsqueda y filtros */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filtrar Rol:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Todos los Roles</option>
            <option value="ROL_ADM">Administradores</option>
            <option value="ROL_ESP">Especialistas</option>
            <option value="ROL_REP">Representantes</option>
          </select>
        </div>
      </div>

      {/* Listado de Usuarios */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cuentas de Acceso al Sistema</h2>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'Usuario registrado' : 'Usuarios registrados'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Cargando usuarios del sistema...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            No se encontraron usuarios con los criterios de búsqueda establecidos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 hidden md:table-cell">Creación</th>
                  <th className="px-6 py-4">Último Acceso</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.map((user) => {
                  const name = getUserName(user);
                  const isActive = user.usu_estd;
                  return (
                    <tr key={user.usu_codi} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <User className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white leading-tight">{name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                              <Mail className="h-3 w-3" /> {user.usu_crro}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.rol_codi)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(user.usu_crea).split(',')[0]}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(user.usu_logi)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => confirmToggle(user)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                            isActive 
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 hover:bg-emerald-100' 
                              : 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 hover:bg-rose-100'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" /> Activo
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5" /> Inactivo
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800/60 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar cambio de estado
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              ¿Estás seguro de que deseas <b>{selectedUser.usu_estd ? 'DESACTIVAR' : 'ACTIVAR'}</b> la cuenta del usuario <b>{getUserName(selectedUser)}</b> ({selectedUser.usu_crro})? 
              {selectedUser.usu_estd && ' Si la desactivas, no podrá acceder al sistema hasta ser reactivado.'}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmToggle}
                className={`px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors ${
                  selectedUser.usu_estd ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
