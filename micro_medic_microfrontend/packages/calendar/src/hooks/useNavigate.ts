import { useCallback } from 'react';
import { navigateToUrl } from 'single-spa';

export function useNavigate() {
    const navigate = useCallback((path: string) => {
        navigateToUrl(path);
    }, []);

    return navigate;
}