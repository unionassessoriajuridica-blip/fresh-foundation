import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEmailService } from "@/hooks/useEmailService";
import { Bot, Mail, TestTube, CheckCircle, XCircle, Loader2 } from "lucide-react";

export const TestCenter = () => {
  const { toast } = useToast();
  const { sendEmail, isLoading: emailLoading } = useEmailService();
  const [aiTest, setAiTest] = useState({
    loading: false,
    result: null as any,
    message: ''
  });
  const [emailTest, setEmailTest] = useState({
    loading: false,
    result: null as any,
    email: '',
    subject: 'Teste de Email - Sistema Jurídico',
    message: 'Este é um teste de envio de email do sistema jurídico. Se você recebeu esta mensagem, a integração está funcionando corretamente!'
  });

  const testAI = async () => {
    if (!aiTest.message.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para testar a IA",
        variant: "destructive",
      });
      return;
    }

    setAiTest(prev => ({ ...prev, loading: true, result: null }));

    try {
      console.log('🤖 Testando IA com mensagem:', aiTest.message);
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: aiTest.message,
          context: 'Teste de funcionamento da IA - Sistema jurídico'
        }
      });

      console.log('📥 Resposta da IA:', { data, error });

      if (error) {
        throw error;
      }

      setAiTest(prev => ({ 
        ...prev, 
        result: { 
          success: true, 
          response: data.response,
          timestamp: new Date().toLocaleString('pt-BR')
        } 
      }));

      toast({
        title: "✅ IA Funcionando",
        description: "A integração com OpenAI está funcionando corretamente",
      });

    } catch (error) {
      console.error('❌ Erro no teste da IA:', error);
      
      setAiTest(prev => ({ 
        ...prev, 
        result: { 
          success: false, 
          error: error.message || 'Erro desconhecido',
          timestamp: new Date().toLocaleString('pt-BR')
        } 
      }));

      toast({
        title: "❌ Erro na IA",
        description: "Problema na integração com OpenAI",
        variant: "destructive",
      });
    } finally {
      setAiTest(prev => ({ ...prev, loading: false }));
    }
  };

  const testEmail = async () => {
    if (!emailTest.email.trim()) {
      toast({
        title: "Erro",
        description: "Digite um email para testar",
        variant: "destructive",
      });
      return;
    }

    setEmailTest(prev => ({ ...prev, loading: true, result: null }));

    try {
      console.log('📧 Testando email para:', emailTest.email);
      
      const result = await sendEmail({
        to: emailTest.email,
        subject: emailTest.subject,
        message: emailTest.message,
        type: 'notification'
      });

      console.log('📬 Resultado do email:', result);

      setEmailTest(prev => ({ 
        ...prev, 
        result: { 
          success: result.success, 
          data: result.data,
          error: result.error,
          timestamp: new Date().toLocaleString('pt-BR')
        } 
      }));

      if (result.success) {
        toast({
          title: "✅ Email Enviado",
          description: "A integração com Resend está funcionando corretamente",
        });
      } else {
        toast({
          title: "❌ Erro no Email",
          description: "Problema na integração com Resend",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Erro no teste de email:', error);
      
      setEmailTest(prev => ({ 
        ...prev, 
        result: { 
          success: false, 
          error: error.message || 'Erro desconhecido',
          timestamp: new Date().toLocaleString('pt-BR')
        } 
      }));

      toast({
        title: "❌ Erro no Email",
        description: "Problema no teste de email",
        variant: "destructive",
      });
    } finally {
      setEmailTest(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Centro de Testes das Integrações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Teste da IA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple" />
              <h3 className="text-lg font-semibold">Teste da IA (OpenAI)</h3>
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Digite uma pergunta para testar a IA..."
                value={aiTest.message}
                onChange={(e) => setAiTest(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
              <Button 
                onClick={testAI} 
                disabled={aiTest.loading || !aiTest.message.trim()}
                className="w-full"
              >
                {aiTest.loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4 mr-2" />
                )}
                Testar IA
              </Button>
            </div>

            {aiTest.result && (
              <Card className={`border-2 ${aiTest.result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {aiTest.result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <Badge variant={aiTest.result.success ? "default" : "destructive"}>
                      {aiTest.result.success ? "SUCESSO" : "ERRO"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{aiTest.result.timestamp}</span>
                  </div>
                  
                  {aiTest.result.success ? (
                    <div>
                      <p className="text-sm font-medium mb-2">Resposta da IA:</p>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                        {aiTest.result.response}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium mb-2">Erro:</p>
                      <p className="text-sm text-red-700">{aiTest.result.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <hr />

          {/* Teste do Email */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Teste de Email (Resend)</h3>
            </div>
            
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Digite um email para teste..."
                value={emailTest.email}
                onChange={(e) => setEmailTest(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Assunto do email..."
                value={emailTest.subject}
                onChange={(e) => setEmailTest(prev => ({ ...prev, subject: e.target.value }))}
              />
              <Textarea
                placeholder="Mensagem do email..."
                value={emailTest.message}
                onChange={(e) => setEmailTest(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
              <Button 
                onClick={testEmail} 
                disabled={emailTest.loading || !emailTest.email.trim()}
                className="w-full"
              >
                {emailTest.loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Enviar Email de Teste
              </Button>
            </div>

            {emailTest.result && (
              <Card className={`border-2 ${emailTest.result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {emailTest.result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <Badge variant={emailTest.result.success ? "default" : "destructive"}>
                      {emailTest.result.success ? "ENVIADO" : "ERRO"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{emailTest.result.timestamp}</span>
                  </div>
                  
                  {emailTest.result.success ? (
                    <div>
                      <p className="text-sm font-medium mb-2">Email enviado com sucesso!</p>
                      {emailTest.result.data?.id && (
                        <p className="text-sm text-gray-600">ID: {emailTest.result.data.id}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium mb-2">Erro ao enviar:</p>
                      <p className="text-sm text-red-700">{emailTest.result.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};