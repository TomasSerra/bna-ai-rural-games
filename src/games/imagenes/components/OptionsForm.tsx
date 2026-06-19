import type { ReactNode } from 'react';
import { Chip } from '@shared/components/ui/chip';
import { ACCIONES, AMBIENTES, ESTILOS } from '@imagenes/lib/options';
import type { EstiloId, Opciones } from '@imagenes/types';

interface OptionsFormProps {
  value: Opciones;
  onChange: (next: Opciones) => void;
  disabled?: boolean;
}

export function OptionsForm({ value, onChange, disabled }: OptionsFormProps) {
  return (
    <div className="space-y-6">
      <ChipGroup label="Ambiente">
        {AMBIENTES.map((a) => (
          <Chip
            key={a.id}
            icon={a.icon}
            label={a.label}
            selected={value.ambiente === a.id}
            disabled={disabled}
            onClick={() => onChange({ ...value, ambiente: a.id })}
          />
        ))}
      </ChipGroup>

      <ChipGroup label="Acción">
        {ACCIONES.map((a) => (
          <Chip
            key={a.id}
            icon={a.icon}
            label={a.label}
            selected={value.accion === a.id}
            disabled={disabled}
            onClick={() => onChange({ ...value, accion: a.id })}
          />
        ))}
      </ChipGroup>

      <ChipGroup label="Estilo">
        {ESTILOS.map((e) => (
          <Chip
            key={e.id}
            icon={e.icon}
            label={e.label}
            selected={value.estilo === e.id}
            disabled={disabled}
            onClick={() => onChange({ ...value, estilo: e.id as EstiloId })}
          />
        ))}
      </ChipGroup>
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xl font-medium leading-none">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-3">
        {children}
      </div>
    </div>
  );
}
