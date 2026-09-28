import { PaletteIcon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-circle hover:scale-105 transition-transform">
        <PaletteIcon className="size-5" />
      </button>

      <div
        tabIndex={0}
        className="dropdown-content mt-2 p-2 shadow-2xl bg-base-200/90 backdrop-blur-xl rounded-2xl w-64 border border-base-content/10 max-h-80 overflow-y-auto"
      >
        <div className="space-y-1">
          {THEMES.map((themeOption) => (
            <button
              key={themeOption.name}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${
                theme === themeOption.name ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-base-content/5"
              }`}
              onClick={() => setTheme(themeOption.name)}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-base-100/80 border border-base-content/10">
                <PaletteIcon className="size-3.5" />
              </span>
              <span className="text-sm font-medium">{themeOption.label}</span>
              <div className="ml-auto flex gap-1">
                {themeOption.colors.map((color, i) => (
                  <span key={i} className="size-2.5 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ThemeSelector;
