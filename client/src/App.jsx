import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/DashBoard';
import QuizEditor from './pages/QuizEditor';
import TakeQuiz from './pages/TakeQuiz';

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/editor/:quizId?"
        element={
          <PrivateRoute>
            <QuizEditor />
          </PrivateRoute>
        }
      />

      <Route path="/take/:sessionId" element={
        <PrivateRoute>
        <TakeQuiz />
        </PrivateRoute>
        } />
    </Routes>
  );
}
