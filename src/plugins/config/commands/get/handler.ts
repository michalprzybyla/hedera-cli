import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { ConfigOptionType } from '../../../../core/services/config/config-service.interface';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../utils/errors';
import { GetConfigOutput } from './output';

function inferConfigOptionType(
  descriptorType: string | undefined,
  value: unknown,
): ConfigOptionType {
  const typeMap: Record<string, 'boolean' | 'number'> = {
    boolean: 'boolean',
    number: 'number',
  };
  return (
    (descriptorType as ConfigOptionType | undefined) ??
    typeMap[typeof value] ??
    'string'
  );
}

export async function getConfigOption(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api } = args;
  const name = args.args.option as string | undefined;

  if (!name) {
    return {
      status: Status.Failure,
      errorMessage: 'Missing required --option parameter',
    };
  }

  try {
    const value = api.config.getOption(name);
    // Try to detect type against listOptions
    const descriptor = api.config.listOptions().find((o) => o.name === name);
    const type = inferConfigOptionType(descriptor?.type, value);

    const output: GetConfigOutput = {
      name,
      type: type as GetConfigOutput['type'],
      value: value,
      allowedValues: descriptor?.allowedValues,
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(output),
    };
  } catch (error) {
    return {
      status: Status.Failure,
      errorMessage: formatError(`Failed to get option "${name}"`, error),
    };
  }
}
