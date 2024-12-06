type ValueTypeType<T extends string> = {
  __type: T;
  constraints?: ValueConstraints;
};

type ValueConstraints = Record<ConstraintName, unknown>;

const EMPTY_VALUE = "empty" as const;

export type EmptyType = ValueTypeType<typeof EMPTY_VALUE>;

const ANY_VALUE = "any" as const;

export type AnyType = ValueTypeType<typeof ANY_VALUE>;

type ConstraintName = string;

export type ValidationSuccess = {
  valid: true;
};

export type ValidationError = {
  valid: false;
  errors: Record<ConstraintName, string>;
};

type ValidationResult = ValidationSuccess | ValidationError;
type TypeValidator = (value: ValueType) => ValidationResult;
export type ConstraintValidator<T> = (data: T) => ValidationResult;

export type ConstraintContext = Record<
  ConstraintName,
  <T>(data: T) => ConstraintValidator<T>
>;

const NATIVE_VALUE = "native" as const;

type NativeType = ValueTypeType<typeof NATIVE_VALUE> & {
  native: NativeTypeKey;
};

type NativeTypeKey = "string" | "number" | "boolean";

export const VALID = Object.freeze({
  valid: true,
});

export const expectedErrorMessage = (expected: string, actual: string) => {
  return `Expected ${expected} but got ${actual}`;
};

export const typeLabel = (type: string) => `type: ${type}`;

export const isNativeType: TypeValidator = (value: ValueType) => {
  if (value.__type === NATIVE_VALUE) {
    return VALID;
  }
  return {
    valid: false,
    errors: {
      type: expectedErrorMessage(
        typeLabel(NATIVE_VALUE),
        typeLabel(value.__type)
      ),
    },
  };
};

export const nativeTypeValidator: (type: NativeTypeKey) => TypeValidator =
  (type: NativeTypeKey) =>
  (value: ValueType): ValidationResult => {
    if (value.__type === NATIVE_VALUE && value.native === type) {
      return VALID;
    }
    return {
      valid: false,
      errors: {
        type: expectedErrorMessage(`native ${type}`, typeLabel(value.__type)),
      },
    };
  };

export const NativeTypes: Record<NativeType[typeof NATIVE_VALUE], NativeType> =
  {
    string: {
      __type: NATIVE_VALUE,
      native: "string",
    },
    number: {
      __type: NATIVE_VALUE,
      native: "number",
    },
    boolean: {
      __type: NATIVE_VALUE,
      native: "boolean",
    },
  };

const MAP_VALUE = "map" as const;
type MapType = ValueTypeType<typeof MAP_VALUE> & {
  members: Record<string, ValueType>;
};

const LIST_VALUE = "list" as const;
type ListType = ValueTypeType<typeof LIST_VALUE> & {
  members: ValueType;
};

const TUPLE_VALUE = "tuple" as const;
type TupleType = ValueTypeType<typeof TUPLE_VALUE> & {
  members: ValueType[];
};

const FUNCTION_VALUE = "function" as const;
type FunctionType = ValueTypeType<typeof FUNCTION_VALUE> & {
  args: ValueType[];
  returns: ValueType;
};

function assignableErrorMessage(
  actual: ValueType,
  expected: ValueType,
  context: string
) {
  return `${toString(expected)} not assignable to ${toString(
    actual
  )}; ${context}`;
}

function flattenResults(results: ValidationResult[]) {
  return results.reduce((acc, result) => {
    if (result.valid) {
      return acc;
    }
    return {
      valid: false,
      errors: {
        ...(acc.valid ? {} : acc.errors),
        ...result.errors,
      },
    };
  }, VALID);
}

function checkConstraints(
  constraints: ValueConstraints | undefined,
  context: ConstraintContext,
  value: ValueType
) {
  if (constraints) {
    const results = Object.entries(constraints).map(([name, data]) => {
      if (context[name]) {
        const validator = context[name](data);
        const result = validator(value.constraints?.[name]);
        if (!result.valid) {
          return {
            valid: false,
            errors: {
              [name]: result.errors[name],
            },
          };
        }
      }
      return VALID;
    });

    return flattenResults(results);
  }
  return VALID;
}

