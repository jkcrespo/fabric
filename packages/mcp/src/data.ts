import { readFileSync } from 'node:fs';

export interface TokenEntry {
  id: string;
  type: string;
  description: string;
  mui: string | null;
  cssVar: string;
  js: string;
  modeDependent: boolean;
  values: Record<string, Record<string, unknown>>;
}

export interface ComponentProp {
  name: string;
  type: string;
  values?: (string | number | boolean)[];
  default?: unknown;
  required?: boolean;
  description: string;
}

export interface ComponentMeta {
  name: string;
  status: string;
  category: string;
  muiBase: string | null;
  intent: string;
  import: string;
  props: ComponentProp[];
  variants?: { name: string; intent: string }[];
  sizes?: { name: string; intent: string }[];
  states?: string[];
  usage: {
    when: string[];
    whenNot: { situation: string; useInstead: string }[];
    composition?: string[];
    related?: string[];
  };
  tokens: string[];
  accessibility: { role: string; keyboard: string[]; notes?: string[] };
  examples?: { title: string; code: string }[];
}

export interface FabricData {
  version: string;
  rules: string;
  guidelines: Record<string, string>;
  brands: Record<string, string>;
  modes: string[];
  tokens: TokenEntry[];
  components: ComponentMeta[];
  /** Markdown versions of the same facts, from the shared renderer. */
  markdown: {
    components: Record<string, string>;
    allComponents: string;
    tokens: string;
    tokenTableHeader: string;
    tokenRows: Record<string, string>;
  };
}

/** The data bundled by build-data.mjs. */
export function loadData(): FabricData {
  return JSON.parse(readFileSync(new URL('./data/fabric.json', import.meta.url), 'utf8'));
}
