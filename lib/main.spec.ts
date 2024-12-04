import { describe, expect, test } from "vitest";
import {
  ConstraintContext,
  ConstraintValidator,
  isAssignableTo,
  NativeTypes,
  VALID,
  ValidationError,
  ValueType,
} from "./main";

const test_constraint_context: ConstraintContext = {
  minlength: ((from: { length: number }) => {
    return (to: typeof from) => {
      if (!to) {
        return {
          valid: false,
          errors: {
            minlength: `string min length not specified, but type requires (${from.length})`,
          },
        };
      }
      if (to < from) {
        return {
          valid: false,
          errors: {
            minlength: `string length ${to.length} is less than ${from.length}`,
          },
        };
      }
      return VALID;
    };
  }) as (data: any) => ConstraintValidator<any>,
};

describe("run-types", () => {
  describe("assignable to", () => {
    test("string => string", () => {
      expect(
        isAssignableTo(
          NativeTypes.string,
          test_constraint_context
        )(NativeTypes.string).valid
      ).toBe(true);
    });

    test("string => string with constraints", () => {
      const result = isAssignableTo(
        { ...NativeTypes.string, constraints: { minlength: { length: 1 } } },
        test_constraint_context
      )(NativeTypes.string);
      expect(result.valid).toBe(false);

      expect((result as ValidationError).errors).toEqual({
        minlength: "string min length not specified, but type requires (1)",
      });
    });

    test("string => number", () => {
      expect(
        isAssignableTo(
          NativeTypes.string,
          test_constraint_context
        )(NativeTypes.number).valid
      ).toBe(false);
    });

    test("string => boolean", () => {
      expect(
        isAssignableTo(
          NativeTypes.string,
          test_constraint_context
        )(NativeTypes.boolean).valid
      ).toBe(false);
    });

    test("map => self", () => {
      const from: ValueType = {
        __type: "map",
        members: {
          a: NativeTypes.string,
          b: NativeTypes.string,
        },
      };
      expect(isAssignableTo(from, test_constraint_context)(from).valid).toBe(
        true
      );
    });

    test("map => subset missing key", () => {
      const from: ValueType = {
        __type: "map",
        members: {
          a: NativeTypes.string,
          b: NativeTypes.string,
        },
      };
      const to: ValueType = {
        __type: "map",
        members: {
          a: NativeTypes.string,
        },
      };
      const result = isAssignableTo(from, test_constraint_context)(to);
      expect(isAssignableTo(from, test_constraint_context)(to).valid).toBe(
        false
      );
      expect((result as ValidationError).errors.type).toBe(
        'map {a: native string, b: native string} not assignable to map {a: native string}; missing key: "b"'
      );
    });

    test("map => subset incorrect field type", () => {
      const from: ValueType = {
        __type: "map",
        members: {
          a: NativeTypes.string,
          b: NativeTypes.string,
        },
      };
      const to: ValueType = {
        __type: "map",
        members: {
          a: NativeTypes.string,
          b: NativeTypes.number,
        },
      };
      const result = isAssignableTo(from, test_constraint_context)(to);
      expect(isAssignableTo(from, test_constraint_context)(to).valid).toBe(
        false
      );
      expect((result as ValidationError).errors.type).toBe(
        'map {a: native string, b: native string} not assignable to map {a: native string, b: native number}; key "b" not assignable to native number'
      );
    });

    test("map => superset", () => {
      const from: ValueType = {
        __type: "map",
        members: {
          a: NativeTypes.string,
          b: NativeTypes.string,
        },
      };
      const to: ValueType = {
        __type: "map",
        members: {
          a: NativeTypes.string,
          b: NativeTypes.string,
          c: NativeTypes.string,
        },
      };
      expect(isAssignableTo(from, test_constraint_context)(to).valid).toBe(
        true
      );
    });

    test("list => self", () => {
      const from: ValueType = {
        __type: "list",
        members: NativeTypes.string,
      };
      expect(isAssignableTo(from, test_constraint_context)(from).valid).toBe(
        true
      );
    });

    test("list => incorrect type", () => {
      const from: ValueType = {
        __type: "list",
        members: NativeTypes.string,
      };
      const to: ValueType = {
        __type: "list",
        members: NativeTypes.number,
      };
      const result = isAssignableTo(from, test_constraint_context)(to);
      expect(isAssignableTo(from, test_constraint_context)(to).valid).toBe(
        false
      );
      expect((result as ValidationError).errors.type).toBe(
        "list [native string] not assignable to list [native number]; list members do not match: native string not assignable to native number; native types do not match"
      );
    });

    test("union type", () => {
        const union: ValueType = {
            __type: "union",
            members: [
                NativeTypes.string,
                NativeTypes.number
            ]
        }

        expect(isAssignableTo(union, test_constraint_context)(NativeTypes.string).valid).toBe(true);
        expect(isAssignableTo(union, test_constraint_context)(NativeTypes.number).valid).toBe(true);
        expect(isAssignableTo(union, test_constraint_context)(NativeTypes.boolean).valid).toBe(false);
    });

    test("intersection type", () => {

        const a: ValueType = {
            __type: "map",
            members: {
              a: NativeTypes.string,
              b: NativeTypes.string,
            },
          };
          const b: ValueType = {
            __type: "map",
            members: {
              a: NativeTypes.string,
              c: NativeTypes.string,
            },
          };

        const intersection: ValueType = {
            __type: "intersection",
            members: [
                a,
                b
            ]
        }

        const result = isAssignableTo(intersection, test_constraint_context)(a);

        expect(result.valid).toBe(false);
        expect((result as ValidationError).errors.type).toBe(
            `intersection [map {a: native string, b: native string}, map {a: native string, c: native string}] not assignable to map {a: native string, b: native string}; map {a: native string, c: native string} not assignable to map {a: native string, b: native string}; missing key: "c"`
        )

    });
  });
});
