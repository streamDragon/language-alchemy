function ChoiceGroup({ label, options, selectedId, onSelect }) {
  return (
    <div className="gateway-choice-group">
      <div className="gateway-choice-group__label">{label}</div>
      <div className="gateway-choice-group__options" role="list">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="listitem"
            aria-pressed={selectedId === option.id}
            className={`gateway-choice ${selectedId === option.id ? 'is-active' : ''}`}
            onClick={() => onSelect(option.id)}
          >
            <strong>{option.labelHe}</strong>
            <span>{option.descriptionHe}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const gatewayCopy = {
  'first-visit': {
    eyebrow: 'Language Alchemy',
    title: 'למצוא את המשפט, השאלה או התרגול הנכון לשיחה שלך עכשיו.',
    text: 'שתי בחירות קצרות יכוונו אותך למסלול פתיחה ברור. לא צריך ללמוד את כל המוצר כדי לדעת מאיפה להתחיל.',
  },
  'returning-user': {
    eyebrow: 'כיוון חדש אם צריך',
    title: 'אפשר להמשיך ישר, ואפשר גם לכוונן מחדש את המסלול.',
    text: 'עדכנו מי את/ה ומה נדרש עכשיו, וההמלצה משתנה מיד בתוך אותו מסך.',
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
          label="מי אני"
          options={personaOptions}
          selectedId={personaId}
          onSelect={onSelectPersona}
        />

        <ChoiceGroup
          label="מה אני צריך/ה עכשיו"
          options={goalOptions}
          selectedId={goalId}
          onSelect={onSelectGoal}
        />
      </div>
    </section>
  )
}
