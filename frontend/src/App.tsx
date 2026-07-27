import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppShell } from "@/components/AppShell";
import { FeedPage } from "@/pages/FeedPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { FriendsPage } from "@/pages/FriendsPage";

function ProfileRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user?.username) return <Navigate to="/" replace />;
  return <Navigate to={`/u/${user.username}`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<FeedPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/posts/:id" element={<PostDetailPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/u/me" element={<ProfileRedirect />} />
              <Route path="/u/:username" element={<ProfilePage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
