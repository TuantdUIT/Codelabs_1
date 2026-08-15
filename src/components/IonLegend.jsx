import { ionLabel } from '../game/ions.js';

function Group({ title, ions }) {
  return (
    <div className="legend-group">
      <span className="legend-group__title">{title}</span>
      <div className="legend-group__list">
        {ions.map((ion) => (
          <span key={ion.id} className="legend-chip" style={{ '--ion-color': ion.color }} title={ion.name}>
            <i className="legend-chip__dot" />
            {ionLabel(ion, ion.type)}
            <em>{ion.name}</em>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function IonLegend({ cations, anions }) {
  return (
    <div className="panel">
      <h3>Bảng ion trong ván</h3>
      <Group title="Cation (+) — kim loại & amoni" ions={cations} />
      <Group title="Anion (−) — gốc axit, hiđroxit, oxit" ions={anions} />
    </div>
  );
}
