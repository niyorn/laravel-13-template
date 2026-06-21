import { useStorage } from '@vueuse/core';
import type { ComputedRef, Ref } from 'vue';
import { computed } from 'vue';

import type { Appearance, ResolvedAppearance } from '@/types';

export type { Appearance, ResolvedAppearance };

export type UseAppearanceReturn = {
    appearance: Ref<Appearance>;
    resolvedAppearance: ComputedRef<ResolvedAppearance>;
    updateAppearance: (value: Appearance) => void;
};

// Reactive ref backed by localStorage: reads the stored value on init and
// writes back automatically on every change (replaces manual getItem/setItem).
const appearance = useStorage<Appearance>('appearance', 'system');

export function updateTheme(value: Appearance): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (value === 'system') {
        const mediaQueryList = window.matchMedia(
            '(prefers-color-scheme: dark)',
        );
        const systemTheme = mediaQueryList.matches ? 'dark' : 'light';

        document.documentElement.classList.toggle(
            'dark',
            systemTheme === 'dark',
        );
    } else {
        document.documentElement.classList.toggle('dark', value === 'dark');
    }
}

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;

    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const handleSystemThemeChange = () => {
    updateTheme(appearance.value || 'system');
};

export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    // Apply the stored preference (or system) immediately on boot...
    updateTheme(appearance.value || 'system');

    // Set up system theme change listener...
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance(): UseAppearanceReturn {
    const resolvedAppearance = computed<ResolvedAppearance>(() => {
        const current = appearance.value ?? 'system';

        if (current === 'system') {
            return prefersDark() ? 'dark' : 'light';
        }

        return current;
    });

    function updateAppearance(value: Appearance) {
        // useStorage persists this to localStorage automatically...
        appearance.value = value;

        // Store in cookie too, so the server can render the right theme (SSR)...
        setCookie('appearance', value);

        updateTheme(value);
    }

    return {
        appearance,
        resolvedAppearance,
        updateAppearance,
    };
}
