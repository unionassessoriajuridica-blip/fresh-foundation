import Header from '@/components/Header';
import SSLBadge from '@/components/SSLBadge';
import { Footer } from '@/components/Footer';

export default function Contato() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Contato</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Seção de Informações de Contato (Esquerda) */}
          <div className="md:w-1/2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-6">Informações de Contato</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Telefone</h3>
                <p className="text-gray-600">(XX) XXXX-XXXX</p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg">Endereço</h3>
                <p className="text-gray-600">
                  Rua Exemplo, 123 - Sala 456<br />
                  Bairro Centro<br />
                  Cidade/Estado - CEP 00000-000
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg">Email</h3>
                <a href="mailto:contato@facilita.adv.br" className="text-blue-600 hover:underline">
                  contato@facilita.adv.br
                </a>
              </div>
              
              <div className="pt-4">
                <h3 className="font-medium text-lg">Horário de Atendimento</h3>
                <p className="text-gray-600">
                  Segunda a Sexta: 9h às 18h<br />
                  Sábado: 9h às 12h
                </p>
              </div>
            </div>
          </div>

          {/* Seção do Mapa (Direita) */}
          <div className="md:w-1/2">
            <div className="h-full bg-white p-4 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-4">Localização</h2>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0754267452926!2d-46.65342658447571!3d-23.56573436763838!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0xd59f9431f2c9776a!2sAv.%20Paulista%2C%201000%20-%20Bela%20Vista%2C%20S%C3%A3o%20Paulo%20-%20SP%2C%2001310-100!5e0!3m2!1spt-BR!2sbr!4v1620000000000!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <SSLBadge />
        </div>
      </main>
      <Footer />
    </div>
  );
}