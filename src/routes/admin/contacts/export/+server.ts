import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
  // Check authentication
  const session = cookies.get('admin_session');
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Get search and status from query params
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || undefined;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }

    // Get all matching contacts
    const contacts = await locals.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Convert to CSV
    const headers = ['Nombre', 'Email', 'Mensaje', 'Estado', 'Fecha de creación'];
    
    const csvRows = [
      headers.join(','),
      ...contacts.map((contact: any) => 
        [
          `"${contact.name.replace(/"/g, '""')}"`,
          contact.email,
          `"${contact.message.replace(/"/g, '""')}"`,
          contact.status,
          new Date(contact.createdAt).toISOString()
        ].join(',')
      )
    ];

    const csv = csvRows.join('\n');

    // Return CSV file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=contactos.csv',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error exporting contacts:', error);
    return new Response('Error generating export', { status: 500 });
  }
};
