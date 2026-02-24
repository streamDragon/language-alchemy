import { useState } from 'react'

export default function MenuSection({
  title,
  subtitle,
  badgeText,
  defaultOpen = false,
  compact = false,
  className = '',
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const classes = ['menu-section', isOpen ? 'is-open' : '', compact ? 'menu-section--compact' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classes}>
      <button
        type="button"
        className="menu-section__toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="menu-section__titleWrap">
          <span className="menu-section__title">{title}</span>
          {subtitle ? <span className="menu-section__subtitle">{subtitle}</span> : null}
        </span>
        <span className="menu-section__meta">
          {badgeText ? <span className="menu-section__badge">{badgeText}</span> : null}
          <span className="menu-section__chevron" aria-hidden="true">
            {isOpen ? '▾' : '▸'}
          </span>
        </span>
      </button>
      {isOpen && <div className="menu-section__body">{children}</div>}
    </section>
  )
}

