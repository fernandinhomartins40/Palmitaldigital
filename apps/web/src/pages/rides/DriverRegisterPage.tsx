import { ComingSoonPage } from '../services/ComingSoonPage';

export function DriverRegisterPage() {
  return (
    <ComingSoonPage
      title="Quero ser motorista"
      subtitle="Cadastro · Verificação · Aprovação"
      accent="cobalt"
      backTo="/rides"
      backLabel="Voltar para Mobilidade"
      description="Cadastre seu veículo, envie a documentação e comece a rodar em Palmital ganhando por corrida — sem comissão da plataforma no MVP."
      features={[
        'Cadastro de veículo (placa, modelo, cor, ano)',
        'Upload de CNH e documento do carro',
        'Aprovação por admin (fase de homologação)',
        'Cadastro de chave PIX para receber',
      ]}
    />
  );
}
