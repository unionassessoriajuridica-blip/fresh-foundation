// src/services/twilioService.ts
class TwilioService {
  async sendWhatsAppMessageSimple(message: any) {
    try {
      // Use as variáveis de ambiente do Vite (frontend)
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Variáveis do Supabase não configuradas');
      }

      console.log('📤 Enviando mensagem via Supabase Function:', {
        to: message.to,
        body: message.body.substring(0, 50) + '...'
      });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/twilio-send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: message.to,
          body: message.body
        })
      });

      const responseText = await response.text();
      console.log('📩 Resposta da Supabase Function:', response.status, responseText);

      if (!response.ok) {
        throw new Error(`Supabase Function error: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ Mensagem enviada com sucesso via Function:', data.sid);
      return data;

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via Function:', error);
      throw error;
    }
  }

  async sendCobrancaMessage(telefone: string, clienteNome: string, valor: number, vencimento: string, dias: number, status: string) {
    try {
      // MENSAGENS LIVRES - funciona nas 24h pós-join
      let body = '';

      if (status === 'PENDENTE' && dias === 3) {
        body = `💡 Lembrete: Sr(a). ${clienteNome}, seu pagamento de ${this.formatCurrency(valor)} vence em ${new Date(vencimento).toLocaleDateString('pt-BR')}.`;
      } else if (status === 'PENDENTE' && dias === 0) {
        body = `⏰ Hoje: Sr(a). ${clienteNome}, seu pagamento de ${this.formatCurrency(valor)} vence hoje!`;
      } else if (status === 'PENDENTE' && dias === -3) {
        body = `🚨 Atraso: Sr(a). ${clienteNome}, seu pagamento de ${this.formatCurrency(valor)} está atrasado desde ${new Date(vencimento).toLocaleDateString('pt-BR')}.`;
      }

      if (!body) {
        console.log('Nenhuma mensagem para enviar');
        return;
      }

      const message = {
        to: `whatsapp:+55${telefone.replace(/\D/g, '')}`,
        body: body
      };

      return this.sendWhatsAppMessageSimple(message);
      
    } catch (error) {
      console.error('Erro no sendCobrancaMessage:', error);
      throw error;
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}

export const twilioService = new TwilioService();