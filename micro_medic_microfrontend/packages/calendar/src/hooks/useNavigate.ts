import { useCallback } from 'react';
import { navigateToUrl } from 'single-spa';

/**
 * `navigateToUrl`, never `location.assign`: a real page load would tear down the Module Federation
 * shared scope and reboot every remote.
 */
export function useNavigate() {
    const navigate = useCallback((path: string) => {
        navigateToUrl(path);
    }, []);

    return navigate;
}