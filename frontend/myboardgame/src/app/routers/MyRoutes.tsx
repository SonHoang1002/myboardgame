
import Home from '../../features/home/Home';
import MyLogin from '../../features/login/view/MyLogin';
import { Navigate, Route, Routes } from 'react-router-dom';
import MySignUp from '../../features/login/view/MySignUp';
import MyInitialUserPage from '../../features/initial_user/IntialUserPage';

function MyRoutes() {
  return (
    <Routes >
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<MyLogin />} />
      <Route path="/signup" element={<MySignUp />} />
      <Route path="/initial_user" element={<MyInitialUserPage />} />
    </Routes>
  );
}

export default MyRoutes;