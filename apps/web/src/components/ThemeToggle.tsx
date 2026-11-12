import { useState } from 'react';
import { currentTheme, setTheme } from '../theme.js';
import type { Theme } from '../theme.js';

export function ThemeToggle() {
  const [theme, setLocalTheme] = useState<Theme>(currentTheme);

  const handleClick = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setLocalTheme(next);
  };

  return (
    <button
      type="button"
      className="btn btn--ghost btn--small"
      onClick={handleClick}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
