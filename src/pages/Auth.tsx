import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Lock, Shield, AlertCircle, MailCheck, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useToast } from "@/hooks/use-toast.ts";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitationData, setInvitationData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("login");
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false); // Novo estado
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("invitation_token");
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/dashboard");
        return;
      }

      if (invitationToken) {
        await validateInvitationToken(invitationToken);
      }

      const shouldSignUp = searchParams.get("signup") === "true";
      const emailParam = searchParams.get("email");
      const nameParam = searchParams.get("name");

      if (shouldSignUp || invitationToken) {
        setActiveTab("signup");
      }

      if (tabParam === "signup") {
        setActiveTab("signup");
      }

      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
      }

      if (nameParam) {
        setSignupName(decodeURIComponent(nameParam));
      }
    };
    checkUser();
  }, [navigate, tabParam, invitationToken, searchParams]);

  const validateInvitationToken = async (token: string) => {
    try {
      setLoading(true);
      const { data: invitation, error } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("token", token)
        .single();

      if (error) throw error;

      if (!invitation) {
        setError("Convite inválido ou não encontrado");
        return;
      }

      const isExpired = new Date(invitation.expires_at) < new Date();
      if (isExpired) {
        setError("Este convite expirou. Solicite um novo convite.");
        return;
      }

      if (invitation.status === "ACCEPTED") {
        setError("Este convite já foi utilizado.");
        return;
      }

      setEmail(invitation.email);
      setSignupName(invitation.nome);
      setInvitationData(invitation);
    } catch (error: any) {
      console.error("Erro ao validar convite:", error);
      setError("Erro ao processar convite. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              nome: signupName || invitationData?.nome || "",
              invited_by: invitationData?.invited_by || null,
            },
          },
        });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Este email já está cadastrado. Tente fazer login.");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Processar convite se existir
      if (invitationToken && signUpData.user) {
        await processInvitationAcceptance(signUpData.user.id);
      }

      // MOSTRAR MENSAGEM DE CONFIRMAÇÃO DE EMAIL EM VEZ DE REDIRECIONAR
      setShowEmailConfirmation(true);

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta.",
      });
    } catch (error: any) {
      setError(error.message || "Erro ao realizar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const processInvitationAcceptance = async (userId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("user_invitations")
        .update({
          status: "ACCEPTED",
          accepted_at: new Date().toISOString(),
          user_id: userId,
        })
        .eq("token", invitationData.token);

      if (updateError) {
        console.error("Erro ao atualizar convite:", updateError);
        throw updateError;
      }

      if (invitationData?.permissions?.length > 0) {
        const permissionsToInsert = invitationData.permissions.map(
          (permission: string) => ({
            user_id: userId,
            permission: permission,
            granted_by: invitationData.invited_by,
          })
        );

        const { error: permError } = await supabase
          .from("user_permissions")
          .insert(permissionsToInsert);

        if (permError) {
          console.error("Erro ao adicionar permissões:", permError);
          throw permError;
        }
      }
    } catch (error) {
      console.error("Erro ao processar aceitação do convite:", error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Se mostrar confirmação de email, exibe mensagem especial
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <CardTitle>Verifique seu Email</CardTitle>
            <CardDescription>
              Enviamos um link de confirmação para seu email
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <MailCheck className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Importante:</strong> Acesse seu email{" "}
                <strong>{email}</strong> e clique no link de confirmação para
                ativar sua conta.
                <br />
                <br />
                Após confirmar, você poderá fazer login normalmente.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => setShowEmailConfirmation(false)}
              variant="outline"
            >
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="mb-4">
            <Shield className="w-12 h-12 text-warning mx-auto mb-4" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            🔒 Acesso Seguro
          </h1>
          <p className="text-muted-foreground mt-2">Criptografia SSL 256-bit</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-success" />
              Área Protegida
            </CardTitle>
            <CardDescription>
              {invitationData ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <MailCheck className="w-4 h-4" />
                  Convite válido para {invitationData.nome}
                </div>
              ) : (
                "Faça login ou cadastre-se para acessar a plataforma"
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">Email</Label>
                    <Input
                      id="email-login"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={!!invitationData}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Senha</Label>
                    <PasswordInput
                      id="password-login"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="purple"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-signup">Nome Completo</Label>
                    <Input
                      id="name-signup"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      disabled={!!invitationData}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={!!invitationData}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup">Senha</Label>
                    <PasswordInput
                      id="password-signup"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  {invitationData && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Convite de:</strong> {invitationData.nome}
                        <br />
                        <strong>Permissões:</strong>{" "}
                        {invitationData.permissions?.join(", ") || "Nenhuma"}
                      </p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    variant="purple"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Cadastrando..." : "Aceitar Convite e Cadastrar"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-success" />
            <span>Protegido por SSL 256-bit</span>
          </div>
          <p>Seus dados são criptografados de ponta a ponta</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
