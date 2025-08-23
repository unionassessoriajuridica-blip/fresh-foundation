// src/services/cobrancaScheduler.ts
import { supabase } from '@/integrations/supabase/client.ts';
import { twilioService } from './twilioService.ts';

export class CobrancaScheduler {
  static async verificarVencimentos() {
    try {
      const hoje = new Date();
      const tresDias = new Date();
      tresDias.setDate(hoje.getDate() + 3);

      console.log('Verificando vencimentos para:', hoje.toISOString().split('T')[0]);

      // Buscar parcelas que vencem em 3 dias
      const { data: parcelasProximas, error } = await supabase
        .from('financeiro')
        .select('*')
        .eq('status', 'PENDENTE')
        .lte('vencimento', tresDias.toISOString().split('T')[0])
        .gte('vencimento', hoje.toISOString().split('T')[0])
        .is('ultimo_envio_cobranca', null);

      if (error) throw error;

      console.log(`Encontradas ${parcelasProximas?.length || 0} parcelas próximas do vencimento`);

      for (const parcela of parcelasProximas || []) {
        // Buscar telefone do cliente separadamente
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .select('telefone')
          .eq('nome', parcela.cliente_nome)
          .eq('user_id', parcela.user_id)
          .single();

        if (clienteError) {
          console.error('Erro ao buscar cliente:', clienteError);
          continue;
        }

        const telefone = clienteData?.telefone;
        if (!telefone) {
          console.log(`Cliente ${parcela.cliente_nome} não possui telefone`);
          continue;
        }

        const vencimento = new Date(parcela.vencimento);
        const diffDias = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        await twilioService.sendCobrancaMessage(
          telefone,
          parcela.cliente_nome,
          Number(parcela.valor),
          parcela.vencimento,
          diffDias,
          parcela.status
        );

        // Atualizar registro
        const { error: updateError } = await supabase
          .from('financeiro')
          .update({ 
            ultimo_envio_cobranca: new Date().toISOString(),
            tentativas_cobranca: (parcela.tentativas_cobranca || 0) + 1
          })
          .eq('id', parcela.id);

        if (updateError) {
          console.error('Erro ao atualizar parcela:', updateError);
        }
      }

      console.log('Processamento de cobranças concluído!');

    } catch (error) {
      console.error('Erro no agendador de cobranças:', error);
    }
  }
}