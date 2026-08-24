import { useHttp } from '@inertiajs/vue3';
import { useAsyncState } from '@vueuse/core';
import { toast } from 'vue-sonner';

import type { AuthConfig } from '@/types/api/schemas';
import { config } from '@/wayfinder/routes/api/auth';

/** What the auth screens render with until the request lands. */
const PENDING: AuthConfig = { passwordRules: '', canResetPassword: false };

/**
 * Get the auth settings the sign-in and sign-up screens render against.
 */
export function useAuthConfig() {
    const http = useHttp<Record<string, never>, AuthConfig>();

    const { state: authConfig, isLoading } = useAsyncState(
        () => http.get(config.url()),
        PENDING,
        {
            onError: () => toast.error('Could not load the sign-in settings.'),
        },
    );

    return { authConfig, isLoading };
}
