import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  // Only check session for non-login admin routes
  if (!url.pathname.startsWith('/admin/login')) {
    const session = cookies.get('admin_session');
    if (!session || session !== 'authenticated') {
      // If not logged in, redirect to login with redirect back to intended URL
      throw redirect(303, `/admin/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
    return { session: { isAdmin: true } };
  }
  return {};
};
