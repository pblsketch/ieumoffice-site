// Vercel OIDC Workload Identity Federation credential helper (used only when
// running on Vercel or local dev with `vercel env pull`). Cloudflare Pages
// Functions authenticate directly with ANTHROPIC_API_KEY instead.

import Anthropic from '@anthropic-ai/sdk'
import { oidcFederationProvider } from '@anthropic-ai/sdk/lib/credentials/oidc-federation'
import { getVercelOidcToken } from '@vercel/oidc'

export function createVercelClaudeClient(env) {
  return new Anthropic({
    credentials: oidcFederationProvider({
      identityTokenProvider: () => getVercelOidcToken(),
      federationRuleId: env.ANTHROPIC_FEDERATION_RULE_ID,
      organizationId: env.ANTHROPIC_ORGANIZATION_ID,
      serviceAccountId: env.ANTHROPIC_SERVICE_ACCOUNT_ID,
      workspaceId: env.ANTHROPIC_WORKSPACE_ID,
      baseURL: 'https://api.anthropic.com',
      fetch,
    }),
    maxRetries: 1,
  })
}
