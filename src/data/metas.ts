import { ubicacion, type Hoja } from "./ubicacion";

export type { Hoja };

export type FilaCarga = {
	id: string;
	etiqueta: string;
	unidad?: string;
	hoja: Hoja;
	fila: number;
	nota?: string;
};

type MetaBase = {
	codigo: string;
	texto: string;
	meta?: string;
	unidad?: string;
	detalles?: string[];
};

export type MetaItem = MetaBase & {
	hoja: Hoja;
	fila: number;
	filas?: FilaCarga[];
};

const cantidad = new Intl.NumberFormat("es-AR");

const unidades: Record<string, string> = {
	"und.": "unidades",
	mts: "metros",
	hrs: "horas",
	tn: "toneladas",
	m3: "m³",
	lts: "litros",
};

function nombreUnidad(unidad: string | null, valor: number | null = null): string | undefined {
	if (!unidad || unidad === "gl") return undefined;
	if (unidad === "%") return "%";
	if (unidad === "und." && valor === 1) return "unidad";
	return unidades[unidad] ?? unidad;
}

function objetivo(valor: number | null, unidad: string | null): string | undefined {
	const nombre = nombreUnidad(unidad, valor);
	if (valor == null || !nombre) return undefined;
	if (unidad === "%") {
		const porcentaje = valor <= 1 ? Math.round(valor * 100) : Math.round(valor);
		return `Meta: ${porcentaje}%`;
	}
	return `Meta: ${cantidad.format(valor)} ${nombre}`;
}

function meta(
	codigo: string,
	texto: string,
	valor: number | null = null,
	unidad: string | null = null,
	detalles?: string[],
): MetaBase {
	return {
		codigo,
		texto: texto.replace(/\s+/g, " ").trim(),
		meta: objetivo(valor, unidad),
		unidad: nombreUnidad(unidad),
		detalles,
	};
}

const obrasSanitariasBase: MetaBase[] = [
	meta(
		"1.1.1",
		"Gestionar financiamiento para la obra cloacal San Benito Este (14300 mts. de redes – Colector de aproximación a lagunas de tratamiento). Impacta sobre 12400 habitantes.",
		1,
		"%",
	),
	meta(
		"1.1.2",
		"Gestionar proyecto de conexión cloacal barrios Solvencia- Altos del este. (11347 mts).",
		1,
		"%",
	),
	meta("1.1.3", "Gestionar financiamiento para la obra cloacal San Benito Este 2.", 1, "%"),
	meta("1.1.4", "Extender servicio cloacal con articulación público/privado.", 200, "mts"),
	meta("1.1.5", "Acometidas domiciliarias.", 40, "und."),
	meta("1.1.6", "Desagote de pozos cobrados", 1000, "und."),
	meta("1.1.7", "Desagote de pozos subsidiados", 500, "und."),
	meta("1.1.8", "Estudio de napas Freaticas", 100, "%"),
	meta("2.7.3", "Tanque de Agua", 50, "und."),
	meta("2.10.2", "Diseñar proyecto pluvial Basavilbaso y Marizza", 1, "%"),
	meta("2.10.3", "Diseñar proyecto pluvial Crespo y Rivadavia", 1, "%"),
	meta("2.10.4", "Diseñar proyecto alcantarillado en Av Friuli", 1, "%"),
	meta(
		"2.10.5",
		"Diseñar Proyecto de ampliación de alcantarillas en Av. San Martin e Irigoyen",
		1,
		"%",
	),
];

const obrasVialesBase: MetaBase[] = [
	meta("3.1.1", "Mejorar el acceso Guido Marizza.", 1, "gl"),
	meta("3.2.1", "Perfilado y enripiado de avenidas.", 400, "mts"),
	meta("3.2.2", "Perfilado y enripiado de calles.", 4000, "mts"),
	meta("3.3.1", "Cordon cuneta.", 300, "mts"),
	meta("3.3.2", "Badenes.", 14, "und."),
	meta("3.3.3", "Bacheo.", 10, "tn"),
	meta("3.3.4", "Riego.", 30000000, "lts"),
	meta("3.3.5", "Embrozado.", 10000, "tn"),
	meta("3.3.6", "Pavimento asfaltico.", 30, "m3"),
	meta("3.3.7", "Pavimento de Hormigón.", 0, "m3"),
	meta("3.3.8", "Bacheo de Hormigón.", 180, "m3"),
	meta("3.3.9", "Lomo de burro", 1, "m3"),
	meta("3.4.1", "Mejorar Nomenclatura.", 10, "und."),
	meta("3.4.2", "Mejorar Señalización.", 3, "und."),
	meta("3.4.3", "Señalizacion de lomos de burro.", 400, "und."),
];

const alumbradoPublicoBase: MetaBase[] = [
	meta(
		"1.2.1",
		"Fabricar y colocar 150 luminarias led nuevas incluidas columnas de alumbrado.",
		150,
		"und.",
	),
	meta(
		"1.2.2",
		"Formular normativas de alumbrados públicos para loteos nuevos adaptadas a las tecnologías disponibles.",
		1,
		"gl",
	),
	meta(
		"1.2.3",
		"Georreferenciar luminarias existentes con su tipología para poder formular planes de mediano plazo adaptados a la demanda.",
		0.2,
		"%",
	),
	meta("1.2.4", "Renovación de red eléctrica del pañol.", 1, "gl"),
	meta("1.2.5", "Renovación de red eléctrica edificio municipal.", 1, "gl"),
	meta("1.2.6", "Ejecución de proyecto de reconfiguración eléctrica del parque Vieytes"),
	meta("1.2.7", "Luminarias Led.", 24, "und."),
	meta("1.2.8", "Reposición de lamparas sodio 150.", 24, "und."),
	meta("1.2.9", "Reposición de lamparas sodio 250.", 24, "und."),
];

