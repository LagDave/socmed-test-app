import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FriendPresenceProvider } from "@/contexts/FriendPresenceProvider";
import { AppShell } from "@/components/AppShell";
import { FeedPage } from "@/pages/FeedPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { PostPhotoCommentsPage } from "@/pages/PostPhotoCommentsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { FriendsPage } from "@/pages/FriendsPage";
import { AccountSettingsPage } from "@/pages/AccountSettingsPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { MessagesPage } from "@/pages/MessagesPage";

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
        <FriendPresenceProvider>
          <BrowserRouter>
            <AppShell>
              <Routes>
              <Route path="/" element={<FeedPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/posts/:id" element={<PostDetailPage />} />
              <Route path="/posts/:postId/photos/:photoId" element={<PostPhotoCommentsPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:conversationId" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<AccountSettingsPage />} />
              <Route path="/u/me" element={<ProfileRedirect />} />
              <Route path="/u/:username" element={<ProfilePage />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </FriendPresenceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
