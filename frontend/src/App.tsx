import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import PollList from './pages/PollList';
import PollDetail from './pages/PollDetail';
import CreatePoll from './pages/CreatePoll';
import Templates from './pages/Templates';
import Login from './pages/Login';

function App() {
  const { fetchProfile } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<PollList />} />
          <Route path="poll/:id" element={<PollDetail />} />
          <Route path="create" element={<CreatePoll />} />
          <Route path="templates" element={<Templates />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
