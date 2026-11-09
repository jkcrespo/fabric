import { docs } from '../utils.js';

const FIELDS = new Set(['TextField', 'Select', 'Autocomplete', 'DatePicker']);
const attr = (el, name) => el.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === name);

/** Finds `shrink: false` anywhere inside an attribute's object value. */
function hasShrinkFalse(a) {
  const expr = a?.value?.type === 'JSXExpressionContainer' ? a.value.expression : null;
  const walk = (n) =>
    n?.type === 'ObjectExpression' &&
    n.properties.some((p) => p.type === 'Property' && ((p.key.name ?? p.key.value) === 'shrink' ? p.value.type === 'Literal' && p.value.value === false : walk(p.value)));
  return walk(expr);
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Labels sit above fields: no floating labels, no placeholder-only labels', url: docs('no-floating-labels') },
    messages: {
      floating: 'Floating labels are not used in Fabric. Labels sit above the input container (the theme handles it) — remove shrink: false.',
      placeholderOnly: '<{{name}}> has a placeholder but no label. Placeholders are not labels: add a visible label (it sits above the field).',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = node.name.type === 'JSXIdentifier' ? node.name.name : node.name.type === 'JSXMemberExpression' ? node.name.property.name : null;
        if (!FIELDS.has(name)) return;
        if (hasShrinkFalse(attr(node, 'InputLabelProps')) || hasShrinkFalse(attr(node, 'slotProps'))) context.report({ node, messageId: 'floating' });
        if (attr(node, 'placeholder') && !attr(node, 'label') && !attr(node, 'aria-label')) context.report({ node, messageId: 'placeholderOnly', data: { name } });
      },
    };
  },
};
