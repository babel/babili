"use strict";

function createRegExpLiteral(args, t) {
  const evaluatedArgs = args.map((a) => a.evaluate());
  if (!evaluatedArgs.every((a) => a.confident === true &&
      typeof a.value === "string")) {
    return;
  }
  let pattern = (evaluatedArgs.length >= 1 &&
                    evaluatedArgs[0].value !== "") ?
                  evaluatedArgs[0].value :
                  "(?:)";
  const flags = evaluatedArgs.length >= 2 ?
                evaluatedArgs[1].value :
                "";

  pattern = new RegExp(pattern).source;
  // This step is for prettification -- technically we can insert whitespace
  // literals into a regExpLiteral just fine.
  // e.g. '\t'.replace(/	/, '') === '\t'.replace(/\t/, '') === ''.
  pattern = pattern.replace(/\n/g, "\\n")
                   .replace(/\t/g, "\\t")
                   .replace(/[\b]/g, "[\\b]")
                   .replace(/\v/g, "\\v")
                   .replace(/\f/g, "\\f")
                   .replace(/\r/g, "\\r");
  return t.regExpLiteral(pattern, flags);
}

function maybeReplaceWithRegExpLiteral(path, t) {
  if (!t.isIdentifier(path.node.callee, {name: "RegExp"})) {
    return;
  }
  const regExpLiteral = createRegExpLiteral(path.get("arguments"), t);
  if (regExpLiteral) {
    path.replaceWith(regExpLiteral);
  }
}

module.exports = function({ types: t }) {
  return {
    name: "transform-regexp-constructors",
    visitor: {
      NewExpression(path) {
        maybeReplaceWithRegExpLiteral(path, t);
      },
      CallExpression(path) {
        // equivalent to `new RegExp()` according to §21.2.3
        maybeReplaceWithRegExpLiteral(path, t);
      },
    },
  };
};
