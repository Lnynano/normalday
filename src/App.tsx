import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { LangProvider } from './i18n/lang';
import Home from './pages/Home';
import ToolPage from './pages/ToolPage';

export default function App() {
  return (
    <LangProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/t/:id" element={<ToolPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </LangProvider>
  );
}
