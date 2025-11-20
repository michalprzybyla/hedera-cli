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

  listPlugins(): PluginStateEntry[] {
    return this.state.list<PluginStateEntry>(PLUGIN_MANAGEMENT_NAMESPACE);
  }

  getPlugin(name: string): PluginStateEntry | undefined {
    const entry = this.state.get<PluginStateEntry>(
      PLUGIN_MANAGEMENT_NAMESPACE,
      name,
    );
    return entry ?? undefined;
  }

  addPlugin(entry: PluginStateEntry): PluginManagementCreateResult {
    const existing = this.getPlugin(entry.name);

    if (existing) {
      return { status: 'duplicate', entry: existing };
    }

    this.upsertPlugin(entry);

    return { status: 'created', entry };
  }

  removePlugin(name: string): PluginManagementRemoveResult {
    if (name === 'plugin-management') {
      return { status: 'protected' };
    }

    const existing = this.getPlugin(name);

    if (!existing) {
      return { status: 'not-found' };
    }

    this.state.delete(PLUGIN_MANAGEMENT_NAMESPACE, name);

    return { status: 'removed', entry: existing };
  }

  enablePlugin(name: string): PluginManagementEnableResult {
    const entry = this.getPlugin(name);

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

    this.upsertPlugin(updated);

    return { status: 'enabled', entry: updated };
  }

  disablePlugin(name: string): PluginManagementDisableResult {
    if (name === 'plugin-management') {
      return { status: 'protected' };
    }

    const entry = this.getPlugin(name);

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

    this.upsertPlugin(updated);

    return { status: 'disabled', entry: updated };
  }

  upsertPlugin(entry: PluginStateEntry): void {
    this.state.set<PluginStateEntry>(
      PLUGIN_MANAGEMENT_NAMESPACE,
      entry.name,
      entry,
    );
  }
}
