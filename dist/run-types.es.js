const p = "empty", $ = "any", u = "native", a = Object.freeze({
  valid: !0
}), T = (r, n) => `Expected ${r} but got ${n}`, g = (r) => `type: ${r}`, S = (r) => r.__type === u ? a : {
  valid: !1,
  errors: {
    type: T(
      g(u),
      g(r.__type)
    )
  }
}, C = (r) => (n) => n.__type === u && n.native === r ? a : {
  valid: !1,
  errors: {
    type: T(`native ${r}`, g(n.__type))
  }
}, F = {
  string: {
    __type: u,
    native: "string"
  },
  number: {
    __type: u,
    native: "number"
  },
  boolean: {
    __type: u,
    native: "boolean"
  }
}, A = "map", v = "list", y = "tuple", h = "function";
function o(r, n, e) {
  return `${l(n)} not assignable to ${l(
    r
  )}; ${e}`;
}
function V(r) {
  return r.reduce((n, e) => e.valid ? n : {
    valid: !1,
    errors: {
      ...n.valid ? {} : n.errors,
      ...e.errors
    }
  }, a);
}
function m(r, n, e) {
  if (r) {
    const s = Object.entries(r).map(([t, i]) => {
      var c;
      if (n[t]) {
        const _ = n[t](i)((c = e.constraints) == null ? void 0 : c[t]);
        if (!_.valid)
          return {
            valid: !1,
            errors: {
              [t]: _.errors[t]
            }
          };
      }
      return a;
    });
    return V(s);
  }
  return a;
}
const U = (r, n) => (e) => {
  const s = m(r.constraints, n, e);
  return s.valid ? e.__type === u && e.native === r.native ? a : {
    valid: !1,
    errors: {
      type: o(e, r, "native types do not match")
    }
  } : s;
}, N = (r, n) => (e) => {
  const s = m(r.constraints, n, e);
  if (!s.valid)
    return s;
  if (e.__type === "map") {
    const t = Object.keys(r.members);
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (!(c in e.members))
        return {
          valid: !1,
          errors: {
            type: o(
              e,
              r,
              `missing key: "${c}"`
            )
          }
        };
      const d = e.members[c], _ = r.members[c];
      if (!f(_, n)(d).valid)
        return {
          valid: !1,
          errors: {
            type: o(
              e,
              r,
              `key "${c}" not assignable to ${l(d)}`
            )
          }
        };
    }
    return a;
  }
  return {
    valid: !1,
    errors: {
      type: o(e, r, "type is not a map")
    }
  };
};
function I(r, n) {
  return (e) => {
    if (e.__type === "list") {
      const s = m(
        r.constraints,
        n,
        e
      );
      if (!s.valid)
        return s;
      const t = f(r.members, n)(e.members);
      return t.valid ? a : {
        valid: !1,
        errors: {
          type: o(
            e,
            r,
            `list members do not match: ${t.errors.type}`
          )
        }
      };
    }
    return {
      valid: !1,
      errors: {
        type: o(e, r, "type is not a list")
      }
    };
  };
}
function O(r, n) {
  return (e) => {
    if (e.__type === "tuple") {
      const s = m(
        r.constraints,
        n,
        e
      );
      if (!s.valid)
        return s;
      if (e.members.length !== r.members.length)
        return {
          valid: !1,
          errors: {
            type: o(
              e,
              r,
              "tuple length does not match"
            )
          }
        };
      for (let t = 0; t < r.members.length; t++)
        if (!f(r.members[t], n)(e.members[t]).valid)
          return {
            valid: !1,
            errors: {
              type: o(
                e,
                r,
                `tuple member ${t} not assignable to ${l(
                  e.members[t]
                )}`
              )
            }
          };
      return a;
    }
    return {
      valid: !1,
      errors: {
        type: o(e, r, "type is not a tuple")
      }
    };
  };
}
function j(r, n) {
  return (e) => {
    if (e.__type === "function") {
      const s = m(
        r.constraints,
        n,
        e
      );
      if (!s.valid)
        return s;
      const t = f(
        r.returns,
        n
      )(e.returns);
      if (!t.valid)
        return t;
      if (r.args.length !== e.args.length)
        return {
          valid: !1,
          errors: {
            type: o(
              e,
              r,
              "function argument length does not match"
            )
          }
        };
      for (let i = 0; i < r.args.length; i++)
        if (!f(r.args[i], n)(e.args[i]).valid)
          return {
            valid: !1,
            errors: {
              type: o(
                e,
                r,
                `function argument ${i} not assignable to ${l(
                  e.args[i]
                )}`
              )
            }
          };
      return a;
    }
    return {
      valid: !1,
      errors: {
        type: o(e, r, "type is not a function")
      }
    };
  };
}
function M(r, n) {
  return (e) => {
    const s = m(
      r.constraints,
      n,
      e
    );
    if (!s.valid)
      return s;
    for (let t = 0; t < r.members.length; t++)
      if (f(r.members[t], n)(e).valid)
        return a;
    return {
      valid: !1,
      errors: {
        type: o(
          e,
          r,
          "type assignable to any member of union"
        )
      }
    };
  };
}
function k(r, n) {
  return (e) => {
    const s = m(
      r.constraints,
      n,
      e
    );
    if (!s.valid)
      return s;
    for (let t = 0; t < r.members.length; t++) {
      const i = f(r.members[t], n)(e);
      if (!i.valid)
        return {
          valid: !1,
          errors: {
            type: o(e, r, i.errors.type)
          }
        };
    }
    return a;
  };
}
const f = (r, n) => {
  switch (r.__type) {
    case u:
      return U(r, n);
    case A:
      return N(r, n);
    case v:
      return I(r, n);
    case y:
      return O(r, n);
    case h:
      return j(r, n);
    case E:
      return M(r, n);
    case L:
      return k(r, n);
    case p:
    case $:
      return () => a;
  }
};
function b(r) {
  return r.map(l).join(", ");
}
function l(r) {
  switch (r.__type) {
    case u:
      return `native ${r.native}`;
    case A:
      return `map {${Object.entries(r.members).map(([n, e]) => `${n}: ${l(e)}`).join(", ")}}`;
    case v:
      return `list [${b([r.members])}]`;
    case y:
      return `tuple [${b(r.members)}]`;
    case h:
      return `function (${b(r.args)}) => ${l(
        r.returns
      )}`;
    case E:
      return `union [${b(r.members)}]`;
    case L:
      return `intersection [${b(r.members)}]`;
    case p:
      return "[empty]";
    case $:
      return "[any]";
  }
}
function P(r, n) {
  return {
    __type: "function",
    args: r,
    returns: n
  };
}
function w(r) {
  return {
    __type: "union",
    members: [r, { __type: "empty" }]
  };
}
const E = "union", L = "intersection";
export {
  F as NativeTypes,
  a as VALID,
  P as createFunctionType,
  w as createOptionalType,
  T as expectedErrorMessage,
  f as isAssignableTo,
  S as isNativeType,
  C as nativeTypeValidator,
  g as typeLabel
};
