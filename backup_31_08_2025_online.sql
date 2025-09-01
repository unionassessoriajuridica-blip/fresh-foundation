

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."permission_type" AS ENUM (
    'READ',
    'WRITE',
    'ADMIN',
    'financeiro',
    'ia_facilita',
    'facilisign',
    'novo_processo',
    'google_integration',
    'agenda',
    'modificar_clientes',
    'excluir_processo',
    'user_management',
    'ver_todos_processos'
);


ALTER TYPE "public"."permission_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_policy_if_not_exists"("table_name" "text", "policy_name" "text", "command" "text", "role" "text", "using_expr" "text", "check_expr" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = table_name AND policyname = policy_name
  ) THEN
    EXECUTE format(
      'CREATE POLICY "%s" ON %s FOR %s TO %s %s %s',
      policy_name,
      table_name,
      command,
      role,
      CASE WHEN using_expr IS NOT NULL THEN 'USING (' || using_expr || ')' ELSE '' END,
      CASE WHEN check_expr IS NOT NULL THEN 'WITH CHECK (' || check_expr || ')' ELSE '' END
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."create_policy_if_not_exists"("table_name" "text", "policy_name" "text", "command" "text", "role" "text", "using_expr" "text", "check_expr" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_invitation_token"("_token" "uuid") RETURNS TABLE("id" "uuid", "email" "text", "nome" "text", "permissions" "text"[], "status" "text", "expires_at" timestamp with time zone, "is_valid" boolean, "message" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.email,
    ui.nome,
    ui.permissions,
    ui.status,
    ui.expires_at,
    CASE 
      WHEN ui.status = 'ACCEPTED' THEN false
      WHEN ui.expires_at < NOW() THEN false
      ELSE true
    END as is_valid,
    CASE 
      WHEN ui.status = 'ACCEPTED' THEN 'Convite já utilizado'
      WHEN ui.expires_at < NOW() THEN 'Convite expirado'
      ELSE 'Convite válido'
    END as message
  FROM user_invitations ui
  WHERE ui.token = _token;
END;
$$;


ALTER FUNCTION "public"."validate_invitation_token"("_token" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chat_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "messages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "mode" "text" DEFAULT 'chat'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text",
    "telefone" "text",
    "cpf_cnpj" "text",
    "endereco" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documentos_assinatura" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDENTE'::"text",
    "data_envio" timestamp with time zone DEFAULT "now"(),
    "data_assinatura" timestamp with time zone,
    "signatarios" "uuid"[] DEFAULT '{}'::"uuid"[],
    "arquivo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."documentos_assinatura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documentos_digitais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text",
    "status" "text" DEFAULT 'TEMPLATE_CRIADO'::"text" NOT NULL,
    "docuseal_template_id" "text",
    "docuseal_submission_id" "text",
    "signatarios" "jsonb",
    "webhook_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tamanho" bigint,
    "data_conclusao" timestamp with time zone
);


ALTER TABLE "public"."documentos_digitais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documentos_processo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "processo_id" "uuid",
    "cliente_nome" "text" NOT NULL,
    "nome_arquivo" "text" NOT NULL,
    "tipo_arquivo" "text" NOT NULL,
    "tamanho_arquivo" bigint NOT NULL,
    "url_arquivo" "text" NOT NULL,
    "descricao" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."documentos_processo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financeiro" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "processo_id" "uuid",
    "cliente_nome" "text" NOT NULL,
    "valor" numeric NOT NULL,
    "tipo" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDENTE'::"text",
    "vencimento" "date",
    "data_pagamento" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ultimo_envio_cobranca" timestamp with time zone,
    "tentativas_cobranca" integer DEFAULT 0
);


ALTER TABLE "public"."financeiro" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notificacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "titulo" "text" NOT NULL,
    "mensagem" "text" NOT NULL,
    "cliente_nome" "text",
    "lida" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notificacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."observacoes_processo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "processo_id" "uuid",
    "cliente_nome" "text" NOT NULL,
    "titulo" "text" NOT NULL,
    "conteudo" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."observacoes_processo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "numero_processo" "text" NOT NULL,
    "cliente_id" "uuid" NOT NULL,
    "tipo_processo" "text" NOT NULL,
    "cliente_preso" boolean DEFAULT false,
    "descricao" "text",
    "prazo" "date",
    "status" "text" DEFAULT 'ATIVO'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."processos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."responsavel_financeiro" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "rg" "text" NOT NULL,
    "cpf" "text" NOT NULL,
    "data_nascimento" "date" NOT NULL,
    "telefone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "endereco_completo" "text" NOT NULL,
    "cep" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."responsavel_financeiro" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "permissions" "public"."permission_type"[] DEFAULT '{}'::"public"."permission_type"[] NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "token" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "user_id" "uuid"
);


ALTER TABLE "public"."user_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission" "public"."permission_type" NOT NULL,
    "granted_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'default'::"text" NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chat_conversations"
    ADD CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documentos_assinatura"
    ADD CONSTRAINT "documentos_assinatura_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documentos_digitais"
    ADD CONSTRAINT "documentos_digitais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documentos_processo"
    ADD CONSTRAINT "documentos_processo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financeiro"
    ADD CONSTRAINT "financeiro_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."observacoes_processo"
    ADD CONSTRAINT "observacoes_processo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processos"
    ADD CONSTRAINT "processos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."responsavel_financeiro"
    ADD CONSTRAINT "responsavel_financeiro_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_financeiro_ultimo_envio" ON "public"."financeiro" USING "btree" ("ultimo_envio_cobranca");



