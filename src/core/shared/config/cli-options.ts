import type { PluginManifest } from '../../plugins/plugin.types';
import accountPluginManifest from '../../../plugins/account/manifest';
import tokenPluginManifest from '../../../plugins/token/manifest';
import networkPluginManifest from '../../../plugins/network/manifest';
import pluginManagementManifest from '../../../plugins/plugin-management/manifest';
import credentialsPluginManifest from '../../../plugins/credentials/manifest';
import stateManagementPluginManifest from '../../../plugins/state-management/manifest';
import topicPluginManifest from '../../../plugins/topic/manifest';
import hbarPluginManifest from '../../../plugins/hbar/manifest';
import configPluginManifest from '../../../plugins/config/manifest';

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

export interface DefaultPluginConfig {
  name: string;
  manifest: PluginManifest;
}

export const DEFAULT_PLUGIN_STATE: DefaultPluginConfig[] = [
  {
    name: accountPluginManifest.name,
    manifest: accountPluginManifest,
  },
  {
    name: tokenPluginManifest.name,
    manifest: tokenPluginManifest,
  },
  {
    name: networkPluginManifest.name,
    manifest: networkPluginManifest,
  },
  {
    name: pluginManagementManifest.name,
    manifest: pluginManagementManifest,
  },
  {
    name: credentialsPluginManifest.name,
    manifest: credentialsPluginManifest,
  },
  {
    name: stateManagementPluginManifest.name,
    manifest: stateManagementPluginManifest,
  },
  {
    name: topicPluginManifest.name,
    manifest: topicPluginManifest,
  },
  {
    name: hbarPluginManifest.name,
    manifest: hbarPluginManifest,
  },
  {
    name: configPluginManifest.name,
    manifest: configPluginManifest,
  },
];
