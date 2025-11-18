/**
 * Unit tests for plugin-management add command
 */
import { Status } from '../../../../core/shared/constants';
import { addPlugin } from '../../commands/add/handler';
import type { StateService } from '../../../../core/services/state/state-service.interface';
import {
  makeArgs,
  makeLogger,
  makeStateMock,
} from '../../../../core/shared/__tests__/helpers/mocks';
import type { PluginStateEntry } from '../../../../core/plugins/plugin.interface';

// Mock path to produce predictable manifest path
jest.mock('path', () => ({
  resolve: (...segments: string[]) => segments.join('/'),
  join: jest.fn(),
}));

// Mock manifest module for a test plugin
jest.mock(
  'dist/plugins/custom-plugin/manifest.js',
  () => ({
    default: {
      name: 'custom-plugin',
      displayName: 'Custom Plugin',
      version: '1.0.0',
      description: 'Test plugin',
    },
  }),
  { virtual: true },
);

describe('plugin-management add command', () => {
  it('should add a new plugin from path and enable it when manifest is valid and name does not exist', async () => {
    const logger = makeLogger();
    const entries: PluginStateEntry[] = [];
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.list.mockReturnValue(entries);
    state.set.mockImplementation(
      (_namespace: string, _key: string, value: unknown) => {
        entries.push(value as PluginStateEntry);
      },
    );
    const api = { state };

    const args = makeArgs(api, logger, {
      path: 'dist/plugins/custom-plugin',
    });

    const result = await addPlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.added).toBe(true);
    expect(output.message).toContain('added and enabled successfully');

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('custom-plugin');
    expect(entries[0].enabled).toBe(true);
    expect(entries[0].path).toBe('dist/plugins/custom-plugin');
  });

  it('should fail when plugin with the same name already exists in state', async () => {
    const logger = makeLogger();
    const existingEntry: PluginStateEntry = {
      name: 'custom-plugin',
      path: 'dist/plugins/custom-plugin',
      enabled: true,
      builtIn: false,
      status: 'loaded',
    };
    const entries: PluginStateEntry[] = [existingEntry];
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.list.mockReturnValue(entries);
    const api = { state };

    const args = makeArgs(api, logger, {
      path: 'dist/plugins/custom-plugin',
    });

    const result = await addPlugin(args);

    expect(result.status).toBe(Status.Failure);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.added).toBe(false);
    expect(output.message).toContain('already exists');

    expect(entries).toHaveLength(1);
  });
});
