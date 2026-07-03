import { useState, useEffect, useMemo } from 'react';
import { Search, User, Mail, Calendar, Clock, X } from 'lucide-react';
import StatusBadge from '../shared/StatusBadge';
import Pagination from '../shared/Pagination';
import LoadingState from '../dashboard/LoadingState';

export default function UsuariosTab({
  usuarios,
  loading,
  handleToggleUser,
  exportUsuariosToPDF,
  exportUsuariosToExcel
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

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

  const hasFilters = searchTerm || roleFilter !== 'ALL' || filterEstado !== 'TODOS' || dateFrom || dateTo

  const filteredUsers = useMemo(() => usuarios.filter(user => {
    const name = getUserName(user).toLowerCase();
    const email = user.usu_crro.toLowerCase();
    const search = searchTerm.toLowerCase();
    if (searchTerm && !name.includes(search) && !email.includes(search)) return false
    if (roleFilter !== 'ALL' && user.rol_codi !== roleFilter) return false
    if (filterEstado === 'ACTIVO' && !user.usu_estd) return false
    if (filterEstado === 'INACTIVO' && user.usu_estd) return false
    if (dateFrom && user.usu_crea && new Date(user.usu_crea) < new Date(dateFrom)) return false
    if (dateTo && user.usu_crea) {
      const end = new Date(dateTo); end.setHours(23, 59, 59, 999)
      if (new Date(user.usu_crea) > end) return false
    }
    return true;
  }), [usuarios, searchTerm, roleFilter, filterEstado, dateFrom, dateTo]);

  const PAGE_SIZE = 8
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE)
  const pagedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0) }, [searchTerm, roleFilter, filterEstado, dateFrom, dateTo])

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('ALL')
    setFilterEstado('TODOS')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filtros */}
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-4 pr-9 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="ALL">Todos los Roles</option>
            <option value="ROL_ADM">Administradores</option>
            <option value="ROL_ESP">Especialistas</option>
            <option value="ROL_REP">Representantes</option>
          </select>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" title="Creación desde" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" title="Creación hasta" />
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cuentas de Acceso al Sistema</h2>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'Usuario registrado' : 'Usuarios registrados'}
          </span>
        </div>

        {loading ? (
          <LoadingState variant="table" rows={5} role="ADMIN_INSTITUCION" />
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
                {pagedUsers.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-500">No se encontraron usuarios.</td></tr>
                ) : pagedUsers.map((user) => {
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
                          onClick={() => handleToggleUser(user.usu_codi, user.usu_estd)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                            isActive 
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 hover:bg-emerald-100' 
                              : 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 hover:bg-rose-100'
                          }`}
                        >
                          <StatusBadge active={isActive} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
