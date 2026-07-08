import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
const lightColors = {
  background: "#ffffff",
  header: "#f3f4f6",
  headerText: "#1f2937",
  border: "#e5e7eb",
  inputBg: "#f9fafb",
  inputBorder: "#d1d5db",
  text: "#111827",
  textSecondary: "#4b5563",
};

const darkColors = {
  background: "#111827",
  header: "#1f2937",
  headerText: "#f9fafb",
  border: "#374151",
  inputBg: "#374151",
  inputBorder: "#4b5563",
  text: "#f9fafb",
  textSecondary: "#9ca3af",
};

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

// 1. Atualizamos a tipagem para incluir o que o ChatScreen pede
type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void; // 👈 Adicionado
  colors: typeof lightColors; // 👈 Adicionado
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  toggleTheme: () => null,
  colors: lightColors,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // 2. Criamos a função toggleTheme baseada no tema atual
  const toggleTheme = () => {
    if (theme === "light") {
      localStorage.setItem(storageKey, "dark");
      setTheme("dark");
    } else {
      // Se for 'dark' ou 'system', joga para 'light'
      localStorage.setItem(storageKey, "light");
      setTheme("light");
    }
  };

  // 3. Resolvemos qual paleta passar para os componentes via JS
  // Se o tema for 'system', verificamos o schema do sistema operacional
  const getSystemTheme = () => 
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  
  const activeTheme = theme === "system" ? getSystemTheme() : theme;
  const colors = activeTheme === "dark" ? darkColors : lightColors;

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    toggleTheme, // 👈 Injetado no Provider
    colors,       // 👈 Injetado no Provider
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};