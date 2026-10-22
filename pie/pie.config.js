/* Configuración del pie de página institucional.
   Es el ÚNICO lugar donde se cambian los datos del autor, los links de colaboración
   y los descargos propios de este proyecto. El componente está en pie/pie.js y es
   el mismo en todos los proyectos: para otro sitio se copia la carpeta pie/ y se
   edita solo este archivo.

   Un valor en null se muestra en pantalla como [COMPLETAR: …] para que no pase
   desapercibido. */
window.PIE_CONFIG = {
  autor: {
    nombre: "Martín Gómez Pizarro",
    mail: "gomezpizarromartin@gmail.com",
    sitio: "https://martingomezpizarro.com.ar",
  },

  proyecto: {
    nombre: "Prebisch",
    url: "https://prebisch.martingomezpizarro.com.ar",
    repo: "https://github.com/martingomezpizarro/brief-economico",
    descripcion: "Prebisch ofrece briefs diarios de economía —lecturas de unos 15 minutos que explican un paper, un capítulo o un tema—, preguntas de control y repaso espaciado de tarjetas, organizados en rutas de estudio por área. También permite armar rutas propias a partir de documentos del usuario, con briefs generados por inteligencia artificial. Está pensado para estudiantes de economía y para cualquier persona que quiera estudiar economía de forma ordenada.",
    anioInicio: 2026,
    // Fecha de la última actualización del sitio (AAAA-MM-DD). Cambiarla al publicar cambios relevantes.
    actualizado: "2026-10-22",
    // Sin licencia definida: rige «todos los derechos reservados». Si se elige una (por ejemplo,
    // CC BY-NC 4.0 para los briefs y MIT para el código), escribirla acá.
    licencia: null,
    // Ruta interna de la página de términos (en una SPA con hash; en un sitio de varias páginas, "terminos.html").
    terminos: "#terminos",
    // Enlaces internos extra que aparecen primero en la fila de links del pie.
    enlaces: [{ texto: "Cómo funciona", href: "#inicio" }],
  },

  colaborar: {
    texto: "Este proyecto es gratuito e independiente. Si te resulta útil, podés colaborar voluntariamente para sostenerlo.",
    cafecito: null,                       // p. ej. "https://cafecito.app/usuario"
    otra: { etiqueta: "Mercado Pago", valor: "martingomezpizarro", link: null }, // valor = alias o CVU; link = link de pago (opcional)
  },

  /* Resumen que aparece en el pie (una o dos frases). */
  descargoCorto:
    "Material de estudio con fines educativos. Los briefs, preguntas y tarjetas se escriben con asistencia de inteligencia artificial y pueden contener errores: no reemplazan la lectura de los trabajos originales. Nada de lo publicado constituye asesoramiento financiero ni recomendación de inversión.",

  /* Descargos ESPECÍFICOS de este proyecto (los generales están en pie.js). */
  especificos: [
    {
      id: "ia",
      titulo: "Contenido generado o asistido por inteligencia artificial",
      parrafos: [
        "Los briefs del rack, sus preguntas de control y sus tarjetas se redactan con asistencia de modelos de inteligencia artificial a partir del texto de cada obra, con revisión de cifras contra la fuente. Los briefs de «Mi estudio» los genera íntegramente un modelo de IA (Google Gemini o Anthropic Claude, según el motor elegido) a partir de los documentos y las indicaciones del usuario, sin revisión humana.",
        "En ambos casos el contenido puede contener errores, omisiones, simplificaciones o interpretaciones discutibles. Las observaciones críticas propias se marcan como «lectura propia». Si encontrás un error, podés reportarlo desde el enlace de cada brief o por mail.",
      ],
    },
    {
      id: "estudio",
      titulo: "Material de estudio y obras citadas",
      parrafos: [
        "Prebisch es un proyecto independiente, sin afiliación con la Universidad Nacional de Córdoba ni con ninguna otra universidad, cátedra, autor, editorial o plataforma de distribución de papers. Los briefs explican y citan los trabajos, pero no los reemplazan: ante cualquier duda, la referencia es siempre la obra original.",
        "El sitio no aloja PDF de terceros: las lecturas del rack enlazan a su búsqueda pública. Los derechos sobre las obras citadas pertenecen a sus autores y editores. Los documentos que cargues en «Mi estudio» son tuyos y sos responsable de contar con el derecho a usarlos.",
      ],
    },
    {
      id: "finanzas",
      titulo: "Contenidos sobre finanzas, mercados y riesgo país",
      parrafos: [
        "Algunas rutas tratan temas de finanzas, mercados, deuda soberana y riesgo país desde un enfoque académico. La información no constituye asesoramiento, recomendación ni oferta de compra o venta de valores negociables o instrumentos financieros, en los términos de la Ley 26.831 de Mercado de Capitales y la normativa de la CNV. Rentabilidades pasadas no garantizan rentabilidades futuras. Invertir implica riesgos, incluida la pérdida del capital. Consultá con un profesional idóneo antes de tomar decisiones.",
      ],
    },
  ],

  /* Política de privacidad (Ley 25.326). null si el sitio no recolecta datos. */
  privacidad: {
    parrafos: [
      "Sin cuenta, todo queda en tu navegador: el progreso, los ajustes, las rutas propias, los PDF de «Mi estudio» y, si las cargás, tus claves de Gemini o Anthropic. Esos datos no salen de tu dispositivo salvo en los casos que se detallan abajo, y se borran al limpiar los datos del sitio en el navegador.",
      "Con cuenta (Google o mail y contraseña), Firebase, un servicio de Google, guarda tu identificador de usuario, tu mail y, si entrás con Google, el nombre asociado a esa cuenta, junto con tu progreso, tus rutas y los briefs que generes. Se usan solo para sincronizar tu estudio entre dispositivos.",
      "Si activás los avisos, el servidor de la app (Cloudflare) guarda la suscripción de tu navegador, tu identificador de usuario y la franja horaria elegida, solo para enviarte el aviso diario. Al desactivarlos, la suscripción se elimina.",
      "Cuando generás un brief, el texto extraído de tus PDF y tus indicaciones se envían para su procesamiento: con el servidor de la app, al servidor y a Google Gemini; con tu propia clave, directamente desde tu navegador a Google o a Anthropic, bajo sus propias condiciones. El servidor de la app no guarda esos textos; solo lleva un contador de uso diario por usuario, que se borra a las 48 horas.",
      "El sitio no usa cookies publicitarias ni herramientas de analítica. Carga tipografías, fórmulas y el inicio de sesión desde servicios de terceros (Google Fonts, cdnjs y Google), que reciben los datos técnicos habituales de cualquier visita, como la dirección IP.",
      "Tus datos no se venden ni se ceden a terceros con fines comerciales. Podés pedir el acceso, la rectificación o la eliminación de tus datos y de tu cuenta escribiendo al mail de contacto.",
      "El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a ellos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto, conforme al artículo 14, inciso 3, de la Ley 25.326. La Agencia de Acceso a la Información Pública, como órgano de control de esa ley, tiene la atribución de atender las denuncias y reclamos de quienes resulten afectados en sus derechos por incumplimiento de las normas de protección de datos personales.",
    ],
  },
};
