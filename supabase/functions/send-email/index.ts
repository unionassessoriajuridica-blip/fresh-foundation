import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  type?: 'notification' | 'reminder' | 'report';
  clienteName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, type, clienteName }: EmailRequest = await req.json();

    if (!to || !subject || !message) {
      throw new Error('Campos obrigatórios: to, subject, message');
    }

    // Template de email baseado no tipo
    const getEmailTemplate = (type: string, message: string, clienteName?: string) => {
      const baseStyle = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Sistema Jurídico</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      `;

      const footer = `
          </div>
        </div>
      `;

      switch (type) {
        case 'notification':
          return `${baseStyle}
            <h2 style="color: #333; margin-bottom: 20px;">🔔 Notificação Importante</h2>
            ${clienteName ? `<p style="color: #666; margin-bottom: 15px;"><strong>Cliente:</strong> ${clienteName}</p>` : ''}
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
              ${message}
            </div>
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              Esta é uma notificação automática do seu sistema jurídico.
            </p>
            ${footer}`;

        case 'reminder':
          return `${baseStyle}
            <h2 style="color: #333; margin-bottom: 20px;">⏰ Lembrete de Prazo</h2>
            ${clienteName ? `<p style="color: #666; margin-bottom: 15px;"><strong>Cliente:</strong> ${clienteName}</p>` : ''}
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
              ${message}
            </div>
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              Não se esqueça de tomar as devidas providências.
            </p>
            ${footer}`;

        case 'report':
          return `${baseStyle}
            <h2 style="color: #333; margin-bottom: 20px;">📊 Relatório</h2>
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #17a2b8;">
              ${message}
            </div>
            <p style="color: #666; margin-top: 20px; font-size: 14px;">
              Relatório gerado automaticamente pelo sistema.
            </p>
            ${footer}`;

        default:
          return `${baseStyle}
            <h2 style="color: #333; margin-bottom: 20px;">💼 Mensagem do Sistema</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              ${message}
            </div>
            ${footer}`;
      }
    };

    const emailResponse = await resend.emails.send({
      from: "Sistema Jurídico <noreply@resend.dev>",
      to: [to],
      subject: subject,
      html: getEmailTemplate(type || 'default', message, clienteName),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);