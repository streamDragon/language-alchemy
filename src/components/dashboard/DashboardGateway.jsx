function ChoiceGroup({ label, options, selectedId, onSelect }) {
  return (
    <fieldset className="gateway-choice-group">
      <legend className="gateway-choice-group__label">{label}</legend>
      <div className="gateway-choice-group__options">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={selectedId === option.id}
            className={`gateway-choice ${selectedId === option.id ? 'is-active' : ''}`}
            onClick={() => onSelect(option.id)}
          >
            <strong>{option.labelHe}</strong>
            <span>{option.descriptionHe}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

const gatewayCopy = {
  'first-visit': {
    eyebrow: 'שיחה אחת קדימה',
    title: 'ניסוח, שאלה או תרגול לשיחה הקרובה.',
    text: 'בוחרים מי את/ה ומה צריך עכשיו. ההמלצה מתעדכנת מיד.',
  },
  'returning-user': {
    eyebrow: 'לפתוח משהו חדש',
    title: 'אפשר להמשיך ישר, או לבחור מסלול אחר לשיחה הנוכחית.',
    text: 'שני צעדים קצרים משנים את ההמלצה.',
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
          label="מי את/ה היום"
          options={personaOptions}
          selectedId={personaId}
          onSelect={onSelectPersona}
        />

        <ChoiceGroup
          label="מה צריך עכשיו"
          options={goalOptions}
          selectedId={goalId}
          onSelect={onSelectGoal}
        />
      </div>
    </section>
  )
}
