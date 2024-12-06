type ValueTypeType<T extends string> = {
    __type: T;
    constraints?: ValueConstraints;
};
type ValueConstraints = Record<ConstraintName, unknown>;
declare const EMPTY_VALUE: "empty";
export type EmptyType = ValueTypeType<typeof EMPTY_VALUE>;
declare const ANY_VALUE: "any";
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
export type ConstraintContext = Record<ConstraintName, <T>(data: T) => ConstraintValidator<T>>;
declare const NATIVE_VALUE: "native";
type NativeType = ValueTypeType<typeof NATIVE_VALUE> & {
    native: NativeTypeKey;
};
type NativeTypeKey = "string" | "number" | "boolean";
export declare const VALID: Readonly<{
    valid: true;
}>;
export declare const expectedErrorMessage: (expected: string, actual: string) => string;
export declare const typeLabel: (type: string) => string;
export declare const isNativeType: TypeValidator;
export declare const nativeTypeValidator: (type: NativeTypeKey) => TypeValidator;
export declare const NativeTypes: Record<NativeType[typeof NATIVE_VALUE], NativeType>;
declare const MAP_VALUE: "map";
type MapType = ValueTypeType<typeof MAP_VALUE> & {
    members: Record<string, ValueType>;
};
declare const LIST_VALUE: "list";
type ListType = ValueTypeType<typeof LIST_VALUE> & {
    members: ValueType;
};
declare const TUPLE_VALUE: "tuple";
type TupleType = ValueTypeType<typeof TUPLE_VALUE> & {
    members: ValueType[];
};
declare const FUNCTION_VALUE: "function";
type FunctionType = ValueTypeType<typeof FUNCTION_VALUE> & {
    args: ValueType[];
    returns: ValueType;
};
export declare const isAssignableTo: (type: ValueType, context: ConstraintContext) => TypeValidator;
export declare function createFunctionType(args: ValueType[], returns: ValueType): FunctionType;
export declare function createOptionalType(type: ValueType): ValueType;
declare const UNION_VALUE: "union";
type UnionType = ValueTypeType<typeof UNION_VALUE> & {
    members: ValueType[];
};
declare const INTERSECTION_VALUE: "intersection";
type IntersectionType = ValueTypeType<typeof INTERSECTION_VALUE> & {
    members: ValueType[];
};
export type ValueType = NativeType | MapType | ListType | FunctionType | TupleType | UnionType | IntersectionType | EmptyType | AnyType;
export {};
