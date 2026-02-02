"use client";
import { useEffect, useState } from "react";
import { useThemeStore } from "@/lib/store";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const { theme } = useThemeStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;

        // Detect system preference if no explicit theme is set (though our store defaults to 'light')
        const applyTheme = (currentTheme: 'light' | 'dark') => {
            if (currentTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme(theme);

        // Optional: Listen for system changes if we want to follow them when no manual choice is made
        // But since we have a toggle, we usually respect the store's state which is persisted in localStorage.

    }, [theme, mounted]);

    if (!mounted) {
        return <div className="invisible">{children}</div>;
    }

    return (
        <div className={theme === 'dark' ? 'dark min-h-screen' : 'min-h-screen'}>
            {children}
        </div>
    );
}
