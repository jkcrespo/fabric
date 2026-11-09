import { onStyleProperty, staticValue, docs } from '../utils.js';

const COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i;
const COLOR_KEYS = /^(color|bgcolor|background(Color)?|border(Top|Right|Bottom|Left)?Color|outlineColor|fill|stroke|caretColor|textDecorationColor|columnRuleColor)$/;
const NAMED = /^(red|blue|green|black|white|gray|grey|orange|purple|yellow|pink|brown|navy|teal|silver|maroon|olive|lime|aqua|fuchsia|cyan|magenta)$/i;

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow hard-coded colors in styles; use semantic color tokens', url: docs('no-hardcoded-colors') },
    messages: {
      hardcoded:
        "Hard-coded color '{{value}}'. Use a semantic color token chosen by intent (e.g. 'text.primary', 'primary.main', theme.fabric.color.danger.text or var(--fabric-color-…)). Fabric is white-label: brand colors must come from tokens.",
    },
    schema: [],
  },
  create(context) {
    const check = (node, text) => context.report({ node, messageId: 'hardcoded', data: { value: text.length > 40 ? `${text.slice(0, 40)}…` : text } });
    return {
      ...onStyleProperty(context, (node, name) => {
        const v = staticValue(node.value);
        if (typeof v !== 'string') return;
        if (COLOR.test(v) || (COLOR_KEYS.test(name) && NAMED.test(v.trim()))) check(node.value, v);
      }),
      // styled.div`color: #fff;` and css`…`
      TaggedTemplateExpression(node) {
        const t = node.tag;
        const styledTag =
          (t.type === 'Identifier' && (t.name === 'css' || t.name === 'keyframes')) ||
          (t.type === 'MemberExpression' && t.object.type === 'Identifier' && t.object.name === 'styled') ||
          (t.type === 'CallExpression' && t.callee.type === 'Identifier' && t.callee.name === 'styled');
        if (!styledTag) return;
        for (const q of node.quasi.quasis) {
          const m = q.value.cooked?.match(COLOR);
          if (m) check(q, m[0]);
        }
      },
    };
  },
};
