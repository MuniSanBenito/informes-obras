import { clavePeriodo, type Periodo } from "./periodo";

const CLAVE = "informe-clave";
const EXTRAS = "informe-extras";
const SALDO = "informe-saldo-inicial";

function leerMapa(clave: string): Record<string, string> {
	try {
		const raw = localStorage.getItem(clave);
		const data: unknown = raw ? JSON.parse(raw) : {};
		if (!data || typeof data !== "object" || Array.isArray(data)) return {};
		const limpio: Record<string, string> = {};
		for (const [id, valor] of Object.entries(data)) {
			if (typeof valor === "string" && valor.trim()) limpio[id] = valor.trim();
		}
		return limpio;
	} catch {
		return {};
	}
}

function guardarMapa(clave: string, mapa: Record<string, string>) {
	localStorage.setItem(clave, JSON.stringify(mapa));
}

export function leerClave(areaId: string): string {
	return leerMapa(CLAVE)[areaId] ?? "";
}

export function guardarClave(areaId: string, pin: string) {
	const mapa = leerMapa(CLAVE);
	const limpia = pin.trim();
	if (limpia) mapa[areaId] = limpia;
	else delete mapa[areaId];
	guardarMapa(CLAVE, mapa);
}

export function olvidarClave(areaId: string) {
	const mapa = leerMapa(CLAVE);
	delete mapa[areaId];
	guardarMapa(CLAVE, mapa);
}

function claveSaldo(periodo: Periodo, informe: string): string {
	return `${clavePeriodo(periodo)}:${informe}`;
}

export function leerSaldoInicial(periodo: Periodo, informe: string): number | null {
	const texto = leerMapa(SALDO)[claveSaldo(periodo, informe)];
	if (texto === undefined) return null;
	const valor = Number(texto.replace(",", "."));
	return Number.isFinite(valor) ? valor : null;
}

export function guardarSaldoInicial(periodo: Periodo, informe: string, valor: number) {
	const mapa = leerMapa(SALDO);
	mapa[claveSaldo(periodo, informe)] = String(valor);
	guardarMapa(SALDO, mapa);
}

export function leerExtras(catalogo: string): string[] {
	const texto = leerMapa(EXTRAS)[catalogo];
	if (!texto) return [];
	return texto
		.split("\n")
		.map((item) => item.trim())
		.filter(Boolean);
}

export function recordarExtra(catalogo: string, valor: string) {
	const limpio = valor.trim();
	if (!limpio) return;
	const actuales = leerExtras(catalogo);
	if (actuales.includes(limpio)) return;
	const mapa = leerMapa(EXTRAS);
	mapa[catalogo] = [...actuales, limpio].join("\n");
	guardarMapa(EXTRAS, mapa);
}
