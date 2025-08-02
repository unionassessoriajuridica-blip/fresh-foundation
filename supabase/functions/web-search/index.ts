import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { query, sources = [] } = await req.json();

    if (!query) {
      throw new Error('Query é obrigatória');
    }

    // Usar Perplexity para busca na web
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityKey) {
      throw new Error('PERPLEXITY_API_KEY não configurada');
    }

    console.log('🔍 Realizando busca na web:', query);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em pesquisa jurídica no Brasil. Forneça informações atualizadas, precisas e cite suas fontes. Use linguagem técnica apropriada para advogados.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: true,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro na API da Perplexity');
    }

    const data = await response.json();
    const searchResult = data.choices[0].message.content;
    const relatedQuestions = data.related_questions || [];

    console.log('✅ Busca na web concluída');

    return new Response(JSON.stringify({ 
      result: searchResult,
      relatedQuestions,
      sources: sources,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na busca web:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});