import { logger } from './logger';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Configuración del servicio de email
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@sky-track.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'SkyTrack';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Inicializar Resend solo si tenemos API key
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Inicializar Gmail transporter
let gmailTransporter: nodemailer.Transporter | null = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Genera el template HTML para el código de verificación
 */
function generateVerificationEmailTemplate(code: string, email: string): EmailTemplate {
  const subject = 'Código de verificación - SkyTrack';
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .code-container {
          background-color: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .verification-code {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SkyTrack</div>
          <h1>Recuperación de Contraseña</h1>
        </div>
        
        <p>Hola,</p>
        
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en SkyTrack.</p>
        
        <p>Tu código de verificación es:</p>
        
        <div class="code-container">
          <div class="verification-code">${code}</div>
        </div>
        
        <div class="warning">
          <strong>⚠️ Importante:</strong>
          <ul>
            <li>Este código expira en <strong>5 minutos</strong></li>
            <li>No compartas este código con nadie</li>
            <li>Si no solicitaste este cambio, ignora este email</li>
          </ul>
        </div>
        
        <p>Si tienes problemas, puedes copiar y pegar el código manualmente.</p>
        
        <div class="footer">
          <p>Este email fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
          <p>&copy; 2024 SkyTrack. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    SkyTrack - Recuperación de Contraseña
    
    Hola,
    
    Recibimos una solicitud para restablecer la contraseña de tu cuenta en SkyTrack.
    
    Tu código de verificación es: ${code}
    
    IMPORTANTE:
    - Este código expira en 5 minutos
    - No compartas este código con nadie
    - Si no solicitaste este cambio, ignora este email
    
    Si tienes problemas, puedes copiar y pegar el código manualmente.
    
    Este email fue enviado automáticamente. Por favor no respondas a este mensaje.
    
    © 2024 SkyTrack. Todos los derechos reservados.
  `;
  
  return { subject, html, text };
}

/**
 * Envía email usando Resend
 */
async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  try {
    logger.info(`Enviando email de verificación a ${to}`, {
      action: 'send_verification_email',
      data: { 
        to, 
        subject: template.subject,
        from: EMAIL_FROM,
        timestamp: new Date().toISOString()
      }
    });

    // Prioridad 1: Intentar con Gmail (sin restricciones)
    if (gmailTransporter && GMAIL_USER && GMAIL_APP_PASSWORD) {
      try {
        const info = await gmailTransporter.sendMail({
          from: `${EMAIL_FROM_NAME} <${GMAIL_USER}>`,
          to: to,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });

        logger.info(`Email de verificación enviado exitosamente a ${to}`, {
          action: 'verification_email_sent',
          data: { 
            to, 
            mode: 'gmail',
            messageId: info.messageId,
            subject: template.subject
          }
        });
        
        return true;
      } catch (error) {
        logger.error(`Error con Gmail, intentando con Resend: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          action: 'gmail_fallback',
          data: { to }
        });
      }
    }

    // Prioridad 2: Intentar con Resend
    if (resend && RESEND_API_KEY) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
          to: [to],
          subject: template.subject,
          html: template.html,
          text: template.text,
        });

        if (error) {
          throw new Error(error.message);
        }

        logger.info(`Email de verificación enviado exitosamente a ${to}`, {
          action: 'verification_email_sent',
          data: { 
            to, 
            mode: 'resend',
            messageId: data?.id,
            subject: template.subject
          }
        });
        
        return true;
      } catch (error) {
        logger.error(`Error con Resend: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          action: 'resend_error',
          data: { to }
        });
      }
    }

    // Fallback: Modo desarrollo
    logger.warn('Ni Gmail ni Resend configurados, enviando email simulado', {
      action: 'send_verification_email_no_service',
      data: { to }
    });
    
    // Modo desarrollo sin servicios de email
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL DE VERIFICACIÓN (MODO DESARROLLO)');
    console.log('='.repeat(60));
    console.log(`Para: ${to}`);
    console.log(`De: ${EMAIL_FROM_NAME} <${EMAIL_FROM}>`);
    console.log(`Asunto: ${template.subject}`);
    console.log('-'.repeat(60));
    console.log(template.text);
    console.log('='.repeat(60) + '\n');
    
    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info(`Email de verificación simulado enviado a ${to}`, {
      action: 'verification_email_sent',
      data: { to, mode: 'development' }
    });
    
    return true;
  } catch (error) {
    logger.error(`Error al enviar email a ${to}`, {
      action: 'send_verification_email_error',
      data: { 
        to, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    return false;
  }
}

/**
 * Envía un código de verificación por email
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    const template = generateVerificationEmailTemplate(code, email);
    const success = await sendEmail(email, template);
    
    if (success) {
      logger.info(`Código de verificación enviado exitosamente a ${email}`, {
        action: 'verification_code_email_sent',
        data: { email }
      });
    } else {
      logger.error(`Falló el envío del código de verificación a ${email}`, {
        action: 'verification_code_email_failed',
        data: { email }
      });
    }
    
    return success;
  } catch (error) {
    logger.error(`Error al enviar código de verificación a ${email}`, {
      action: 'send_verification_code_error',
      data: { 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    return false;
  }
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Obtiene la configuración del servicio de email
 */
export function getEmailConfig() {
  return {
    from: EMAIL_FROM,
    fromName: EMAIL_FROM_NAME,
    isDevelopment: process.env.NODE_ENV === 'development'
  };
}
