// SOURCE TEXT — edit freely. Markers (never rendered):
//   (no marker, first passage)  starts automatically
//   **  blank start: clears the screen, begins a new composition
//   *   new passage appended to what is already on screen (click to advance)
export const RAW = String.raw`Me cuesta mucho plasmar lo abstracto en palabras. Mi lengua es más lenta que mis pensamientos, y se vuelve tímida cuando debe explicarse. **Cuando escribo, es imposible no perderme entre las ramas de preguntas y respuestas que surgen tras cada letra, punto, coma. *Vomito mis palabras.

**Me gusta pensar en las personas que amo, y me gusta ver lo que amo de ellas en partes de mí; *me gusta darles las gracias en silencio y saber que no volveré a verlas. **Me gusta pensar en lo que me duele y saber que también va a sanar.

**Me gustan los misterios, las preguntas, las redes de conexiones invisibles entre conceptos aparentemente desconectados. Me gusta pensar que soy separada, y reconocer que no lo soy.
**Me gustan los pájaros. Me gustan los insectos, pero no tocarlos. Me gustan los gatos, pero soy alérgica a ellos; aún así los acaricio.

**Quiero ser humana. Anhelo ser humana. Amo ser humana. *Me gusta abrazar y reír y llorar y tener miedo, enfrentarlo y darme cuenta de que estaré bien después de todo. *Me gusta conmoverme, maravillarme. *Me gusta mirar montañas y sentirme lejana. *Me gusta mirar nubes y sentirme pequeña. *Me gusta ver mis manos y notar las arrugas donde mis dedos se doblan. *Me gusta observar el borde saturado entre la luz y la sombra. *Me gusta el color naranja del sol al amanecer. *Me gusta hacer regalos, compartir canciones, dar consejos, aprender. **Me gusta ver el rostro de mi abuelita cuando me miro en el espejo.

**Lloro con frecuencia pensando en las personas que voy a amar en el futuro; no porque me duela no conocerlas aún, sino porque la simple idea de amar me desborda el corazón. *Lloro también pensando en las personas que amo ahora y lo agradecida que estoy por presenciarlas. El amor me abruma y escapa en lágrimas. **Soy sensible. *Me invento historias cuando escucho música a solas. *Cuando el viento pasa, me imagino que me abraza. *No puedo dormir sin abrazar a mi peluche y besar su frente.

**Me gusta ser privada. *Me gusta que nadie sepa mucho de mí. *Me gusta no hablar de mis logros. *Me gusta nunca mencionar lo que pasa en mi cabeza. *Me gusta no responder hasta que me pregunten. *Me gusta observar. 

**No prendo la luz de mi pieza porque quiero minimizar el costo de mi presencia. Abro mi puerta despacio para no hacer ruido. 
*A veces siento que hacerme invisible es quitar un peso de encima, aún cuando sé que soy amada. *Me sorprende que las personas piensen en mí cuando no estoy ahí.

**Quisiera ser mamá, pero me da miedo fallarles. 
*Quisiera ser pareja, pero siento que no estoy hecha para el tipo de amor que buscan de mí. 
**Me gusta crecer y preguntar y elegir y cuidar y consentir y comprender. Me gusta la disciplina, la vida ascética, el control de los impulsos.
**Me gusta la ternura y las caricias. Me gusta cuando mis amigas sostienen mi mano.

**Cuando sea grande, quiero aprender a ser pequeña. 

**Y por qué?
*y por qué?
*y por qué?
*y por qué? 

*y por qué lo busco? 
*y por qué lo hago? 
*y por qué lo pienso? 
*y por qué lo siento? 
*y por qué lo oculto? 

*por qué saludo a los pájaros en mi ventana cuando salgo de mi casa? 
*y por qué pinté mi pieza de amarillo? 
*y por qué recojo flores caídas, sabiendo que con el tiempo se secarán?
*y por qué me detengo a mirar hormigas? 
*y por qué dibujo lo que amo?
*y por qué temo cuando soy? 

*y por qué evito ser vista? 
*y por qué anhelo ser entendida?
*por qué oro en secreto?
*y por qué me hago preguntas?
*por qué no paro de buscar? 

*y por qué me levanto en las mañanas? 
*y por qué elegí esta carrera?
*por qué quiero contar historias? 
*y por qué no paro de llorar?

**por qué me hiciste humana, y qué debo encontrar? 

**Quiero ser humano y amarillo y naranja y gato y ciervo y nube y sol y estrella y mar torrencial. *Quiero ser palabra y sentimiento y fuego y árbol y pájaro y rayo de luz entre las hojitas de un guayacán. *Quiero ser canción y silencio y grito y armonía y pelusa y piedrita y amor y amada y adulta y niña y nada en particular.

**Todo 
*Todo
*Todo lleva a ti

**Hay algo en mi que exige, inevitablemente, ser.
*Entre más lo encuentro, menos lo conozco.

**...

**¿Para qué vuela el canario, si ya existe el avión?
*¿Y para qué también canta, si igual lo hace el gorrión?

**Me gusta cuando las personas organizan sus pensamientos de manera cuidadosa y elocuente, haciendo uso correcto de la puntuación y estructura gramatical, siendo claros y explícitos con el punto al que quieren llegar.

*Ya terminé de pensar.`
// Parse into steps: [{ kind:'start'|'new'|'add', text, scene, k }]  (scene = composition index, k = position inside it)
export function parse(raw = RAW) {
  const parts = raw.split(/(\*\*|\*)/), steps = []; let scene = -1, k = 0
  const push = (kind, chunk) => { const text = chunk.replace(/\s*\n\s*/g, '\n').trim(); if (!text) return; if (kind !== 'add') { scene++; k = 0 } steps.push({ kind, text, scene, k: k++ }) }
  push('start', parts[0])
  for (let i = 1; i < parts.length; i += 2) push(parts[i] === '**' ? 'new' : 'add', parts[i + 1] || '')
  return steps
}
