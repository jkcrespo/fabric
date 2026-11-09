import { docs } from '../utils.js';

const FABRIC = new Set(['Button', 'TextField', 'Card', 'Alert', 'Dialog']);

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Use the Fabric component when one exists instead of the raw MUI one', url: docs('prefer-fabric-components') },
    messages: {
      prefer:
        "Fabric has {{article}} {{name}} with an intent-based API and usage rules. Import it from '@jkcrespo/fabric-react' (props differ: see its contract, e.g. get_component(\"{{name}}\")).",
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const src = node.source.value;
        if (src === '@mui/material') {
          for (const s of node.specifiers) {
            if (s.type === 'ImportSpecifier' && FABRIC.has(s.imported.name)) context.report({ node: s, messageId: 'prefer', data: { name: s.imported.name, article: /^[AEIOU]/.test(s.imported.name) ? 'an' : 'a' } });
          }
        } else {
          const m = /^@mui\/material\/(\w+)$/.exec(src);
          if (m && FABRIC.has(m[1])) context.report({ node, messageId: 'prefer', data: { name: m[1], article: /^[AEIOU]/.test(m[1]) ? 'an' : 'a' } });
        }
      },
    };
  },
};
