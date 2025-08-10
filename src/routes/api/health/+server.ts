import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { sendMail } from '$lib/server/email';

const prisma = new PrismaClient();

export const GET: RequestHandler = async () => {
  type HealthCheck = {
    status: 'ok' | 'error';
    timestamp: string;
    checks: {
      database: {
        status: 'ok' | 'error';
        timestamp: string;
        error?: string;
      };
      // Add more checks here as needed
    };
  };

  let databaseStatus: 'ok' | 'error' = 'ok';
  let databaseError: string | undefined;
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    databaseStatus = 'error';
    databaseError = error instanceof Error ? error.message : 'Unknown database error';
    
    // Send email notification for database error
    try {
      await sendMail({
        to: process.env.ADMIN_EMAIL || 'admin@example.com',
        subject: '🚨 Database Connection Error',
        html: `
          <h1>Database Connection Error</h1>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Error:</strong> ${databaseError}</p>
          <p>Please check the database server and connection settings.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send error email:', emailError);
    }
  }

  const healthCheck: HealthCheck = {
    status: databaseStatus === 'ok' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: databaseStatus,
        timestamp: new Date().toISOString(),
        ...(databaseError && { error: databaseError })
      }
      // Add more health checks as needed
    }
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    healthCheck.status = 'error';
    healthCheck.checks.database.status = 'error';
    healthCheck.checks.database.error = error instanceof Error ? error.message : 'Unknown error';
    
    return json(healthCheck, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Health-Check': 'true'
      }
    });
  } finally {
    await prisma.$disconnect();
  }

  return json(healthCheck, { 
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'X-Health-Check': 'true'
    }
  });
};
