import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/utils/format";

describe("Format Utilities", () => {
  const testDate = new Date("2023-12-25T10:30:00Z");

  describe("formatDate", () => {
    it("formats date as full date string", () => {
      const result = formatDate(testDate);
      expect(result).toBe("December 25, 2023");
    });

    it("accepts string input", () => {
      const result = formatDate("2023-12-25T12:00:00Z");
      expect(result).toBe("December 25, 2023");
    });

    it("accepts number input", () => {
      const result = formatDate(testDate.getTime());
      expect(result).toBe("December 25, 2023");
    });
  });

  describe("formatTime", () => {
    it("formats time in 12-hour format", () => {
      const result = formatTime(testDate);
      // Note: This will vary based on timezone, so we check format structure
      expect(result).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
    });
  });

  describe("formatDateTime", () => {
    it("formats date and time together", () => {
      const result = formatDateTime(testDate);
      expect(result).toMatch(
        /^[A-Za-z]{3}\s\d{1,2},\s\d{4},\s\d{1,2}:\d{2}\s?(AM|PM)$/
      );
    });
  });

  describe("formatRelativeTime", () => {
    beforeAll(() => {
      // Mock the current date for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2023-12-25T12:00:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("formats future date as relative time", () => {
      const futureDate = new Date("2023-12-26T12:00:00Z");
      const result = formatRelativeTime(futureDate);
      expect(result).toBe("tomorrow");
    });

    it("formats past date as relative time", () => {
      const pastDate = new Date("2023-12-24T12:00:00Z");
      const result = formatRelativeTime(pastDate);
      expect(result).toBe("yesterday");
    });

    it("formats hours correctly", () => {
      const pastDate = new Date("2023-12-25T10:00:00Z");
      const result = formatRelativeTime(pastDate);
      expect(result).toBe("2 hours ago");
    });
  });
});
