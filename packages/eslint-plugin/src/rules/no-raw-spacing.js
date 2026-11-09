import { onStyleProperty, staticValue, tokens, docs } from '../utils.js';

const SPACING_KEYS = /^(p|pt|pr|pb|pl|px|py|m|mt|mr|mb|ml|mx|my|gap|rowGap|columnGap|padding(Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?|margin(Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?)$/;
const PX = /^(-?\d*\.?\d+)px$/;
const scale = tokens.spaceScale; // px → token key

export default {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: { description: 'Disallow raw px/rem spacing; use the 4px spacing scale or relationship tokens', url: docs('no-raw-spacing') },
    messages: {
      onScale:
        "Raw spacing '{{value}}'. It is space.{{token}} on the scale — prefer a relationship token if one fits (space.between-buttons, space.card-padding…). Auto-fix: {{fix}}.",
      offScale:
        "Raw spacing '{{value}}' is off the 4px scale. Use a relationship token (space.between-inputs, space.container-padding…) or the scale (space.000 … space.3200).",
    },
    schema: [],
  },
  create(context) {
    return onStyleProperty(context, (node, name, where) => {
      if (!SPACING_KEYS.test(name)) return;
      const v = staticValue(node.value);
      if (v === undefined || v === 0 || v === '0') return;
      // In sx, numbers are theme units (n × 4px) — already on the grid.
      if (typeof v === 'number' && where === 'sx') return;
      const parts = typeof v === 'number' ? [`${v}px`] : String(v).trim().split(/\s+/);
      if (parts.some((p) => p === 'auto' || p.startsWith('var(') || p.startsWith('calc('))) return;
      const px = parts.map((p) => {
        const m = PX.exec(p);
        return m ? parseFloat(m[1]) : null;
      });
      const all = px.every((n) => n !== null && scale[n] !== undefined);
      if (!all) {
        if (parts.some((p) => /\d/.test(p))) context.report({ node: node.value, messageId: 'offScale', data: { value: String(v) } });
        return;
      }
      // Exact match on the scale: safe, value-preserving fix.
      let replacement;
      if (where === 'sx' && px.length === 1) replacement = String(px[0] / 4);
      else replacement = `'${px.map((n) => `var(--fabric-space-${scale[n].replace('.', '-')})`).join(' ')}'`;
      context.report({
        node: node.value,
        messageId: 'onScale',
        data: { value: String(v), token: px.map((n) => scale[n]).join(' / '), fix: replacement },
        fix: (fixer) => fixer.replaceText(node.value, replacement),
      });
    });
  },
};
