/// <reference lib="dom" />
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

const responseWithCors = (
  body: Record<string, unknown> | string,
  status = 200,
  additionalHeaders: Record<string, string> = {}
) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...additionalHeaders,
    },
  });
};

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

serve(async (req) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  const url = new URL(req.url);
  console.log("URL pathname:", url.pathname);

  const docusealApiKey = Deno.env.get("DOCUSEAL_API_KEY");
  const docusealBaseUrl = Deno.env.get("DOCUSEAL_BASE_URL");
  if (!docusealApiKey || !docusealBaseUrl) {
    console.error(
      "DOCUSEAL_API_KEY or DOCUSEAL_BASE_URL environment variables not configured"
    );
    return responseWithCors({ error: "Server configuration incomplete" }, 500);
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    }
  );

  // Authentication
  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();
  if (!user || authError) {
    console.log("Authentication error:", authError?.message);
    return responseWithCors({ error: "Unauthorized" }, 401);
  }
  // Upload route
  const routePath = url.pathname.replace("/functions/v1", "");
  if (req.method === "POST" && routePath === "/docuseal-upload") {
    try {
      console.log("Iniciando upload para DocuSeal");
      const contentType = req.headers.get("content-type") || "";
      if (!contentType.includes("multipart/form-data")) {
        return responseWithCors({ error: "Invalid content type" }, 400);
      }
      const formData = await req.formData();
      const file = formData.get("file");
      const title = formData.get("title") as string | null;
      const documentId = formData.get("documentId") as string | null;

      if (!(file instanceof Blob)) {
        return responseWithCors({ error: "Invalid file type" }, 400);
      }

      if (!documentId) {
        return responseWithCors({ error: "Document ID is required" }, 400);
      }

      const uploadFile =
        file instanceof File
          ? file
          : new File([file], "document.pdf", { type: file.type });

      // Verifique o arquivo
      console.log("File details:", {
        name: uploadFile.name,
        size: uploadFile.size,
        type: uploadFile.type,
        lastModified: uploadFile.lastModified,
      });

      // 1. Upload to DocuSeal
      const docusealForm = new FormData();
      docusealForm.append("template[document]", uploadFile, uploadFile.name);
      if (title) docusealForm.append("template[name]", title);

      // Adicione logs antes do fetch:
      console.log("Enviando para DocuSeal:", {
        url: `${docusealBaseUrl}/templates`,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          title: title,
          documentId: documentId,
        },
        title,
      });

      // Log para debug - mostre as entradas do FormData
      for (const [key, value] of docusealForm.entries()) {
        console.log(`FormData entry: ${key}`, value);
      }

      const uploadResponse = await fetch(`${docusealBaseUrl}/templates/pdf`, {
        method: "POST",
        headers: {
          "X-Auth-Token": docusealApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: title || "Documento sem título",
          documents: [
            {
              name: uploadFile.name,
              file: await fileToBase64(uploadFile),
            },
          ],
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error("DocuSeal error:", errorData);
        return responseWithCors(
          {
            error: "Failed to upload to DocuSeal",
            details: errorData,
          },
          uploadResponse.status
        );
      }

      const docusealData = await uploadResponse.json();
      console.log("Resposta do DocuSeal:", docusealData);
      const { error: updateError } = await supabaseClient
        .from("documentos_digitais")
        .update({
          docuseal_template_id: docusealData.id, // ⬅️ ID do DocuSeal
          status: "TEMPLATE_CRIADO",
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (updateError) throw updateError;
      if (!docusealData.id) {
        throw new Error("DocuSeal não retornou o ID do template");
      }

      // 2. Atualiza o documento no Supabase com os dados do DocuSeal
      const { data: document, error: dbError } = await supabaseClient
        .from("documentos_digitais")
        .update({
          docuseal_template_id: docusealData.id.toString(),
          status: "TEMPLATE_CRIADO",
          updated_at: new Date().toISOString(),
          metadata: {
            docuseal_response: docusealData,
          },
        })
        .eq("id", documentId)
        .select()
        .single();

      if (dbError) {
        console.error("Supabase update error:", dbError);
        return responseWithCors(
          { error: "Database error", details: dbError.message },
          500
        );
      }

      return responseWithCors({
        success: true,
        document,
        docuseal_data: docusealData,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Detailed error:", errorMessage);
      return responseWithCors(
        {
          error: "DocuSeal connection error",
          details: errorMessage,
        },
        502
      );
    }
  }

  return responseWithCors({ error: "Not Found" }, 404);
});
