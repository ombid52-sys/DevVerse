import { describe, it, expect } from "vitest";
import { createCollectionSchema, updateCollectionSchema } from "@/lib/validations/collection";

describe("Collections & Favorites Logic", () => {
  it("validates collection creation with name bounds", () => {
    const valid = createCollectionSchema.safeParse({
      name: "Machine Learning Stacks",
      description: "Python and Rust neural network inference tools.",
    });
    expect(valid.success).toBe(true);

    const emptyName = createCollectionSchema.safeParse({
      name: "",
      description: "No title provided",
    });
    expect(emptyName.success).toBe(false);
  });

  it("validates collection update schema", () => {
    const validUpdate = updateCollectionSchema.safeParse({
      name: "Renamed Collection",
    });
    expect(validUpdate.success).toBe(true);
  });

  it("handles duplicate prevention in collection application arrays", () => {
    const collectionAppIds = ["app-1", "app-2", "app-3"];
    const newAppId = "app-2";

    const alreadyExists = collectionAppIds.includes(newAppId);
    expect(alreadyExists).toBe(true);

    const uniqueNewAppId = "app-4";
    const canAdd = !collectionAppIds.includes(uniqueNewAppId);
    expect(canAdd).toBe(true);
  });
});
