import { redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { ContactStatus, Prisma } from '@prisma/client';

// Number of contacts per page
const CONTACTS_PER_PAGE = 10;

// Server-side types

// Using App.Locals (augmented in src/app.d.ts) for typing

export const load: PageServerLoad = async ({ url, cookies, locals }) => {
  // Check if user is logged in
  const session = cookies.get('admin_session');
  if (!session) {
    throw redirect(302, '/admin/login');
  }

  // Handle pagination
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = CONTACTS_PER_PAGE;
  const skip = (page - 1) * perPage;

  // Handle sorting
  const sort = (url.searchParams.get('sort') || 'createdAt') as string;
  const order = (url.searchParams.get('order') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';
  const orderBy = { [sort]: order } as Prisma.ContactOrderByWithRelationInput;

  // Handle status filter
  const status = url.searchParams.get('status') as ContactStatus | null;

  // Build where clause
  const where: Prisma.ContactWhereInput = {};
  
  // Handle search
  const search = url.searchParams.get('search') || undefined;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { message: { contains: search, mode: 'insensitive' as const } }
    ];
  }
  
  if (status) {
    where.status = status;
  }

  // Get total count and paginated contacts
  const [total, contacts] = await Promise.all([
    locals.prisma.contact.count({ where }),
    locals.prisma.contact.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        status: true,
        createdAt: true
      }
    })
  ]);

  // Ensure contacts have the correct type
  const typedContacts = contacts as Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    status: ContactStatus;
    createdAt: Date;
  }>;

  return {
    session: { authenticated: true },
    contacts: typedContacts,
    total,
    page,
    perPage,
    hasNext: skip + perPage < total,
    hasPrev: page > 1,
    search: search,
    status: status || undefined,
    sort,
    order
  } satisfies Record<string, unknown>;
};

export const actions: Actions = {
  // Handle logout
  logout: async ({ cookies }) => {
    cookies.delete('admin_session', { 
      path: '/admin',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    throw redirect(303, '/admin/login');
  },
  
  // Handle contact deletion
  deleteContact: async ({ request, locals }) => {
    if (!locals.session?.authenticated) {
      throw error(401, 'Unauthorized');
    }
    
    const data = await request.formData();
    const id = data.get('id') as string;
    
    if (!id) {
      throw error(400, 'Contact ID is required');
    }
    
    try {
      await locals.prisma.contact.delete({
        where: { id }
      });
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting contact:', err);
      throw error(500, 'Failed to delete contact');
    }
  }
};