CREATE INDEX "idx_financeiro_vencimento_status" ON "public"."financeiro" USING "btree" ("vencimento", "status");



CREATE UNIQUE INDEX "user_permissions_user_id_permission_key" ON "public"."user_permissions" USING "btree" ("user_id", "permission");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."documentos_assinatura"
    ADD CONSTRAINT "documentos_assinatura_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."financeiro"
    ADD CONSTRAINT "financeiro_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "public"."processos"("id");



ALTER TABLE ONLY "public"."financeiro"
    ADD CONSTRAINT "financeiro_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."processos"
    ADD CONSTRAINT "fk_processos_clientes" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id");



ALTER TABLE ONLY "public"."processos"
    ADD CONSTRAINT "processos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Permitir acesso total a processos" ON "public"."processos" FOR SELECT USING (true);



CREATE POLICY "Permitir atualização dos próprios clientes" ON "public"."clientes" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Permitir atualização dos próprios documentos" ON "public"."documentos_digitais" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Permitir atualização dos próprios processos" ON "public"."processos" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Permitir inserção para usuários autenticados" ON "public"."clientes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Permitir inserção para usuários autenticados" ON "public"."documentos_digitais" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserção para usuários autenticados" ON "public"."processos" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Permitir leitura dos próprios clientes" ON "public"."clientes" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Permitir leitura dos próprios documentos" ON "public"."documentos_digitais" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Permitir leitura dos próprios processos" ON "public"."processos" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Service role full access documentos" ON "public"."documentos_digitais" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access notificacoes" ON "public"."notificacoes" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create invitations" ON "public"."user_invitations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can create their own invitations" ON "public"."user_invitations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "invited_by"));



CREATE POLICY "Usuários autenticados podem inserir observações" ON "public"."observacoes_processo" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem atualizar financeiro" ON "public"."financeiro" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem atualizar próprias observações" ON "public"."observacoes_processo" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem atualizar seus próprios documentos" ON "public"."documentos_processo" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem deletar financeiro" ON "public"."financeiro" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem deletar próprias observações" ON "public"."observacoes_processo" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem excluir seus próprios documentos" ON "public"."documentos_processo" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem excluir seus próprios processos" ON "public"."processos" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem inserir financeiro" ON "public"."financeiro" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem inserir próprias observações" ON "public"."observacoes_processo" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem inserir responsavel" ON "public"."responsavel_financeiro" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem inserir seus próprios documentos" ON "public"."documentos_processo" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem ver próprias observações" ON "public"."observacoes_processo" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuários podem ver seu financeiro" ON "public"."financeiro" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem ver seu responsavel" ON "public"."responsavel_financeiro" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuários podem ver seus próprios documentos" ON "public"."documentos_processo" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."chat_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documentos_assinatura" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documentos_digitais" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documentos_processo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financeiro" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notificacoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."observacoes_processo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."responsavel_financeiro" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_policy_if_not_exists"("table_name" "text", "policy_name" "text", "command" "text", "role" "text", "using_expr" "text", "check_expr" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_policy_if_not_exists"("table_name" "text", "policy_name" "text", "command" "text", "role" "text", "using_expr" "text", "check_expr" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_policy_if_not_exists"("table_name" "text", "policy_name" "text", "command" "text", "role" "text", "using_expr" "text", "check_expr" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_invitation_token"("_token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_invitation_token"("_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_invitation_token"("_token" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."chat_conversations" TO "anon";
GRANT ALL ON TABLE "public"."chat_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."clientes" TO "anon";
GRANT ALL ON TABLE "public"."clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."clientes" TO "service_role";



GRANT ALL ON TABLE "public"."documentos_assinatura" TO "anon";
GRANT ALL ON TABLE "public"."documentos_assinatura" TO "authenticated";
GRANT ALL ON TABLE "public"."documentos_assinatura" TO "service_role";



GRANT ALL ON TABLE "public"."documentos_digitais" TO "anon";
GRANT ALL ON TABLE "public"."documentos_digitais" TO "authenticated";
GRANT ALL ON TABLE "public"."documentos_digitais" TO "service_role";



GRANT ALL ON TABLE "public"."documentos_processo" TO "anon";
GRANT ALL ON TABLE "public"."documentos_processo" TO "authenticated";
GRANT ALL ON TABLE "public"."documentos_processo" TO "service_role";



GRANT ALL ON TABLE "public"."financeiro" TO "anon";
GRANT ALL ON TABLE "public"."financeiro" TO "authenticated";
GRANT ALL ON TABLE "public"."financeiro" TO "service_role";



GRANT ALL ON TABLE "public"."notificacoes" TO "anon";
GRANT ALL ON TABLE "public"."notificacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."notificacoes" TO "service_role";



GRANT ALL ON TABLE "public"."observacoes_processo" TO "anon";
GRANT ALL ON TABLE "public"."observacoes_processo" TO "authenticated";
GRANT ALL ON TABLE "public"."observacoes_processo" TO "service_role";



GRANT ALL ON TABLE "public"."processos" TO "anon";
GRANT ALL ON TABLE "public"."processos" TO "authenticated";
GRANT ALL ON TABLE "public"."processos" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."responsavel_financeiro" TO "anon";
GRANT ALL ON TABLE "public"."responsavel_financeiro" TO "authenticated";
GRANT ALL ON TABLE "public"."responsavel_financeiro" TO "service_role";



GRANT ALL ON TABLE "public"."user_invitations" TO "anon";
GRANT ALL ON TABLE "public"."user_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
