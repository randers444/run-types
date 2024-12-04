type ValueTypeType<T extends string> = {
    __type: T;
    constraints?: Contraints;
};
type Contraints = Record<string, unknown>;
declare const NATIVE_VALUE: "native";
type NativeType = ValueTypeType<typeof NATIVE_VALUE> & {
    native: 'string' | 'number' | 'boolean';
};
export declare const NativeTypes: Record<NativeType[typeof NATIVE_VALUE], NativeType>;
export declare function isString(value: ValueType): value is NativeType;
export declare function isNumber(value: ValueType): value is NativeType;
type MapType = ValueTypeType<'map'> & {
    map: Record<string, ValueType>;
};
type ListType = ValueTypeType<'list'> & {
    members: ValueType;
};
type FunctionType = ValueTypeType<'function'> & {
    args: ValueType[];
    returns: ValueType;
};
export declare function createFunctionType(args: ValueType[], returns: ValueType): FunctionType;
export type ValueType = NativeType | MapType | ListType | FunctionType;
export {};
