import type { CierreInforme } from "../data/informes";
import { clavePeriodo, type Periodo } from "./periodo";

export type EstadoFila = "pendiente" | "enviada" | "quitando";

export type Fila = {
	id: string;
	valores: Record<string, string>;
	estado: EstadoFila;
	visto: boolean;
};

const KEY = "informe-filas";

function sanitizarValores(valores: unknown): Record<string, string> {
	if (!valores || typeof valores !== "object" || Array.isArray(valores)) return {};
	const limpio: Record<string, string> = {};
	for (const [id, valor] of Object.entries(valores)) {
		if (typeof valor === "string" && valor.trim()) limpio[id] = valor.trim();
	}
	return limpio;
}

function sanitizarFila(item: unknown): Fila | null {
	if (!item || typeof item !== "object") return null;
	const fila = item as { id?: unknown; valores?: unknown; estado?: unknown; visto?: unknown };
	if (typeof fila.id !== "string" || !fila.id.trim()) return null;
	const valores = sanitizarValores(fila.valores);
	if (Object.keys(valores).length === 0) return null;
	const estado: EstadoFila =
		fila.estado === "enviada" || fila.estado === "quitando" ? fila.estado : "pendiente";
	return { id: fila.id, valores, estado, visto: fila.visto === true };
}

function sanitizarLista(lista: unknown): Fila[] {
	if (!Array.isArray(lista)) return [];
	return lista.flatMap((item) => {
		const fila = sanitizarFila(item);
		return fila ? [fila] : [];
	});
}

function sanitizarMes(mes: unknown): Record<string, Fila[]> {
	if (!mes || typeof mes !== "object" || Array.isArray(mes)) return {};
	const limpio: Record<string, Fila[]> = {};
	for (const id of Object.keys(mes)) {
		const filas = sanitizarLista(mes[id as keyof typeof mes]);
		if (filas.length > 0) limpio[id] = filas;
	}
	return limpio;
}

function leerTodo(): Record<string, Record<string, Fila[]>> {
	try {
		const raw = localStorage.getItem(KEY);
		const data: unknown = raw ? JSON.parse(raw) : {};
		if (!data || typeof data !== "object" || Array.isArray(data)) return {};
		return data as Record<string, Record<string, Fila[]>>;
	} catch {
		return {};
	}
}

export function leerFilas(periodo: Periodo, informe: string): Fila[] {
	const mes = sanitizarMes(leerTodo()[clavePeriodo(periodo)]);
	return mes[informe] ?? [];
}

export function guardarFilas(periodo: Periodo, informe: string, filas: Fila[]) {
	const todo = leerTodo();
	const clave = clavePeriodo(periodo);
	const mes = sanitizarMes(todo[clave]);
	const lista = sanitizarLista(filas);
	if (lista.length > 0) mes[informe] = lista;
	else delete mes[informe];
	if (Object.keys(mes).length > 0) todo[clave] = mes;
	else delete todo[clave];
	localStorage.setItem(KEY, JSON.stringify(todo));
}

export function leerPeriodosDe(informe: string): { periodo: Periodo; filas: Fila[] }[] {
	const grupos: { periodo: Periodo; filas: Fila[] }[] = [];
	for (const [clave, mes] of Object.entries(leerTodo())) {
		const filas = sanitizarMes(mes)[informe];
		if (!filas) continue;
		const [anioTexto, mesTexto] = clave.split("-");
		const anio = Number(anioTexto);
		const mesNumero = Number(mesTexto);
		if (!anio || !mesNumero) continue;
		grupos.push({ periodo: { anio, mes: mesNumero }, filas });
	}
	return grupos;
}

export function ordenarFilas(filas: Fila[]): Fila[] {
	return filas
		.map((fila, indice) => ({ fila, indice }))
		.sort((a, b) => {
			const fechaA = a.fila.valores.fecha ?? "";
			const fechaB = b.fila.valores.fecha ?? "";
			if (fechaA !== fechaB) return fechaA < fechaB ? -1 : 1;
			return a.indice - b.indice;
		})
		.map((item) => item.fila);
}

export function combinarFilas(locales: Fila[], remotas: Fila[]): Fila[] {
	const localesPorId = new Map(locales.map((fila) => [fila.id, fila]));
	const remotasPorId = new Set(remotas.map((fila) => fila.id));
	const combinadas: Fila[] = [];

	for (const remota of remotas) {
		const local = localesPorId.get(remota.id);
		if (local?.estado === "quitando" || local?.estado === "pendiente") {
			combinadas.push(local);
			continue;
		}
		combinadas.push({ ...remota, estado: "enviada", visto: true });
	}

	for (const local of locales) {
		if (remotasPorId.has(local.id)) continue;
		if (local.estado === "pendiente" || local.estado === "quitando") {
			combinadas.push(local);
			continue;
		}
		if (local.estado === "enviada" && !local.visto) {
			combinadas.push({ ...local, estado: "pendiente" });
		}
	}

	return combinadas;
}

export function incorporarFilas(locales: Fila[], llegadas: Fila[]): Fila[] {
	const mapa = new Map(locales.map((fila) => [fila.id, fila]));
	for (const llegada of llegadas) {
		const local = mapa.get(llegada.id);
		if (local?.estado === "quitando" || local?.estado === "pendiente") continue;
		mapa.set(llegada.id, { ...llegada, estado: "enviada", visto: true });
	}
	return [...mapa.values()];
}

export function filasPendientes(grupos: Fila[][], cierre: CierreInforme): Fila[] {
	const cerrados = new Set<string>();
	for (const grupo of grupos) {
		for (const fila of grupo) {
			if (fila.estado === "quitando") continue;
			const id = fila.valores.cierra;
			if (id) cerrados.add(id);
		}
	}
	const abiertas: Fila[] = [];
	for (const grupo of grupos) {
		for (const fila of grupo) {
			if (fila.estado === "quitando") continue;
			if (fila.valores[cierre.estado] !== cierre.abierto) continue;
			if (cerrados.has(fila.id)) continue;
			abiertas.push(fila);
		}
	}
	return ordenarFilas(abiertas);
}
