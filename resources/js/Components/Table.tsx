import { ReactNode } from 'react';

interface Column<T> {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    render?: (item: T) => ReactNode;
    className?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    className?: string;
    keyExtractor?: (item: T) => string | number;
}

export default function Table<T extends Record<string, any>>({
    columns,
    data,
    emptyMessage = 'Aucune donnée disponible',
    onRowClick,
    className = '',
    keyExtractor = (item) => item.id,
}: TableProps<T>) {
    const getAlignment = (align?: 'left' | 'center' | 'right') => {
        switch (align) {
            case 'center':
                return 'text-center';
            case 'right':
                return 'text-right';
            default:
                return 'text-left';
        }
    };

    return (
        <div className={`overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-900/80 text-slate-300">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-4 py-3 font-medium ${getAlignment(column.align)} ${column.className || ''}`}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-8 text-center text-slate-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={keyExtractor(item)}
                                    className={`border-t border-white/10 text-slate-200 transition-colors ${
                                        onRowClick
                                            ? 'cursor-pointer hover:bg-white/5'
                                            : ''
                                    }`}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={`${keyExtractor(item)}-${column.key}`}
                                            className={`px-4 py-3 ${getAlignment(column.align)} ${column.className || ''}`}
                                        >
                                            {column.render
                                                ? column.render(item)
                                                : item[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Composant pour les actions dans une cellule
interface TableActionsProps {
    children: ReactNode;
}

export function TableActions({ children }: TableActionsProps) {
    return (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    );
}

// Composant pour un bouton d'action
interface TableActionButtonProps {
    onClick?: () => void;
    variant?: 'default' | 'danger' | 'success';
    children: ReactNode;
    className?: string;
}

export function TableActionButton({
    onClick,
    variant = 'default',
    children,
    className = '',
}: TableActionButtonProps) {
    const variantClasses = {
        default: 'border-white/15 text-slate-200 hover:bg-white/10',
        danger: 'border-rose-300/30 text-rose-200 hover:bg-rose-300/10',
        success: 'border-emerald-300/30 text-emerald-200 hover:bg-emerald-300/10',
    };

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${variantClasses[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

// Composant pour un badge de statut
interface TableBadgeProps {
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
    children: ReactNode;
}

export function TableBadge({ variant = 'default', children }: TableBadgeProps) {
    const variantClasses = {
        success: 'bg-green-500/20 text-green-300',
        danger: 'bg-red-500/20 text-red-300',
        warning: 'bg-amber-500/20 text-amber-300',
        info: 'bg-blue-500/20 text-blue-300',
        default: 'bg-slate-500/20 text-slate-300',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${variantClasses[variant]}`}>
            {children}
        </span>
    );
}

// Composant pour un indicateur coloré
interface TableColorIndicatorProps {
    color: string;
    label?: string;
}

export function TableColorIndicator({ color, label }: TableColorIndicatorProps) {
    return (
        <div className="flex items-center gap-2">
            <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
            />
            {label && <span>{label}</span>}
        </div>
    );
}