const isAssignableToNative = (type: NativeType, context: ConstraintContext) => {
  return (value: ValueType) => {
    const result = checkConstraints(type.constraints, context, value);
    if (!result.valid) {
      return result;
    }

    if (value.__type === NATIVE_VALUE && value.native === type.native) {
      return VALID;
    }

    return {
      valid: false,
      errors: {
        type: assignableErrorMessage(value, type, "native types do not match"),
      },
    };
  };
};

const isAssignableToMap = (type: MapType, context: ConstraintContext) => {
  return (value: ValueType) => {
    const result = checkConstraints(type.constraints, context, value);
    if (!result.valid) {
      return result;
    }

    if (value.__type === "map") {
      // compare keys
      const typeKeys = Object.keys(type.members);

      // compare values
      for (let i = 0; i < typeKeys.length; i++) {
        const typeKey = typeKeys[i];

        if (!(typeKey in value.members)) {
          return {
            valid: false,
            errors: {
              type: assignableErrorMessage(
                value,
                type,
                `missing key: "${typeKey}"`
              ),
            },
          };
        }
        const valueValueType = value.members[typeKey];
        const typeValueType = type.members[typeKey];
        if (!isAssignableTo(typeValueType, context)(valueValueType).valid) {
          return {
            valid: false,
            errors: {
              type: assignableErrorMessage(
                value,
                type,
                `key "${typeKey}" not assignable to ${toString(valueValueType)}`
              ),
            },
          };
        }
      }
      return VALID;
    }
    return {
      valid: false,
      errors: {
        type: assignableErrorMessage(value, type, `type is not a map`),
      },
    };
  };
};

function isAssignableToList(type: ListType, context: ConstraintContext) {
  return (value: ValueType) => {
    if (value.__type === "list") {
      const constraint_result = checkConstraints(
        type.constraints,
        context,
        value
      );
      if (!constraint_result.valid) {
        return constraint_result;
      }

      const result = isAssignableTo(type.members, context)(value.members);
      if (result.valid) {
        return VALID;
      }

      return {
        valid: false,
        errors: {
          type: assignableErrorMessage(
            value,
            type,
            `list members do not match: ${result.errors.type}`
          ),
        },
      };
    }
    return {
      valid: false,
      errors: {
        type: assignableErrorMessage(value, type, `type is not a list`),
      },
    };
  };
}

function isAssignableToTuple(type: TupleType, context: ConstraintContext) {
  return (value: ValueType) => {
    if (value.__type === "tuple") {
      const constraint_result = checkConstraints(
        type.constraints,
        context,
        value
      );
      if (!constraint_result.valid) {
        return constraint_result;
      }

      if (value.members.length !== type.members.length) {
        return {
          valid: false,
          errors: {
            type: assignableErrorMessage(
              value,
              type,
              `tuple length does not match`
            ),
          },
        };
      }
      for (let i = 0; i < type.members.length; i++) {
        if (!isAssignableTo(type.members[i], context)(value.members[i]).valid) {
          return {
            valid: false,
            errors: {
              type: assignableErrorMessage(
                value,
                type,
                `tuple member ${i} not assignable to ${toString(
                  value.members[i]
                )}`
              ),
            },
          };
        }
      }
      return VALID;
    }
    return {
      valid: false,
      errors: {
        type: assignableErrorMessage(value, type, `type is not a tuple`),
      },
    };
  };
}

function isAssignableToFunction(
  type: FunctionType,
  context: ConstraintContext
) {
  return (value: ValueType) => {
    if (value.__type === "function") {
      const constraint_result = checkConstraints(
        type.constraints,
        context,
        value
      );
      if (!constraint_result.valid) {
        return constraint_result;
      }
      const return_result = isAssignableTo(
        type.returns,
        context
      )(value.returns);

      if (!return_result.valid) {
        return return_result;
      }


      if (type.args.length !== value.args.length) {
        return {
          valid: false,
          errors: {
            type: assignableErrorMessage(
              value,
              type,
              `function argument length does not match`
            ),
          },
        };
      }
      for (let i = 0; i < type.args.length; i++) {
        if (!isAssignableTo(type.args[i], context)(value.args[i]).valid) {
          return {
            valid: false,
            errors: {
              type: assignableErrorMessage(
                value,
                type,
                `function argument ${i} not assignable to ${toString(
                  value.args[i]
                )}`
              ),
            },
          };
        }
      }
      return VALID;
    }
    return {
      valid: false,
      errors: {
        type: assignableErrorMessage(value, type, `type is not a function`),
      },
    };
  };
}

