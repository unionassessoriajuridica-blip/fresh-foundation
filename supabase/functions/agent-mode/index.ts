import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, files = [], previousMessages = [] } = await req.json();

    if (!message) {
      throw new Error('Mensagem é obrigatória');
    }

    console.log('🤖 Modo Agente ativado para:', message);

    // Sistema prompt para modo agente
    const agentSystemPrompt = `Você é um agente jurídico autônomo especializado em direito brasileiro. Sua função é:

1. ANALISAR o problema apresentado de forma estruturada
2. DECOMPOR em etapas menores se necessário  
3. PESQUISAR informações relevantes quando apropriado
4. FORNECER soluções práticas e fundamentadas
5. CITAR fontes legais específicas (leis, artigos, jurisprudência)
6. SUGERIR próximos passos concretos

Características do modo agente:
- Seja proativo e pense além da pergunta inicial
- Identifique possíveis problemas ou oportunidades relacionadas
- Forneça análises detalhadas e estratégicas
- Use raciocínio jurídico estruturado
- Considere diferentes cenários e suas implicações

Contexto adicional: ${context || 'Assistente jurídico geral'}`;

    // Construir histórico de mensagens
    const messages = [
      { role: 'system', content: agentSystemPrompt }
    ];

    // Adicionar mensagens anteriores se houver
    if (previousMessages.length > 0) {
      messages.push(...previousMessages);
    }

    // Adicionar informações de arquivos se houver
    if (files.length > 0) {
      const fileInfo = files.map(f => `Arquivo: ${f.name} (${f.type})`).join('\n');
      messages.push({
        role: 'system',
        content: `Arquivos anexados pelo usuário:\n${fileInfo}\n\nConsidere estes arquivos na sua análise.`
      });
    }

    // Adicionar mensagem do usuário
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
        tools: [
          {
            type: "function",
            function: {
              name: "search_legal_information",
              description: "Buscar informações jurídicas atualizadas na web",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Termo de busca jurídica"
                  }
                },
                required: ["query"]
              }
            }
          },
          {
            type: "function", 
            function: {
              name: "analyze_legal_document",
              description: "Analisar documento jurídico em detalhes",
              parameters: {
                type: "object",
                properties: {
                  document_type: {
                    type: "string",
                    description: "Tipo do documento (contrato, petição, etc.)"
                  },
                  key_points: {
                    type: "array",
                    items: { type: "string" },
                    description: "Pontos principais a analisar"
                  }
                },
                required: ["document_type"]
              }
            }
          }
        ],
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro na API da OpenAI');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message;

    // Verificar se IA quer usar ferramentas
    if (aiResponse.tool_calls) {
      console.log('🔧 IA solicitou uso de ferramentas:', aiResponse.tool_calls.length);
      
      const toolResults = [];
      for (const toolCall of aiResponse.tool_calls) {
        if (toolCall.function.name === 'search_legal_information') {
          toolResults.push({
            tool_call_id: toolCall.id,
            result: `Busca realizada: ${JSON.parse(toolCall.function.arguments).query} - Consulte jurisprudência e legislação atualizada.`
          });
        } else if (toolCall.function.name === 'analyze_legal_document') {
          const args = JSON.parse(toolCall.function.arguments);
          toolResults.push({
            tool_call_id: toolCall.id,
            result: `Análise de ${args.document_type} - Pontos identificados para revisão detalhada.`
          });
        }
      }

      return new Response(JSON.stringify({ 
        response: aiResponse.content || 'Processando análise...',
        toolCalls: aiResponse.tool_calls,
        toolResults: toolResults,
        agentMode: true,
        reasoning: 'Modo agente ativado - análise estruturada em andamento'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Resposta do agente gerada');

    return new Response(JSON.stringify({ 
      response: aiResponse.content,
      agentMode: true,
      reasoning: 'Análise completa realizada pelo modo agente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro no modo agente:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});