import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>
}));

describe('ThemeProvider', () => {
  it('renders without crashing', () => {
    render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    expect(document.querySelector('[data-testid="theme-provider"]')).toBeInTheDocument();
  });

  it('passes props to NextThemesProvider', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div>Test content</div>
      </ThemeProvider>
    );
    
    expect(document.querySelector('[data-testid="theme-provider"]')).toBeInTheDocument();
  });
});
