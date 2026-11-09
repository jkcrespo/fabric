import { cssVarSet, tokens, jsTree, closest, docs } from '../utils.js';

const VAR = /--fabric-[a-z0-9-]+/g;
const INTERNAL = /^(primitive|brand)\.[a-z0-9.-]+$/;

/** Property names of a member chain after `.fabric` (theme.fabric.color.text.default). */
function fabricPath(node) {
  const segs = [];
  let n = node;
  while (n.type === 'MemberExpression') {
    if (n.computed) {
      if (n.property.type !== 'Literal') return null; // dynamic: cannot check
      segs.unshift(String(n.property.value));
    } else segs.unshift(n.property.name);
    n = n.object;
  }
  if (n.type === 'Identifier') segs.unshift(n.name);
  const i = segs.indexOf('fabric');
  return i === -1 ? null : segs.slice(i + 1);
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow internal (primitive/brand) and unknown Fabric tokens', url: docs('no-unknown-tokens') },
    messages: {
      unknownVar: "Unknown Fabric CSS variable '{{name}}'.{{hint}}",
      internal: "'{{name}}' is an internal token. Only semantic tokens (color.*, space.*, radius.*, typography.*, elevation.*, motion.*) may be used outside tokens/.",
      unknownPath: "theme.fabric.{{path}} does not exist.{{hint}}",
    },
    schema: [],
  },
  create(context) {
    const checkString = (node, s) => {
      if (INTERNAL.test(s)) return context.report({ node, messageId: 'internal', data: { name: s } });
      for (const [name] of s.matchAll(VAR)) {
        if (cssVarSet.has(name)) continue;
        if (/^--fabric-(primitive|brand)-/.test(name)) context.report({ node, messageId: 'internal', data: { name } });
        else context.report({ node, messageId: 'unknownVar', data: { name, hint: ` Did you mean '${closest(name, tokens.cssVars)}'?` } });
      }
    };
    return {
      Literal(node) {
        if (typeof node.value === 'string') checkString(node, node.value);
      },
      TemplateElement(node) {
        if (node.value.cooked) checkString(node, node.value.cooked);
      },
      MemberExpression(node) {
        if (node.parent.type === 'MemberExpression' && node.parent.object === node) return; // only the outermost chain
        const path = fabricPath(node);
        if (!path?.length) return;
        let tree = jsTree;
        for (let i = 0; i < path.length; i++) {
          if (!tree[path[i]]) {
            const options = Object.keys(tree);
            const hint = options.length ? ` Did you mean '${[...path.slice(0, i), closest(path[i], options)].join('.')}'?` : '';
            return context.report({ node, messageId: 'unknownPath', data: { path: path.join('.'), hint } });
          }
          tree = tree[path[i]];
        }
      },
    };
  },
};
