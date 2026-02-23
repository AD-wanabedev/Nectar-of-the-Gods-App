import { Phone, Mail, User, Building2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import GlassCard from './GlassCard';

export default function AccountsList({ accounts, contacts, onRowClick, onEditClick, onDeleteClick }) {
    if (accounts.length === 0) {
        return (
            <div className="text-center py-12 text-white/40 bg-black/20 rounded-2xl border border-white/5 mx-2">
                <p>No accounts match the current filters.</p>
                <p className="text-xs mt-1">Try adjusting your search criteria.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 px-2">
            {accounts.map(account => {
                const accountContacts = contacts.filter(c => c.accountId === account.id);
                const primary = accountContacts[0];
                const statusColors = {
                    'New': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                    'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    'Converted': 'bg-green-500/20 text-green-400 border-green-500/30',
                    'Lost': 'bg-red-500/20 text-red-400 border-red-500/30',
                };
                const statusBadge = account.status || 'New';

                return (
                    <GlassCard
                        key={account.id}
                        onClick={() => onRowClick(account)}
                        className="p-4 active:scale-[0.99] transition-transform cursor-pointer hover:bg-white/[0.02]"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 pr-2">
                                <h3 className="font-bold text-white text-lg leading-tight flex items-center gap-1.5 line-clamp-1">
                                    <Building2 size={16} className="text-brand-gold flex-shrink-0" />
                                    {account.businessName || 'Unnamed Account'}
                                </h3>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap ${statusColors[statusBadge] || statusColors['New']}`}>
                                {statusBadge}
                            </span>
                        </div>

                        {/* Financials & Priority */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-green-400 font-bold text-sm bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">
                                ₹{(account.totalRevenue || 0).toLocaleString()}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${account.priority === 'High' ? 'text-red-400 bg-red-400/10' :
                                account.priority === 'Medium' ? 'text-amber-400 bg-amber-400/10' :
                                    'text-gray-400 bg-gray-400/10'
                                }`}>
                                Priority: {account.priority || 'Medium'}
                            </span>
                        </div>

                        {/* Contact Info Preview */}
                        <div className="bg-black/20 rounded-lg p-2 border border-white/5 mb-3">
                            {primary ? (
                                <div className="space-y-1">
                                    <p className="text-sm text-white/90 font-medium flex items-center gap-1.5">
                                        <User size={14} className="text-white/40" /> {primary.name}
                                    </p>
                                    <div className="flex flex-col sm:flex-row sm:gap-4 text-xs text-white/60">
                                        {primary.phone && (
                                            <p className="flex items-center gap-1">
                                                <Phone size={12} /> {primary.phone}
                                            </p>
                                        )}
                                        {primary.email && (
                                            <p className="flex items-center gap-1 truncate">
                                                <Mail size={12} /> {primary.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-white/40 italic py-1">No contacts attached yet.</p>
                            )}
                        </div>

                        {/* Footer Meta */}
                        <div className="flex items-center justify-between text-[10px] text-white/40 pt-2 border-t border-white/5">
                            <span className="flex items-center gap-1">
                                <User size={10} className="text-brand-gold" /> {primary?.teamMember || 'Unassigned'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={10} /> {(() => {
                                    try {
                                        if (!account.createdAt) return '-';
                                        const d = new Date(account.createdAt);
                                        return isNaN(d) ? '-' : format(d, 'MMM d, yyyy');
                                    } catch {
                                        return '-';
                                    }
                                })()}
                            </span>
                        </div>
                    </GlassCard>
                );
            })}
        </div>
    );
}
