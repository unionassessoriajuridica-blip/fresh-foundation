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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const webhookData = await req.json()
    console.log('DocuSeal webhook received:', webhookData)

    const { event_type, data } = webhookData

    if (!data?.id) {
      return new Response(JSON.stringify({ error: 'Invalid webhook data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let status = 'UNKNOWN'
    let shouldNotify = false

    switch (event_type) {
      case 'submission.created':
        status = 'ENVIADO_PARA_ASSINATURA'
        break
      case 'submission.completed':
        status = 'ASSINADO'
        shouldNotify = true
        break
      case 'submission.expired':
        status = 'EXPIRADO'
        shouldNotify = true
        break
      case 'submission.declined':
        status = 'RECUSADO'
        shouldNotify = true
        break
      default:
        console.log('Unhandled event type:', event_type)
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    // Find and update document
    const { data: documents, error: findError } = await supabaseClient
      .from('documentos_digitais')
      .select('*')
      .eq('docuseal_submission_id', data.id)

    if (findError) {
      console.error('Error finding document:', findError)
      return new Response(JSON.stringify({ error: 'Failed to find document' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!documents || documents.length === 0) {
      console.log('No document found for submission ID:', data.id)
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const document = documents[0]

    // Update document status
    const { error: updateError } = await supabaseClient
      .from('documentos_digitais')
      .update({
        status,
        webhook_data: webhookData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', document.id)

    if (updateError) {
      console.error('Error updating document:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update document' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create notification if needed
    if (shouldNotify) {
      const notificationTitle = status === 'ASSINADO' 
        ? 'Documento Assinado' 
        : status === 'EXPIRADO'
        ? 'Documento Expirado'
        : 'Documento Recusado'

      const notificationMessage = status === 'ASSINADO'
        ? `O documento "${document.nome}" foi assinado com sucesso.`
        : status === 'EXPIRADO'
        ? `O documento "${document.nome}" expirou sem ser assinado.`
        : `O documento "${document.nome}" foi recusado.`

      await supabaseClient
        .from('notificacoes')
        .insert({
          user_id: document.user_id,
          tipo: 'DOCUMENTO_DIGITAL',
          titulo: notificationTitle,
          mensagem: notificationMessage,
          data_documento: document.id,
        })
    }

    return new Response(JSON.stringify({ 
      success: true,
      document_updated: true,
      notification_created: shouldNotify
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})