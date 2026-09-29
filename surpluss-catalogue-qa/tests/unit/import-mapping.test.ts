import { describe, it, expect } from "vitest";
import { autoMap, parseNumber, validateRows, type ParsedFile } from "@/lib/import-mapping";

describe("Spreadsheet Import Mapping (src/lib/import-mapping.ts)", () => {
    describe("parseNumber", () => {
        it("parses currency strings and formatted numbers properly", () => {
            expect(parseNumber("₹1,299")).toBe(1299);
            expect(parseNumber("$549.50")).toBe(549.5);
            expect(parseNumber("1200")).toBe(1200);
            expect(parseNumber("")).toBeNull();
            expect(parseNumber("N/A")).toBeNull();
        });
    });

    describe("autoMap", () => {
        it("maps exact standard header names accurately", () => {
            const headers = ["SKU", "Product Name", "Brand", "Category", "MRP", "Offer Price", "Quantity"];
            const mapping = autoMap(headers);

            expect(mapping["SKU"]).toBe("sku");
            expect(mapping["Product Name"]).toBe("name");
            expect(mapping["MRP"]).toBe("mrp");
            expect(mapping["Offer Price"]).toBe("offerPrice");
            expect(mapping["Quantity"]).toBe("quantity");
        });

        // Substring collision check
        it("BUG: maps 'List Price' to MRP rather than colliding into offerPrice via 'price' substring", () => {
            const headers = ["List Price", "Selling Price"];
            const mapping = autoMap(headers);

            expect(mapping["List Price"]).toBe("mrp");
            expect(mapping["Selling Price"]).toBe("offerPrice");
        });
    });

    describe("validateRows", () => {
        const mapping = {
            SKU: "sku" as const,
            "Product Name": "name" as const,
            Quantity: "quantity" as const,
            MRP: "mrp" as const,
            "Offer Price": "offerPrice" as const,
        };

        it("blocks rows with missing SKU or missing product name", () => {
            const file: ParsedFile = {
                name: "test.csv",
                sizeKB: 1,
                headers: ["SKU", "Product Name", "Quantity"],
                rows: [
                    { SKU: "", "Product Name": "Sample", Quantity: "10" },
                    { SKU: "SKU-1", "Product Name": "", Quantity: "10" },
                ],
            };

            const result = validateRows(file, mapping);
            expect(result.rows).toHaveLength(0);
            expect(result.issues).toHaveLength(2);
            expect(result.issues.every((i) => i.blocking)).toBe(true);
        });

        it("blocks duplicate SKUs across rows", () => {
            const file: ParsedFile = {
                name: "test.csv",
                sizeKB: 1,
                headers: ["SKU", "Product Name", "Quantity"],
                rows: [
                    { SKU: "DUP-1", "Product Name": "Item 1", Quantity: "5" },
                    { SKU: "DUP-1", "Product Name": "Item 2", Quantity: "10" },
                ],
            };

            const result = validateRows(file, mapping);
            expect(result.issues.some((i) => i.message.includes("appears more than once"))).toBe(true);
        });

        it("flags non-https image links as non-blocking warnings", () => {
            const file: ParsedFile = {
                name: "test.csv",
                sizeKB: 1,
                headers: ["SKU", "Product Name", "Quantity", "Image URL"],
                rows: [
                    {
                        SKU: "IMG-1",
                        "Product Name": "Item",
                        Quantity: "5",
                        "Image URL": "http://insecure.com/pic.jpg",
                    },
                ],
            };

            const customMapping = { ...mapping, "Image URL": "imageUrl" as const };
            const result = validateRows(file, customMapping);
            expect(result.warnings).toBe(1);
            expect(result.rows[0].imageUrl).toBeUndefined();
        });
    });
});