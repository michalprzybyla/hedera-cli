import { PluginStateEntry } from '../../plugins/plugin.interface';
import { StateService } from '../state/state-service.interface';
import { PLUGIN_MANAGEMENT_NAMESPACE } from '../../shared/constants';
import {
  PluginManagementDisableResult,
  PluginManagementEnableResult,
  PluginManagementService,
  PluginManagementCreateResult,
  PluginManagementRemoveResult,
} from './plugin-management-service.interface';

export class PluginManagementServiceImpl implements PluginManagementService {
  private readonly state: StateService;

  constructor(state: StateService) {
    this.state = state;
  }

  listEntries(): PluginStateEntry[] {
    return this.state.list<PluginStateEntry>(PLUGIN_MANAGEMENT_NAMESPACE);
  }

  getEntry(name: string): PluginStateEntry | undefined {
    const entry = this.state.get<PluginStateEntry>(
      PLUGIN_MANAGEMENT_NAMESPACE,
      name,
    );
    return entry ?? undefined;
  }

  createEntry(entry: PluginStateEntry): PluginManagementCreateResult {
    const existing = this.getEntry(entry.name);

    if (existing) {
      return { status: 'duplicate', entry: existing };
    }

    this.setEntry(entry);

    return { status: 'created', entry };
  }

  removeEntry(name: string): PluginManagementRemoveResult {
    if (name === 'plugin-management') {
      return { status: 'protected' };
    }

    const existing = this.getEntry(name);

    if (!existing) {
      return { status: 'not-found' };
    }

    this.state.delete(PLUGIN_MANAGEMENT_NAMESPACE, name);

    return { status: 'removed', entry: existing };
  }

  enableEntry(name: string): PluginManagementEnableResult {
    const entry = this.getEntry(name);

    if (!entry) {
      return { status: 'not-found' };
    }

    if (entry.enabled) {
      return { status: 'already-enabled', entry };
    }

    const updated: PluginStateEntry = {
      ...entry,
      enabled: true,
    };

    this.setEntry(updated);

    return { status: 'enabled', entry: updated };
  }

  disableEntry(name: string): PluginManagementDisableResult {
    if (name === 'plugin-management') {
      return { status: 'protected' };
    }

    const entry = this.getEntry(name);

    if (!entry) {
      return { status: 'not-found' };
    }

    if (!entry.enabled) {
      return { status: 'already-disabled', entry };
    }

    const updated: PluginStateEntry = {
      ...entry,
      enabled: false,
    };

    this.setEntry(updated);

    return { status: 'disabled', entry: updated };
  }

  setEntry(entry: PluginStateEntry): void {
    this.state.set<PluginStateEntry>(
      PLUGIN_MANAGEMENT_NAMESPACE,
      entry.name,
      entry,
    );
  }
}
