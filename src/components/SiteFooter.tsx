import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="foot-grid">
        <div>
          <div className="foot-brand">Aguas Vivas</div>
          <p style={{ fontSize: "0.86rem", maxWidth: 260, lineHeight: 1.6 }}>
            Una plataforma para predicar, enseñar y servir — llevando el
            evangelio a toda criatura.
          </p>
        </div>
        <div className="foot-col">
          <h5>Plataforma</h5>
          <ul>
            <li>
              <Link href="/plan-de-salvacion">Plan de Salvación</Link>
            </li>
            <li>
              <a href="/#vivo">En vivo</a>
            </li>
            <li>
              <a href="/#niveles">Estudios bíblicos</a>
            </li>
            <li>
              <a href="/#mayordomia">Mayordomía</a>
            </li>
            <li>
              <Link href="/biblioteca">Biblioteca</Link>
            </li>
            <li>
              <Link href="/donar">Dar mi ofrenda 💛</Link>
            </li>
          </ul>
        </div>
        <div className="foot-col">
          <h5>Comunidad</h5>
          <ul>
            <li>
              <Link href="/acceso">Registro de miembros</Link>
            </li>
            <li>
              <a href="#">Testimonios</a>
            </li>
            <li>
              <a href="#">Bautismos</a>
            </li>
          </ul>
        </div>
        <div className="foot-col">
          <h5>Contacto</h5>
          <ul>
            <li>
              <a href="#">Escríbenos</a>
            </li>
            <li>
              <a href="#">Redes sociales</a>
            </li>
            <li>
              <a href="#">Ubicación</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} Aguas Vivas.</span>
        <span>Marcos 16:15</span>
      </div>
    </footer>
  );
}
