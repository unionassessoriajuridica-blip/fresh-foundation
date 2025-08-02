import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { templateId, signatarios } = await req.json()

    if (!templateId || !signatarios || !Array.isArray(signatarios)) {
      return new Response(JSON.stringify({ error: 'Template ID and signatarios are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const docusealApiKey = Deno.env.get('DOCUSEAL_API_KEY')
    const docusealBaseUrl = Deno.env.get('DOCUSEAL_BASE_URL')

    if (!docusealApiKey || !docusealBaseUrl) {
      return new Response(JSON.stringify({ error: 'DocuSeal configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send for signature
    const signatureData = {
      template_id: templateId,
      submitters: signatarios.map((sig: any, index: number) => ({
        name: sig.nome,
        email: sig.email,
        role: sig.role || `Signatário ${index + 1}`,
      }))
    }

    const response = await fetch(`${docusealBaseUrl}/api/submissions`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': docusealApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signatureData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DocuSeal send signature error:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to send document for signature' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const docusealResponse = await response.json()

    // Update document status in database
    const { error: updateError } = await supabaseClient
      .from('documentos_digitais')
      .update({
        docuseal_submission_id: docusealResponse.id,
        status: 'ENVIADO_PARA_ASSINATURA',
        signatarios: signatarios,
        updated_at: new Date().toISOString(),
      })
      .eq('docuseal_template_id', templateId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update document status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      submission: docusealResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Send signature error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})