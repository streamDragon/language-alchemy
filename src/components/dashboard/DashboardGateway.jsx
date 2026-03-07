function ChoiceGroup({ label, options, selectedId, onSelect, compact = false }) {
  const selectedOption = options.find((option) => option.id === selectedId) ?? null

  return (
    <fieldset className="gateway-choice-group">
      <legend className="gateway-choice-group__label">{label}</legend>
      <div className={`gateway-choice-group__options ${compact ? 'is-compact' : ''}`}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={selectedId === option.id}
            className={`gateway-choice ${compact ? 'gateway-choice--compact' : ''} ${selectedId === option.id ? 'is-active' : ''}`}
            onClick={() => onSelect(option.id)}
          >
            <strong>{option.labelHe}</strong>
            {!compact && <span>{option.descriptionHe}</span>}
          </button>
        ))}
      </div>

      {compact && selectedOption?.descriptionHe && (
        <p className="gateway-choice-group__summary">{selectedOption.descriptionHe}</p>
      )}
    </fieldset>
  )
}

const gatewayCopy = {
  'first-visit': {
    eyebrow: 'פתיחה קצרה',
    title: 'מי את/ה היום ומה צריך עכשיו?',
    text: 'בוחרים שני דברים ופותחים מסלול אחד.',
  },
  'returning-user': {
    eyebrow: 'פתיחה חדשה',
    title: 'מי את/ה היום ומה צריך עכשיו?',
    text: 'ההמלצה מתעדכנת מיד.',
  },
}

export default function DashboardGateway({
  goalId,
  goalOptions,
  mode,
  onSelectGoal,
  onSelectPersona,
  personaId,
  personaOptions,
}) {
  const copy = gatewayCopy[mode] ?? gatewayCopy['first-visit']

  return (
    <section className="dashboard-gateway" aria-labelledby="dashboard-gateway-title">
      <div className="dashboard-gateway__intro">
        <p className="dashboard-hero__eyebrow">{copy.eyebrow}</p>
        <h1 id="dashboard-gateway-title">{copy.title}</h1>
        <p>{copy.text}</p>
      </div>

      <div className="dashboard-gateway__groups">
        <ChoiceGroup
          compact
          label="מי את/ה היום"
          options={personaOptions}
          selectedId={personaId}
          onSelect={onSelectPersona}
        />

        <ChoiceGroup
          compact
          label="מה צריך עכשיו"
          options={goalOptions}
          selectedId={goalId}
          onSelect={onSelectGoal}
        />
      </div>
    </section>
  )
}
