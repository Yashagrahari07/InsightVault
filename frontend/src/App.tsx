import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EntriesPage from './pages/EntriesPage'
import EntryDetailPage from './pages/EntryDetailPage'
import CreateEntryPage from './pages/CreateEntryPage'
import TagsPage from './pages/TagsPage'

const App = () => {
  const { isAuthenticated, isLoading } = useAuth()

  // Check token directly for immediate redirect after login
  const hasToken = localStorage.getItem('access_token')
  const shouldBeAuthenticated = isAuthenticated || (hasToken && !isLoading)

  if (isLoading && !hasToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={shouldBeAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={shouldBeAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      {shouldBeAuthenticated ? (
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="entries" element={<EntriesPage />} />
          <Route path="entries/new" element={<CreateEntryPage />} />
          <Route path="entries/:id" element={<EntryDetailPage />} />
          <Route path="tags" element={<TagsPage />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  )
}

export default App

