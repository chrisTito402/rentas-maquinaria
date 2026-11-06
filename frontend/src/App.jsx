import { Navigate, Route, Routes } from 'react-router-dom';
import Operacion from './paginas/operacion/Operacion.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/:seccion" element={<Operacion />} />
      <Route path="*" element={<Navigate to="/admin/inicio" replace />} />
    </Routes>
  );
}
