import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './store/authStore';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AnimeListPage from './pages/anime/AnimeListPage';
import AnimeDetailPage from './pages/anime/AnimeDetailPage';
import CharacterListPage from './pages/characters/CharacterListPage';
import CharacterDetailPage from './pages/characters/CharacterDetailPage';
import CharacterFormPage from './pages/characters/CharacterFormPage';
import CharacterComparePage from './pages/characters/CharacterComparePage';
import ProfilePage from './pages/profile/ProfilePage';
import TagManagePage from './pages/admin/TagManagePage';

export default function App() {
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, []);

  // Listen for forced navigation events (token expiry)
  useEffect(() => {
    const handler = () => {
      // Token expired, auth store will handle cleanup
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  // Only show global loader on very first load when checking stored token
  if (isLoading && isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/anime" element={<AnimeListPage />} />
        <Route path="/anime/:id" element={<AnimeDetailPage />} />
        <Route path="/characters" element={<CharacterListPage />} />
        {/* Static routes BEFORE dynamic :id */}
        <Route path="/characters/new" element={<CharacterFormPage />} />
        <Route path="/characters/compare" element={<CharacterComparePage />} />
        <Route path="/characters/:id/edit" element={<CharacterFormPage />} />
        <Route path="/characters/:id" element={<CharacterDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/tags" element={<TagManagePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
