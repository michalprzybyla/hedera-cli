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
  enabled: boolean;
  builtIn: boolean;
  status: 'loaded' | 'unloaded' | 'error';
}

export const DEFAULT_PLUGIN_STATE: DefaultPluginConfig[] = [
  {
    name: 'account',
    path: './dist/plugins/account',
    enabled: true,
    builtIn: true,
    status: 'unloaded',
  },
  {
    name: 'token',
    path: './dist/plugins/token',
    enabled: true,
    builtIn: true,
    status: 'unloaded',
  },
  {
    name: 'network',
    path: './dist/plugins/network',
    enabled: true,
    builtIn: true,
    status: 'unloaded',
  },
  {
    name: 'plugin-management',
    path: './dist/plugins/plugin-management',
    enabled: true,
    builtIn: true,
    status: 'unloaded',
  },
  {
    name: 'credentials',
    path: './dist/plugins/credentials',
    enabled: true,
    builtIn: true,
    status: 'unloaded',
  },
  {
    name: 'state-management',
    path: './dist/plugins/state-management',
    enabled: true,
    builtIn: true,
    status: 'unloaded',
  },
  {
    name: 'topic',
    path: './dist/plugins/topic',
    enabled: true,
    builtIn: true,
    status: 'unloaded',
  },
  {
    name: 'hbar',
    path: './dist/plugins/hbar',
    enabled: true,
    builtIn: true,
    status: 'unloaded',
  },
  {
    name: 'config',
    path: './dist/plugins/config',
    enabled: true,
    builtIn: true,
    status: 'unloaded',
  },
];
