interface ConflictBannerProps {
    message: string;
}

export function ConflictBanner({ message }: ConflictBannerProps) {
    if (!message) return null;

    return (
        <div className="conflict-banner" role="alert">
            <span className="conflict-banner-icon" aria-hidden="true">⚠️</span>
            <span className="conflict-banner-message">{message}</span>
        </div>
    );
}