import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => {
  // Add any providers here (Theme, Router, etc.)
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };
