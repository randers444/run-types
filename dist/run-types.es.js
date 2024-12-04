const t = "native", i = {
  string: {
    __type: t,
    native: "string"
  },
  number: {
    __type: t,
    native: "number"
  },
  boolean: {
    __type: t,
    native: "boolean"
  }
};
function r(n) {
  return n.__type === t && n.native === "string";
}
function _(n) {
  return n.__type === t && n.native === "number";
}
function o(n, e) {
  return {
    __type: "function",
    args: n,
    returns: e
  };
}
export {
  i as NativeTypes,
  o as createFunctionType,
  _ as isNumber,
  r as isString
};
