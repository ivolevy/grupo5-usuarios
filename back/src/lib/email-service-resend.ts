import { Resend } from 'resend';

export class EmailServiceResend {
  private resend: Resend;

  constructor() {
    // Resend no requiere credenciales de aplicación para el plan gratuito
    // Solo necesitas registrarte en resend.com y obtener una API key
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); // Fallback para desarrollo
  }

  private logEmailAttempt(type: string, email: string, status: 'success' | 'error', details?: any) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      type,
      email,
      status,
      details: details || {}
    };

    if (status === 'success') {
      console.log(`✅ [EMAIL SUCCESS] ${type} enviado a ${email}`, logData);
    } else {
      console.error(`❌ [EMAIL ERROR] ${type} falló para ${email}`, logData);
    }
  }

  async enviarEmail(to: string, subject: string, body: string) {
    const emailType = subject.includes('recupero') ? 'Código de Recupero' : 'Confirmación';
    
    try {
      console.log(`📧 [EMAIL ATTEMPT] Enviando ${emailType} a ${to}...`);
      
      const { data, error } = await this.resend.emails.send({
        from: 'SkyTrack <noreply@sky-track.com>', // Dominio verificado en Resend
        to: [to],
        subject,
        html: body
      });

      if (error) {
        this.logEmailAttempt(emailType, to, 'error', { error: error.message });
        throw new Error(`Error enviando email: ${error.message}`);
      }

      this.logEmailAttempt(emailType, to, 'success', { 
        messageId: data?.id,
        subject,
        timestamp: new Date().toISOString()
      });

      return { success: true, message: 'Email enviado correctamente', data };
    } catch (error) {
      this.logEmailAttempt(emailType, to, 'error', { 
        error: error instanceof Error ? error.message : error,
        subject
      });
      throw new Error(`Error enviando email: ${error instanceof Error ? error.message : error}`);
    }
  }

  async enviarCodigoRecupero(email: string, codigo: string) {
    const subject = 'Código de recupero de contraseña - SkyTrack';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">SkyTrack</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Sistema de Gestión</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h2 style="color: white; margin: 0 0 15px 0; font-size: 24px;">Recupero de Contraseña</h2>
          <p style="color: white; margin: 0 0 20px 0; font-size: 16px;">Utiliza el siguiente código para continuar:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block; margin: 10px 0;">
            <h1 style="color: #2563eb; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: monospace;">${codigo}</h1>
          </div>
          
          <p style="color: white; margin: 20px 0 0 0; font-size: 14px;">
            <strong>Este código expira en 15 minutos.</strong>
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Instrucciones:</h3>
          <ol style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li>Ingresa este código en la página de verificación</li>
            <li>El código es válido por 15 minutos</li>
            <li>Si no solicitaste este cambio, ignora este email</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Este es un email automático, por favor no respondas.<br>
            Si tienes problemas, contacta al soporte técnico.
          </p>
        </div>
      </div>
    `;

    return await this.enviarEmail(email, subject, body);
  }

  async enviarConfirmacionRecupero(email: string) {
    const subject = 'Contraseña actualizada exitosamente - SkyTrack';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">SkyTrack</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Sistema de Gestión</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <div style="background: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="font-size: 30px;">✅</span>
          </div>
          <h2 style="color: white; margin: 0 0 15px 0; font-size: 24px;">¡Contraseña Actualizada!</h2>
          <p style="color: white; margin: 0; font-size: 16px;">Tu contraseña ha sido cambiada exitosamente.</p>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⚠️ Importante:</h3>
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            Si no realizaste este cambio, contacta inmediatamente al soporte técnico.
          </p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Próximos pasos:</h3>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li>Ya puedes iniciar sesión con tu nueva contraseña</li>
            <li>Mantén tu contraseña segura y no la compartas</li>
            <li>Considera usar un gestor de contraseñas</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Este es un email automático, por favor no respondas.<br>
            Si tienes problemas, contacta al soporte técnico.
          </p>
        </div>
      </div>
    `;

    return await this.enviarEmail(email, subject, body);
  }
}

// Instancia singleton
export const emailServiceResend = new EmailServiceResend();
