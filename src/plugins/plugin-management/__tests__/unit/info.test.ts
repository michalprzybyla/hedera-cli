/**
 * Unit tests for plugin-management info command
 */
import { Status } from '../../../../core/shared/constants';
import { getPluginInfo } from '../../commands/info/handler';
import type { StateService } from '../../../../core/services/state/state-service.interface';
import {
  makeArgs,
  makeLogger,
  makeStateMock,
} from '../../../../core/shared/__tests__/helpers/mocks';
import type { PluginStateEntry } from '../../../../core/plugins/plugin.interface';

jest.mock('path', () => ({
  resolve: (...segments: string[]) => segments.join('/'),
}));

jest.mock(
  'dist/plugins/topic/manifest.js',
  () => ({
    default: {
      name: 'topic',
      version: '2.0.0',
      displayName: 'Topic Plugin',
      description: 'Manage Hedera topics',
      commands: [{ name: 'list' }, { name: 'create' }],
      capabilities: ['topic:list', 'topic:create'],
    },
  }),
  { virtual: true },
);

describe('plugin-management info command', () => {
  it('should return plugin information from manifest', async () => {
    const logger = makeLogger();
    const entry: PluginStateEntry = {
      name: 'topic',
      path: 'dist/plugins/topic',
      enabled: true,
    };
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.get.mockReturnValue(entry);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'topic' });

    const result = await getPluginInfo(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    const output = JSON.parse(result.outputJson!);
    expect(output.found).toBe(true);
    expect(output.plugin.name).toBe('topic');
    expect(output.plugin.version).toBe('2.0.0');
    expect(output.plugin.displayName).toBe('Topic Plugin');
    expect(output.plugin.description).toContain('Manage Hedera topics');
    expect(output.plugin.commands).toEqual(['list', 'create']);
    expect(output.plugin.capabilities).toEqual(['topic:list', 'topic:create']);
  });

  it('should fall back to state data when manifest is not available', async () => {
    const logger = makeLogger();
    const entry: PluginStateEntry = {
      name: 'custom-plugin',
      path: 'dist/plugins/custom-plugin',
      enabled: true,
      displayName: 'Custom Plugin',
      version: '0.1.0',
      description: 'Description from state',
      commands: ['run'],
      capabilities: ['custom:run'],
    };
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.get.mockReturnValue(entry);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await getPluginInfo(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    const output = JSON.parse(result.outputJson!);
    expect(output.found).toBe(true);
    expect(output.plugin.name).toBe('custom-plugin');
    expect(output.plugin.version).toBe('0.1.0');
    expect(output.plugin.displayName).toBe('Custom Plugin');
    expect(output.plugin.description).toBe('Description from state');
    expect(output.plugin.commands).toEqual(['run']);
    expect(output.plugin.capabilities).toEqual(['custom:run']);
  });

  it('should return not found when plugin does not exist', async () => {
    const logger = makeLogger();
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.get.mockReturnValue(undefined);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'missing-plugin' });

    const result = await getPluginInfo(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    const output = JSON.parse(result.outputJson!);
    expect(output.found).toBe(false);
    expect(output.message).toContain('missing-plugin');
  });
});
