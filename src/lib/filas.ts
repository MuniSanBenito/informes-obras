import { clavePeriodo, type Periodo } from "./periodo";

export type Fila = {
	id: string;
	valores: Record<string, string>;
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

function sanitizarLista(lista: unknown): Fila[] {
	if (!Array.isArray(lista)) return [];
	return lista.flatMap((item) => {
		if (!item || typeof item !== "object" || typeof item.id !== "string") return [];
		const valores = sanitizarValores(item.valores);
		return Object.keys(valores).length > 0 ? [{ id: item.id, valores }] : [];
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
		const data = raw ? JSON.parse(raw) : {};
		if (!data || typeof data !== "object" || Array.isArray(data)) return {};
		return data;
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
