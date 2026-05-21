import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { useAuthStore } from './store/authStore'
import Home from './pages/Home'
import Search from './pages/Search'
import ProductDetail from './pages/ProductDetail'
import PublishProduct from './pages/PublishProduct'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Wishlist from './pages/Wishlist'
import Auth from './pages/Auth'
import Moderation from './pages/Moderation'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/auth" replace />
}

function RequireModerator({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/auth" replace />
  if (user.role !== 'moderator') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/publish"
            element={
              <RequireAuth>
                <PublishProduct />
              </RequireAuth>
            }
          />
          <Route path="/profile/me" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route
            path="/messages"
            element={
              <RequireAuth>
                <Messages />
              </RequireAuth>
            }
          />
          <Route
            path="/wishlist"
            element={
              <RequireAuth>
                <Wishlist />
              </RequireAuth>
            }
          />
          <Route
            path="/moderation"
            element={
              <RequireModerator>
                <Moderation />
              </RequireModerator>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
