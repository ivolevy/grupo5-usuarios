import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: 'mail.techsecuritysrl.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: 'ordenesdetrabajo@techsecuritysrl.com',
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async enviarEmail(to: string, subject: string, body: string) {
    try {
      const mailOptions = {
        from: '"TECH Security" <ordenesdetrabajo@techsecuritysrl.com>',
        to,
        subject,
        html: body
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'Email enviado correctamente', info };
    } catch (error) {
      throw new Error(`Error enviando email: ${error instanceof Error ? error.message : error}`);
    }
  }

  async enviarCodigoRecupero(email: string, codigo: string) {
    const subject = 'Código de recupero de contraseña - TECH Security';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recupero de Contraseña</h2>
        <p>Hola,</p>
        <p>Has solicitado recuperar tu contraseña. Utiliza el siguiente código para continuar:</p>
        
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${codigo}</h1>
        </div>
        
        <p><strong>Este código expira en 15 minutos.</strong></p>
        <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático, por favor no respondas.
        </p>
      </div>
    `;

    return await this.enviarEmail(email, subject, body);
  }

  async enviarConfirmacionRecupero(email: string) {
    const subject = 'Contraseña actualizada - TECH Security';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Contraseña Actualizada</h2>
        <p>Hola,</p>
        <p>Tu contraseña ha sido actualizada exitosamente.</p>
        <p>Si no realizaste este cambio, contacta inmediatamente al soporte técnico.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Este es un email automático, por favor no respondas.
        </p>
      </div>
    `;

    return await this.enviarEmail(email, subject, body);
  }
}

// Instancia singleton
export const emailService = new EmailService();
