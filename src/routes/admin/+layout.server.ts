import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // hooks.server.ts already enforces protection and populates locals.session
  if (locals.session?.authenticated) {
    return { session: { authenticated: true } };
  }
  return { session: undefined };
};
