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

export function periodoAnterior(periodo: Periodo): Periodo {
	if (periodo.mes <= 1) return { anio: periodo.anio - 1, mes: 12 };
	return { anio: periodo.anio, mes: periodo.mes - 1 };
}

export function fechaIso(fecha: Date): string {
	const mes = String(fecha.getMonth() + 1).padStart(2, "0");
	const dia = String(fecha.getDate()).padStart(2, "0");
	return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function periodoDeFecha(iso: string): Periodo | null {
	const partes = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!partes) return null;
	const periodo = { anio: Number(partes[1]), mes: Number(partes[2]) };
	const dia = Number(partes[3]);
	if (!periodoValido(periodo)) return null;
	const ultimo = new Date(periodo.anio, periodo.mes, 0).getDate();
	if (dia < 1 || dia > ultimo) return null;
	return periodo;
}

export function rangoAnios(): { min: string; max: string } {
	return { min: `${ANIOS[0]}-01-01`, max: `${ANIOS[ANIOS.length - 1]}-12-31` };
}

export function limitesPeriodo(periodo: Periodo): { min: string; max: string } {
	const ultimo = new Date(periodo.anio, periodo.mes, 0).getDate();
	const mes = String(periodo.mes).padStart(2, "0");
	return {
		min: `${periodo.anio}-${mes}-01`,
		max: `${periodo.anio}-${mes}-${String(ultimo).padStart(2, "0")}`,
	};
}

export function fechaPorDefecto(periodo: Periodo): string {
	const hoy = fechaIso(new Date());
	const rango = limitesPeriodo(periodo);
	if (hoy >= rango.min && hoy <= rango.max) return hoy;
	return rango.min;
}
