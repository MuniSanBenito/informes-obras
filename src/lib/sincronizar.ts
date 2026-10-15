import type { DatosInforme } from "../data/informes";
import {
	combinarFilas,
	guardarFilas,
	incorporarFilas,
	leerFilas,
	type Fila,
} from "./filas";
import { clavePeriodo, periodoValido, type Periodo } from "./periodo";
import { envioBase, guardarEnPlanilla, leerPlanilla, PLANILLA_SCRIPT } from "./planilla";
import { recalcularSaldos, resolverBase } from "./saldo";
import { camposEnvio, valoresDesdeColumnas } from "./valores";

export type ResultadoSync = {
	filas: Fila[];
	gid?: number;
	error?: string;
	enviados: number;
	quitados: number;
	pinInvalida: boolean;
	saldoAntes: number | null;
	sinScript: boolean;
};

export async function sincronizarInforme(datos: DatosInforme, periodo: Periodo, pin: string): Promise<ResultadoSync> {
	let filas = leerFilas(periodo, datos.informe);
	if (!PLANILLA_SCRIPT) {
		return vacio(filas, true);
	}

	let gid: number | undefined;
	let saldoAntes: number | null = null;
	let pullOk = false;
	const lectura = await leerPlanilla(envioBase(datos, periodo.anio, periodo.mes, pin));
	if (!lectura.ok) {
		if (lectura.error === "pin") return { ...vacio(filas, false), pinInvalida: true, error: "pin" };
	} else {
		pullOk = true;
		gid = lectura.gid;
		saldoAntes = lectura.saldoAntes;
		filas = mezclar(datos, periodo, filas, lectura.filas);
	}

	const base = datos.saldo ? resolverBase(periodo, datos.informe, pullOk ? saldoAntes : null, pullOk) : null;
	if (datos.saldo && base !== null) filas = recalcularSaldos(filas, datos.saldo, base);

	let enviados = 0;
	let quitados = 0;
	let error: string | undefined;
	let pinInvalida = false;
	const cola = filas.filter((fila) => fila.estado === "pendiente" || fila.estado === "quitando");
	for (const fila of cola) {
		const quitar = fila.estado === "quitando";
		const resultado = await guardarEnPlanilla({
			...envioBase(datos, periodo.anio, periodo.mes, pin),
			accion: quitar ? "quitar" : "agregar",
			id: fila.id,
			campos: quitar ? undefined : camposEnvio(datos.campos, fila.valores),
		});
		if (!resultado.ok) {
			if (resultado.error === "pin") pinInvalida = true;
			else error = resultado.error;
			break;
		}
		if (resultado.gid !== undefined) gid = resultado.gid;
		if (quitar) {
			filas = filas.filter((item) => item.id !== fila.id);
			quitados += 1;
			continue;
		}
		filas = filas.map((item) =>
			item.id === fila.id ? { ...item, estado: "enviada", visto: resultado.opaco !== true } : item,
		);
		enviados += 1;
	}

	guardarFilas(periodo, datos.informe, filas);
	return { filas, gid, error, enviados, quitados, pinInvalida, saldoAntes, sinScript: false };
}

function mezclar(
	datos: DatosInforme,
	periodo: Periodo,
	locales: Fila[],
	remotas: { id: string; anio: number; mes: number; cierra: string; valores: Record<string, string> }[],
): Fila[] {
	const grupos = new Map<string, Fila[]>();
	for (const remota of remotas) {
		const destino = { anio: remota.anio, mes: remota.mes };
		if (!periodoValido(destino)) continue;
		const clave = clavePeriodo(destino);
		const lista = grupos.get(clave) ?? [];
		lista.push({
			id: remota.id,
			estado: "enviada",
			visto: true,
			valores: valoresDesdeColumnas(datos.campos, remota.valores, remota.cierra),
		});
		grupos.set(clave, lista);
	}

	const actual = clavePeriodo(periodo);
	const filas = combinarFilas(locales, grupos.get(actual) ?? []);
	for (const [clave, llegadas] of grupos) {
		if (clave === actual) continue;
		const [anioTexto, mesTexto] = clave.split("-");
		const destino = { anio: Number(anioTexto), mes: Number(mesTexto) };
		if (!periodoValido(destino)) continue;
		guardarFilas(destino, datos.informe, incorporarFilas(leerFilas(destino, datos.informe), llegadas));
	}
	return filas;
}

function vacio(filas: Fila[], sinScript: boolean): ResultadoSync {
	return {
		filas,
		enviados: 0,
		quitados: 0,
		pinInvalida: false,
		saldoAntes: null,
		sinScript,
	};
}
