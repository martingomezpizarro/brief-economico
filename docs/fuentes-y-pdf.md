# Fuentes y PDF de las lecturas

Cómo se abre el texto completo de cada lectura del rack desde la app.

## Decisiones (octubre 2026)

- **Lecturas de acceso público**: se enlaza la **fuente oficial** (repositorio del banco central, CEPAL, BID, revista de acceso abierto, página del autor o working paper). No se copian los PDF a un Drive propio: «acceso público» significa que se pueden leer gratis, no que se puedan redistribuir. Una carpeta de Drive pública quedaría solo para documentos con licencia abierta (Creative Commons) o material propio.
- El enlace público se muestra a quien **inició sesión** (Google o mail y contraseña). Sin sesión aparece «Abrir el texto completo (con tu cuenta)», que lleva a la cuenta.
- **Lecturas no públicas**: cada usuario conecta **su carpeta de Google Drive** desde Ajustes › Mi biblioteca. En compu sigue estando la opción de la carpeta local.
- **Nombre de los PDF**: `NNNN - Cita (año) - Título - tipo.pdf`, donde NNNN es el número de la lectura en `data/indice.json` con cuatro cifras. Ejemplo: `0165 - Michel y Díaz (2015) - Determinantes del riesgo soberano en República Dominicana - paper.pdf`. Tipos: paper, libro, capitulo, apunte, informe, dato. El número da la vinculación exacta; si falta, la app empareja por parecido del nombre (mismo criterio que la carpeta local). El número figura como «Nº» en la página de cada lectura, junto con el nombre sugerido.

## Archivos

- `herramientas/fuentes.json`: registro de acceso por lectura. `estado`: `publico` (enlace oficial gratuito), `verificar` (enlace candidato o caso dudoso), `no_publico` (sin versión libre: libros, revistas con suscripción, apuntes). Se edita a mano.
- `herramientas/aplicar_fuentes.py`: copia a `data/indice.json` los campos `url` y `acceso: "publico"` de las lecturas con estado `publico`. Correrlo después de editar el registro.
- `herramientas/renombrar_pdfs.py`: propone (`renombrar.csv`), aplica (`--aplicar`) y deshace (`--deshacer`) la convención de nombres en una carpeta de PDF.

## Activar Google Drive (una vez)

La app usa el selector de Google con el permiso `drive.file`: solo ve los archivos o la carpeta que el usuario elige. Es un permiso no sensible, así que no requiere la auditoría de seguridad que Google exige para leer todo el Drive.

