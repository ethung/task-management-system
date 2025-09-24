import { screen } from "@testing-library/dom";
import { render } from "@testing-library/react";

import { Header } from "@/components/layout/header";
import { APP_NAME } from "@/lib/constants";

describe("Header", () => {
  it("renders the application name", () => {
    render(<Header />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(APP_NAME);
  });

  it("has the correct semantic structure", () => {
    render(<Header />);

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("border-b");
  });

  it("applies correct styling classes", () => {
    render(<Header />);

    const header = screen.getByRole("banner");
    expect(header).toHaveClass(
      "bg-background/95",
      "supports-[backdrop-filter]:bg-background/60",
      "border-b",
      "backdrop-blur"
    );
  });
});
