import type { LayoutServerLoad } from './$types';
import type { ServerLoadEvent } from '@sveltejs/kit';

export const load = (async ({ locals }: ServerLoadEvent) => {
  // hooks.server.ts already enforces protection and populates locals.session
  if (locals.session?.authenticated) {
    return { session: { authenticated: true } };
  }
  return { session: undefined };
}) satisfies LayoutServerLoad;
