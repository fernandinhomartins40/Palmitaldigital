import { useEffect, useState } from 'react';
import { Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi } from '../api';

const ROLES = ['USER', 'ADMIN', 'JOURNALIST', 'DRIVER', 'BUSINESS', 'RESTAURANT'];

export function UsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.listUsers(search || undefined, roleFilter || undefined)
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  const changeRole = async (id: string, role: string) => {
    await adminApi.updateRole(id, role);
    load();
  };

  const toggle = async (id: string) => {
    await adminApi.toggleActive(id);
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie contas e permissões</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-40"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Todas roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">Nenhum usuário encontrado.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium focus:border-blue-500 focus:outline-none"
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.isActive !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(u.id)}
                      className={`btn text-xs px-3 py-1.5 ${u.isActive !== false ? 'btn-ghost' : 'btn-success'}`}
                    >
                      {u.isActive !== false
                        ? <><ToggleLeft size={14} /> Desativar</>
                        : <><ToggleRight size={14} /> Ativar</>
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
