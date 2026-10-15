import type { SaldoInforme } from "../data/informes";
import { leerSaldoInicial } from "./dispositivo";
import { leerFilas, ordenarFilas, type Fila } from "./filas";
import { periodoAnterior, type Periodo } from "./periodo";
import { deltaSaldo, numero, textoNumero } from "./valores";

export function redondear(valor: number): number {
	return Math.round(valor * 1000) / 1000;
}

export function saldoAlCierre(filas: Fila[], saldo: SaldoInforme, inicial: number): number {
	let actual = inicial;
	for (const fila of ordenarFilas(filas.filter((item) => item.estado !== "quitando"))) {
		actual = redondear(actual + deltaSaldo(fila.valores, saldo));
	}
	return actual;
}

export function recalcularSaldos(filas: Fila[], saldo: SaldoInforme, inicial: number): Fila[] {
	const activas = ordenarFilas(filas.filter((fila) => fila.estado !== "quitando"));
	const quitando = filas.filter((fila) => fila.estado === "quitando");
	let actual = inicial;
	const actualizadas = activas.map((fila) => {
		actual = redondear(actual + deltaSaldo(fila.valores, saldo));
		const texto = textoNumero(actual);
		if (fila.valores.saldo && textoNumero(numero(fila.valores.saldo)) === texto) return fila;
		return {
			...fila,
			valores: { ...fila.valores, saldo: texto },
			estado: fila.estado === "enviada" ? ("pendiente" as const) : fila.estado,
			visto: fila.estado === "enviada" ? false : fila.visto,
		};
	});
	return [...actualizadas, ...quitando];
}

export function resolverBase(
	periodo: Periodo,
	informe: string,
	saldoAntes: number | null,
	conocerCero: boolean,
): number | null {
	const explicito = leerSaldoInicial(periodo, informe);
	if (explicito !== null) return explicito;
	if (saldoAntes !== null) return saldoAntes;
	const previa = ultimaConSaldo(leerFilas(periodoAnterior(periodo), informe));
	if (previa !== null) return previa;
	return conocerCero ? 0 : null;
}

export function ultimaConSaldo(filas: Fila[]): number | null {
	const orden = ordenarFilas(filas.filter((fila) => fila.estado !== "quitando"));
	for (let indice = orden.length - 1; indice >= 0; indice -= 1) {
		const fila = orden[indice];
		if (!fila?.valores.saldo) continue;
		const valor = numero(fila.valores.saldo);
		if (fila.valores.saldo.trim()) return valor;
	}
	return null;
}
