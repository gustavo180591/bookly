import { fail, type Actions, type ActionFailure } from '@sveltejs/kit';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

type ContactStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'SPAM';
import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

const prisma = new PrismaClient();

// Types
type FormData = {
  name: string;
  email: string;
  message: string;
};

type FormErrors = {
  fieldErrors: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
};

type FormResult = {
  success: boolean;
  message?: string;
  error?: string;
  errors?: FormErrors['fieldErrors'];
  data?: FormData;
};

// Schema for form validation
const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email')
    .max(100, 'Email must be less than 100 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters')
});

// Initialize email transporter
const createTransporter = async () => {
  if (!env.PRIVATE_EMAIL || !env.PRIVATE_EMAIL_PASSWORD) {
    // Use Ethereal for development
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('Ethereal test account created:', testAccount.user);
    console.log('Ethereal test password:', testAccount.pass);
    
    return {
      transporter,
      from: `"Bookly Contact" <${testAccount.user}>`,
      to: 'admin@example.com',
      isDev: true
    };
  }
  
  // Use real SMTP config in production
  return {
    transporter: nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: env.PRIVATE_EMAIL,
        pass: env.PRIVATE_EMAIL_PASSWORD
      }
    }),
    from: `"Bookly Contact" <${env.PRIVATE_EMAIL}>`,
    to: env.PRIVATE_EMAIL,
    isDev: false
  };
};

export const actions: Actions = {
  default: async ({ request }): Promise<FormResult | ActionFailure<FormResult>> => {
    const formData = await request.formData();
    const data = Object.fromEntries(formData) as Record<string, string>;
    
    // Validate form data
    const result = contactSchema.safeParse(data);
    
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as FormErrors['fieldErrors'];
      return {
        success: false,
        errors,
        data: {
          name: data.name || '',
          email: data.email || '',
          message: data.message || ''
        }
      };
    }
    
    try {
      const { name, email, message } = result.data;
      
      // Save to database
      await prisma.contact.create({
        data: {
          name,
          email,
          message,
          status: 'NEW' as ContactStatus,
          tags: ['contact-form']
        }
      });
      
      // Set up email transport
      const { transporter, from, to, isDev } = await createTransporter();
      
      // Send email notification
      const mailOptions = {
        from: `"${name}" <${isDev ? from : email}>`,
        to,
        replyTo: email,
        subject: 'New Contact Form Submission',
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          '',
          'Message:',
          message
        ].join('\n'),
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      if (isDev) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      };
      
    } catch (error) {
      console.error('Error processing contact form:', error);
      return fail(500, { 
        success: false,
        error: 'An error occurred while processing your request.',
        data: {
          name: data.name || '',
          email: data.email || '',
          message: data.message || ''
        }
      });
    }
  }
};
