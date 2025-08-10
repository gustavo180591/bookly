import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

export const handleAuth: Handle = async ({ event, resolve }) => {
  // Get session from cookies
  const session = event.cookies.get('admin_session');
  
  // Add session to locals for use in load functions
  if (session === 'authenticated') {
    event.locals.session = { authenticated: true };
  } else {
    event.locals.session = undefined;
  }

  // Protect admin routes
  if (event.url.pathname.startsWith('/admin')) {
    // Allow access to login page
    if (event.url.pathname === '/admin/login') {
      // If already logged in, redirect to admin
      if (session === 'authenticated') {
        throw redirect(303, '/admin');
      }
      return resolve(event);
    }

    // Require authentication for other admin routes
    if (session !== 'authenticated') {
      const redirectTo = event.url.pathname + event.url.search;
      throw redirect(303, `/admin/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
  }

  return resolve(event);
};

export const handle = sequence(handleAuth);
