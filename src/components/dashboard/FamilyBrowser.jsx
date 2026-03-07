import { Link } from 'react-router-dom'
import { labStatusLabel } from './dashboardUtils'

function LabBrowseCard({ lab }) {
  return (
    <article className="family-lab-card" data-family={lab.family}>
      <div className="family-lab-card__top">
        <div>
          <h3>{lab.titleHe}</h3>
          <p>{lab.promiseHe}</p>
        </div>

        <span className={`family-lab-card__status family-lab-card__status--${lab.status}`}>
          {labStatusLabel(lab.status)}
        </span>
      </div>

      <div className="family-lab-card__meta">
        <span>{lab.audienceLabelHe}</span>
        <span>{lab.sessionLengthMin} דקות</span>
      </div>

      <div className="family-lab-card__result">{lab.resultHe}</div>

      <Link to={lab.route} className="inline-action">
        {lab.quickStartLabel}
      </Link>
    </article>
  )
}

export default function FamilyBrowser({ familySections }) {
  return (
    <section className="family-browser" aria-labelledby="family-browser-title">
      <div className="section-head">
        <div>
          <p className="dashboard-hero__eyebrow">אחרי שבוחרים פתיחה</p>
          <h2 id="family-browser-title">אפשר גם לעיין לפי סוג העבודה</h2>
          <p>מי שרוצה לדפדף ידנית ימצא כאן את כל המשפחות: מיומנות, אבחון והשפעה.</p>
        </div>
      </div>

      <div className="family-section-list">
        {familySections.map((family) => (
          <section key={family.id} className="family-section" data-family={family.id}>
            <div className="family-section__head">
              <div>
                <p className="dashboard-hero__eyebrow">{family.badgeHe}</p>
                <h3>{family.titleHe}</h3>
                <p>{family.descriptionHe}</p>
              </div>
            </div>

            <div className="family-section__grid">
              {family.labs.map((lab) => (
                <LabBrowseCard key={lab.id} lab={lab} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
