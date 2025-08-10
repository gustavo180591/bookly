import { json } from '@sveltejs/kit';
import { sendMail } from '$lib/server/email';

export async function GET() {
  const testEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  
  try {
    await sendMail({
      to: testEmail,
      subject: 'Test de Email — Bookly',
      html: `
        <h1>✅ Prueba de Email Exitosa</h1>
        <p>Este es un correo de prueba desde Bookly 🚀</p>
        <p><strong>Hora del envío:</strong> ${new Date().toLocaleString()}</p>
        <p>Si estás viendo este correo, la configuración SMTP es correcta.</p>
      `
    });
    
    return json({ 
      ok: true, 
      message: 'Email de prueba enviado correctamente',
      sentTo: testEmail
    });
    
  } catch (err) {
    console.error('❌ Error enviando email de prueba:', err);
    return json({ 
      ok: false, 
      error: err instanceof Error ? err.message : 'Error desconocido'
    }, { status: 500 });
  }
}
