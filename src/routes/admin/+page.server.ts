import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import type { ContactStatus, Prisma } from '@prisma/client';

// Define types for server-side context
interface ServerLocals {
  prisma: {
    contact: {
      count: (args: { where?: Prisma.ContactWhereInput }) => Promise<number>;
      findMany: (args: {
        where?: Prisma.ContactWhereInput;
        orderBy?: Prisma.ContactOrderByWithRelationInput;
        skip?: number;
        take?: number;
        select?: Prisma.ContactSelect;
      }) => Promise<Array<{
        id: string;
        name: string;
        email: string;
        message: string;
        status: ContactStatus;
        createdAt: Date;
      }>>;
      delete: (args: { where: { id: string } }) => Promise<void>;
    };
  };
}

interface PageData {
  session: boolean;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    status: ContactStatus;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  search?: string;
  status?: string;
  sort: string;
  order: 'asc' | 'desc';
}

export const load: PageServerLoad<PageData> = async ({ 
  url, 
  cookies, 
  locals 
}: { 
  url: URL; 
  cookies: { get: (name: string) => string | undefined }; 
  locals: ServerLocals 
}) => {
  // Check if user is logged in
  const session = cookies.get('admin_session');
  if (!session) {
    throw redirect(302, '/admin/login');
  }

  // Check if PRIVATE_ADMIN_PASSWORD is set
  if (!env.PRIVATE_ADMIN_PASSWORD) {
    throw new Error('PRIVATE_ADMIN_PASSWORD is not set in environment variables');
  }

  // Handle pagination
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = 10;
  const skip = (page - 1) * perPage;

  // Handle sorting
  const sort = (url.searchParams.get('sort') as keyof typeof Prisma.ContactScalarFieldEnum) || 'createdAt';
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
    session: true,
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
  };
};

export const actions: Actions = {
  logout: async ({ cookies }: { cookies: { delete: (name: string, options: { path: string }) => void } }) => {
    cookies.delete('admin_session', { path: '/' });
    throw redirect(303, '/admin/login');
  },
  
  deleteContact: async ({ 
    request, 
    locals 
  }: { 
    request: Request; 
    locals: ServerLocals 
  }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    
    if (!id) {
      throw new Error('Contact ID is required');
    }
    
    await locals.prisma.contact.delete({
      where: { id }
    });
    
    return { success: true };
  }
};
