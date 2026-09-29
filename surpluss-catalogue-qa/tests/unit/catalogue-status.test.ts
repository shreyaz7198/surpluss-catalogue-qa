import { describe, it, expect } from "vitest";
import { effectiveStatus } from "@/lib/catalogue-status";

describe("Catalogue Status Lifecycle (src/lib/catalogue-status.ts)", () => {
    it("treats legacy 'inactive' and 'expired' statuses as 'draft'", () => {
        expect(effectiveStatus("inactive", null)).toBe("draft");
        expect(effectiveStatus("expired", null)).toBe("draft");
    });

    it("returns 'draft' when status is draft, regardless of expiry date", () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days ahead
        expect(effectiveStatus("draft", futureDate)).toBe("draft");
        expect(effectiveStatus("draft", null)).toBe("draft");
    });

    it("keeps published catalogue as 'published' when expiresAt is null (no expiry)", () => {
        expect(effectiveStatus("published", null)).toBe("published");
    });

    // FAILING TEST FOR BUG 2: Valid future date marked as expired
    it("BUG: published catalogue with a future expiry date should remain published", () => {
        const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days in future
        const status = effectiveStatus("published", futureDate);
        expect(status).toBe("published");
    });

    // FAILING TEST FOR BUG 2: Past expiry date should transition to expired
    it("BUG: published catalogue with a past expiry date should be marked expired", () => {
        const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2); // 2 days ago
        const status = effectiveStatus("published", pastDate);
        expect(status).toBe("expired");
    });
});