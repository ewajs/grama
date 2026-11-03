<script setup>
import RatingLab from './.vitepress/components/RatingLab.vue';
</script>

# El cálculo, paso a paso

Esta página explica el **modelo 2 de Grama**, publicado con la versión **0.22.0**.
Primero convertimos un tablero terminado en un rival y un resultado; después Glicko-2
actualiza la estimación. Podés empezar por [la explicación sin fórmulas](/tu-nivel).

Las ecuaciones se renderizan en la página. En pantallas chicas, las más largas se pueden
desplazar horizontalmente. Cada una tiene una explicación y sus variables al lado.

## Probá el cálculo

Mové la dificultad y mirá el nivel del rival. Después probá una pista, tres extras o el
doble de tiempo. Por último, abrí **Cambiá tu punto de partida** y bajá el RD: vas a ver
que el mismo resultado modifica menos una estimación más asentada.

<RatingLab />

La herramienta usa las mismas funciones que el juego. Cada movimiento simula **un solo
nuevo tablero desde tu punto de partida**, sin encadenar partidas ni leer tus datos.
La curva enseña el resultado esperado; no es una distribución de la capacidad de la población.

## Antes de empezar: las variables

| Símbolo             | Significado                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| $r$, $RD$, $\sigma$ | Tu valoración, incertidumbre y volatilidad antes del tablero               |
| $r_b$, $RD_b$       | Valoración e incertidumbre del tablero usado como rival                    |
| $d$                 | Dificultad numérica del tablero; no es el número de nivel                  |
| $L$, $H$, $B$       | Total de letras objetivo, letras reveladas con pistas y extras encontrados |
| $t$, $t_0$          | Tiempo activo observado y tiempo de referencia, en segundos                |
| $s$, $E$            | Resultado obtenido y resultado esperado, entre 0 y 1                       |
| $\mu$, $\phi$       | Valoración y RD convertidos a la escala interna de Glicko-2                |
| $v$, $\Delta$       | Varianza de la evidencia y estimación interna del desvío de desempeño      |
| $\tau$              | Cuánto permitimos que se ajuste la volatilidad                             |

Los decimales de las ecuaciones usan punto; en los ejemplos y controles usamos coma.
No redondeamos entre pasos. La pantalla del juego redondea la valoración al mostrarla.

## 1. Medir el desafío

### De dónde sale la dificultad

Cada palabra objetivo tiene un rango de frecuencia $k_i$ que empieza en cero, y una
longitud $\ell_i$. Con $N$ palabras objetivo y $W$ letras en la rueda:

$$
d=\frac{1}{N}\sum_{i=1}^{N}
\left[\log_{10}(k_i+1)+0.25(\ell_i-3)\right]-0.25(W-6)
$$

Una palabra menos frecuente tiene un rango mayor y sube el puntaje. Una más larga también
suma dificultad. El último término compensa que las palabras largas son más naturales
cuando la rueda tiene más letras. La etiqueta del tablero cambia a **Media** desde 2,75,
**Difícil** desde 3,25 y **Extra difícil** desde 3,75; por debajo es **Fácil**.

La cantidad de palabras afecta el trabajo total y el tiempo de referencia, pero este
puntaje promedia las palabras: no suma una penalización independiente por pedir más.
Son heurísticas basadas en el vocabulario, no una medición exacta de cuánto te costará.
Se conservan los rangos y descriptores originales para no reinterpretar un tablero con
un diccionario futuro.

### Convertirlo en un rival

$$
r_b=1500+400(d-3),\qquad RD_b=150
$$

| Dificultad $d$ | Nivel del tablero $r_b$ |
| -------------- | ----------------------- |
| 2,5            | 1300                    |
| 3              | 1500                    |
| 3,5            | 1700                    |
| 4              | 1900                    |

El punto de referencia 3, la pendiente 400 y el RD 150 son **supuestos de Grama**.
Un RD del tablero distinto de cero reconoce que su dificultad no está perfectamente
calibrada. No hay un rival humano ni un grupo de jugadores detrás de estos valores.

## 2. Describir cómo lo resolviste

Un tablero completo parte de un resultado interno de **0,65**. Una resolución
independiente tiene así más valor que un empate contra el rival de referencia.
No dice que hayas acertado el 65% ni que tu habilidad haya mejorado ese porcentaje.

### Pistas

$$
h=0.15\min\left(1,\frac{H}{0.2L}\right)
$$

Se resta $h$. Con 20 letras objetivo, una pista resta 0,0375; cuatro restan 0,15.
A partir de revelar el 20% de las letras, la resta no crece más. En un tablero con
40 letras, cada una pesa la mitad. Es un costo moderado por ayuda, no una pérdida
directa de puntos Glicko: todavía falta comparar con la expectativa.

