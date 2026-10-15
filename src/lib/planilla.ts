import { columnasDe, type DatosInforme } from "../data/informes";
import type { CampoEnvio } from "./valores";

export const PLANILLA_ID = "12mkLInxMvEX4KM73d4YQPwNgC1uEkEN5T6xWYrWXgBg";

export const PLANILLA_URL = `https://docs.google.com/spreadsheets/d/${PLANILLA_ID}/edit`;

export const PLANILLA_SCRIPT = import.meta.env.PUBLIC_PLANILLA_SCRIPT ?? "";

/**
 * Única capa que guarda y lee los informes.
 *
 * Hoy el destino es un Google Sheet vía Apps Script. Alcanza para el volumen
 * (cientos de filas por mes), el personal ya trabaja con planillas y el
 * informe del mes se arma desde ahí.
 *
 * Conviene pasar a una base (por ejemplo D1 o Supabase) solo si aparece
 * alguno de estos casos: usuarios con roles y auditoría de quién cargó qué,
 * fotos adjuntas, integración con otros sistemas, o mucha concurrencia.
 * El reemplazo queda en este archivo (`guardarEnPlanilla`, `leerPlanilla`
 * y `generarInformeMes`). El resto de la app no habla con el destino.
 */

export function urlPestana(gid?: number): string {
	if (gid === undefined) return PLANILLA_URL;
	return `${PLANILLA_URL}#gid=${gid}`;
}

export type EnvioPlanilla = {
	accion: "agregar" | "quitar" | "generar";
	id?: string;
	anio: number;
	mes: number;
	areaId: string;
	area: string;
	informe: string;
	pestana: string;
	pin: string;
	columnas?: string[];
	campos?: CampoEnvio[];
};

export type FilaRemota = {
	id: string;
	anio: number;
	mes: number;
	cierra: string;
	valores: Record<string, string>;
};

export type LecturaPlanilla = {
	ok: true;
	gid?: number;
	saldoAntes: number | null;
	filas: FilaRemota[];
};

export type ResultadoEnvio =
	| { ok: true; gid?: number; opaco?: boolean; url?: string; aviso?: string }
	| { ok: false; error: string };

export function envioBase(datos: DatosInforme, anio: number, mes: number, pin: string): EnvioPlanilla {
	return {
		accion: "agregar",
		anio,
		mes,
		areaId: datos.areaId,
		area: datos.area,
		informe: datos.titulo,
		pestana: datos.pestana,
		pin,
		columnas: columnasDe(datos),
	};
}

export async function guardarEnPlanilla(envio: EnvioPlanilla): Promise<ResultadoEnvio> {
	return interpretar(await post(envio));
}

export async function generarInformeMes(
	envio: Omit<EnvioPlanilla, "accion" | "campos" | "columnas" | "id">,
): Promise<ResultadoEnvio> {
	return interpretar(await post({ ...envio, accion: "generar" }));
}

export async function leerPlanilla(envio: EnvioPlanilla): Promise<LecturaPlanilla | { ok: false; error: string }> {
	if (!PLANILLA_SCRIPT) return { ok: false, error: "sin-script" };
	try {
		const url = new URL(PLANILLA_SCRIPT);
		url.searchParams.set("accion", "leer");
		url.searchParams.set("pestana", envio.pestana);
		url.searchParams.set("areaId", envio.areaId);
		url.searchParams.set("anio", String(envio.anio));
		url.searchParams.set("mes", String(envio.mes));
		url.searchParams.set("pin", envio.pin);
		const data = await pedir(url.toString());
		const resultado = interpretar(data);
		if (!resultado.ok) return resultado;
		const objeto = esObjeto(data) ? data : {};
		return {
			ok: true,
			gid: resultado.gid,
			saldoAntes: comoNumero(objeto.saldoAntes),
			filas: filasRemotas(objeto.filas),
		};
	} catch {
		return { ok: false, error: "red" };
	}
}

async function post(body: unknown): Promise<unknown> {
	if (!PLANILLA_SCRIPT) return { ok: false, error: "sin-script" };
	try {
		return await pedir(PLANILLA_SCRIPT, {
			method: "POST",
			headers: { "Content-Type": "text/plain;charset=utf-8" },
			body: JSON.stringify(body),
		});
	} catch {
		try {
			await fetch(PLANILLA_SCRIPT, {
				method: "POST",
				mode: "no-cors",
				body: JSON.stringify(body),
			});
			return { ok: true, opaco: true };
		} catch {
			return { ok: false, error: "red" };
		}
	}
}

async function pedir(url: string, init?: RequestInit): Promise<unknown> {
	const respuesta = await fetch(url, { redirect: "follow", cache: "no-store", ...init });
	if (respuesta.type === "opaque") return { ok: true, opaco: true };
	const texto = await respuesta.text();
	if (!texto) return { ok: false, error: "respuesta" };
	try {
		return JSON.parse(texto) as unknown;
	} catch {
		return { ok: false, error: "respuesta" };
	}
}

function interpretar(data: unknown): ResultadoEnvio {
	if (!esObjeto(data)) return { ok: false, error: "respuesta" };
	if (data.ok === true) {
		return {
			ok: true,
			gid: typeof data.gid === "number" ? data.gid : undefined,
			opaco: data.opaco === true,
			url: typeof data.url === "string" ? data.url : undefined,
			aviso: typeof data.aviso === "string" ? data.aviso : undefined,
		};
	}
	return { ok: false, error: typeof data.error === "string" ? data.error : "error" };
}

function filasRemotas(valor: unknown): FilaRemota[] {
	if (!Array.isArray(valor)) return [];
	return valor.flatMap((item) => {
		if (!esObjeto(item) || typeof item.id !== "string" || !item.id) return [];
		const valores: Record<string, string> = {};
		if (esObjeto(item.valores)) {
			for (const [clave, celda] of Object.entries(item.valores)) {
				if (typeof celda === "string" && celda.trim()) valores[clave] = celda.trim();
				else if (typeof celda === "number" && Number.isFinite(celda)) valores[clave] = String(celda);
			}
		}
		return [
			{
				id: item.id,
				anio: Number(item.anio),
				mes: Number(item.mes),
				cierra: typeof item.cierra === "string" ? item.cierra : "",
				valores,
			},
		];
	});
}

function comoNumero(valor: unknown): number | null {
	if (typeof valor === "number" && Number.isFinite(valor)) return valor;
	if (typeof valor === "string" && valor.trim()) {
		const n = Number(valor.replace(",", "."));
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
	return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
