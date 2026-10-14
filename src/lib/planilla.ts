import type { Hoja } from "../data/ubicacion";

export const PLANILLA_URL =
	"https://docs.google.com/spreadsheets/d/1FvqAaB2ngcKoo1x_wY6BVB0pqVdNOtL9cTi8zz3AcSg/edit";

export const PLANILLA_SCRIPT = import.meta.env.PUBLIC_PLANILLA_SCRIPT ?? "";

const INICIO: Record<Hoja, Partial<Record<number, number>>> = {
	"OC-1": { 2024: 18, 2025: 34, 2026: 50 },
	"OC-2": { 2024: 18, 2025: 34 },
	"OC-3": { 2024: 20, 2025: 36 },
};

export function columnaMes(hoja: string, anio: number, mes: number): number | null {
	const inicio = INICIO[hoja as Hoja]?.[anio];
	if (!inicio || mes < 1 || mes > 12) return null;
	return inicio + mes - 1;
}

export type FilaEnvio = {
	hoja: string;
	fila: number;
	valor: number;
};

export async function enviarPlanilla(anio: number, mes: number, filas: FilaEnvio[]) {
	if (!PLANILLA_SCRIPT) {
		return { ok: false as const, motivo: "sin-script" as const };
	}
	await fetch(PLANILLA_SCRIPT, {
		method: "POST",
		mode: "no-cors",
		body: JSON.stringify({ anio, mes, filas }),
	});
	return { ok: true as const };
}
