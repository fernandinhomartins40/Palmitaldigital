import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Car, Send } from 'lucide-react';
import { ridesApi } from '../../services/ridesApi';

const PIX_TYPES = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'];

export function DriverRegisterPage() {
  const navigate = useNavigate();
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('CPF');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!vehicleModel || !vehiclePlate || !vehicleColor || !licenseNumber || !pixKey) return;
    setSubmitting(true);
    try {
      await ridesApi.registerDriver({
        vehicleModel,
        vehiclePlate: vehiclePlate.toUpperCase(),
        vehicleColor,
        licenseNumber,
        pixKey,
        pixKeyType,
      });
      navigate('/rides/driver');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <Link to="/rides" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Mobilidade
      </Link>

      <div className="halo halo-cobalt glass rounded-3xl p-6 space-y-2">
        <h1 className="text-xl font-bold text-ink">Quero ser motorista</h1>
        <p className="text-mute text-sm">Cadastre seu veículo e comece a rodar em Palmital.</p>
      </div>

      <div className="glass rounded-3xl p-5 space-y-4">
        <p className="text-xs font-mono uppercase tracking-wider text-mute">Dados do veículo</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <label className="text-xs text-mute font-mono uppercase tracking-wider">Modelo *</label>
            <input
              className="w-full glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-cobalt/50"
              placeholder="Ex: Fiat Siena 2018"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-mute font-mono uppercase tracking-wider">Placa *</label>
            <input
              className="w-full glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-cobalt/50 uppercase"
              placeholder="ABC1234"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              maxLength={8}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-mute font-mono uppercase tracking-wider">Cor *</label>
            <input
              className="w-full glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-cobalt/50"
              placeholder="Branco"
              value={vehicleColor}
              onChange={(e) => setVehicleColor(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-mute font-mono uppercase tracking-wider">Número da CNH *</label>
          <input
            className="w-full glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-cobalt/50"
            placeholder="Número da habilitação"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
        </div>

        <div className="border-t border-line pt-4 space-y-3">
          <p className="text-xs font-mono uppercase tracking-wider text-mute">Pagamento — Chave PIX</p>
          <div className="flex gap-2">
            <select
              className="glass-strong rounded-2xl px-3 py-2.5 text-sm text-ink outline-none border border-line focus:border-cobalt/50 bg-transparent"
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value)}
            >
              {PIX_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              className="flex-1 glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-cobalt/50"
              placeholder="Sua chave PIX..."
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
            />
          </div>
          <p className="text-xs text-mute">
            O passageiro pagará direto para esta chave após a corrida.
          </p>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !vehicleModel || !vehiclePlate || !vehicleColor || !licenseNumber || !pixKey}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          style={{ background: 'var(--cobalt)' }}
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Cadastrando...' : 'Cadastrar e começar a rodar'}
        </button>
      </div>

      {/* Info */}
      <div className="glass rounded-2xl p-4 space-y-2">
        <p className="text-xs font-mono uppercase tracking-wider text-mute">Como funciona</p>
        {[
          'Você se cadastra com seus dados e veículo',
          'Fique online para receber chamadas de passageiros',
          'Aceite corridas próximas de você',
          'Passageiro paga via PIX diretamente para você',
          'Sem comissão da plataforma no momento',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-ink/80">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ background: 'color-mix(in srgb, var(--cobalt) 15%, transparent)', color: 'var(--cobalt)' }}
            >
              {i + 1}
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