const obrasCivilesBase: MetaBase[] = [
	meta(
		"2.1.1",
		"Ejecutar proyecto de readecuación de estadio cerrado, vestuarios, baños y comedor",
		1,
		"gl",
	),
	meta(
		"2.3.1",
		"Realizar la reestructuración del Área de Obras Privadas y Catastro, apuntando a procesos basados en economías colaborativas.",
		0.4,
		"%",
	),
	meta("2.3.2", "Diseño del Nuevo Código Urbano de Edificación.", 0.3, "%"),
	meta("2.5.1", "Desarrollar proyecto polo tecnologico.", 1, "gl"),
	meta("2.5.2", "Mantenimiento de edificios", 1, "%"),
	meta("2.5.3", "Edificio municipal.", 1, "%"),
	meta("2.5.5", "Consejo deliberante.", 1, "%"),
	meta("2.5.6", "Accion social."),
	meta("2.5.7", "Transito y juzgado de faltas.", 1, "%"),
	meta("2.5.8", "Hall de ingreso.", 100, "%"),
	meta(
		"2.8.1",
		"Ajustar e implementar el Plan de Ordenamiento Territorial, estableciendo además los marcos jurídicos correspondientes y determinando los procesos participativos que se van a llevar a cabo para su ajuste.",
		1,
		"%",
	),
];

const higieneUrbanaBase: MetaBase[] = [
	meta(
		"1.3.1",
		"Volquetes: mantenimiento del depósito de residuos de la ciudad para evitar la obstrucción de los caminos de ingresos. (Limpieza y mantenimiento en Hs Cargadora).",
		380,
		"hrs",
	),
	meta("1.3.2", "Preparación de parque lineal sur.", 200, "hrs"),
	meta("1.3.3", "Colocación de juegos infantiles y deportivos en plazas y parques.", 24, "und."),
	meta("1.3.4", "Construcción de bancos para plazas.", 40, "und."),
	meta("1.3.5", "Colocación de bancos para plazas", 60, "und."),
	meta("1.3.6", "Recuperacion de juegos", 30, "und."),
	meta("2.1.2", "Integración del paseo del arroyo.", 1, "gl"),
	meta(
		"2.2.1",
		"Formular proyecto de funcionalización del área deportiva de Av Marizza y Paraná.",
		1,
		"%",
	),
	meta("2.2.2", "Diseño del Proyecto Parque Lineal Sur.", 1, "%"),
	meta("2.2.3", "Diseño del Proyecto Parque de la Vida.", 0.7, "%"),
	meta("2.2.4", "Diseño del Parque de los Pueblos Libres."),
	meta("2.2.5", "Recuperacion de plazas barriales", 3, "und."),
	meta(
		"2.4.1",
		"Ejecutar y revisar proyecto de funcionalización del área deportiva de Av. Marizza y Paraná.",
		1,
		"%",
	),
	meta("2.5.4", "Jardines.", 1, "und."),
	meta("2.6.1", "Avanzar en los puntos de recolección de las botellas plásticas", 0.2, "%"),
	meta(
		"2.6.2",
		"Avanzar en acciones destinadas al desarrollo de compostaje y recolección diferenciada de residuos con las ONG´s locales y comisiones vecinales.",
		0.2,
		"%",
	),
	meta("2.6.3", "Diseñar e implementar el Plan de Gestión de Residuos.", 0.2, "%"),
	meta("2.6.5", "Promoción del compostaje domiciliario", 0.2, "%"),
	meta("2.7.1", "Diseñar un Plan de arbolado", 200, "und."),
	meta("2.7.2", "Realizar plantacion de arboles"),
	meta("2.9.1", "Formular el Plan de Acción Climático (PLAC).", 1, "%"),
	meta("2.9.2", "Realizar el inventario de Gases de efecto Invernadero", 1, "%"),
	meta(
		"2.10.1",
		"Gestionar con loteadores la transferencia de áreas inundables en los entornos de los arroyos al municipio de San Benito",
		1,
		"%",
	),
];

function ubicar(items: MetaBase[]): MetaItem[] {
	return items.map((item) => {
		const lugar = ubicacion[item.codigo];
		if (!lugar) throw new Error(`Falta la fila de ${item.codigo}`);
		const unidad = item.unidad ?? nombreUnidad(lugar.unidad ?? null);
		const filas = lugar.filas?.map((fila) => ({
			id: fila.id,
			etiqueta: fila.etiqueta,
			unidad: nombreUnidad(fila.unidad),
			hoja: lugar.hoja,
			fila: fila.fila,
			nota: fila.nota,
		}));
		return { ...item, unidad, hoja: lugar.hoja, fila: lugar.fila, filas };
	});
}

export const obrasSanitarias = ubicar(obrasSanitariasBase);
export const obrasViales = ubicar(obrasVialesBase);
export const alumbradoPublico = ubicar(alumbradoPublicoBase);
export const obrasCiviles = ubicar(obrasCivilesBase);
export const higieneUrbana = ubicar(higieneUrbanaBase);
