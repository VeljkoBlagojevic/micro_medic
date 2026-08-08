import { useRef, useEffect } from "react";
import '@micro-medic/design-system';

interface MmButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    full?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export function MmButton({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    full = false,
    onClick,
}: MmButtonProps) {
    const ref = useRef<HTMLElement & {
        loading: boolean;
        disabled: boolean;
        fullWidth: boolean;
        variant: string;
        size: string;
        type: string;
    }>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.loading = loading;
        }
    }, [loading]);

    useEffect(() => {
        if (ref.current) {
            ref.current.disabled = disabled;
        }
    }, [disabled]);

    useEffect(() => {
        if (ref.current) {
            ref.current.fullWidth = full;
        }
    }, [full]);

    useEffect(() => {
        if (ref.current) {
            ref.current.variant = variant;
            ref.current.size = size;
            ref.current.type = 'button';
        }

        const el = ref.current;
        if (!el || !onClick) return;
        const handler = (event: MouseEvent) => {
            if (el.loading || el.disabled) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            onClick(event as unknown as React.MouseEvent<HTMLButtonElement, MouseEvent>);
        };
        el.addEventListener('click', handler);
        return () => {
            el.removeEventListener('click', handler);
        };
    }, [onClick, loading, disabled, variant, size]);

    return (
        <mm-button
            ref={ref}
            variant={variant}
            size={size}
            fullWidth={full}
            loading={loading}
            disabled={disabled}
            type="button"
        >
            {children}
        </mm-button>
    );
}