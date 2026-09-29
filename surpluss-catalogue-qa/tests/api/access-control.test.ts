import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/server 'after' hook so it doesn't throw inside Node
vi.mock("next/server", async (importOriginal) => {
    const actual = await importOriginal<typeof import("next/server")>();
    return {
        ...actual,
        after: vi.fn((fn: () => void) => {
            // no-op in tests
        }),
    };
});

// Mock next/cache
vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

// Mock @/auth
vi.mock("@/auth", () => ({
    auth: vi.fn(),
}));

// Mock @/lib/prisma
const mockPrisma = {
    catalogue: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
    },
    catalogueListing: {
        findMany: vi.fn(),
        createMany: vi.fn(),
    },
    product: {
        findMany: vi.fn(),
    },
    enquiry: {
        create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
};

vi.mock("@/lib/prisma", () => ({
    getPrisma: () => mockPrisma,
}));

// Mock @/lib/incomplete
vi.mock("@/lib/incomplete", () => ({
    findIncompleteProducts: vi.fn().mockResolvedValue([]),
    incompleteMessage: vi.fn(),
    INCOMPLETE_PRODUCT_WHERE: {},
}));

// Mock @/lib/notifications
vi.mock("@/lib/notifications", () => ({
    notifyTeam: vi.fn(),
}));

// Mock helpers to avoid complex DTO transform errors
vi.mock("@/app/api/admin/catalogues/helpers", () => ({
    CATALOGUE_INCLUDE: {},
    toCatalogueDto: vi.fn((cat) => ({ id: cat.id, slug: cat.slug })),
    validUntilToExpiresAt: vi.fn(() => null),
}));

import { auth } from "@/auth";
import { PATCH } from "@/app/api/admin/catalogues/[id]/route";
import { POST as postEnquiry } from "@/app/api/enquiries/route";

describe("API & Access Control Tests (Task 3)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Admin Catalogues API - Authorization Guards", () => {
        const validUuid = "11111111-1111-4111-8111-111111111111";

        it("returns 401 Unauthorized when an unauthenticated user calls PATCH", async () => {
            vi.mocked(auth).mockResolvedValue(null as any);

            const request = new Request("http://localhost/api/admin/catalogues/" + validUuid, {
                method: "PATCH",
                body: JSON.stringify({
                    name: "Test Catalogue",
                    slug: "test-slug",
                    description: "Description",
                    status: "draft",
                    banners: [],
                }),
            });

            const response = await PATCH(request, { params: Promise.resolve({ id: validUuid }) });
            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe("Unauthorized");
        });

        // FAILING TEST FOR SECURITY BUG: Staff role should NOT be allowed to publish catalogues
        it("SECURITY BUG: blocks staff from publishing a catalogue (should return 403 Forbidden)", async () => {
            // Authenticated as STAFF
            vi.mocked(auth).mockResolvedValue({
                user: { id: "user-staff", email: "staff@example.com", role: "staff" },
                expires: "2099-01-01",
            } as any);

            mockPrisma.catalogue.findUnique.mockResolvedValue({
                id: validUuid,
                slug: "existing-catalogue",
                status: "draft",
            });

            mockPrisma.catalogue.update.mockResolvedValue({
                id: validUuid,
                slug: "existing-catalogue",
                status: "published",
                banners: [],
            });

            const request = new Request("http://localhost/api/admin/catalogues/" + validUuid, {
                method: "PATCH",
                body: JSON.stringify({
                    name: "Updated Name",
                    slug: "existing-catalogue",
                    description: "Valid description text",
                    category: "Electronics",
                    notifyNumber: "919876543210",
                    validUntil: "2026-12-31",
                    status: "published", // Attempting to publish as staff!
                    banners: [],
                }),
            });

            const response = await PATCH(request, { params: Promise.resolve({ id: validUuid }) });

            // In auth-guards.ts: "Publishing a catalogue and deleting a catalogue are the two actions the sales team must not perform on their own... Both are admin-only."
            // The bug: The endpoint does not check for admin role and returns 200 OK to staff.
            // Expected secure behavior: 403 Forbidden.
            expect(response.status).toBe(403);
        });
    });

    describe("Public Enquiries API - Status Guards", () => {
        const validUuid = "22222222-2222-4222-8222-222222222222";
        const productId = "33333333-3333-4333-8333-333333333333";

        // FAILING TEST: Route allows enquiries on draft / unpublished catalogues
        it("BUG: should reject enquiry submission when catalogue is in draft status", async () => {
            mockPrisma.catalogue.findUnique.mockResolvedValue({
                id: validUuid,
                status: "draft", // Catalogue is in draft status
                expiresAt: null,
                notifyNumber: null,
            });

            mockPrisma.catalogueListing.findMany.mockResolvedValue([
                {
                    id: "listing-1",
                    productId,
                    product: {
                        name: "Item",
                        sku: "SKU1",
                        brand: "Brand",
                        offerPrice: 100,
                        priceOnRequest: false,
                        moq: 1,
                        quantity: 50,
                    },
                },
            ]);

            mockPrisma.enquiry.create.mockResolvedValue({ id: "enq-1" });

            const request = new Request("http://localhost/api/enquiries", {
                method: "POST",
                body: JSON.stringify({
                    catalogueId: validUuid,
                    name: "Buyer Name",
                    phone: "9876543210",
                    countryCode: "+91",
                    items: [{ productId, quantity: 5 }],
                }),
            });

            const response = await postEnquiry(request);

            // Business rule: Enquiries should NOT be allowed on draft catalogues.
            // Expected: 400 Bad Request or 404 Not Found.
            // Actual bug in route.ts: It succeeds and returns 201 Created.
            expect(response.status).toBe(400);
        });
    });
});