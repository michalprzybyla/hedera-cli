export const RESERVED_LONG_OPTIONS = new Set<string>([
  'format',
  'json',
  'output',
  'script',
  'color',
  'no-color',
  'verbose',
  'quiet',
  'debug',
  'help',
  'version',
]);

/**
 * Default set of built-in plugins shipped with the CLI.
 * These are used to bootstrap the plugin-management state on first run.
 *
 * The structure mirrors `PluginStateEntry` in `core/plugins/plugin-state.ts`
 * but we use a plain object type here to avoid a direct import from core/plugins.
 */
export interface DefaultPluginConfig {
  name: string;
  path: string;
}

export const DEFAULT_PLUGIN_STATE: DefaultPluginConfig[] = [
  {
    name: 'account',
    path: './dist/plugins/account',
  },
  {
    name: 'token',
    path: './dist/plugins/token',
  },
  {
    name: 'network',
    path: './dist/plugins/network',
  },
  {
    name: 'plugin-management',
    path: './dist/plugins/plugin-management',
  },
  {
    name: 'credentials',
    path: './dist/plugins/credentials',
  },
  {
    name: 'state-management',
    path: './dist/plugins/state-management',
  },
  {
    name: 'topic',
    path: './dist/plugins/topic',
  },
  {
    name: 'hbar',
    path: './dist/plugins/hbar',
  },
  {
    name: 'config',
    path: './dist/plugins/config',
  },
];
