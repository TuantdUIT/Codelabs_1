import type { CSSProperties } from 'react';
import { ionLabel } from '../feature/in-organic/ions';
import type { ActiveIon } from '../feature/in-organic/ions';

function Group({ title, ions }: { title: string; ions: ActiveIon[] }) {
  return (
    <div className="legend-group">
      <span className="legend-group__title">{title}</span>
      <div className="legend-group__list">
        {ions.map((ion) => (
          <span
            key={ion.id}
            className="legend-chip"
            style={{ '--ion-color': ion.color } as CSSProperties}
            title={ion.name}
          >
            <i className="legend-chip__dot" />
            {ionLabel(ion, ion.type)}
            <em>{ion.name}</em>
          </span>
        ))}
      </div>
    </div>
  );
}

interface IonLegendProps {
  cations: ActiveIon[];
  anions: ActiveIon[];
}

export default function IonLegend({ cations, anions }: IonLegendProps) {
  return (
    <div className="panel">
      <h3>Bảng ion trong ván</h3>
      <Group title="Cation (+) — kim loại & amoni" ions={cations} />
      <Group title="Anion (−) — gốc axit, hiđroxit, oxit" ions={anions} />
    </div>
  );
}
