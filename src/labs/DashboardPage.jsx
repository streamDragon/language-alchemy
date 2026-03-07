import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getLabManifest,
  getLabsByFamily,
  goalOptions,
  labFamilies,
  personaOptions,
  recommendLabsForGateway,
} from '../data/labManifest'
import { getLabConfig } from '../data/labsConfig'
import DashboardGateway from '../components/dashboard/DashboardGateway'
import DashboardWelcomeSheet from '../components/dashboard/DashboardWelcomeSheet'
import FamilyBrowser from '../components/dashboard/FamilyBrowser'
import RecommendedLabPanel from '../components/dashboard/RecommendedLabPanel'
import ReturningUserRail from '../components/dashboard/ReturningUserRail'
import { useAppState } from '../state/appStateContext'
import {
  dashboardWelcomePaths,
  DEFAULT_DASHBOARD_GOAL_ID,
  DEFAULT_DASHBOARD_PERSONA_ID,
  hasMeaningfulDashboardHistory,
  timeLabel,
} from '../components/dashboard/dashboardUtils'

function getLabTitle(labId) {
  return getLabManifest(labId)?.titleHe ?? getLabConfig(labId)?.titleHe ?? labId
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { state, setPreferences } = useAppState()
  const preferences = state.preferences ?? {}

  const [personaId, setPersonaId] = useState(
    preferences.dashboardLastPersonaId ?? DEFAULT_DASHBOARD_PERSONA_ID,
  )
  const [goalId, setGoalId] = useState(preferences.dashboardLastGoalId ?? DEFAULT_DASHBOARD_GOAL_ID)

  const familySections = useMemo(
    () => labFamilies.map((family) => ({ ...family, labs: getLabsByFamily(family.id) })),
    [],
  )
  const recommendations = useMemo(
    () => recommendLabsForGateway({ personaId, goalId }),
    [goalId, personaId],
  )

  const primaryLab = recommendations[0] ?? null
  const selectedPersona = personaOptions.find((item) => item.id === personaId)
  const selectedGoal = goalOptions.find((item) => item.id === goalId)
  const recentHistory = state.history.slice(0, 3)
  const recentFavorites = state.favorites.slice(0, 3)
  const lastVisitedLab = getLabManifest(preferences.lastVisitedLabId) ?? getLabManifest('phrasing')
  const hasMeaningfulHistory = hasMeaningfulDashboardHistory(state)
  const dashboardMode = hasMeaningfulHistory ? 'returning-user' : 'first-visit'
  const showWelcomeSheet =
    dashboardMode === 'first-visit' && !preferences.dashboardWelcomeDismissed

  const activeWelcomePathId =
    dashboardWelcomePaths.find(
      (path) => path.personaId === personaId && path.goalId === goalId,
    )?.id ?? dashboardWelcomePaths[0].id

  const handleSelectPersona = (nextPersonaId) => {
    setPersonaId(nextPersonaId)
    setPreferences({ dashboardLastPersonaId: nextPersonaId })
  }

  const handleSelectGoal = (nextGoalId) => {
    setGoalId(nextGoalId)
    setPreferences({ dashboardLastGoalId: nextGoalId })
  }

  const handleSelectWelcomePath = (pathId) => {
    const selectedPath = dashboardWelcomePaths.find((path) => path.id === pathId)
    if (!selectedPath) return
    handleSelectPersona(selectedPath.personaId)
    handleSelectGoal(selectedPath.goalId)
  }

  const dismissWelcomeSheet = () => {
    if (preferences.dashboardWelcomeDismissed) return
    setPreferences({ dashboardWelcomeDismissed: true })
  }

  const handleStartRecommended = () => {
    if (!primaryLab?.route) return
    if (showWelcomeSheet) dismissWelcomeSheet()
    navigate(primaryLab.route)
  }

  const handleContinue = () => {
    if (lastVisitedLab?.route) navigate(lastVisitedLab.route)
  }

  const activityTimestamp =
    recentHistory[0]?.createdAt ?? recentFavorites[0]?.createdAt ?? null

  const showMemorySection = recentHistory.length > 0 || recentFavorites.length > 0

  return (
    <div className="page-stack dashboard-page">
      <section className={`dashboard-opening-slab dashboard-opening-slab--${dashboardMode}`}>
        {showWelcomeSheet && (
          <DashboardWelcomeSheet
            pathOptions={dashboardWelcomePaths}
            selectedPathId={activeWelcomePathId}
            recommendedLab={primaryLab}
            onDismiss={dismissWelcomeSheet}
            onSelectPath={handleSelectWelcomePath}
            onStart={handleStartRecommended}
          />
        )}

        {dashboardMode === 'returning-user' && (
          <ReturningUserRail
            lastActivityAt={activityTimestamp}
            lastVisitedLab={lastVisitedLab}
            onContinue={handleContinue}
            recentFavorites={recentFavorites}
            recentHistory={recentHistory}
          />
        )}

        <DashboardGateway
          goalId={goalId}
          goalOptions={goalOptions}
          mode={dashboardMode}
          onSelectGoal={handleSelectGoal}
          onSelectPersona={handleSelectPersona}
          personaId={personaId}
          personaOptions={personaOptions}
        />

        <RecommendedLabPanel
          actionVariant={
            showWelcomeSheet ? 'hidden' : dashboardMode === 'returning-user' ? 'secondary' : 'primary'
          }
          goal={selectedGoal}
          lab={primaryLab}
          mode={dashboardMode}
          onStart={handleStartRecommended}
          persona={selectedPersona}
        />
      </section>

      <FamilyBrowser familySections={familySections} />

      {showMemorySection && (
        <section className="dashboard-memory-section">
          <div className="section-head">
            <div>
              <p className="dashboard-hero__eyebrow">להיזכר מהר</p>
              <h2>מה עבד לאחרונה</h2>
              <p>היסטוריה ושמורים נשארים כאן למטה, אחרי שבחרת מה לפתוח עכשיו.</p>
            </div>
            <Link to="/library" className="inline-action">
              לפתוח את הספרייה
            </Link>
          </div>

          <div className="dashboard-memory-grid">
            {recentHistory.length > 0 && (
              <article className="panel-card panel-card--soft dashboard-memory-card">
                <div className="panel-card__head">
                  <h3>תרגולים אחרונים</h3>
                </div>

                <div className="stack-list">
                  {recentHistory.map((entry) => (
                    <div key={entry.id} className="stack-list__item">
                      <strong>{getLabTitle(entry.labId)}</strong>
                      <p>{entry.summaryHe ?? entry.sentenceText ?? 'תרגול'}</p>
                      <small>{timeLabel(entry.createdAt)}</small>
                    </div>
                  ))}
                </div>
              </article>
            )}

            {recentFavorites.length > 0 && (
              <article className="panel-card panel-card--soft dashboard-memory-card">
                <div className="panel-card__head">
                  <h3>שמורים לחזרה מהירה</h3>
                </div>

                <div className="stack-list">
                  {recentFavorites.map((favorite) => (
                    <div key={favorite.id} className="stack-list__item">
                      <strong>{favorite.titleHe}</strong>
                      <p>{favorite.sentenceText}</p>
                      <small>{timeLabel(favorite.createdAt)}</small>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
