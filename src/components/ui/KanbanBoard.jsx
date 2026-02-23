import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Building2, IndianRupee } from 'lucide-react';
import GlassCard from './GlassCard';
import { accountsDB } from '../db';

const STATUSES = ['New', 'In Progress', 'Converted', 'Lost'];

function SortableAccountCard({ account }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: account.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 cursor-grab active:cursor-grabbing">
            <GlassCard className="p-3 bg-brand-dark/60 hover:bg-brand-dark/40 border border-white/10 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-sm leading-tight flex items-center gap-1">
                        <Building2 size={12} className="text-brand-gold flex-shrink-0" />
                        <span className="line-clamp-1">{account.businessName || 'Unnamed'}</span>
                    </h4>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wide
                        ${account.priority === 'High' ? 'text-red-400 bg-red-400/10' :
                            account.priority === 'Medium' ? 'text-amber-400 bg-amber-400/10' :
                                'text-gray-400 bg-gray-400/10'}`}>
                        {account.priority || 'Med'}
                    </span>
                    <span className="text-green-400 font-bold flex items-center">
                        <IndianRupee size={10} /> {(account.totalRevenue || 0).toLocaleString()}
                    </span>
                </div>
            </GlassCard>
        </div>
    );
}

function KanbanColumn({ title, accounts }) {
    const colors = {
        'New': 'border-t-purple-500',
        'In Progress': 'border-t-blue-500',
        'Converted': 'border-t-green-500',
        'Lost': 'border-t-red-500',
    };

    return (
        <div className={`flex-1 min-w-[280px] w-[280px] bg-black/20 rounded-xl border border-white/5 border-t-4 ${colors[title] || 'border-t-gray-500'} p-3 flex flex-col max-h-full`}>
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">{title}</h3>
                <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-medium">
                    {accounts.length}
                </span>
            </div>

            <SortableContext items={accounts.map(a => a.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[100px]">
                    {accounts.map(account => (
                        <SortableAccountCard key={account.id} account={account} />
                    ))}
                    {accounts.length === 0 && (
                        <div className="h-full min-h-[100px] border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/20 text-xs">
                            Drop here
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export default function KanbanBoard({ accounts, onRefreshAccounts }) {
    const [localAccounts, setLocalAccounts] = useState(accounts);

    useEffect(() => {
        setLocalAccounts(accounts);
    }, [accounts]);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        // Find the dragged account
        const draggedAccount = localAccounts.find(a => a.id === active.id);
        if (!draggedAccount) return;

        // Determine destination status based on what we hovered over
        let targetStatus = null;

        // Did we drop directly on a column header/empty space?
        if (STATUSES.includes(over.id)) {
            targetStatus = over.id;
        } else {
            // Or did we drop on another card? Find its status
            const overAccount = localAccounts.find(a => a.id === over.id);
            if (overAccount) {
                targetStatus = overAccount.status || 'New';
            }
        }

        if (targetStatus && draggedAccount.status !== targetStatus) {
            // Optimistic UI update
            const updatedAccounts = localAccounts.map(a =>
                a.id === active.id ? { ...a, status: targetStatus } : a
            );
            setLocalAccounts(updatedAccounts);

            // Persist to DB
            try {
                await accountsDB.update(active.id, { status: targetStatus });
                if (onRefreshAccounts) onRefreshAccounts();
            } catch (error) {
                console.error("Failed to update status drag:", error);
                // Revert on failure
                setLocalAccounts(accounts);
            }
        }
    };

    // Group accounts by status
    const groupedAccounts = STATUSES.reduce((acc, status) => {
        acc[status] = localAccounts.filter(a => (a.status || 'New') === status)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return acc;
    }, {});

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)] min-h-[500px] hide-scrollbar snap-x snap-mandatory px-1">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
            >
                {STATUSES.map(status => (
                    <div key={status} id={status} className="snap-center">
                        <KanbanColumn
                            title={status}
                            accounts={groupedAccounts[status]}
                        />
                    </div>
                ))}
            </DndContext>
        </div>
    );
}