function isAssignableToUnion(type: UnionType, context: ConstraintContext) {
  return (value: ValueType) => {
    const constraint_result = checkConstraints(
      type.constraints,
      context,
      value
    );
    if (!constraint_result.valid) {
      return constraint_result;
    }
    for (let i = 0; i < type.members.length; i++) {
      if (isAssignableTo(type.members[i], context)(value).valid) {
        return VALID;
      }
    }
    return {
      valid: false,
      errors: {
        type: assignableErrorMessage(
          value,
          type,
          `type assignable to any member of union`
        ),
      },
    };
  };
}

function isAssignableToIntersection(
  type: IntersectionType,
  context: ConstraintContext
) {
  return (value: ValueType) => {
    const constraint_result = checkConstraints(
      type.constraints,
      context,
      value
    );
    if (!constraint_result.valid) {
      return constraint_result;
    }
    for (let i = 0; i < type.members.length; i++) {
      const result = isAssignableTo(type.members[i], context)(value);
      if (!result.valid) {
        return {
          valid: false,
          errors: {
            type: assignableErrorMessage(value, type, result.errors.type),
          },
        };
      }
    }
    return VALID;
  };
}

export const isAssignableTo: (
  type: ValueType,
  context: ConstraintContext
) => TypeValidator = (type: ValueType, context: ConstraintContext) => {
  switch (type.__type) {
    case NATIVE_VALUE:
      return isAssignableToNative(type, context);
    case MAP_VALUE:
      return isAssignableToMap(type, context);
    case LIST_VALUE:
      return isAssignableToList(type, context);
    case TUPLE_VALUE:
      return isAssignableToTuple(type, context);
    case FUNCTION_VALUE:
      return isAssignableToFunction(type, context);
    case UNION_VALUE:
      return isAssignableToUnion(type, context);
    case INTERSECTION_VALUE:
      return isAssignableToIntersection(type, context);
    case EMPTY_VALUE:
    case ANY_VALUE:
      return () => VALID;

  }
};

function toStringList(types: ValueType[]): string {
  return types.map(toString).join(", ");
}

function toString(type: ValueType): string {
  switch (type.__type) {
    case NATIVE_VALUE:
      return `native ${type.native}`;
    case MAP_VALUE:
      return `map {${Object.entries(type.members)
        .map(([key, value]) => `${key}: ${toString(value)}`)
        .join(", ")}}`;
    case LIST_VALUE:
      return `list [${toStringList([type.members])}]`;
    case TUPLE_VALUE:
      return `tuple [${toStringList(type.members)}]`;
    case FUNCTION_VALUE:
      return `function (${toStringList(type.args)}) => ${toString(
        type.returns
      )}`;
    case UNION_VALUE:
      return `union [${toStringList(type.members)}]`;
    case INTERSECTION_VALUE:
      return `intersection [${toStringList(type.members)}]`;
    case EMPTY_VALUE:
      return `[empty]`;
    case ANY_VALUE:
      return `[any]`;
  }
}

export function createFunctionType(
  args: ValueType[],
  returns: ValueType
): FunctionType {
  return {
    __type: "function",
    args,
    returns,
  };
}

export function createOptionalType(type: ValueType): ValueType {
  return {
    __type: "union",
    members: [type, { __type: "empty" }],
  };
}

const UNION_VALUE = "union" as const;
/* 'Or' type */
type UnionType = ValueTypeType<typeof UNION_VALUE> & {
  members: ValueType[];
};

const INTERSECTION_VALUE = "intersection" as const;
/* 'And' type */
type IntersectionType = ValueTypeType<typeof INTERSECTION_VALUE> & {
  members: ValueType[];
};

export type ValueType =
  | NativeType
  | MapType
  | ListType
  | FunctionType
  | TupleType
  | UnionType
  | IntersectionType
  | EmptyType
  | AnyType;
