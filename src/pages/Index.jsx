import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Header } from '../components/Header';
import { getMasVendidas, getSeleccion } from '../utils/tiendaInformation'

const ETIQUETA_GENERO = { F: "Dama", M: "Caballero", U: "Unisex" };

const HERO_VIDEO = "/video/FJi-qlgTJ0Unz9N8WTgNO_output.mp4";
const HERO_POSTER = "/img/vaic-images-625efab6-cc6c-4f0c-be51-38c6b6275425.png";

const aLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  for (const clave of ["data", "perfumes", "resultados", "items"]) {
    if (Array.isArray(respuesta?.[clave])) return respuesta[clave];
  }
  return [];
};

const aTarjeta = (p) => {
  const perfume = p.perfume ?? p;
  const acordes = perfume.acordes;

  return {
    id: perfume.id ?? p.perfume_id ?? p.id,
    nombre: perfume.nombre ?? perfume.nombre_perfume ?? p.nombre_perfume ?? "Perfume",
    genero: ETIQUETA_GENERO[perfume.genero ?? p.genero] ?? "Unisex",
    acordes: Array.isArray(acordes) ? acordes.join(" · ") : (acordes ?? ""),
    img: perfume.imagen ?? perfume.imagen_url ?? p.imagen ?? "",
  };
};

const momentoActual = () => {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "día" : "noche";
};
const TEXTO_MOMENTO = {
  día: { titulo: "Ideales para el día", sub: "Esencias que acompañan tu jornada" },
  noche: { titulo: "Ideales para la noche", sub: "Esencias para cuando cae el sol" },
};

// Fade + deslizamiento rápido al entrar en pantalla
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setVis(true), io.disconnect()), { threshold: 0.15 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${vis ? "reveal--in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero__media" style={{ backgroundImage: `url(${HERO_POSTER})` }}>
        <video
          className="hero__video"
          src={HERO_VIDEO}
          poster={HERO_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      </div>
      <div className="hero__glow" />

      <div className="hero__text">
        <p className="eyebrow">Perfumería de autor</p>
        <h1>Tu perfume,<br />es <em>mensaje</em></h1>
        <p className="hero__sub">Perfumes originales a tu precio ideal</p>
        <Link className="btn" to="/esencias">Descubrir esencias</Link>
      </div>
    </section>
  );
}

function Section({ titulo, sub, items, verTodas }) {
  return (
    <section className="section">
      <Reveal className="section__head">
        <h2>{titulo}</h2>
        <p>{sub}</p>
      </Reveal>
      <div className="grid">
        {items.map((e, k) => (
          <Reveal key={e.id} delay={k * 120}>
          <Link to={`/esencias?esencia=${e.id}`} className="card">
            <div className="card__img"><img src={e.img} alt={e.nombre} loading="lazy" /></div>
            <h3>{e.nombre}</h3>
            <span>{e.genero} · {e.acordes}</span>
          </Link>
          </Reveal>
        ))}
      </div>
      <Link className="link" to={verTodas}>Ver todas →</Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <img src="/img/logo-perfumshops.png" alt="PerfumShops" />
        <p>Mi perfume, es mensaje.</p>
      </div>
      <div>
        <h4>Contacto</h4>
        <p>contacto@perfumshops.com</p>
        <p>+58 000 000 0000</p>
      </div>
      <div>
        <h4>Síguenos</h4>
        <p><Link to="#">Instagram</Link> · <Link to="#">TikTok</Link> · <Link to="#">WhatsApp</Link></p>
      </div>
      <small>© {new Date().getFullYear()} PerfumShops. Todos los derechos reservados.</small>
    </footer>
  );
}

export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [masVendidas, setMasVendidas] = useState([]);

  const [momento] = useState(momentoActual);
  const [seleccion, setSeleccion] = useState([]);

  useEffect(() => {
    let vigente = true;
    getSeleccion(momento)
      .then((d) => { if (vigente) setSeleccion(aLista(d).map(aTarjeta)); })
      .catch((error) => console.error("Error cargando la selección de perfumes:", error));
    return () => { vigente = false; };
  }, [momento]);

  useEffect(() => {
    let vigente = true;
    getMasVendidas()
      .then((datos) => { if (vigente) setMasVendidas(aLista(datos).map(aTarjeta)); })
      .catch((error) => console.error("Error cargando perfumes más vendidos:", error));
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <Header scrolled={scrolled} />
      <Hero />
      <main>
        {masVendidas.length > 0 && (
          <Section titulo="Las más vendidas" sub="Las favoritas de nuestros clientes" items={masVendidas} verTodas="/esencias?filtro=mas-vendidas" />
        )}

        {seleccion.length > 0 && (
          <Section
            titulo={TEXTO_MOMENTO[momento].titulo}
            sub={TEXTO_MOMENTO[momento].sub}
            items={seleccion}
            verTodas={`/esencias?momento=${encodeURIComponent(momento)}`}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
