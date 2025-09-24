import { cn } from "@/lib/utils/cn";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn(
      "base-class",
      true && "conditional-class",
      false && "excluded-class"
    );
    expect(result).toBe("base-class conditional-class");
  });

  it("handles arrays of classes", () => {
    const result = cn(["class1", "class2"], "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("handles objects with boolean values", () => {
    const result = cn({
      class1: true,
      class2: false,
      class3: true,
    });
    expect(result).toBe("class1 class3");
  });

  it("handles undefined and null values", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("merges Tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });
});
