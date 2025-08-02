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

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
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

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Upload to DocuSeal
    const uploadData = new FormData()
    uploadData.append('file', new Blob([arrayBuffer], { type: file.type }), file.name)
    uploadData.append('title', title || file.name)

    const response = await fetch(`${docusealBaseUrl}/api/templates`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': docusealApiKey,
      },
      body: uploadData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DocuSeal upload error:', errorText)
      return new Response(JSON.stringify({ error: 'Failed to upload document to DocuSeal' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const docusealResponse = await response.json()

    // Store document info in Supabase
    const { data: document, error } = await supabaseClient
      .from('documentos_digitais')
      .insert({
        user_id: user.id,
        docuseal_template_id: docusealResponse.id,
        nome: title || file.name,
        tipo: file.type,
        status: 'TEMPLATE_CRIADO',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: 'Failed to store document info' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      document,
      docuseal_template: docusealResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})