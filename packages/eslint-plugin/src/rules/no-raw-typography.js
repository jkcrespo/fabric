import { onStyleProperty, staticValue, docs } from '../utils.js';

const TYPE_KEYS = /^(fontSize|fontFamily|fontWeight|lineHeight|letterSpacing)$/;

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow ad hoc typography; use typography tokens, no text-case emphasis', url: docs('no-raw-typography') },
    messages: {
      raw: "Ad hoc '{{name}}: {{value}}'. Use a typography style instead (<Typography variant=\"body1\">, typography.heading-sm …) — never set size, weight or family directly.",
      textCase: "'textTransform: {{value}}' — create emphasis through scale and weight, never text case.",
      italic: "Ad hoc italics. Do not override text styles with bold, underline or italics; pick a different typography style.",
    },
    schema: [],
  },
  create(context) {
    return onStyleProperty(context, (node, name) => {
      const v = staticValue(node.value);
      if (v === undefined) return;
      if (TYPE_KEYS.test(name) && v !== 'inherit') context.report({ node: node.value, messageId: 'raw', data: { name, value: String(v) } });
      else if (name === 'textTransform' && /^(uppercase|capitalize)$/.test(String(v))) context.report({ node: node.value, messageId: 'textCase', data: { value: String(v) } });
      else if (name === 'fontStyle' && v === 'italic') context.report({ node: node.value, messageId: 'italic' });
    });
  },
};
