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
  listEntries(): PluginStateEntry[];
  getEntry(name: string): PluginStateEntry | undefined;
  createEntry(entry: PluginStateEntry): PluginManagementCreateResult;
  removeEntry(name: string): PluginManagementRemoveResult;
  enableEntry(name: string): PluginManagementEnableResult;
  disableEntry(name: string): PluginManagementDisableResult;
  setEntry(entry: PluginStateEntry): void;
}
