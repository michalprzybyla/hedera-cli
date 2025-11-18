/**
 * Enable Plugin Command Output
 * Reuses AddPluginOutputSchema but with enable-specific template.
 */
import { z } from 'zod';
import { AddPluginOutputSchema } from '../../schema';

// Export the schema
export { AddPluginOutputSchema as EnablePluginOutputSchema };

// Human-readable template for enable
export const ENABLE_PLUGIN_TEMPLATE = `{{#if added}}
✅ Plugin enabled successfully
   Name: {{name}}
   Path: {{path}}
{{else}}
❌ Failed to enable plugin
   Name: {{name}}
   Path: {{path}}
   Error: {{message}}
{{/if}}`;

// Type export
export type EnablePluginOutput = z.infer<typeof AddPluginOutputSchema>;
