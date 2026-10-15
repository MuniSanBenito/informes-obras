export const PLANILLA_ID = "12mkLInxMvEX4KM73d4YQPwNgC1uEkEN5T6xWYrWXgBg";

export const PLANILLA_URL = `https://docs.google.com/spreadsheets/d/${PLANILLA_ID}/edit`;

// Una pestaña por área dentro de la planilla.
const GID_PESTANA: Record<string, number> = {
	"obras-viales": 0,
	"alumbrado-publico": 424294301,
	"parques-y-paseos": 954183759,
	"obras-civiles": 1516332370,
};

export function urlPestana(areaId: string): string {
	const gid = GID_PESTANA[areaId];
	return gid === undefined ? PLANILLA_URL : `${PLANILLA_URL}#gid=${gid}`;
}

export const PLANILLA_SCRIPT = import.meta.env.PUBLIC_PLANILLA_SCRIPT ?? "";

export type CampoEnvio = {
	etiqueta: string;
	valor: string | number;
};

export type EnvioPlanilla = {
	accion: "agregar" | "quitar";
	id: string;
	anio: number;
	mes: number;
	area: string;
	informe: string;
	campos?: CampoEnvio[];
};

export async function guardarEnPlanilla(envio: EnvioPlanilla) {
	if (!PLANILLA_SCRIPT) {
		return { ok: false as const, motivo: "sin-script" as const };
	}
	await fetch(PLANILLA_SCRIPT, {
		method: "POST",
		mode: "no-cors",
		body: JSON.stringify(envio),
	});
	return { ok: true as const };
}
