import { describe, it, expect } from "vitest";
import {
    discountPercent,
    priceLabel,
    needsPricesForSale,
    PRICE_ON_REQUEST_LABEL,
    NO_PRICE_LABEL,
} from "@/lib/pricing";

describe("Pricing Logic (src/lib/pricing.ts)", () => {
    describe("discountPercent", () => {
        it("calculates normal discount correctly", () => {
            // 100 MRP, 80 Offer Price = 20% discount
            expect(discountPercent({ priceOnRequest: false, mrp: 100, offerPrice: 80 })).toBe(20);
            // 1000 MRP, 500 Offer Price = 50% discount
            expect(discountPercent({ priceOnRequest: false, mrp: 1000, offerPrice: 500 })).toBe(50);
            // Rounding check: 100 MRP, 66.6 Offer Price ~ 33%
            expect(discountPercent({ priceOnRequest: false, mrp: 100, offerPrice: 66.6 })).toBe(33);
        });

        it("returns 0 when priceOnRequest is true", () => {
            expect(discountPercent({ priceOnRequest: true, mrp: 100, offerPrice: 50 })).toBe(0);
        });

        it("returns 0 when mrp or offerPrice is null or 0", () => {
            expect(discountPercent({ priceOnRequest: false, mrp: null, offerPrice: 50 })).toBe(0);
            expect(discountPercent({ priceOnRequest: false, mrp: 100, offerPrice: null })).toBe(0);
            expect(discountPercent({ priceOnRequest: false, mrp: 0, offerPrice: 50 })).toBe(0);
            expect(discountPercent({ priceOnRequest: false, mrp: 100, offerPrice: 0 })).toBe(0);
        });

        it("returns 0 when values are non-finite (NaN or Infinity)", () => {
            expect(discountPercent({ priceOnRequest: false, mrp: NaN, offerPrice: 50 })).toBe(0);
            expect(discountPercent({ priceOnRequest: false, mrp: 100, offerPrice: Infinity })).toBe(0);
        });

        // FAILING TEST FOR BUG: Negative discount when offerPrice > mrp
        it("BUG: should not return a negative discount when offer price exceeds MRP", () => {
            // When Offer Price (120) is higher than MRP (100), discount should be 0%, not -20%
            const discount = discountPercent({ priceOnRequest: false, mrp: 100, offerPrice: 120 });
            expect(discount).toBe(0);
        });
    });

    describe("priceLabel", () => {
        const formatter = (n: number) => `₹${n.toLocaleString("en-IN")}`;

        it("shows PRICE_ON_REQUEST_LABEL when priceOnRequest is enabled", () => {
            expect(priceLabel({ priceOnRequest: true, offerPrice: 500 }, formatter)).toBe(PRICE_ON_REQUEST_LABEL);
        });

        it("formats the offer price when present and priceOnRequest is false", () => {
            expect(priceLabel({ priceOnRequest: false, offerPrice: 1500 }, formatter)).toBe("₹1,500");
        });

        it("shows NO_PRICE_LABEL when offerPrice is null", () => {
            expect(priceLabel({ priceOnRequest: false, offerPrice: null }, formatter)).toBe(NO_PRICE_LABEL);
        });
    });

    describe("needsPricesForSale", () => {
        it("returns false if priceOnRequest is true, regardless of prices", () => {
            expect(needsPricesForSale({ priceOnRequest: true, mrp: null, offerPrice: null })).toBe(false);
        });

        it("returns true if either mrp or offerPrice is null when priceOnRequest is false", () => {
            expect(needsPricesForSale({ priceOnRequest: false, mrp: 100, offerPrice: null })).toBe(true);
            expect(needsPricesForSale({ priceOnRequest: false, mrp: null, offerPrice: 80 })).toBe(true);
            expect(needsPricesForSale({ priceOnRequest: false, mrp: null, offerPrice: null })).toBe(true);
        });

        it("returns false if both mrp and offerPrice are provided", () => {
            expect(needsPricesForSale({ priceOnRequest: false, mrp: 100, offerPrice: 80 })).toBe(false);
        });
    });
});