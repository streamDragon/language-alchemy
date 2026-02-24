import { useMemo, useState } from 'react'
import { getLessonPlanByLabId } from '../../data/labs.he'

export default function LabLessonPrompt({
  labId,
  compact = false,
  className = '',
  headingHe = 'לפני שמתחילים',
}) {
  const lesson = useMemo(() => getLessonPlanByLabId(labId), [labId])
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState('')

  if (!lesson) return null

  const classes = ['lesson-prompt']
  if (compact) classes.push('lesson-prompt--compact')
  if (className) classes.push(className)

  const handleVideoClick = () => {
    if (lesson.videoUrl) {
      window.open(lesson.videoUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setStatus('עדיין אין קישור לסרטון. אפשר להוסיף ב-`src/data/labs.he.js`.')
  }

  return (
    <section className={classes.join(' ')} aria-label={`שיעור מקדים עבור ${lesson.titleHe}`}>
      <div className="lesson-prompt__top">
        <div className="lesson-prompt__titleWrap">
          <div className="lesson-prompt__eyebrow">{headingHe}</div>
          <h3>{lesson.titleHe}</h3>
          <p>{lesson.summaryHe}</p>
        </div>
        <div className="lesson-prompt__actions">
          <button type="button" onClick={() => setIsOpen((prev) => !prev)} aria-expanded={isOpen}>
            {isOpen ? 'הסתר שיעור' : 'עיין בשיעור'}
          </button>
          <button type="button" className="secondary-button" onClick={handleVideoClick}>
            צפה בסרט
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lesson-prompt__body">
          {lesson.objectivesHe?.length ? (
            <div className="lesson-block">
              <h4>מה תלמד/י כאן</h4>
              <ul>
                {lesson.objectivesHe.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {(lesson.lessonSectionsHe ?? []).map((section) => (
            <div key={section.title} className="lesson-block">
              <h4>{section.title}</h4>
              {section.text ? <p>{section.text}</p> : null}
              {section.bullets?.length ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}

          {lesson.coachPromptsHe?.length ? (
            <div className="lesson-block lesson-block--coach">
              <h4>פאנל מאמן / תרגול מודרך</h4>
              <ul>
                {lesson.coachPromptsHe.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {lesson.resourceUrl ? (
            <div className="lesson-prompt__resource">
              <a href={lesson.resourceUrl} target="_blank" rel="noreferrer">
                {lesson.resourceLabelHe || 'משאב כתוב'}
              </a>
            </div>
          ) : null}
        </div>
      )}

      <div className="status-line" aria-live="polite">
        {status}
      </div>
    </section>
  )
}

