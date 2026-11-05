# Tu nivel de juego

**Tu progreso** te ayuda a ver cómo te está yendo: muestra una estimación de tu nivel de
juego desde la primera rueda nueva que completás. Resolver un tablero difícil pesa más;
las pistas restan un poco, y los extras y la rapidez tienen una influencia menor.

Podés leer esta página sin saber matemática. Si querés entender las ecuaciones y probar
los controles, seguí con [El cálculo, paso a paso](/calculo-del-nivel).

## Tres números que cuentan cosas diferentes

| En Grama       | Qué cuenta                                                | Cómo cambia                                    |
| -------------- | --------------------------------------------------------- | ---------------------------------------------- |
| Puntos         | Las palabras que encontraste y los premios por dificultad | Se acumulan al jugar niveles que todavía pagan |
| Estrellas      | Cómo completaste cada nivel: pistas y extras              | Conservás tu mejor resultado al repetir        |
| Nivel de juego | Tu desempeño frente a la dificultad de los tableros       | Puede subir o bajar; no tiene un máximo fijo   |

Encontrar una palabra objetivo da 10 puntos por letra; una extra da 2. Los tableros
difíciles multiplican esos premios. **Esos puntos no se convierten en tu nivel de juego**.
Podés conseguir más puntos y, al mismo tiempo, bajar un poco tu estimación de nivel.
Las [estrellas](/progreso#estrellas), los logros y el diccionario siguen por separado.

## La idea de Glicko-2

Glicko-2 es un sistema de valoración creado por Mark Glickman para juegos competitivos.
En vez de dar siempre la misma cantidad de puntos por ganar, compara el resultado con
**lo que esperaba de vos frente a ese rival**. Superar una expectativa difícil aporta
más evidencia que repetir algo que ya se esperaba que pudieras hacer.

Grama usa un tablero como rival de referencia. Un tablero con palabras más difíciles
tiene un nivel más alto. Al completarlo, el juego construye un resultado que contempla
las pistas, extras y tiempo, y actualiza tu valoración con Glicko-2.

La matemática de Glicko-2 viene de su modelo publicado; **convertir un tablero en rival
y puntuar su resolución son decisiones propias de Grama**. Es una adaptación práctica,
con supuestos iniciales que podemos ajustar, no una medición científica de inteligencia
ni una posición en una clasificación mundial.

## Los tres ingredientes

| Ingrediente            | Qué significa                                                   | Ejemplo                                                           |
| ---------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| Valoración, o _rating_ | La estimación actual de tu nivel de juego                       | 1500 es el punto de partida común, no un logro ni un techo        |
| Desviación, o **RD**   | Cuánto le falta asentarse a esa estimación                      | Con pocas partidas, el mismo resultado suele mover más el nivel   |
| Volatilidad, $\sigma$  | Cuánta variación inesperada contempla el modelo en tu desempeño | Permite ajustar la incertidumbre cuando los resultados sorprenden |

Grama empieza con valoración **1500**, RD **350** y volatilidad **0,06**. La pantalla
muestra la valoración; RD y volatilidad se usan por dentro. No confundas el RD con
puntos que te faltan ni interpretes la volatilidad como una nota de constancia personal.

Al principio la estimación puede moverse bastante. Con más evidencia suele asentarse.
Esto no garantiza que siempre vaya a subir ni que el sistema conozca tu capacidad real.

## Qué pesa en cada tablero

**Dificultad: lo principal.** Se usa el puntaje de las palabras del tablero, que contempla
su rareza, longitud y tamaño de rueda. El número de nivel, por sí solo, no es la dificultad.
Los niveles numerados y los desafíos del día alimentan la misma valoración.

**Pistas: una resta moderada.** Se considera la proporción de letras objetivo reveladas.
Una pista en un tablero grande no pesa igual que en uno chico. La penalización tiene un
límite. Pedí ayuda cuando la necesitás: completar y disfrutar el nivel sigue siendo el objetivo.

**Extras: un pequeño reconocimiento.** Encontrar más palabras ayuda, pero cada extra
adicional aporta menos. No hace falta agotar el diccionario para tener un buen resultado.

**Rapidez: un ajuste pequeño, si se pudo medir.** El tiempo de referencia depende de la
dificultad y del total de letras objetivo. Pensar cuenta; salir de la pantalla, abrir
un diálogo o pasar la app al fondo pausa el tiempo observado. Si falta tiempo o no es
confiable, se usa el resto del resultado y el ajuste de velocidad es neutral.

::: tip Una escala no es la otra
El resultado interno de un tablero está entre 0 y 1. No es un porcentaje de mejora ni
una probabilidad de que hayas ganado. La valoración Glicko que ves en pantalla no tiene
un máximo fijo. Los [ejemplos numéricos](/calculo-del-nivel#un-ejemplo-completo) muestran cómo se conectan.
:::

## Cómo leer tu pantalla

<img class="screen" src="/screenshots/progreso.png" alt="Nivel de juego, tendencia y evolución de las últimas partidas">

La tarjeta **Tu progreso** del inicio muestra tu valoración actual. El resumen de un
tablero recién completado también muestra el nuevo valor y su cambio con signo; la
primera vez lo presenta como tu primer nivel de juego.

El número grande de la pantalla Tu progreso es tu valoración después del último tablero que contó. El gráfico
muestra hasta diez actualizaciones, en orden de juego. Después de seis actualizaciones,
la tendencia compara el promedio de las últimas tres valoraciones con el de las tres
anteriores: al menos **15 puntos** de diferencia dice **En alza** o **En baja**; en el
medio dice **Estable**. No es un pronóstico ni una prueba de mejora estadística.

Un buen resultado puede subir poco si ya se esperaba algo parecido. Un tablero terminado
puede bajar tu valoración si su resultado quedó por debajo de la expectativa. La pantalla
no te quita puntos acumulados, estrellas ni logros por eso.

## Qué partidas cuentan

- Una rueda nueva completa, con dificultad conocida, puede actualizar tu nivel desde la primera vez.
- Repetir una rueda conocida queda como **Práctica**, sin modificar la valoración.
- Un resultado sin dificultad suficiente queda **Sin puntaje**, pero se conserva en el historial.
- El tiempo incierto no descarta todo el resultado. El historial previo desconocido puede contar
  provisionalmente, conservando esa limitación en el registro.
- Abandonar un tablero no se trata como una derrota. No se inventan partidas anteriores al registro.
- **Contrarreloj** conserva sus propios puntos y mejor puntaje registrado; no cambia este nivel de juego.

## Dudas habituales

### ¿Jugar fácil me hace perder puntos?

Puede bajar la estimación de nivel, porque el sistema compara con lo que esperaba de vos.
Un resultado de un tablero fácil puede aportar evidencia por debajo de una valoración
alta. Elegí la dificultad que disfrutás: el nivel de juego no es un premio por jugar más.

### ¿Dejo de jugar y baja mi nivel?

No. La versión actual no aplica decaimiento ni períodos de inactividad por calendario.
El motor Glicko-2 puede modelar incertidumbre por inactividad, pero Grama todavía no
convirtió días sin jugar en períodos del modelo. No mostramos una caída inventada.

### ¿Puede cambiar después de una actualización?

Sí, si cambiamos los supuestos del modelo. Conservamos las observaciones originales y
podemos recalcular con otro algoritmo. Eso no cambia tus palabras, puntos o estrellas.
Los valores actuales son referencias del juego, no una escala universal entre personas.

### ¿Cómo ayudo a mejorar el cálculo?

Jugá como siempre. Si algo no coincide con cómo te fue, mandanos una captura. Si hace
falta investigar, **Compartir comentarios → Descargar datos** crea un archivo local
con tus partidas, la versión del cálculo y tu progreso guardado. Vos decidís si lo compartís. No necesitás
GitHub ni un número fijo de partidas. Leé [qué incluye el archivo](/progreso#compartir-comentarios).

**Para seguir aprendiendo:** [El cálculo, paso a paso](/calculo-del-nivel), con ecuaciones,
un ejemplo resuelto y controles para explorar los supuestos.
