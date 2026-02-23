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

export default function AccountsTable({ accounts, contacts, isLoading, onRowClick, onEditClick, onDeleteClick }) {
    const [sorting, setSorting] = useState([]);

    const columns = [
        {
            accessorKey: 'businessName',
            header: 'Company / Account',
            meta: { width: 'w-[20%]' },
            cell: info => <span className="font-bold text-white whitespace-nowrap">{info.getValue() || 'Unnamed Account'}</span>,
        },
        {
            id: 'primaryContact',
            header: 'Primary Contact',
            meta: { width: 'w-[15%]' },
            cell: ({ row }) => {
                const accountContacts = contacts.filter(c => c.accountId === row.original.id);
                const primary = accountContacts[0];
                if (!primary) return <span className="text-white/50 text-xs italic">No contacts</span>;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm text-white truncate max-w-[150px]">{primary.name}</span>
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
            meta: { width: 'w-[10%]' },
            cell: info => {
                const status = info.getValue() || 'New';
                const colors = {
                    'New': 'bg-blue-600',
                    'In Progress': 'bg-orange-600',
                    'Converted': 'bg-purple-600',
                    'Lost': 'bg-red-600',
                };
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap ${colors[status] || colors['New']}`}>
                        {status === 'Converted' ? 'Customer' : status === 'In Progress' ? 'Qualified' : status}
                    </span>
                );
            }
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            meta: { width: 'w-[10%]' },
            cell: info => {
                const priority = info.getValue() || 'Medium';
                const colors = {
                    'High': 'bg-red-500',
                    'Medium': 'bg-amber-500',
                    'Low': 'bg-gray-500'
                };
                return (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap ${colors[priority]}`}>
                        {priority}
                    </span>
                );
            }
        },
        {
            accessorKey: 'totalRevenue',
            header: 'Value',
            meta: { width: 'w-[12%]' },
            cell: info => {
                const val = info.getValue() || 0;
                const formattedValue = new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(val);
                return <span className={`font-bold whitespace-nowrap ${val > 0 ? 'text-green-400' : 'text-white/50'}`}>{formattedValue}</span>;
            }
        },
        {
            id: 'contacts',
            header: 'Contact Info',
            meta: { width: 'w-[18%]' },
            cell: ({ row }) => {
                const accountContacts = contacts.filter(c => c.accountId === row.original.id);
                const primary = accountContacts[0];
                if (!primary) return null;

                return (
                    <div className="text-xs text-white/80 space-y-1">
                        {primary.phone && <p className="truncate max-w-[150px]">{primary.phone}</p>}
                        {primary.email && <p className="truncate max-w-[150px]">{primary.email}</p>}
                    </div>
                );
            }
        },
        {
            id: 'owner',
            header: 'Owner',
            meta: { width: 'w-[10%]' },
            cell: ({ row }) => {
                // Determine owner based on the first contact's assigned member, or default
                const accountContacts = contacts.filter(c => c.accountId === row.original.id);
                const primary = accountContacts[0];
                const owner = primary?.teamMember || 'Unassigned';
                return (
                    <div className="flex items-center gap-1.5 text-xs text-white/80 whitespace-nowrap truncate max-w-[100px]">
                        <User size={12} className="text-brand-gold flex-shrink-0" /> {owner}
                    </div>
                );
            }
        },
        {
            id: 'lastContact',
            header: 'Created At',
            accessorFn: row => row.createdAt,
            meta: { width: 'w-[10%]' },
            cell: info => {
                const dateStr = info.getValue();
                if (!dateStr) return <span className="text-white/30 text-xs">-</span>;
                try {
                    const parsedDate = new Date(dateStr);
                    if (isNaN(parsedDate)) throw new Error('Invalid Date');
                    return <span className="text-white/80 text-xs whitespace-nowrap">{format(parsedDate, 'MMM d, yyyy')}</span>;
                } catch {
                    return <span className="text-white/30 text-xs">-</span>;
                }
            }
        },
        {
            id: 'actions',
            header: '',
            meta: { width: 'w-[5%]' },
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
        <div className="w-full bg-gray-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative custom-scrollbar">
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px] text-white">
                    <thead className="bg-gray-800 text-xs uppercase tracking-wider text-white/80 border-b border-white/10 sticky top-0 z-10">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    const metaWidth = header.column.columnDef.meta?.width || 'w-auto';
                                    return (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={`px-4 py-3 font-medium cursor-pointer hover:text-white/80 transition-colors group select-none relative ${metaWidth}`}
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
                    <tbody className="divide-y divide-white/10 bg-gray-900">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, idx) => (
                                <tr key={`skel-${idx}`} className="animate-pulse hover:bg-white/[0.02]">
                                    <td className="px-4 py-4 w-[20%]"><div className="h-4 bg-white/10 rounded w-2/3"></div></td>
                                    <td className="px-4 py-4 w-[15%]"><div className="h-4 bg-white/10 rounded w-3/4 mb-1"></div><div className="h-3 bg-white/5 rounded w-1/2"></div></td>
                                    <td className="px-4 py-4 w-[10%]"><div className="h-6 gap-2 bg-white/10 rounded-full w-20"></div></td>
                                    <td className="px-4 py-4 w-[10%]"><div className="h-6 gap-2 bg-white/10 rounded-full w-16"></div></td>
                                    <td className="px-4 py-4 w-[12%]"><div className="h-4 bg-white/10 rounded w-16"></div></td>
                                    <td className="px-4 py-4 w-[18%]"><div className="h-3 bg-white/5 rounded w-1/2 mb-1"></div><div className="h-3 bg-white/5 rounded w-2/3"></div></td>
                                    <td className="px-4 py-4 w-[10%]"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                                    <td className="px-4 py-4 w-[10%]"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                                    <td className="px-4 py-4 w-[5%]"><div className="h-6 bg-white/5 rounded w-12"></div></td>
                                </tr>
                            ))
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick(row.original)}
                                    className="group hover:bg-white/[0.05] transition-colors cursor-pointer"
                                >
                                    {row.getVisibleCells().map(cell => {
                                        const metaWidth = cell.column.columnDef.meta?.width || 'w-auto';
                                        return (
                                            <td key={cell.id} className={`px-4 py-4 align-middle text-sm border-white/10 ${metaWidth}`}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )))}
                        {!isLoading && table.getRowModel().rows.length === 0 && (
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
            <div className="bg-gray-800 border-t border-white/10 p-3 flex justify-between items-center text-xs text-brand-gold font-medium uppercase tracking-wider">
                <span>Summary</span>
                <div className="flex gap-6">
                    <span>Count: {accounts.length}</span>
                    <span>Sum: ₹{accounts.reduce((sum, a) => sum + (a.totalRevenue || 0), 0).toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
    );
}
