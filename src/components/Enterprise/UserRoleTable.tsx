import React from 'react';
import { UserRoleAssignment, Role } from '../../types/rbac';

interface UserRoleTableProps {
    users: UserRoleAssignment[];
    roles: Role[];
    isLoading: boolean;
}

export const UserRoleTable: React.FC<UserRoleTableProps> = ({ users, roles, isLoading }) => {
    if (isLoading) {
        return (
            <div className="w-full h-64 flex items-center justify-center rounded-xl bg-white border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!users.length) {
        return (
            <div className="w-full p-8 flex flex-col items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500">
                No users match the given criteria.
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Assigned Role</th>
                            <th className="px-6 py-4">Last Active</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full bg-slate-200 border border-slate-200" />
                                        <div>
                                            <div className="font-medium text-slate-900 text-sm">{user.userName}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{user.userEmail}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {user.department}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        defaultValue={user.assignedRoleId}
                                        className="block w-full max-w-xs px-3 py-2 text-sm border font-medium text-slate-700 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {new Date(user.lastActive).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
