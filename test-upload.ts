// test-upload.ts
export {};

interface Template {
  id: number;
  name: string;
  slug: string;
  documents: Array<{
    url: string;
    filename: string;
  }>;
}

async function getTemplates(): Promise<Template[]> {
  const docusealApiKey = "xtbxvaVUdiFAT4u8mKYqTdCvJUiJLKuLUMMpoV8e2gF";
  const docusealBaseUrl = "https://api.docuseal.com";

  try {
    console.log("Buscando templates...");
    const response = await fetch(`${docusealBaseUrl}/templates`, {
      headers: {
        "X-Auth-Token": docusealApiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Falha ao buscar templates:", error.message);
    return [];
  }
}

async function getTemplateDetails(id: number): Promise<void> {
  const docusealApiKey = "xtbxvaVUdiFAT4u8mKYqTdCvJUiJLKuLUMMpoV8e2gF";
  const docusealBaseUrl = "https://api.docuseal.com";

  try {
    console.log(`Obtendo detalhes do template ${id}...`);
    const response = await fetch(`${docusealBaseUrl}/templates/${id}`, {
      headers: {
        "X-Auth-Token": docusealApiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const template = await response.json();
    console.log("Detalhes do template:", {
      id: template.id,
      name: template.name,
      documentos: template.documents.map(d => ({
        nome: d.filename,
        url: d.url
      }))
    });
  } catch (error) {
    console.error(`Falha ao buscar template ${id}:`, error.message);
  }
}

async function main() {
  const templates = await getTemplates();
  
  if (templates.length === 0) {
    console.log("Nenhum template encontrado.");
    return;
  }

  console.log(`Encontrados ${templates.length} templates:`);
  templates.forEach(t => console.log(`- ${t.name} (ID: ${t.id}, Slug: ${t.slug})`));

  // Pegar detalhes do primeiro template como exemplo
  await getTemplateDetails(templates[0].id);
}

main().catch(console.error);