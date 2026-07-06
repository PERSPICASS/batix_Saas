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
        <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
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
                                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={keyExtractor(item)}
                                    className={`border-t border-gray-200 text-slate-700 transition-colors dark:border-white/10 dark:text-slate-200 ${
                                        onRowClick
                                            ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5'
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
        default: 'border-gray-300 text-slate-600 hover:bg-gray-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10',
        danger: 'border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-300/30 dark:text-rose-200 dark:hover:bg-rose-300/10',
        success: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-300/30 dark:text-emerald-200 dark:hover:bg-emerald-300/10',
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
        success: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
        danger: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
        warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
        default: 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
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
