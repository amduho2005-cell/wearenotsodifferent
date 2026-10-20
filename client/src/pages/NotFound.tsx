import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../components/Status';
import { Spiral } from '../components/Doodles';

export function NotFound() {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="narrow empty paper">
      <Spiral size={48} className="ink-bluegray" />
      <h1 className="page-title">Esta hoja está en blanco</h1>
      <p>La dirección que buscas no existe en el diario.</p>
      <div className="empty__actions">
        <Link to="/" className="btn btn--ghost">
          Ir al inicio
        </Link>
        <Link to="/entradas" className="btn">
          Leer el diario
        </Link>
      </div>
    </div>
  );
}
