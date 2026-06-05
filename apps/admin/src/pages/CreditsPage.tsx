import { CreditCard } from 'lucide-react';

const plans = [
  { name: 'Starter',      price: 'R$ 49/mês',  credits: 500,  features: ['500 créditos/mês', 'Suporte por e-mail'] },
  { name: 'Pro',          price: 'R$ 149/mês', credits: 2000, features: ['2.000 créditos/mês', 'Suporte prioritário', 'API access'] },
  { name: 'Enterprise',   price: 'Sob consulta',credits: 0,   features: ['Créditos ilimitados', 'SLA dedicado', 'Onboarding'] },
];

export function CreditsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Créditos & Planos</h1>
        <p className="mt-1 text-sm text-gray-500">Estrutura de planos — integração de cobrança em desenvolvimento</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className="card flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900">{p.name}</p>
                <p className="text-sm font-semibold text-blue-600">{p.price}</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-600 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
        <p className="text-sm">Integração com gateway de pagamento em desenvolvimento.</p>
        <p className="text-xs mt-1">Assinaturas e histórico de transações aparecerão aqui.</p>
      </div>
    </div>
  );
}
