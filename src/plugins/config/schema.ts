/**
 * Common schemas for config command outputs
 */
import { CONFIG_OPTION_TYPES } from '../../../core/services/config/config-service.interface';
import { z } from 'zod';

export const ConfigOptionTypeSchema = z.enum(CONFIG_OPTION_TYPES);

export const ConfigValueSchema = z.union([z.boolean(), z.number(), z.string()]);