### Palabras extra

$$
b=0.05\frac{B}{B+3}
$$

Se suma $b$. Con tres extras sumás 0,025; con seis, aproximadamente 0,0333.
El bono se acerca a 0,05 sin crecer indefinidamente. Así reconocemos la exploración
sin convertir la cantidad de extras en el factor principal.

### Tiempo

$$
t_0=4L\,2^{d-2.75}
$$

Suponemos cuatro segundos por letra objetivo en dificultad 2,75. Cada punto adicional
de dificultad duplica ese tiempo de referencia. Es una referencia inicial elegida
para el juego, no un tiempo obtenido de un estudio de jugadores.

$$
u=0.05\,C\!\left(\log_2\frac{t_0}{t}\right),
\qquad C(x)=\min(1,\max(-1,x))
$$

A la velocidad de referencia, $u=0$. Resolver en la mitad del tiempo suma 0,05; tardar
el doble resta 0,05. Ser todavía más rápido o lento no amplía el efecto. Si el tiempo
es cero, falta o es incierto, **$u=0$**: no inventamos tiempo ni descartamos toda la partida.
Pensar cuenta como tiempo activo. Diálogos, segundo plano y salir del tablero lo pausan.

### Juntar los factores

$$
s=0.65-h+b+u
$$

Con estos parámetros, $s$ queda entre 0,45 y 0,75. **Es el resultado de un encuentro,
no un límite para tu valoración.** Las pistas pueden compensarse parcialmente con
rapidez o extras; buscar extras lleva tiempo. Esos intercambios son parte del diseño
inicial, y los efectos secundarios están acotados para que la dificultad sea central.

## 3. Convertir las escalas

Glicko-2 trabaja en otra escala. Usamos $q=173.7178$:

$$
\mu=\frac{r-1500}{q},\quad \phi=\frac{RD}{q},\quad
\mu_b=\frac{r_b-1500}{q},\quad \phi_b=\frac{RD_b}{q}
$$

No cambia el significado: es una conversión de unidades. Restar 1500 centra la escala;
dividir por $q$ permite usar las ecuaciones publicadas de Glicko-2.

## 4. Calcular qué se esperaba

Primero ajustamos cuánto confiar en la valoración del rival:

$$
g(\phi_b)=\frac{1}{\sqrt{1+3\phi_b^2/\pi^2}}
$$

Un rival más incierto tiene un $g$ menor: su resultado informa menos. El RD **del rival**
aparece aquí; tu propio RD interviene después, al decidir cuánto mover tu valoración.

$$
E=\frac{1}{1+\exp[-g(\phi_b)(\mu-\mu_b)]}
$$

Si ambos tienen igual valoración, $E=0.5$. Si tu valoración es mayor que la del rival,
se espera un resultado más alto. En juegos binarios se interpreta como una expectativa
de victoria. Grama usa un resultado graduado: lo importante es comparar **$s$ con $E$**.
Si $s>E$, la valoración sube; si $s<E$, baja.

Esto explica por qué completar un tablero no garantiza una subida. Una valoración alta
puede exigir un resultado que ese tablero fácil no alcanza a respaldar. Tampoco
significa que tengas esa probabilidad, científicamente medida, de resolver una palabra.

## 5. Cuánta información aporta el encuentro

Grama usa un tablero valorado por período. Las sumas del caso general de varios rivales
se reducen a estos términos:

$$
v=\frac{1}{g(\phi_b)^2E(1-E)},\qquad
\Delta=v\,g(\phi_b)(s-E)
$$

$v$ resume la varianza de la nueva evidencia. Un enfrentamiento muy desigual suele
aportar menos información que uno cercano. $\Delta$ resume el desvío de desempeño
para ajustar la volatilidad; **no es el número de puntos que vas a ganar**.

Una misma partida no se cuenta varias veces contra rivales inventados. Repetir datos
no crea observaciones independientes.

## 6. Actualizar la volatilidad

La volatilidad previa es $\sigma$ y usamos $\tau=0.5$. Definimos $a=\ln(\sigma^2)$
y buscamos numéricamente un valor $x$ que haga cero esta función:

$$
f(x)=\frac{e^x(\Delta^2-\phi^2-v-e^x)}{2(\phi^2+v+e^x)^2}
-\frac{x-a}{\tau^2}=0
$$

$$
\sigma'=e^{x/2}
$$

El primer término relaciona la sorpresa de los resultados con la incertidumbre que ya
había. El segundo evita que la volatilidad se aparte demasiado de su valor anterior.
$\tau$ controla esa resistencia: no es el peso de las pistas ni un límite al nivel.
No necesitás resolver esta raíz a mano; el motor usa el procedimiento numérico de la
referencia. Si el cálculo falla, Grama no inventa una estimación de reemplazo.

