export const MESES = [
	"enero",
	"febrero",
	"marzo",
	"abril",
	"mayo",
	"junio",
	"julio",
	"agosto",
	"septiembre",
	"octubre",
	"noviembre",
	"diciembre",
];

export const ANIOS = [2024, 2025, 2026];

const KEY = "informe-periodo";

export type Periodo = {
	anio: number;
	mes: number;
};

export function periodoActual(): Periodo {
	const hoy = new Date();
	const anio = ANIOS.includes(hoy.getFullYear()) ? hoy.getFullYear() : ANIOS[ANIOS.length - 1];
	return { anio, mes: hoy.getMonth() + 1 };
}

export function periodoValido(periodo: Periodo): boolean {
	return ANIOS.includes(periodo.anio) && periodo.mes >= 1 && periodo.mes <= 12;
}

export function leerPeriodo(): Periodo {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return periodoActual();
		const data = JSON.parse(raw);
		const periodo = { anio: Number(data.anio), mes: Number(data.mes) };
		return periodoValido(periodo) ? periodo : periodoActual();
	} catch {
		return periodoActual();
	}
}

export function guardarPeriodo(periodo: Periodo) {
	if (!periodoValido(periodo)) return;
	localStorage.setItem(KEY, JSON.stringify(periodo));
	window.dispatchEvent(new Event("informe-periodo"));
}

export function clavePeriodo(periodo: Periodo): string {
	return `${periodo.anio}-${String(periodo.mes).padStart(2, "0")}`;
}

export function nombrePeriodo(periodo: Periodo): string {
	return `${MESES[periodo.mes - 1]} de ${periodo.anio}`;
}
