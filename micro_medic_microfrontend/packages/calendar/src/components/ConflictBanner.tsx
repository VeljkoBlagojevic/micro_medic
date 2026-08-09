interface ConflictBannerProps {
    message: string;
}

export function ConflictBanner({ message }: ConflictBannerProps) {
    if (!message) return null;

    return (
        <div className="cal-conflict-banner" role="alert">
            <span className="cal-conflict-banner__icon" aria-hidden="true">⚠️</span>
            <span className="cal-conflict-banner__message">{message}</span>
        </div>
    );
}