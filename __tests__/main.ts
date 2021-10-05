import recreate from "../src/index";

const hasOwn = Object.prototype.hasOwnProperty;

const isObject = (obj: unknown): obj is Record<string, unknown> =>
  obj && obj !== null && !Array.isArray(obj);

const spyedConsole = {};

for (const key in global.console) {
  if (
    hasOwn.call(global.console, key) &&
    typeof global.console[key] === "function"
  ) {
    spyedConsole[key] = jest.spyOn(global.console, key);
  }
}

test("should export only one default function", async () => {
  const exports = await import("../src/index");
  expect(Object.keys(exports)).toStrictEqual(["default"]);
  expect(typeof exports.default).toBe("function");
});

test("shouldn't mutate given object", () => {
  const given = {};
  expect(given).not.toBe(recreate(given));
});

test("should return given primitive", () => {
  [0, false, "!", Symbol("a"), BigInt(1e100)].forEach((given) => {
    expect(given).toBe(recreate(given));
  });
});

test("should handle given object", () => {
  const given = {};
  expect(isObject(recreate(given))).toBeTruthy();
  expect(given).not.toBe(recreate(given));
});

test("should handle given array", () => {
  const given = [];
  expect(Array.isArray(recreate(given))).toBeTruthy();
  expect(given).not.toBe(recreate(given));
});

test("should handle given set", () => {
  const given = new Set();
  expect(recreate(given) instanceof Set).toBeTruthy();
  expect(given).not.toBe(recreate(given));
});

test("should handle given map", () => {
  const given = new Map();
  expect(recreate(given) instanceof Map).toBeTruthy();
  expect(given).not.toBe(recreate(given));
});

test("should copy properties from object", () => {
  const given = { a: 1, b: 2, c: 3 };
  const taken = recreate(given);

  for (const key in given) {
    expect(typeof taken[key]).not.toBe("undefined");
    expect(given[key]).toBe(taken[key]);
  }
});

test("shouldn't copy prototype properties", () => {
  Object.prototype.prototypeProperty = function () {};
  const given = { a: 1, b: 2, c: 3 };

  const taken = recreate(given);
  delete Object.prototype.prototypeProperty;
  expect("prototypeProperty" in taken).toBeFalsy();
});

test("should properly handle nested structures", () => {
  const given = {
    nested: { a: 1, b: 2, c: 3 },
  };
  const taken = recreate(given);
  expect(taken.nested).not.toBe(undefined);
  expect(taken.nested.constructor).toBe(given.nested.constructor);
});

test("should handle property of nested object", () => {
  const given = {
    nestedObject: { a: 1, b: 2, c: 3 },
  };
  const taken = recreate(given);

  for (const key in given.nestedObject) {
    expect(taken.nestedObject[key]).toBe(given.nestedObject[key]);
  }
});

test("should handle property of nested array", () => {
  const given = {
    nestedArray: [1, 2, 3],
  };
  const taken = recreate(given);

  for (const key in given.nestedArray) {
    expect(taken.nestedArray[key]).toBe(given.nestedArray[key]);
  }
});

test("should handle property of nested map", () => {
  const given = {
    nestedMap: new Map([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]),
  };
  const taken = recreate(given);

  for (const [key, value] of taken.nestedMap) {
    expect(value).toBe(given.nestedMap.get(key));
  }
});

// this test should be last
test("shouldn't call console methods", () => {
  for (const key in spyedConsole) {
    expect(spyedConsole[key]).not.toHaveBeenCalled();
    spyedConsole[key].mockReset();
    spyedConsole[key].mockRestore();
  }
});
