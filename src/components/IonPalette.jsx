import { ionLabel } from '../game/ions.js';

function IonGroup({ title, ions, type, selected, onSelect }) {
  return (
    <div className="ion-group">
      <span className="ion-group__title">{title}</span>
      <div className="ion-group__list">
        {ions.map((ion) => {
          const isActive = selected.type === type && selected.ion.id === ion.id;
          return (
            <button
              key={ion.id}
              className={`ion-chip${isActive ? ' ion-chip--active' : ''}`}
              style={{ '--ion-color': ion.color }}
              onClick={() => onSelect(ion, type)}
              title={ion.name}
            >
              {ionLabel(ion, type)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function IonPalette({ cations, anions, selected, onSelect }) {
  return (
    <div className="ion-palette">
      <IonGroup title="Cation (+)" ions={cations} type="cation" selected={selected} onSelect={onSelect} />
      <IonGroup title="Anion (−)" ions={anions} type="anion" selected={selected} onSelect={onSelect} />
    </div>
  );
}
