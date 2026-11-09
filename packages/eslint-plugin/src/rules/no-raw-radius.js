import { onStyleProperty, staticValue, docs } from '../utils.js';

const RADIUS_KEYS = /^border(Top|Bottom)?(Left|Right|Start|End)?(Start|End)?Radius$/;

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow raw border radius; apply the assigned radius token', url: docs('no-raw-radius') },
    messages: {
      raw: "Raw radius '{{value}}'. Apply the assigned token: radius.button, radius.input, radius.card-sm/md/lg (dialogs: radius.card-lg), or radius.full for pills — never pick a radius by eye.",
    },
    schema: [],
  },
  create(context) {
    return onStyleProperty(context, (node, name) => {
      if (!RADIUS_KEYS.test(name)) return;
      const v = staticValue(node.value);
      if (v === undefined || v === 0 || v === '0' || v === 'inherit') return;
      context.report({ node: node.value, messageId: 'raw', data: { value: String(v) } });
    });
  },
};
