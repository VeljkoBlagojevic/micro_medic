import { useEffect, useRef } from 'react';
import '@micro-medic/design-system';

interface MmModalProps extends React.HTMLAttributes<HTMLElement> {
	open?: boolean;
	heading?: string;
	size?: 'sm' | 'md' | 'lg';
	dismissible?: boolean;
	onClose?: () => void;
	footer?: React.ReactNode;
}

export function MmModal({
	children,
	open = false,
	heading = '',
	size = 'md',
	dismissible = true,
	onClose,
	footer,
}: MmModalProps) {
	const ref = useRef<HTMLElement & {
		open: boolean;
		heading: string;
		size: 'sm' | 'md' | 'lg';
		dissmissible: boolean;
	}>(null);

	useEffect(() => {
		if (ref.current) {
			ref.current.open = open;
			ref.current.heading = heading;
			ref.current.size = size;
			ref.current.dissmissible = dismissible;
		}
	}, [open, heading, size, dismissible]);

	useEffect(() => {
		const el = ref.current;
		if (!el || !onClose) return;

		const handler = () => {
			onClose();
		};

		el.addEventListener('mm-close', handler);
		return () => {
			el.removeEventListener('mm-close', handler);
		};
	}, [onClose]);

	return (
		<mm-modal ref={ref} open={open} heading={heading} size={size} dissmissible={dismissible}>
			{children}
			{footer ? <div slot="footer">{footer}</div> : null}
		</mm-modal>
	);
}