## 7. La nueva valoración

Primero agregamos la variación admitida para un período activo y combinamos la evidencia:

$$
\phi^*=\sqrt{\phi^2+\sigma'^2},\qquad
\phi'=\left(\frac{1}{(\phi^*)^2}+\frac{1}{v}\right)^{-1/2}
$$

$$
\mu'=\mu+\phi'^2g(\phi_b)(s-E)
$$

Volvemos a la escala visible:

$$
r'=1500+q\mu',\qquad RD'=\min(350,q\phi')
$$

La diferencia $s-E$ da la dirección; $g$ y $\phi'^2$ modulan el tamaño. Por eso el
mismo tablero puede mover mucho una valoración nueva y poco una ya asentada. El tope
350 es una política de **incertidumbre**, no un techo de valoración. El motor conserva
los decimales y usa $(r',RD',\sigma')$ como punto de partida del siguiente tablero.

## Un ejemplo completo

Tomemos los valores iniciales $r=1500$, $RD=350$, $\sigma=0.06$. Completás un tablero
con $d=2.75$, 20 letras objetivo, sin pistas ni extras, en 80 segundos confiables.

| Paso                  | Resultado aproximado            |
| --------------------- | ------------------------------- |
| Rival del tablero     | $r_b=1400$, $RD_b=150$          |
| Tiempo de referencia  | $t_0=80$ segundos               |
| Resultado del tablero | $s=0.65$                        |
| Escala interna        | $\mu=0$, $\phi=2.014762$        |
| Confianza en el rival | $g=0.902908$                    |
| Resultado esperado    | $E=0.627091$                    |
| Evidencia             | $v=5.245412$, $\Delta=0.108502$ |
| Nueva volatilidad     | $\sigma'\approx0.05999855$      |
| Nueva valoración      | $r'\approx1508.227055$          |
| Nuevo RD              | $RD'\approx262.854655$          |

La pantalla muestra **1508** (con separador de miles según tu dispositivo). Subió poco,
porque 0,65 estuvo apenas por encima de lo esperado, 0,6271. El RD bajó al agregar
información. El laboratorio empieza con estos mismos valores y recalcula con el motor real.

Con el mismo tablero y tiempo, una pista deja $s=0.6125$, por debajo de esa expectativa;
tres extras sin pistas lo llevan a $s=0.675$. Contra un tablero más difícil también
cambia el rival, no solo el resultado: exploralo con el control de dificultad.

## Qué es estándar y qué elegimos nosotros

| Parte                                                                        | Procedencia                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Transformación, $g$, $E$, $v$, $\Delta$, raíz de volatilidad y actualización | Glicko-2 publicado                                                        |
| Inicio 1500 / RD 350 / volatilidad 0,06; $\tau=0.5$                          | Valores iniciales elegidos de la referencia como defaults                 |
| Un tablero por período y RD máximo 350                                       | Política operativa de Grama                                               |
| Dificultad como rival y RD del rival 150                                     | Supuestos provisionales de Grama                                          |
| Resultado fraccionario por pistas, extras y tiempo                           | Adaptación de Grama a las ecuaciones; no es el resultado binario original |
| Tendencia de las últimas seis actualizaciones                                | Presentación de Grama; no interviene en Glicko-2                          |

La referencia recomienda períodos con varios resultados, típicamente 10–15. Elegimos
un tablero por período para dar respuesta inmediata, sin esperar varias partidas; esa decisión no se convierte en una validación de la adaptación.

No aplicamos períodos vacíos por días sin jugar. Los replays conocidos no actualizan
la valoración; tampoco se transforman en derrotas los abandonos. Si faltó tiempo,
el resto de un resultado completo puede contar. El historial previo desconocido se admite
provisionalmente sin borrar esa limitación. [Más sobre qué partidas cuentan](/tu-nivel#que-partidas-cuentan).

No hay un máximo impuesto al rating, pero repetir siempre evidencia fácil y parecida
no demuestra una capacidad ilimitada. Tampoco el RD garantiza un intervalo de capacidad
real ni un mínimo asegurado. Esta es una escala del modelo del juego, ajustable con la
experiencia; se conserva el registro original para poder recalcularla.

**Fuente:** Mark E. Glickman, [Example of the Glicko-2 system (2022)](https://www.glicko.net/glicko/glicko2.pdf).
El motor de Grama reproduce el ejemplo de la referencia en sus pruebas. Los factores
y los supuestos de esta página corresponden al modelo 2; la versión de la app y la del
modelo se registran por separado en el [archivo de historial](/progreso#compartir-comentarios).
