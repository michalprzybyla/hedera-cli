import { CommandOption } from '../plugins/plugin.types';

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

export function filterReservedOptions(options: CommandOption[]): {
  allowed: CommandOption[];
  filtered: string[];
} {
  const reservedNames = new Set(
    options
      .filter((option) => RESERVED_LONG_OPTIONS.has(option.name.toLowerCase()))
      .map((option) => option.name),
  );
  const allowed = options.filter((option) => !reservedNames.has(option.name));
  const filtered = Array.from(reservedNames);
  return { allowed, filtered };
}
