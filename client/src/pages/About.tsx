import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../components/Status';
import { Heart, Spiral, Squiggle, Star } from '../components/Doodles';

export function About() {
  useDocumentTitle('Sobre el proyecto');

  return (
    <div className="about">
      <header className="page-head">
        <p className="hand page-head__kicker">por qué existe este cuaderno</p>
        <h1 className="page-title">Sobre el proyecto</h1>
        <Squiggle className="ink-sage" size={160} />
      </header>

      <div className="about__grid">
        <section className="paper lined-soft about__main">
          <span className="tape tape--lavender tape--top" aria-hidden="true" />
          <h2 className="section__title">Un diario, no una red social</h2>
          <p>
            <strong>we are not so different</strong> es un diario colectivo. Cada persona escribe una sola página sobre su
            interés más friki: lo que le ha dado, y lo que a veces le ha costado. Todas las páginas se pueden leer desde el
            diario general y se pueden buscar por cualquier palabra.
          </p>
          <p>
            Lo que te gusta también forma parte de ti. Burlarse de los gustos de alguien es burlarse de una parte de esa
            persona, y muchas situaciones de <strong>bullying</strong> empiezan justo ahí: en un llavero, una camiseta, un
            juego, una afición «rara».
          </p>

          <h2 className="section__title">Visibilizar el bullying</h2>
          <p>
            El acoso escolar y social suele vivirse en silencio. Leer experiencias contadas en primera persona ayuda a
            ponerle nombre a lo que pasó, a entender que no fue culpa de quien lo sufrió y a reconocer que esas burlas
            tienen consecuencias reales: personas que dejan de dibujar, de jugar o de hablar de lo que aman.
          </p>
          <p>
            Pero este diario también guarda lo bonito: amistades, vocaciones, comunidades y momentos de orgullo que nacieron
            gracias a esas mismas aficiones. Las dos caras importan.
          </p>

          <h2 className="section__title">Crear empatía</h2>
          <p>
            Cuando lees la página de alguien que se emociona con los insectos o con los dados de veinte caras, es fácil
            descubrir que lo que sentía —ilusión, vergüenza, alivio— se parece mucho a lo que has sentido tú. De ahí el
            nombre: <em>we are not so different</em>.
          </p>
        </section>

        <aside className="about__side">
          <div className="note note--sage" style={{ ['--tilt' as string]: '1.5deg' }}>
            <p className="hand note__title">
              Lo que aquí <u>no</u> hay
            </p>
            <ul className="checklist checklist--no">
              <li>likes ni reacciones</li>
              <li>seguidores</li>
              <li>comentarios</li>
              <li>mensajes privados</li>
              <li>rankings ni «populares»</li>
              <li>categorías que te encasillen</li>
            </ul>
          </div>

          <div className="note note--lavender" style={{ ['--tilt' as string]: '-1.5deg' }}>
            <p className="hand note__title">Cuidar tu privacidad</p>
            <ul className="checklist">
              <li>Puedes usar un seudónimo.</li>
              <li>La foto es opcional; puede ser un dibujo o un objeto que te represente.</li>
              <li>La experiencia negativa es opcional. Nadie tiene que inventarse nada.</li>
              <li>No escribas apellidos, colegios, direcciones, teléfonos, correos ni redes sociales.</li>
            </ul>
          </div>

          <div className="note note--blue" style={{ ['--tilt' as string]: '1deg' }}>
            <p className="hand note__title">
              Si estás viviendo bullying <Heart size={20} className="ink-charcoal" />
            </p>
            <p>
              No es culpa tuya y no tienes que aguantarlo en soledad. Cuéntaselo a una persona adulta de confianza: tu
              familia, un profesor o profesora, la orientadora del centro. Si estás en peligro, llama a los servicios de
              emergencia de tu país.
            </p>
          </div>
        </aside>
      </div>

      <section className="section paper about__tech">
        <h2 className="section__title">
          <Spiral size={28} className="ink-bluegray" /> Una nota técnica
        </h2>
        <p>
          Las páginas se guardan en una base de datos MongoDB y las fotografías en un almacenamiento de archivos aparte.
          Tu entrada se reconoce mediante un <strong>código de edición</strong> que recibes al crearla, sin cuentas ni
          contraseñas. Todas las entradas del diario son de personas reales que eligieron compartir su historia.
        </p>
      </section>

      <div className="about__cta">
        <Star size={30} className="ink-lavender" />
        <Link to="/entradas" className="btn btn--ghost">
          Leer las entradas
        </Link>
        <Link to="/mi-entrada" className="btn">
          Escribir mi página
        </Link>
      </div>
    </div>
  );
}
