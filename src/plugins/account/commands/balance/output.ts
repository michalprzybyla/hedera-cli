/**
 * Account Balance Command Output Schema and Template
 */
import { z } from 'zod';
import {
  EntityIdSchema,
  TinybarSchema,
  HtsBaseUnitSchema,
} from '../../../../core/schemas';

/**
 * Account Balance Command Output Schema
 */
export const AccountBalanceOutputSchema = z.object({
  accountId: EntityIdSchema,
  hbarBalance: TinybarSchema,
  hbarOnly: z.boolean().optional(),
  tokenBalances: z
    .array(
      z.object({
        tokenId: EntityIdSchema,
        balance: HtsBaseUnitSchema,
      }),
    )
    .optional(),
});

export type AccountBalanceOutput = z.infer<typeof AccountBalanceOutputSchema>;

/**
 * Human-readable template for account balance output
 */
export const ACCOUNT_BALANCE_TEMPLATE = `
💰 Account Balance: {{hbarBalance}} tinybars
{{#unless hbarOnly}}
{{#if tokenBalances}}
🪙 Token Balances:
{{#each tokenBalances}}
   {{tokenId}}: {{balance}}
{{/each}}
{{else}}
   No token balances found
{{/if}}
{{/unless}}
`.trim();
