import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400", // Cache por 24 horas
      },
    });
  }

  try {
    console.log("Recebendo solicitação para enviar assinatura");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (!user || authError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { templateId, signatarios } = await req.json();
    console.log("Dados recebidos:", { templateId, signatarios });
    if (!templateId || !signatarios || !Array.isArray(signatarios)) {
      return new Response(
        JSON.stringify({ error: "Template ID and signatarios are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const docusealApiKey = Deno.env.get("DOCUSEAL_API_KEY");
    const docusealBaseUrl = Deno.env.get("DOCUSEAL_BASE_URL");

    if (!docusealApiKey || !docusealBaseUrl) {
      return new Response(
        JSON.stringify({ error: "DocuSeal configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verifica se há pelo menos um signatário válido
    const validSigners = signatarios.filter((s) => s.nome && s.email);
    if (validSigners.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one valid signer is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepara dados para o DocuSeal
    const submissionData = {
      template_id: templateId,
      submitters: validSigners.map((sig, index) => ({
        name: sig.nome,
        email: sig.email,
        role: sig.role || `signer_${index + 1}`,
      })),
    };

    const response = await fetch(`${docusealBaseUrl}/submissions`, {
      method: "POST",
      headers: {
        "X-Auth-Token": docusealApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submissionData),
    }).catch((err) => {
      console.error("Erro na chamada à API DocuSeal:", err);
      throw err;
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Erro na API DocuSeal:", {
        status: response.status,
        error: errorData,
        submissionData,
      });
      throw new Error(JSON.stringify(errorData));
    }

    const docusealResponse = await response.json();

    // Atualiza o documento no Supabase
    const { error: updateError } = await supabaseClient
      .from("documentos_digitais")
      .update({
        docuseal_submission_id: docusealResponse.id,
        status: "ENVIADO_PARA_ASSINATURA",
        signatarios: validSigners,
        updated_at: new Date().toISOString(),
      })
      .eq("docuseal_template_id", templateId)
      .eq("user_id", user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "Database update failed",
          details: updateError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        submission: docusealResponse,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
