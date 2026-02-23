import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react';
import { ChevronDown, ChevronUp, MoreHorizontal, User, UserPlus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import GlassCard from './GlassCard';

export default function AccountsTable({ accounts, contacts, onRowClick, onEditClick, onDeleteClick }) {
    const [sorting, setSorting] = useState([]);

    const columns = [
        {
            accessorKey: 'businessName',
            header: 'Company / Account',
            cell: info => <span className="font-bold text-white whitespace-nowrap">{info.getValue() || 'Unnamed Account'}</span>,
        },
        {
            id: 'primaryContact',
            header: 'Primary Contact',
            cell: ({ row }) => {
                const accountContacts = contacts.filter(c => c.accountId === row.original.id);
                const primary = accountContacts[0];
                if (!primary) return <span className="text-white/30 text-xs italic">No contacts</span>;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm text-white/90">{primary.name}</span>
                        {accountContacts.length > 1 && (
                            <span className="text-[10px] text-brand-gold mt-0.5 px-1.5 py-0.5 rounded-full bg-brand-gold/10 w-fit">
                                +{accountContacts.length - 1} more
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: info => {
                const status = info.getValue() || 'New';
                const colors = {
                    'New': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                    'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    'Converted': 'bg-green-500/20 text-green-400 border-green-500/30',
                    'Lost': 'bg-red-500/20 text-red-400 border-red-500/30',
                };
                return (
                    <span className={`px-2 py-1 rounded text-xs border font-medium whitespace-nowrap ${colors[status] || colors['New']}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: info => {
                const priority = info.getValue() || 'Medium';
                const colors = {
                    'High': 'text-red-400 bg-red-400/10',
                    'Medium': 'text-amber-400 bg-amber-400/10',
                    'Low': 'text-gray-400 bg-gray-400/10'
                };
                return (
                    <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${colors[priority]}`}>
                        {priority}
                    </span>
                );
            }
        },
        {
            accessorKey: 'totalRevenue',
            header: 'Value',
            cell: info => {
                const val = info.getValue() || 0;
                return <span className="text-green-400 font-bold whitespace-nowrap">₹{val.toLocaleString()}</span>;
            }
        },
        {
            id: 'contacts',
            header: 'Contact Info',
            cell: ({ row }) => {
                const accountContacts = contacts.filter(c => c.accountId === row.original.id);
                const primary = accountContacts[0];
                if (!primary) return null;

                return (
                    <div className="text-xs text-white/60 space-y-1 whitespace-nowrap">
                        {primary.phone && <p>{primary.phone}</p>}
                        {primary.email && <p>{primary.email}</p>}
                    </div>
                );
            }
        },
        {
            id: 'owner',
            header: 'Owner',
            cell: ({ row }) => {
                // Determine owner based on the first contact's assigned member, or default
                const accountContacts = contacts.filter(c => c.accountId === row.original.id);
                const primary = accountContacts[0];
                const owner = primary?.teamMember || 'Unassigned';
                return (
                    <div className="flex items-center gap-1.5 text-xs text-white/70 whitespace-nowrap">
                        <User size={12} className="text-brand-gold" /> {owner}
                    </div>
                );
            }
        },
        {
            id: 'lastContact',
            header: 'Created At',
            accessorFn: row => row.createdAt,
            cell: info => {
                const dateStr = info.getValue();
                if (!dateStr) return <span className="text-white/30 text-xs">-</span>;
                try {
                    const parsedDate = new Date(dateStr);
                    if (isNaN(parsedDate)) throw new Error('Invalid Date');
                    return <span className="text-white/70 text-xs whitespace-nowrap">{format(parsedDate, 'MMM d, yyyy')}</span>;
                } catch {
                    return <span className="text-white/30 text-xs">-</span>;
                }
            }
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button onClick={(e) => { e.stopPropagation(); onEditClick(row.original); }} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded">
                        <MoreHorizontal size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteClick(row.original); }} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded">
                        <span className="text-xs font-bold">Del</span>
                    </button>
                </div>
            )
        }
    ];

    const table = useReactTable({
        data: accounts,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <GlassCard className="p-0 overflow-hidden border border-white/10 shadow-2xl relative custom-scrollbar">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-black/40 text-xs uppercase tracking-wider text-white/50 border-b border-white/10 sticky top-0 z-10">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    return (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className="px-4 py-3 font-medium cursor-pointer hover:text-white/80 transition-colors group select-none relative"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-1">
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                <span className="opacity-0 group-hover:opacity-50 transition-opacity">
                                                    {{
                                                        asc: <ChevronUp size={14} className="opacity-100 text-brand-gold" />,
                                                        desc: <ChevronDown size={14} className="opacity-100 text-brand-gold" />,
                                                    }[header.column.getIsSorted()] ?? <ChevronUp size={14} />}
                                                </span>
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-brand-dark/20">
                        {table.getRowModel().rows.map(row => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick(row.original)}
                                className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="px-4 py-3 align-middle text-sm border-white/5">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {table.getRowModel().rows.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-white/40 text-sm">
                                    No accounts match the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Bottom Summary Bar */}
            <div className="bg-black/60 border-t border-white/10 p-3 flex justify-between items-center text-xs text-brand-gold font-medium uppercase tracking-wider">
                <span>Summary</span>
                <div className="flex gap-6">
                    <span>Count: {accounts.length}</span>
                    <span>Sum: ₹{accounts.reduce((sum, a) => sum + (a.totalRevenue || 0), 0).toLocaleString()}</span>
                </div>
            </div>
        </GlassCard>
    );
}
