// NIVEL 6 del MUNDO 1 (el último) — EXAMEN FINAL: "Diagramas de flujo y pseudocódigo" (10 ejercicios, 20 puntos, 40 minutos).
// Lo juega components/nivel/ExamenFinal.jsx (no Nivel.jsx):
//  · Un solo intento por ejercicio: bien = 2 puntos, mal = 0. Sin comodines, sin pistas y sin mostrar la solución.
//  · Contrarreloj de 40 minutos: si se acaba, el examen se cierra y se califica con lo conseguido hasta ese momento.
//  · Nota: menos de 12 = C · 12 a 15 = B · 16 a 18 = A · 19 o 20 = AD. El nivel se completa con 12 puntos o más.
// Dos tipos de ejercicio:
//  · 'diagrama' (los que traen CÓDIGO): convertir el pseudocódigo en su diagrama, sin cambiar la lógica (mismo armado que el nivel 5).
//  · 'programa' (los PROBLEMAS): el estudiante escribe su propio pseudocódigo. Lo ejecuta el intérprete (servicios/pseint.js) con
//    varios datos de prueba (algunos ocultos): vale CUALQUIER procedimiento mientras el resultado sea el correcto.
import { dg } from './helpers.js';

const INI = ['Inicio', 'ini'];
const FIN = ['Fin', 'fin'];
const si = (dec, siCamino, noCamino) => ({ dec, si: siCamino, no: noCamino });

// Ejercicio de escribir el programa completo. validacion = { casos, comparar, requiere } (ver validar() en servicios/pseint.js)
const pg = (p, problema, resultado, validacion, extra = {}) => ({ tipo: 'programa', p, problema, resultado, validacion, ...extra });

const datos = (...xs) => xs.map(String);

export const MINUTOS_EXAMEN = 40;
export const PUNTOS_POR_EJERCICIO = 2;
export const PUNTOS_PARA_APROBAR = 12;

// Nota final según los puntos (de 0 a 20)
export function notaExamen(puntos) {
  if (puntos >= 19) return { nota: 'AD', texto: 'Logro destacado' };
  if (puntos >= 16) return { nota: 'A', texto: 'Logro esperado' };
  if (puntos >= 12) return { nota: 'B', texto: 'En proceso' };
  return { nota: 'C', texto: 'En inicio' };
}

