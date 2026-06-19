<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue';
import { computed } from 'vue';

import { Button } from '@/components/ui/button';
import { useAppearance } from '@/composables/useAppearance';

const { resolvedAppearance, updateAppearance } = useAppearance();

const isDark = computed(() => resolvedAppearance.value === 'dark');

function toggleAppearance() {
    updateAppearance(isDark.value ? 'light' : 'dark');
}
</script>

<template>
    <Button
        variant="ghost"
        size="icon"
        class="group h-9 w-9 cursor-pointer"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleAppearance"
    >
        <Sun v-if="isDark" class="size-5 opacity-80 group-hover:opacity-100" />
        <Moon v-else class="size-5 opacity-80 group-hover:opacity-100" />
    </Button>
</template>
