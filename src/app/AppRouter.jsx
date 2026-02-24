import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './AppShell'
import DashboardPage from '../labs/DashboardPage'
import AlchemyLabPage from '../labs/AlchemyLabPage'
import BeyondWordsLabPage from '../labs/BeyondWordsLabPage'
import CleanQuestionsPage from '../labs/CleanQuestionsPage'
import LibraryPage from '../labs/LibraryPage'
import MindLiberatingLanguagePage from '../labs/MindLiberatingLanguagePage'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="lab/phrasing" element={<AlchemyLabPage labId="phrasing" />} />
        <Route path="lab/empathy" element={<AlchemyLabPage labId="empathy" />} />
        <Route path="lab/boundaries" element={<AlchemyLabPage labId="boundaries" />} />
        <Route path="lab/clean-questions" element={<CleanQuestionsPage />} />
        <Route path="lab/questions" element={<CleanQuestionsPage />} />
        <Route path="lab/beyond-words" element={<BeyondWordsLabPage />} />
        <Route path="lab/beyond" element={<BeyondWordsLabPage />} />
        <Route path="lab/mind-liberating-language" element={<MindLiberatingLanguagePage />} />
        <Route path="lab/mind-liberating" element={<MindLiberatingLanguagePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
