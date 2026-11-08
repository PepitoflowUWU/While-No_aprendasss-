// NIVEL 5 del MUNDO 1 — Creación de diagramas de flujo (3 lecciones = 3 etapas, 5 ejercicios por lección, sin teoría).
// El estudiante ARMA el diagrama: toca los bloques en orden y, al poner un rombo, completa sus caminos SÍ y NO
// (componente EjercicioDiagrama, logica en servicios/diagrama.js).
//  · d           = la solución: ['texto', 'forma'] (ini | fin | io | proc | dec) o { dec, si: [...], no: [...] }.
//  · distractores = bloques que sobran (no van en el diagrama).
//  · codigo      = pseudocódigo que se muestra junto a la pregunta (etapa 1 y algunos de la etapa 3).
//  · pista       = lo que muestra el COMODÍN.
//  · intro / introTexto = el personaje guía habla antes de empezar (solo en la lección 1).
// La misma información está en la base (database/migraciones/28_nivel5_diagramas.sql); el juego usa la de la base si está disponible.
import { dg } from './helpers.js';

const INI = ['Inicio', 'ini'];
const FIN = ['Fin', 'fin'];
const si = (dec, siCamino, noCamino) => ({ dec, si: siCamino, no: noCamino });

export const NIVEL_5 = {
  t: 'Creación de diagramas de flujo',
  lecciones: [

    // ── Lección 1 (Etapa 1): del código al diagrama ───────────────────────────────────────────────
    { titulo: 'Del código al diagrama de flujo',
      sinTeoria: true,
      intro: true,
      introTexto: 'Te fue bastante bien en el pseudocódigo, pero ¿qué tal si ahora probamos con los diagramas?',
      teoria: [],
      ejercicios: [
        dg('Ejercicio 1. Sumar dos números. Lee el pseudocódigo y arma su diagrama de flujo.',
          [INI, ['Leer numero1', 'io'], ['Leer numero2', 'io'], ['suma ← numero1 + numero2', 'proc'], ['Escribir suma', 'io'], FIN],
          { distractores: [['suma ← numero1 * numero2', 'proc']],
            pista: 'Primero debes solicitar los dos números, después realizar la suma y finalmente mostrar el resultado.',
            codigo: 'INICIO\n    DEFINIR numero1, numero2, suma COMO ENTERO\n\n    LEER numero1\n    LEER numero2\n\n    suma ← numero1 + numero2\n\n    ESCRIBIR suma\nFIN' }),
        dg('Ejercicio 2. Calcular el doble de un número. Lee el pseudocódigo y arma su diagrama de flujo.',
          [INI, ['Leer numero', 'io'], ['doble ← numero * 2', 'proc'], ['Escribir doble', 'io'], FIN],
          { distractores: [['doble ← numero + 2', 'proc']],
            pista: 'El proceso principal consiste en multiplicar el número ingresado por 2.',
            codigo: 'INICIO\n    DEFINIR numero, doble COMO ENTERO\n\n    LEER numero\n\n    doble ← numero * 2\n\n    ESCRIBIR doble\nFIN' }),
        dg('Ejercicio 3. Determinar si un número es positivo. Lee el pseudocódigo y arma su diagrama de flujo.',
          [INI, ['Leer numero', 'io'], si('¿numero > 0?', [['Escribir "POSITIVO"', 'io']], [['Escribir "NO ES POSITIVO"', 'io']]), FIN],
          { distractores: [['¿numero < 0?', 'dec']],
            pista: 'Debes utilizar un rombo para representar la condición. Recuerda que una decisión tiene dos caminos: verdadero (SÍ) y falso (NO).',
            codigo: 'INICIO\n    DEFINIR numero COMO ENTERO\n\n    LEER numero\n\n    SI numero > 0 ENTONCES\n        ESCRIBIR "POSITIVO"\n    SINO\n        ESCRIBIR "NO ES POSITIVO"\n    FIN SI\nFIN' }),
        dg('Ejercicio 4. Calcular el promedio de tres notas. Lee el pseudocódigo y arma su diagrama de flujo.',
          [INI, ['Leer nota1, nota2, nota3', 'io'], ['suma ← nota1 + nota2 + nota3', 'proc'], ['promedio ← suma / 3', 'proc'], ['Escribir promedio', 'io'], FIN],
          { distractores: [['promedio ← suma * 3', 'proc']],
            pista: 'Necesitas tres entradas antes de realizar el cálculo. El promedio se obtiene sumando las notas y dividiendo entre 3.',
            codigo: 'INICIO\n    DEFINIR nota1, nota2, nota3, promedio COMO REAL\n\n    LEER nota1\n    LEER nota2\n    LEER nota3\n\n    promedio ← (nota1 + nota2 + nota3) / 3\n\n    ESCRIBIR promedio\nFIN' }),
        dg('Ejercicio 5. Determinar si un estudiante aprobó. Lee el pseudocódigo y arma su diagrama de flujo.',
          [INI, ['Leer nota', 'io'], si('¿nota >= 11?', [['Escribir "APROBADO"', 'io']], [['Escribir "DESAPROBADO"', 'io']]), FIN],
          { distractores: [['¿nota > 11?', 'dec']],
            pista: 'La condición debe comprobar si la nota es mayor o igual a 11. Utiliza dos salidas dependiendo del resultado.',
            codigo: 'INICIO\n    DEFINIR nota COMO REAL\n\n    LEER nota\n\n    SI nota >= 11 ENTONCES\n        ESCRIBIR "APROBADO"\n    SINO\n        ESCRIBIR "DESAPROBADO"\n    FIN SI\nFIN' }),
      ],
    },

    // ── Lección 2 (Etapa 2): del problema al diagrama ─────────────────────────────────────────────
    { titulo: 'Del problema al diagrama de flujo',
      sinTeoria: true,
      teoria: [],
      ejercicios: [
        dg('Ejercicio 6. Una tienda vende cuadernos a S/ 8 cada uno. El usuario ingresa cuántos cuadernos desea comprar. Arma el diagrama que calcula y muestra el precio total.',
          [INI, ['Leer cantidad', 'io'], ['total ← cantidad * 8', 'proc'], ['Escribir total', 'io'], FIN],
          { distractores: [['total ← cantidad + 8', 'proc']],
            pista: 'Necesitas solicitar la cantidad de cuadernos y multiplicarla por 8.' }),
        dg('Ejercicio 7. Un usuario ingresa su edad actual. Arma el diagrama que calcula cuántos años tendrá dentro de 10 años y lo muestra (si ingresa 18, debe mostrar 28).',
          [INI, ['Leer edad', 'io'], ['edadFutura ← edad + 10', 'proc'], ['Escribir edadFutura', 'io'], FIN],
          { distractores: [['edadFutura ← edad - 10', 'proc']],
            pista: 'Solo necesitas una entrada y una operación de suma.' }),
        dg('Ejercicio 8. Arma el diagrama que pide la edad de una persona: si tiene 18 años o más muestra "Mayor de edad"; si no, "Menor de edad".',
          [INI, ['Leer edad', 'io'], si('¿edad >= 18?', [['Escribir "Mayor de edad"', 'io']], [['Escribir "Menor de edad"', 'io']]), FIN],
          { distractores: [['¿edad > 18?', 'dec']],
            pista: 'Utiliza una decisión que compare la edad con el número 18.' }),
        dg('Ejercicio 9. Una tienda descuenta S/ 15 del precio de un producto. El usuario ingresa el precio original. Arma el diagrama que muestra el precio final (si el precio es S/ 100, debe mostrar S/ 85).',
          [INI, ['Leer precio', 'io'], ['precioFinal ← precio - 15', 'proc'], ['Escribir precioFinal', 'io'], FIN],
          { distractores: [['precioFinal ← precio + 15', 'proc']],
            pista: 'Primero solicita el precio, luego realiza una resta.' }),
        dg('Ejercicio 10. El usuario ingresa dos números diferentes. Arma el diagrama que los compara y muestra cuál es el mayor.',
          [INI, ['Leer numero1', 'io'], ['Leer numero2', 'io'], si('¿numero1 > numero2?', [['Escribir numero1', 'io']], [['Escribir numero2', 'io']]), FIN],
          { distractores: [['mayor ← numero1 + numero2', 'proc']],
            pista: 'Necesitas dos entradas y una decisión. Compara el primer número con el segundo.' }),
      ],
    },

    // ── Lección 3 (Etapa 3): desafíos combinados ──────────────────────────────────────────────────
    { titulo: 'Desafíos combinados',
      sinTeoria: true,
      teoria: [],
      ejercicios: [
        dg('Ejercicio 11. Calcular el área de un triángulo. Lee el pseudocódigo y arma su diagrama de flujo.',
          [INI, ['Leer base', 'io'], ['Leer altura', 'io'], ['area ← (base * altura) / 2', 'proc'], ['Escribir area', 'io'], FIN],
          { distractores: [['area ← base * altura', 'proc']],
            pista: 'El diagrama debe tener dos entradas y un proceso matemático. Recuerda dividir el resultado entre 2.',
            codigo: 'INICIO\n    DEFINIR base, altura, area COMO REAL\n\n    LEER base\n    LEER altura\n\n    area ← (base * altura) / 2\n\n    ESCRIBIR area\nFIN' }),
        dg('Ejercicio 12. Un sistema pide la temperatura de una habitación. Si es mayor a 30 grados muestra "Temperatura alta"; si es menor o igual, "Temperatura normal". Arma su diagrama.',
          [INI, ['Leer temperatura', 'io'], si('¿temperatura > 30?', [['Escribir "Temperatura alta"', 'io']], [['Escribir "Temperatura normal"', 'io']]), FIN],
          { distractores: [['¿temperatura < 30?', 'dec']],
            pista: 'Utiliza un rombo para comprobar si la temperatura supera los 30 grados.' }),
        dg('Ejercicio 13. Calcular el total con envío. Lee el pseudocódigo y arma su diagrama de flujo.',
          [INI, ['Leer precio', 'io'], si('¿precio >= 100?', [['envio ← 0', 'proc']], [['envio ← 10', 'proc']]), ['total ← precio + envio', 'proc'], ['Escribir total', 'io'], FIN],
          { distractores: [['total ← precio - envio', 'proc']],
            pista: 'Primero evalúa el precio: si es 100 o más, el envío es gratis; si es menor, cuesta 10. Después de la decisión, suma el precio y el envío.',
            codigo: 'INICIO\n    DEFINIR precio, envio, total COMO REAL\n\n    LEER precio\n\n    SI precio >= 100 ENTONCES\n        envio ← 0\n    SINO\n        envio ← 10\n    FIN SI\n\n    total ← precio + envio\n\n    ESCRIBIR total\nFIN' }),
        dg('Ejercicio 14. Un jugador empieza con 3 vidas. El usuario ingresa cuántas vidas perdió. Arma el diagrama que calcula las vidas restantes: si quedan 0 o menos muestra "Juego terminado"; si no, muestra las vidas que quedan.',
          [INI, ['Leer vidasPerdidas', 'io'], ['vidas ← 3 - vidasPerdidas', 'proc'], si('¿vidas <= 0?', [['Escribir "Juego terminado"', 'io']], [['Escribir "Vidas restantes: ", vidas', 'io']]), FIN],
          { distractores: [['vidas ← 3 + vidasPerdidas', 'proc']],
            pista: 'Primero realiza una resta entre las vidas iniciales y las perdidas. Después utiliza una decisión para comprobar si quedan vidas.' }),
        dg('Ejercicio 15. Sistema de calificación. Lee el pseudocódigo y arma su diagrama de flujo: tiene una decisión dentro de otra.',
          [INI, ['Leer nota', 'io'], si('¿nota >= 18?', [['Escribir "EXCELENTE"', 'io']],
            [si('¿nota >= 11?', [['Escribir "APROBADO"', 'io']], [['Escribir "DESAPROBADO"', 'io']])]), FIN],
          { pista: 'Este ejercicio tiene una decisión dentro de otra. Primero comprueba si la nota es 18 o más; si no lo es (camino NO), comprueba si alcanza 11.',
            codigo: 'INICIO\n    DEFINIR nota COMO REAL\n\n    LEER nota\n\n    SI nota >= 18 ENTONCES\n        ESCRIBIR "EXCELENTE"\n    SINO\n        SI nota >= 11 ENTONCES\n            ESCRIBIR "APROBADO"\n        SINO\n            ESCRIBIR "DESAPROBADO"\n        FIN SI\n    FIN SI\nFIN' }),
      ],
    },
  ],
};