1. En [Google Cloud Console](https://console.cloud.google.com/), con el proyecto **prebisch-785b1** (el mismo de Firebase):
   - *APIs y servicios › Biblioteca*: habilitar **Google Picker API** y **Google Drive API**.
   - *APIs y servicios › Credenciales*: abrir el ID de cliente OAuth **Web client (auto created by Google Service)** y agregar en «Orígenes autorizados de JavaScript» `https://prebisch.martingomezpizarro.com.ar`. Copiar el **ID de cliente** (termina en `.apps.googleusercontent.com`).
   - Si la clave de API del navegador tiene restricciones de API, sumar Google Picker API a la lista.
   - *Pantalla de consentimiento de OAuth*: agregar el alcance `.../auth/drive.file`.
2. En `index.html`, pegar el ID en `DRIVE_CFG.clientId`. Mientras esté vacío, Ajustes muestra que la conexión con Drive no está activada.
3. Probar en el celular: Ajustes › Mi biblioteca › Conectar mi carpeta de Drive.

Si al elegir una carpeta entera la app no ve sus archivos (depende de cómo Google aplique `drive.file` a las carpetas), la app lo avisa y pide entrar a la carpeta y marcar todos los PDF.

## Pendiente

Estado del registro: 100 públicas con enlace, 60 para verificar, 115 sin versión libre, 65 sin revisar todavía. Los 144 apuntes de cátedra se dan por no públicos.

### Para verificar a mano

Abrir el enlace, confirmar que es el mismo trabajo y que se lee gratis; si está bien, pasar `estado` a `publico` en `herramientas/fuentes.json`.

- **2** Gutiérrez y Yepes (2010) · América Latina y Asia del Este: una mirada al papel de los choques externos — https://ideas.repec.org/a/col/000438/013486.html
- **7** Massad (1999) · Flujo de capitales: evolución y políticas en los noventa — https://repositorio.cepal.org/items/24e47e31-50a7-4273-bdd3-6feac5e7112c/full (versión en inglés)
- **13** Herrera García (2002) · Importancia de los flujos financieros en el crecimiento de países emergentes — https://repository.eia.edu.co/handle/11190/3681
- **16** Barco y Castillo · Respuestas de política económica frente al influjo de capitales — https://www.bcrp.gob.pe/docs/Publicaciones/Revista-Moneda/Moneda-145/Moneda-145-05.pdf
- **19** UNAM · Ruta de escape: pandemia, turbulencia financiera y alternativas de política económica — https://libros.iiec.unam.mx/media/165/download
- **29** López, Prada y Rodríguez · Evidencia de mecanismo de acelerador financiero en una economía pequeña y abierta — https://www.banrep.gov.co/sites/default/files/publicaciones/archivos/espe_060-1.pdf (versión en portugués en ESPE 60)
- **39** BID · Instituciones políticas, procesos de diseño de políticas y resultados de política — https://publications.iadb.org/es/la-politica-de-las-politicas-publicas-progreso-economico-y-social-en-america-latina-informe-2006 (capítulo del IPES 2006)
- **60** Alves, Amarante, Salas y Vigorito · La evolución de la desigualdad de ingresos en Uruguay entre 1998 y 2009 (posible DT del IECON (ideas.repec.org/p/ulr/wpaper/dt-05-09.html))
- **62** Foders · Latin America: the long and winding road to growth — https://ideas.repec.org/p/zbw/ifwkwp/1066.html
- **68** Rossi · Poverty in Uruguay (1989-97) — https://ideas.repec.org/p/ude/wpaper/2001.html
- **83** Canales-Kriljenko, Guimarães, Ishii y Karacadağ · Cuál es la mejor intervención de los bancos centrales en mercados cambiarios volátiles — https://www.bcrp.gob.pe/docs/Publicaciones/Revista-Moneda/Moneda-133/Revista-Moneda-133-03.pdf
- **90** Lasarte y Pérez · Regímenes de tipo de cambio y crecimiento económico en países en desarrollo — https://www.funcas.es/wp-content/uploads/Migracion/Publicaciones/PDF/1683.pdf
- **92** Dominioni y Licandro · Shock regional y devaluación compensatoria: un enfoque de equilibrio general con tres bienes — https://ideas.repec.org/p/bku/doctra/1996005.html
- **94** Shocks exógenos y endeudamiento externo: impacto sobre el crecimiento y la distribución — https://ideas.repec.org/a/elt/journl/v87y2020i346p403-436.html
- **103** Garbero, Porto y César · Globalización, apertura comercial y composición tributaria: evidencia para América Latina — https://bd.aaep.org.ar/anales/works/works2015/Garbero_AAEP2015.pdf
- **109** César · La devaluación y sus efectos composicionales sobre el set de importaciones — https://depeco.econo.unlp.edu.ar/wp-content/uploads/2017/08/110-tesis-Cesar.pdf
- **117** Ugalde Hernández · Análisis de flujos de capitales externos en Costa Rica, 1980-2016 — https://revistas.csuca.org/Record/RI10278/Details
- **125** El sistema monetario internacional y la situación de las economías emergentes — https://ideas.repec.org/a/rbp/moneda/moneda-141-01.html
- **138** Cortés Villafradez y Hernández Luna · Impacto del desarrollo del sistema financiero en el crecimiento de países emergentes, 2001-2011 — https://ideas.repec.org/a/col/000452/013172.html
- **140** Rivas Aceves y Puebla Ménez · Inversión extranjera directa y crecimiento económico — https://ideas.repec.org/a/imx/journl/v11y2016i2p51-75.html
- **145** Oddone (2004) · Mercados emergentes y crisis financiera internacional: el caso argentino — https://eumed.net/ce/nahuel-crisis.htm
- **153** Lindao, Erazo y González (2004) · Riesgo país Ecuador: principales determinantes y su incidencia — https://www.dspace.espol.edu.ec/bitstream/123456789/652/1/1211.pdf
- **155** Análisis comparativo de las crisis del Ecuador con las grandes crisis del siglo XX y la de 2008 — https://puceinvestiga.puce.edu.ec/en/publications/an%C3%A1lisis-comparativo-de-las-crisis-del-ecuador-con-las-dos-grande/
- **158** Tene (2020) · Análisis del riesgo país del Ecuador durante la pandemia — https://ciencialatina.org/index.php/cienciala/article/view/1332
- **165** Michel y Díaz (2015) · Determinantes del riesgo soberano en República Dominicana — https://www.secmca.org/recard/index.php/foro/article/view/58/52
- **169** Acosta, Gudynas et al. (2005) · El otro riesgo país: indicadores y desarrollo en la economía — https://digitalrepository.unm.edu/abya_yala/442
- **170** Ginel · Ensayo sobre el riesgo país en la Argentina — https://cl2.ucema.edu.ar/publicaciones/download/documentos/164.pdf
- **174** Alvarado-Barrera y Vera-Gutiérrez · Factores determinantes del crecimiento económico en el Ecuador — https://dialnet.unirioja.es/descarga/articulo/8635040.pdf
- **186** Gnecco · Riesgo país y tasa de corte exigida — https://eco.mdp.edu.ar/revistas/index.php/faces/article/download/180/163/334
- **1003** BCRA · Boletín monetario y financiero — https://www.bcra.gob.ar/metodologias-de-las-estadisticas-monetarias-y-financieras/ (página general del BCRA)
- **1042** Creel · Econometrics (apuntes con código) — https://ddd.uab.cat/record/45123
- **1081** Motta y Morero (2019) · Teoría de la innovación (en Suárez, Erbes y Barletta, comps.) — https://biblioteca-repositorio.clacso.edu.ar/bitstream/CLACSO/8551/1/Teoria-innovacion.pdf (libro compilado completo)
- **1085** Marx (1867) · El capital, caps. V, XI, XII y XIII (obra en dominio público; falta una traducción libre al español)
- **1128** Rincón (2007) · Curso intermedio de probabilidad (libro del autor, sin enlace oficial encontrado)
- **1136** Manual de clasificaciones presupuestarias (no se sabe qué manual (nacional o provincial))
- **1140** Galassi (2015) · Public funding for start-ups in Argentina — https://sidpa.economicas.uba.ar/wp-content/uploads/2022/05/paperimpact_sidpa.pdf
- **1144** Harasztosi y Lindner (2019) · Who pays for the minimum wage? — https://real.mtak.hu/99819
- **1149** Capello · Vulnerabilidad fiscal en provincias (falta identificar el trabajo)
- **1155** Gasparini · Incidencia distributiva (falta identificar el trabajo)
- **1159** Impacto distributivo de la política social en la Argentina (falta identificar el trabajo)
- **1160** Ruiz del Castillo (2010) · Sobre la evolución del gasto público social en América Latina y su papel estabilizador — https://repositorio.cepal.org/bitstream/handle/11362/5469/1/S1000128_es.pdf
- **1164** Abuelafia y Meloni · Determinantes económicos de los resultados electorales en Argentina — https://www.depeco.econo.unlp.edu.ar/wp-content/uploads/2017/05/doc26.pdf
- **1172** Capello (2020) · Autonomía fiscal de las provincias argentinas — https://www.ieral.org/images_db/noticias_archivos/4205-Monitor%20Fiscal.pdf
- **1186** Lagos Rodríguez · Una revisión de la literatura del federalismo fiscal — https://ideas.repec.org/a/ief/revaec/v32y2022i108p11-17.html
- **1197** The debate about the attempts to stabilize prices in Argentina, 1948-1954 — https://revistas.utadeo.edu.co/index.php/TyE/article/download/debate-acerca-intentos-estabilizacion-precios-Argentina-1948-1954/2047/6358
- **1203** INDEC · Metodología del EMAE (falta el enlace a la metodología en indec.gob.ar)
- **1210** Atkinson (2014) · After Piketty? — https://www.inet.ox.ac.uk/publications/after-piketty
- **1215** De Gregorio (2003) · El Banco Central y la inflación — https://ideas.repec.org/p/chb/bcchep/05.html
- **1216** Dornbusch y Edwards (1992) · La macroeconomía del populismo — https://econpapers.repec.org/RePEc:wbk:wbrwps:316 (versión en inglés del Banco Mundial)
- **1219** Harberger (1998) · A vision of the growth process — https://ideas.repec.org/a/taf/recsxx/v1y1998i1p1-33.html
- **1221** Lasarte y Pérez (2011) · Regímenes de tipo de cambio y crecimiento económico en países en desarrollo — https://www.funcas.es/wp-content/uploads/Migracion/Publicaciones/PDF/1683.pdf (mismo trabajo que 90)
- **1225** Hume (1752) · Ensayos morales, políticos y literarios («Del dinero», «De la balanza comercial») — https://davidhume.org/texts/pld/bt (original en inglés (dominio público))
- **1231** Carvalho (2019) · A second-generation structuralist transformation problem: inertial inflation — https://ideas.repec.org/p/osf/socarx/gxy4n.html (preprint en SocArXiv)
- **1243** Cohen (2000) · Dollarization: pros and cons (no se encontró el texto de Cohen (2000))
- **1253** Neder y Rubio (2024) · Monetary policy: the trade-offs of being green — https://fundamentos.eco.unrc.edu.ar/index.php/fund/article/view/63 (versión en español)
- **1254** Neder y Rubio · Monetary policy: the trade-offs of being green (enfoque teórico) — https://fundamentos.eco.unrc.edu.ar/index.php/fund/article/view/63
- **1266** Neder y Descalzi (2024) · Seigniorage in small open dollarized economies — https://www.eco.unc.edu.ar/files/ief/Descalzi-Neder.pdf
- **1273** Oviedo (2022) · Déficit fiscal y tipo de cambio fijo: una combinación insostenible — https://repec.udesa.edu.ar/pub/econ/ydoc3.pdf
- **1274** Canitrot (1975) · La experiencia populista de redistribución de ingresos — https://repositorio.cedes.org/handle/123456789/2901
- **1275** Gay (2018) · Producto potencial en un modelo de corrección de errores — https://bd.aaep.org.ar/anales/works/works2018/gay.pdf

### Sin revisar todavía

- **5** Deuda externa en los países emergentes
- **6** Efectos de la crisis internacional: remesas, comercio y respuesta de política en Colombia
- **1204** INDEC (2024) · Cuenta de generación del ingreso e insumo de mano de obra, IV-2023
- **1205** INDEC (2024) · Incidencia de la pobreza y la indigencia, II-2023
- **1206** INDEC (2024) · Indicadores del sector energético, IV-2023
- **1207** INDEC (2024) · Índice de producción industrial manufacturero, enero 2024
- **1208** INDEC (2024) · Índice de producción industrial manufacturero, febrero 2024
- **1209** INDEC (2024) · Informe de avance del nivel de actividad, IV-2023
- **1277** Agénor (2004) · Inflation and disinflation programs
- **1279** BID (2004) · Se buscan buenos empleos
- **1287** FMI (2013) · Jobs and growth: analytical and operational considerations
- **1289** Damill y Frenkel (2006) · El mercado de trabajo argentino en la globalización financiera
- **1290** Buera y Nicolini (2021) · The history of Argentina
- **1291** Gasparini (2005) · El fracaso distributivo argentino
- **1292** Gay y Escudero (2010) · Resultado fiscal estructural en Argentina
- **1293** Kehoe, Nicolini y Sargent (2021) · A framework for studying the monetary and fiscal history of Latin America
- **1294** Mishkin y Savastano (2001) · Monetary policy strategies for Latin America
- **1295** Rodríguez (1995) · El Plan de Convertibilidad
- **1299** Redrado (2010) · La política monetaria y financiera: Argentina frente a la crisis
- **1300** Calvo, Leiderman y Reinhart (1993) · Capital inflows and real exchange rate appreciation in Latin America
- **1301** Rodrik (2005) · Growth strategies
- **1302** Schmitt-Grohé y Uribe (2001) · Políticas de estabilización y los costos de dolarizar
- **1303** Sturzenegger (2003) · ¿Por qué crecen menos los regímenes de cambio fijo?
- **1304** Williamson (2002) · Did the Washington Consensus fail?
- **1305** Williamson (2004) · The Washington Consensus as policy prescription for development
- **1332** Brainard (1967) · Uncertainty and the effectiveness of policy
- **1334** Capello y Grión (2001) · La economía argentina bajo una regla de presupuesto balanceado
- **1336** Oviedo · Interacciones entre el multiplicador-acelerador y la política fiscal
- **1337** Jiménez, Letelier, Ruelas y Bonet-Morón · Reglas fiscales subnacionales
- **1338** Reinhart, Rogoff y Savastano (2003) · Debt intolerance
- **1339** Reinhart y Rogoff (2004) · Serial default and the "paradox" of rich-to-poor capital flows
- **1340** Reyes (2013) · Tipo de cambio real en Argentina: determinantes y lecciones
- **1341** Romaniello (2010) · Real exchange rate and fiscal outcomes: a flow approach
- **1342** Samuelson (1939) · Interactions between the multiplier analysis and the principle of acceleration
- **1347** Plosser (1989) · Understanding real business cycles
- **1349** Eaton y Gersovitz (1981) · Debt with potential repudiation
- **1350** Eaton, Gersovitz y Stiglitz (1986) · The pure theory of country risk
- **1352** Rose y Spiegel (2004) · A gravity model of sovereign lending: trade, default, and credit
- **1353** Edwards (1983) · LDC's foreign borrowing and default risk: 1976-1980
- **1354** Oks y Padilla (2000) · Determinantes del riesgo país en Argentina 1994-99
- **1355** Nogués y Grandes (2001) · Country risk: economic policy, contagion effect or political noise?
- **1356** Kiguel y Lopetegui (1997) · Entendiendo el riesgo país
- **1357** Bongiorni (2020) · Determinantes del spread de bonos soberanos argentinos
- **1358** Caride (2010) · Determinantes del riesgo país en la Argentina del post default
- **1359** Bellas, Papaioannou y Petrova (2010) · Determinants of emerging market sovereign bond spreads
- **1360** Csonto e Ivaschenko (2013) · Determinants of sovereign bond spreads in emerging markets
- **1361** Determinantes macroeconómicos del riesgo país en el Perú (tesis)
- **1362** González-Rozada y Levy Yeyati (2008) · Global factors and emerging market spreads
- **1363** Guevara García (2015) · Determinantes del riesgo soberano en economías latinoamericanas
- **1364** Alegría y Bazán (2023) · Determinantes del riesgo país en América Latina (2008-2022)
- **1365** Uribe y Yue (2006) · Country spreads and emerging countries: who drives whom?
- **1366** FMI (2009) · Manual de balanza de pagos y posición de inversión internacional (MBP6)
- **1369** INDEC (2023) · Balanza de pagos, PII y deuda externa: metodología
- **1370** INDEC (2007) · Metodología de estimación del balance de pagos
- **1372** Little y Mirrlees (1991) · Project appraisal and planning twenty years on
- **1373** Balassa (1976) · The 'effects method' of project evaluation
- **1374** Chervel (1977) · The rationale of the effects method: a reply to Bela Balassa
- **1375** Cropper y Oates (1992) · Environmental economics: a survey
- **1376** Dasgupta (1972) · A comparative analysis of the UNIDO guidelines and the OECD manual
- **1377** Londero (1989) · Sobre el uso de técnicas de insumo-producto para estimar precios de cuenta
- **1378** Marin y Psacharopoulos (1982) · The reward for risk in the labor market
- **1379** Fernández (2008) · Métodos de valoración de empresas
- **1380** Psacharopoulos (1994) · Returns to investment in education: a global update
- **1381** Smith y Huang (1995) · Can markets value air quality? A meta-analysis of hedonic property value models
- **1382** Stewart (1980) · Evaluación social de proyectos (lectura)