export const NIVEL_6 = {
  t: 'Examen final',
  lecciones: [
    { titulo: 'Examen: Diagramas de flujo y pseudocódigo',
      tipo: 'examen',
      sinTeoria: true,
      teoria: [],
      ejercicios: [
        // ── Nivel fácil ──────────────────────────────────────────────────────────────────────────
        dg('Ejercicio 1. Sumar dos números. Convierte el pseudocódigo en su diagrama de flujo, sin cambiar su lógica.',
          [INI, ['Leer num1', 'io'], ['Leer num2', 'io'], ['suma ← num1 + num2', 'proc'], ['Escribir suma', 'io'], FIN],
          { dificultad: 'Fácil', resultado: 'Si los números son 15 y 25, debe mostrar 40.',
            distractores: [['suma ← num1 - num2', 'proc'], ['Escribir num1', 'io']],
            codigo: 'INICIO\n    DEFINIR num1, num2, suma COMO ENTERO\n\n    LEER num1\n    LEER num2\n\n    suma ← num1 + num2\n\n    ESCRIBIR suma\nFIN' }),
        pg('Ejercicio 2. Calcular el doble.',
          'Escribe el pseudocódigo de un programa que solicite un número al usuario, calcule su doble y muestre el resultado.',
          'Si el usuario ingresa 8, debe mostrar 16.',
          { comparar: 'numeros', casos: [
            { entrada: datos(8), salida: '16' },
            { entrada: datos(5), salida: '10' },
            { entrada: datos(-3), salida: '-6', oculto: true },
            { entrada: datos(0), salida: '0', oculto: true },
          ] },
          { dificultad: 'Fácil' }),
        dg('Ejercicio 3. Calcular el precio de una compra. Convierte el pseudocódigo en su diagrama de flujo, sin cambiar su lógica.',
          [INI, ['cantidad ← 3', 'proc'], ['precio ← 20', 'proc'], ['total ← cantidad * precio', 'proc'], ['Escribir total', 'io'], FIN],
          { dificultad: 'Fácil', resultado: 'Debe mostrar 60.',
            distractores: [['Leer cantidad', 'io'], ['total ← cantidad + precio', 'proc']],
            codigo: 'INICIO\n    DEFINIR cantidad, precio, total COMO REAL\n\n    cantidad ← 3\n    precio ← 20\n\n    total ← cantidad * precio\n\n    ESCRIBIR total\nFIN' }),
        pg('Ejercicio 4. Determinar si un número es positivo.',
          'Escribe el pseudocódigo de un programa que solicite un número y determine si es positivo o negativo. Si el número es igual a cero, debe mostrar "Es cero".',
          'Debe contemplar tres posibles resultados: positivo, negativo y cero.',
          { comparar: 'palabras', requiere: ['Si'], casos: [
            { entrada: datos(7), contiene: ['positivo'], excluye: ['negativo', 'cero'], espera: 'Positivo' },
            { entrada: datos(-4), contiene: ['negativo'], excluye: ['positivo', 'cero'], espera: 'Negativo' },
            { entrada: datos(0), contiene: ['es cero'], excluye: ['positivo', 'negativo'], espera: 'Es cero' },
            { entrada: datos(125), contiene: ['positivo'], excluye: ['negativo', 'cero'], oculto: true },
            { entrada: datos(-1), contiene: ['negativo'], excluye: ['positivo', 'cero'], oculto: true },
          ] },
          { dificultad: 'Fácil' }),

        // ── Nivel intermedio ─────────────────────────────────────────────────────────────────────
        dg('Ejercicio 5. Determinar si un estudiante aprobó. Convierte el pseudocódigo en su diagrama de flujo, sin cambiar su lógica.',
          [INI, ['Leer nota', 'io'], si('¿nota >= 11?', [['Escribir "APROBADO"', 'io']], [['Escribir "DESAPROBADO"', 'io']]), FIN],
          { dificultad: 'Intermedio', resultado: 'Si la nota es 15, debe mostrar APROBADO. Si es 9, debe mostrar DESAPROBADO.',
            distractores: [['¿nota > 11?', 'dec']],
            codigo: 'INICIO\n    DEFINIR nota COMO REAL\n\n    LEER nota\n\n    SI nota >= 11 ENTONCES\n        ESCRIBIR "APROBADO"\n    SINO\n        ESCRIBIR "DESAPROBADO"\n    FIN SI\nFIN' }),

        // ── Nivel difícil ────────────────────────────────────────────────────────────────────────
        pg('Ejercicio 6. Descuento según el monto de compra.',
          'Una tienda aplica descuentos según el monto de compra:\n• Si compra S/ 300 o más, recibe 20 % de descuento.\n• Si compra S/ 200 o más, recibe 10 % de descuento.\n• Si compra menos de S/ 200, no recibe descuento.\nEscribe el pseudocódigo que solicite el monto de compra, calcule el descuento correspondiente y muestre el total a pagar.',
          'Para una compra de S/ 350, debe mostrar S/ 280.',
          { comparar: 'numeros', requiere: ['Si'], casos: [
            { entrada: datos(350), salida: '280' },
            { entrada: datos(250), salida: '225' },
            { entrada: datos(150), salida: '150' },
            { entrada: datos(300), salida: '240', oculto: true },
            { entrada: datos(200), salida: '180', oculto: true },
            { entrada: datos(199), salida: '199', oculto: true },
          ] },
          { dificultad: 'Difícil' }),
        dg('Ejercicio 7. Determinar el mayor de tres números. Convierte el pseudocódigo en su diagrama de flujo, sin cambiar su lógica.',
          [INI, ['Leer a', 'io'], ['Leer b', 'io'], ['Leer c', 'io'], ['mayor ← a', 'proc'],
            si('¿b > mayor?', [['mayor ← b', 'proc']], []),
            si('¿c > mayor?', [['mayor ← c', 'proc']], []),
            ['Escribir mayor', 'io'], FIN],
          { dificultad: 'Difícil', resultado: 'Si los números son 12, 35 y 20, debe mostrar 35.',
            distractores: [['¿b < mayor?', 'dec'], ['mayor ← a + b + c', 'proc']],
            codigo: 'INICIO\n    DEFINIR a, b, c, mayor COMO ENTERO\n\n    LEER a\n    LEER b\n    LEER c\n\n    mayor ← a\n\n    SI b > mayor ENTONCES\n        mayor ← b\n    FIN SI\n\n    SI c > mayor ENTONCES\n        mayor ← c\n    FIN SI\n\n    ESCRIBIR mayor\nFIN' }),
        pg('Ejercicio 8. Control de vidas de un videojuego.',
          'Un personaje comienza con 5 vidas. El usuario debe ingresar la cantidad de vidas perdidas.\nEl programa debe calcular las vidas restantes y mostrar:\n• "Jugador eliminado" si las vidas son iguales o menores que cero.\n• "Pocas vidas" si le quedan entre 1 y 2 vidas.\n• "Continúa jugando" si le quedan 3 o más vidas.\nEscribe el pseudocódigo completo.',
          'Si pierde 3 vidas, debe mostrar Pocas vidas.',
          { comparar: 'palabras', requiere: ['Si'], casos: [
            { entrada: datos(3), contiene: ['pocas vidas'], excluye: ['eliminado', 'continua jugando'], espera: 'Pocas vidas' },
            { entrada: datos(1), contiene: ['continua jugando'], excluye: ['eliminado', 'pocas vidas'], espera: 'Continúa jugando' },
            { entrada: datos(5), contiene: ['jugador eliminado'], excluye: ['pocas vidas', 'continua jugando'], espera: 'Jugador eliminado' },
            { entrada: datos(8), contiene: ['jugador eliminado'], excluye: ['pocas vidas', 'continua jugando'], oculto: true },
            { entrada: datos(4), contiene: ['pocas vidas'], excluye: ['eliminado', 'continua jugando'], oculto: true },
            { entrada: datos(2), contiene: ['continua jugando'], excluye: ['eliminado', 'pocas vidas'], oculto: true },
            { entrada: datos(0), contiene: ['continua jugando'], excluye: ['eliminado', 'pocas vidas'], oculto: true },
          ] },
          { dificultad: 'Difícil' }),
        dg('Ejercicio 9. Calcular sueldo con horas extras. Convierte el pseudocódigo en su diagrama de flujo, sin cambiar su lógica.',
          [INI, ['Leer horas', 'io'], ['Leer pagoHora', 'io'],
            si('¿horas > 40?', [['sueldo ← (40 * pagoHora) + ((horas - 40) * pagoHora * 1.5)', 'proc']], [['sueldo ← horas * pagoHora', 'proc']]),
            ['Escribir sueldo', 'io'], FIN],
          { dificultad: 'Difícil', resultado: 'Si trabaja 45 horas y gana S/ 10 por hora, debe mostrar 475.',
            distractores: [['¿horas >= 40?', 'dec'], ['sueldo ← horas * pagoHora * 1.5', 'proc']],
            codigo: 'INICIO\n    DEFINIR horas, pagoHora, sueldo COMO REAL\n\n    LEER horas\n    LEER pagoHora\n\n    SI horas > 40 ENTONCES\n        sueldo ← (40 * pagoHora) + ((horas - 40) * pagoHora * 1.5)\n    SINO\n        sueldo ← horas * pagoHora\n    FIN SI\n\n    ESCRIBIR sueldo\nFIN' }),
        pg('Ejercicio 10. Sistema de clasificación de notas.',
          'Una institución necesita clasificar a sus estudiantes según sus calificaciones.\nEl programa debe solicitar tres notas, calcular el promedio y mostrar la clasificación:\n• Promedio mayor o igual a 18: "Excelente".\n• Promedio mayor o igual a 14: "Bueno".\n• Promedio mayor o igual a 11: "Aprobado".\n• Promedio menor que 11: "Desaprobado".\nEscribe el pseudocódigo completo, desde la lectura de las tres notas hasta mostrar el promedio y su clasificación.',
          'Si las notas son 18, 16 y 20, debe mostrar un promedio de 18 y la clasificación Excelente.',
          { comparar: 'palabras', requiere: ['Si'], casos: [
            { entrada: datos(18, 16, 20), salida: '18', contiene: ['excelente'], excluye: ['bueno', 'aprobado', 'desaprobado'], espera: '18 y Excelente' },
            { entrada: datos(15, 14, 16), salida: '15', contiene: ['bueno'], excluye: ['excelente', 'aprobado', 'desaprobado'], espera: '15 y Bueno' },
            { entrada: datos(12, 11, 10), salida: '11', contiene: ['aprobado'], excluye: ['excelente', 'bueno', 'desaprobado'], espera: '11 y Aprobado' },
            { entrada: datos(8, 10, 9), salida: '9', contiene: ['desaprobado'], excluye: ['excelente', 'bueno'], espera: '9 y Desaprobado' },
            { entrada: datos(20, 19, 18), salida: '19', contiene: ['excelente'], excluye: ['bueno', 'aprobado', 'desaprobado'], oculto: true },
            { entrada: datos(14, 14, 14), salida: '14', contiene: ['bueno'], excluye: ['excelente', 'aprobado', 'desaprobado'], oculto: true },
          ] },
          { dificultad: 'Difícil' }),
      ],
    },
  ],
};
