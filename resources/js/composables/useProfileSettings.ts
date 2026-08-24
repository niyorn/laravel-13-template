import { useHttp } from '@inertiajs/vue3';
import { useAsyncState } from '@vueuse/core';
import { toast } from 'vue-sonner';

import type { ProfileSettings } from '@/types/api/schemas';
import { profile } from '@/wayfinder/routes/api/settings';

/** What the profile screen renders with until the request lands. */
const PENDING: ProfileSettings = { mustVerifyEmail: false };

/**
 * Get the profile settings screen's data for the signed-in user.
 */
export function useProfileSettings() {
    const http = useHttp<Record<string, never>, ProfileSettings>();

    const { state: profileSettings, isLoading } = useAsyncState(
        () => http.get(profile.url()),
        PENDING,
        {
            onError: () => toast.error('Could not load your profile settings.'),
        },
    );

    return { profileSettings, isLoading };
}
