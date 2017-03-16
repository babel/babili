"use strict";

module.exports = function({ types: t }) {
  return {
    name: "transform-remove-console",
    visitor: {
      CallExpression(path) {
        const callee = path.get("callee");

        if (!callee.isMemberExpression()) return;

        if (isConsole(callee)) {
          // console.log()
          if (path.parentPath.isExpressionStatement()) {
            path.remove();
          } else {
            path.replaceWith(createVoid0());
          }
        } else if (isConsoleBind(callee)) {
          // console.log.bind()
          path.replaceWith(createNoop());
        }
      },
      MemberExpression: {
        exit(path) {
          if (isConsole(path) && !path.parentPath.isMemberExpression()) {
            if (path.parentPath.isAssignmentExpression() && path.parentKey === "left") {
              path.parentPath.get("right").replaceWith(createNoop());
            } else {
              path.replaceWith(createNoop());
            }
          }
        }
      }
    }
  };

  function isGlobalConsoleId(id) {
    const name = "console";
    return id.isIdentifier({ name }) && !id.scope.getBinding(name) && id.scope.hasGlobal(name);
  }

  function isConsole(memberExpr) {
    const object = memberExpr.get("object");
    if (isGlobalConsoleId(object)) return true;

    const property = memberExpr.get("property");
    return isGlobalConsoleId(object.get("object")) &&
      (property.isIdentifier({ name: "call" }) || property.isIdentifier({ name: "apply" }));
  }

  function isConsoleBind(memberExpr) {
    const object = memberExpr.get("object");
    return object.isMemberExpression() &&
      isGlobalConsoleId(object.get("object")) &&
      memberExpr.get("property").isIdentifier({ name: "bind" });
  }

  function createNoop() {
    return t.functionExpression(null, [], t.blockStatement([]));
  }

  function createVoid0() {
    return t.unaryExpression("void", t.numericLiteral(0));
  }
};
