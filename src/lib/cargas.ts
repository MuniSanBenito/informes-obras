import { clavePeriodo, type Periodo } from "./periodo";

export type Carga = {
	id: string;
	valor: number;
};

const KEY = "informe-cargas";
const VIEJO = "informe-metas-valores";

function sanitizar(lista: unknown): Carga[] {
	if (!Array.isArray(lista)) return [];
	return lista.filter(
		(item) =>
			item &&
			typeof item.id === "string" &&
			Number.isFinite(item.valor) &&
			item.valor >= 0,
	);
}

function sanitizarMes(mes: unknown): Record<string, Carga[]> {
	if (!mes || typeof mes !== "object" || Array.isArray(mes)) return {};
	const limpio: Record<string, Carga[]> = {};
	for (const id of Object.keys(mes)) {
		const cargas = sanitizar(mes[id as keyof typeof mes]);
		if (cargas.length > 0) limpio[id] = cargas;
	}
	return limpio;
}

function leerTodo(): Record<string, Record<string, Carga[]>> {
	try {
		const raw = localStorage.getItem(KEY);
		const data = raw ? JSON.parse(raw) : {};
		if (!data || typeof data !== "object" || Array.isArray(data)) return {};
		return data;
	} catch {
		return {};
	}
}

export function leerMes(periodo: Periodo): Record<string, Carga[]> {
	const todo = leerTodo();
	const clave = clavePeriodo(periodo);
	if (!todo[clave] && localStorage.getItem(VIEJO)) {
		try {
			todo[clave] = sanitizarMes(JSON.parse(localStorage.getItem(VIEJO) ?? "{}"));
			localStorage.setItem(KEY, JSON.stringify(todo));
			localStorage.removeItem(VIEJO);
		} catch {
			localStorage.removeItem(VIEJO);
		}
	}
	return sanitizarMes(todo[clave]);
}

export function guardarMes(periodo: Periodo, cargas: Record<string, Carga[]>) {
	const todo = leerTodo();
	todo[clavePeriodo(periodo)] = sanitizarMes(cargas);
	localStorage.setItem(KEY, JSON.stringify(todo));
}
