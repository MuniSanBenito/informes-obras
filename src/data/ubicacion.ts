export type Hoja = "OC-1" | "OC-2" | "OC-3";

export type FilaPlanilla = {
	id: string;
	etiqueta: string;
	unidad: string | null;
	fila: number;
	nota?: string;
};

export type Ubicacion = {
	hoja: Hoja;
	fila: number;
	unidad?: string | null;
	filas?: FilaPlanilla[];
};

export const ubicacion: Record<string, Ubicacion> = {
	"1.1.1": {
		hoja: "OC-1",
		fila: 6,
		filas: [
			{ id: "1.1.1", etiqueta: "Avance", unidad: "%", fila: 6 },
			{
				id: "1.1.1-mts",
				etiqueta: "Metros de redes",
				unidad: "mts",
				fila: 7,
				nota: "Meta: 14.300 metros",
			},
		],
	},
	"1.1.2": {
		hoja: "OC-1",
		fila: 8,
		filas: [
			{ id: "1.1.2", etiqueta: "Avance", unidad: "%", fila: 8 },
			{
				id: "1.1.2-mts",
				etiqueta: "Metros de redes",
				unidad: "mts",
				fila: 9,
				nota: "Meta: 11.347 metros",
			},
		],
	},
	"1.1.3": { hoja: "OC-1", fila: 10 },
	"1.1.4": { hoja: "OC-1", fila: 11 },
	"1.1.5": { hoja: "OC-1", fila: 12 },
	"1.1.6": { hoja: "OC-1", fila: 13 },
	"1.1.7": { hoja: "OC-1", fila: 14 },
	"1.1.8": { hoja: "OC-1", fila: 15 },
	"1.2.1": {
		hoja: "OC-1",
		fila: 16,
		filas: [
			{ id: "1.2.1", etiqueta: "Columnas fabricadas", unidad: "und.", fila: 16 },
			{ id: "1.2.1-plantadas", etiqueta: "Columnas plantadas", unidad: "und.", fila: 17 },
			{ id: "1.2.1-instaladas", etiqueta: "Luminarias instaladas", unidad: "und.", fila: 18 },
		],
	},
	"1.2.2": { hoja: "OC-1", fila: 19 },
	"1.2.3": { hoja: "OC-1", fila: 20 },
	"1.2.4": { hoja: "OC-1", fila: 21 },
	"1.2.5": { hoja: "OC-1", fila: 22 },
	"1.2.6": { hoja: "OC-1", fila: 23 },
	"1.2.7": {
		hoja: "OC-1",
		fila: 24,
		filas: [
			{ id: "1.2.7", etiqueta: "Equipos LED nuevos", unidad: "und.", fila: 24 },
			{ id: "1.2.7-recuperados", etiqueta: "Equipos LED recuperados", unidad: "und.", fila: 25 },
		],
	},
	"1.2.8": { hoja: "OC-1", fila: 26 },
	"1.2.9": { hoja: "OC-1", fila: 27 },
	"1.3.1": { hoja: "OC-1", fila: 28 },
	"1.3.2": { hoja: "OC-1", fila: 29 },
	"1.3.3": { hoja: "OC-1", fila: 30 },
	"1.3.4": { hoja: "OC-1", fila: 31 },
	"1.3.5": { hoja: "OC-1", fila: 32 },
	"1.3.6": { hoja: "OC-1", fila: 33 },
	"2.1.1": { hoja: "OC-2", fila: 6 },
	"2.1.2": { hoja: "OC-2", fila: 7 },
	"2.2.1": { hoja: "OC-2", fila: 8 },
	"2.2.2": { hoja: "OC-2", fila: 9 },
	"2.2.3": { hoja: "OC-2", fila: 10 },
	"2.2.4": { hoja: "OC-2", fila: 11, unidad: "%" },
	"2.2.5": { hoja: "OC-2", fila: 12 },
	"2.3.1": { hoja: "OC-2", fila: 13 },
	"2.3.2": { hoja: "OC-2", fila: 14 },
	"2.4.1": { hoja: "OC-2", fila: 15 },
	"2.5.1": {
		hoja: "OC-2",
		fila: 16,
		filas: [
			{ id: "2.5.1", etiqueta: "Proyecto", unidad: "gl", fila: 16 },
			{
				id: "2.5.1-ejecucion",
				etiqueta: "Ejecución",
				unidad: "%",
				fila: 17,
				nota: "Meta: 100%",
			},
		],
	},
	"2.5.2": { hoja: "OC-2", fila: 18 },
	"2.5.3": { hoja: "OC-2", fila: 19 },
	"2.5.4": { hoja: "OC-2", fila: 20 },
	"2.5.5": { hoja: "OC-2", fila: 21 },
	"2.5.6": { hoja: "OC-2", fila: 22, unidad: "und." },
	"2.5.7": { hoja: "OC-2", fila: 23 },
	"2.5.8": { hoja: "OC-2", fila: 24 },
	"2.6.1": { hoja: "OC-2", fila: 25 },
	"2.6.2": { hoja: "OC-2", fila: 26 },
	"2.6.3": { hoja: "OC-2", fila: 27 },
	"2.6.5": { hoja: "OC-2", fila: 28 },
	"2.7.1": { hoja: "OC-2", fila: 29 },
	"2.7.2": { hoja: "OC-2", fila: 30 },
	"2.7.3": { hoja: "OC-2", fila: 31 },
	"2.8.1": {
		hoja: "OC-2",
		fila: 32,
		filas: [
			{ id: "2.8.1", etiqueta: "Avance", unidad: "%", fila: 32 },
			{
				id: "2.8.1-marco",
				etiqueta: "Marco legal",
				unidad: "%",
				fila: 33,
				nota: "Meta: 100%",
			},
		],
	},
	"2.9.1": { hoja: "OC-2", fila: 34 },
	"2.9.2": { hoja: "OC-2", fila: 35 },
	"2.10.1": { hoja: "OC-2", fila: 36 },
	"2.10.2": { hoja: "OC-2", fila: 37 },
	"2.10.3": { hoja: "OC-2", fila: 38 },
	"2.10.4": { hoja: "OC-2", fila: 39 },
	"2.10.5": { hoja: "OC-2", fila: 40 },
	"3.1.1": { hoja: "OC-3", fila: 7 },
	"3.2.1": { hoja: "OC-3", fila: 8 },
	"3.2.2": { hoja: "OC-3", fila: 9 },
	"3.3.1": { hoja: "OC-3", fila: 10 },
	"3.3.2": { hoja: "OC-3", fila: 11 },
	"3.3.3": { hoja: "OC-3", fila: 12 },
	"3.3.4": { hoja: "OC-3", fila: 13 },
	"3.3.5": { hoja: "OC-3", fila: 14 },
	"3.3.6": { hoja: "OC-3", fila: 15 },
	"3.3.7": { hoja: "OC-3", fila: 16 },
	"3.3.8": { hoja: "OC-3", fila: 17 },
	"3.3.9": { hoja: "OC-3", fila: 18 },
	"3.4.1": { hoja: "OC-3", fila: 19 },
	"3.4.2": { hoja: "OC-3", fila: 20 },
	"3.4.3": { hoja: "OC-3", fila: 21 },
};
