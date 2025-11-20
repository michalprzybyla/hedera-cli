import { PluginStateEntry } from '../../plugins/plugin.interface';

export type PluginManagementCreateResult =
  | { status: 'created'; entry: PluginStateEntry }
  | { status: 'duplicate'; entry: PluginStateEntry };

export type PluginManagementRemoveResult =
  | { status: 'removed'; entry: PluginStateEntry }
  | { status: 'not-found' }
  | { status: 'protected' };

export type PluginManagementEnableResult =
  | { status: 'enabled'; entry: PluginStateEntry }
  | { status: 'already-enabled'; entry: PluginStateEntry }
  | { status: 'not-found' };

export type PluginManagementDisableResult =
  | { status: 'disabled'; entry: PluginStateEntry }
  | { status: 'already-disabled'; entry: PluginStateEntry }
  | { status: 'not-found' }
  | { status: 'protected' };

export interface PluginManagementService {
  listPlugins(): PluginStateEntry[];
  getPlugin(name: string): PluginStateEntry | undefined;
  addPlugin(entry: PluginStateEntry): PluginManagementCreateResult;
  removePlugin(name: string): PluginManagementRemoveResult;
  enablePlugin(name: string): PluginManagementEnableResult;
  disablePlugin(name: string): PluginManagementDisableResult;
  upsertPlugin(entry: PluginStateEntry): void;
}
