import { ConfigService } from './config-service.interface';
import type { DefaultKeyManagerType } from '../../types/shared.types';
import { StateService } from '../state/state-service.interface';

const CONFIG_NAMESPACE = 'config';
const KEY_ED25519_ENABLED = 'ed25519_support_enabled';
const KEY_DEFAULT_KEY_MANAGER = 'default_key_manager';

type OptionType = 'boolean' | 'number' | 'string' | 'enum';

type OptionSpec =
  | {
      type: 'boolean';
      default: boolean;
    }
  | {
      type: 'number';
      default: number;
    }
  | {
      type: 'string';
      default: string;
    }
  | {
      type: 'enum';
      default: string;
      allowedValues: readonly string[];
    };

const CONFIG_OPTIONS: Record<string, OptionSpec> = {
  [KEY_ED25519_ENABLED]: {
    type: 'boolean',
    default: false,
  },
  [KEY_DEFAULT_KEY_MANAGER]: {
    type: 'enum',
    default: 'local',
    allowedValues: [
      'local',
      'encrypted_local',
    ] as readonly DefaultKeyManagerType[],
  },
} as const;

export class ConfigServiceImpl implements ConfigService {
  private state: StateService;

  constructor(stateService: StateService) {
    this.state = stateService;
  }

  listOptions(): {
    name: string;
    type: OptionType;
    value: boolean | number | string;
    allowedValues?: string[];
  }[] {
    return Object.entries(CONFIG_OPTIONS).map(([name, spec]) => {
      const base = {
        name,
        type: spec.type,
        value: this.getOption(name),
      } as {
        name: string;
        type: OptionType;
        value: boolean | number | string;
        allowedValues?: string[];
      };
      if (spec.type === 'enum') {
        base.allowedValues = [...spec.allowedValues];
      }
      return base;
    });
  }

  getOption<T = boolean | number | string>(name: string): T {
    const spec = CONFIG_OPTIONS[name];
    if (!spec) {
      throw new Error(`Unknown config option: ${name}`);
    }
    const raw = this.state.get<unknown>(CONFIG_NAMESPACE, name);
    if (raw === undefined || raw === null) {
      // return default
      return spec.default as unknown as T;
    }
    // basic runtime validation on read
    switch (spec.type) {
      case 'boolean':
        return Boolean(raw) as unknown as T;
      case 'number': {
        const n = Number(raw);
        if (Number.isNaN(n)) {
          return spec.default as unknown as T;
        }
        return n as unknown as T;
      }
      case 'string':
        return String(raw) as unknown as T;
      case 'enum': {
        const s = String(raw);
        if (!spec.allowedValues.includes(s)) {
          return spec.default as unknown as T;
        }
        return s as unknown as T;
      }
      default:
        return raw as T;
    }
  }

  setOption(name: string, value: boolean | number | string): void {
    const spec = CONFIG_OPTIONS[name];
    if (!spec) {
      throw new Error(`Unknown config option: ${name}`);
    }
    switch (spec.type) {
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Invalid value for ${name}: expected boolean`);
        }
        this.state.set<boolean>(CONFIG_NAMESPACE, name, value);
        return;
      case 'number': {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          throw new Error(`Invalid value for ${name}: expected number`);
        }
        this.state.set<number>(CONFIG_NAMESPACE, name, value);
        return;
      }
      case 'string': {
        if (typeof value !== 'string') {
          throw new Error(`Invalid value for ${name}: expected string`);
        }
        this.state.set<string>(CONFIG_NAMESPACE, name, value);
        return;
      }
      case 'enum': {
        if (typeof value !== 'string' || !spec.allowedValues.includes(value)) {
          const allowed = spec.allowedValues.join(', ');
          throw new Error(
            `Invalid value for ${name}: expected one of (${allowed})`,
          );
        }
        this.state.set<string>(CONFIG_NAMESPACE, name, value);
        return;
      }
      default:
        throw new Error(`Unsupported option type for ${name}`);
    }
  }
}
