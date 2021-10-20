import { slugify } from "./slugify";

describe("slugify", () => {
  test("does not preserve forward slashes", () => {
    expect(slugify("CFMM / core")).toEqual("cfmm-core");
  });

  test("does not emojis", () => {
    expect(slugify("cfmm/🏢 Core")).toEqual("cfmm-core");
  });
});
