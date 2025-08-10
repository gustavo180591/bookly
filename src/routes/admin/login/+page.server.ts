import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { PRIVATE_ADMIN_PASSWORD } from '$env/static/private';

export const load: PageServerLoad = async ({ locals }) => {
  // If already logged in, redirect to admin
  if (locals.session) {
    throw redirect(302, '/admin');
  }
  return {};
};

export const actions = {
  default: async ({ cookies, request, url }) => {
    const data = await request.formData();
    const password = data.get('password');
    const redirectTo = data.get('redirectTo') as string;

    if (password === PRIVATE_ADMIN_PASSWORD) {
      // Set secure, httpOnly cookie
      cookies.set('admin_session', 'authenticated', {
        path: '/admin',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      throw redirect(303, redirectTo || '/admin');
    }

    return {
      error: 'Contraseña incorrecta',
    };
  },
} satisfies Actions;
