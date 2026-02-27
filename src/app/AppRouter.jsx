import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './AppShell'
import DashboardPage from '../labs/DashboardPage'
import AlchemyLabPage from '../labs/AlchemyLabPage'
import BeyondWordsLabPage from '../labs/BeyondWordsLabPage'
import CleanQuestionsPage from '../labs/CleanQuestionsPage'
import LibraryPage from '../labs/LibraryPage'
import MindLiberatingLanguagePage from '../labs/MindLiberatingLanguagePage'
import RelationsLabPage from '../labs/RelationsLabPage'
import PerspectiveLabPage from '../labs/PerspectiveLabPage'
import LabSessionGate from '../components/layout/LabSessionGate'
import ScreenModeBoundary from '../components/layout/ScreenModeBoundary'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="lab/phrasing"
          element={(
            <LabSessionGate labId="phrasing">
              <AlchemyLabPage labId="phrasing" />
            </LabSessionGate>
          )}
        />
        <Route
          path="lab/empathy"
          element={(
            <LabSessionGate labId="empathy">
              <AlchemyLabPage labId="empathy" />
            </LabSessionGate>
          )}
        />
        <Route
          path="lab/boundaries"
          element={(
            <LabSessionGate labId="boundaries">
              <AlchemyLabPage labId="boundaries" />
            </LabSessionGate>
          )}
        />
        <Route
          path="lab/clean-questions"
          element={(
            <LabSessionGate labId="clean-questions">
              <CleanQuestionsPage />
            </LabSessionGate>
          )}
        />
        <Route
          path="lab/questions"
          element={(
            <LabSessionGate labId="clean-questions">
              <CleanQuestionsPage />
            </LabSessionGate>
          )}
        />
        <Route
          path="lab/beyond-words"
          element={(
            <LabSessionGate labId="beyond-words">
              <BeyondWordsLabPage />
            </LabSessionGate>
          )}
        />
        <Route
          path="lab/beyond"
          element={(
            <LabSessionGate labId="beyond-words">
              <BeyondWordsLabPage />
            </LabSessionGate>
          )}
        />
        <Route
          path="lab/mind-liberating-language"
          element={(
            <LabSessionGate labId="mind-liberating-language">
              <MindLiberatingLanguagePage />
            </LabSessionGate>
          )}
        />
        <Route
          path="lab/mind-liberating"
          element={(
            <LabSessionGate labId="mind-liberating-language">
              <MindLiberatingLanguagePage />
            </LabSessionGate>
          )}
        />
        <Route
          path="lab/relations"
          element={(
            <ScreenModeBoundary
              screenId="relations"
              shell={<RelationsLabPage />}
              legacy={<RelationsLabPage />}
            />
          )}
        />
        <Route
          path="lab/relationship-questions"
          element={(
            <ScreenModeBoundary
              screenId="relations"
              shell={<RelationsLabPage />}
              legacy={<RelationsLabPage />}
            />
          )}
        />
        <Route
          path="lab/perspectives"
          element={(
            <ScreenModeBoundary
              screenId="perspectives"
              shell={<PerspectiveLabPage />}
              legacy={<PerspectiveLabPage />}
            />
          )}
        />
        <Route
          path="lab/now-before"
          element={(
            <ScreenModeBoundary
              screenId="perspectives"
              shell={<PerspectiveLabPage />}
              legacy={<PerspectiveLabPage />}
            />
          )}
        />
        <Route path="library" element={<LibraryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
