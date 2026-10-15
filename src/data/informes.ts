import { materialesAlumbrado, materialesViales } from "./catalogos";

export type TipoCampo =
	| "texto"
	| "parrafo"
	| "fecha"
	| "numero"
	| "opciones"
	| "marcas"
	| "seleccion"
	| "multiple"
	| "cantidades"
	| "calculado";

export type Campo = {
	id: string;
	etiqueta: string;
	tipo: TipoCampo;
	requerido?: boolean;
	opciones?: string[];
	catalogo?: string;
	columna?: string;
	completa?: Record<string, string>;
	porDefecto?: string;
	conservar?: boolean;
	sugiere?: { campo: string; propiedad: string };
	atajos?: string[];
	atajo?: "reemplazar" | "agregar";
	expandir?: boolean;
	modos?: string[];
	sugerencias?: string;
	recordar?: boolean;
};

export type ModoInforme = {
	id: string;
	etiqueta: string;
};

export type CierreInforme = {
	estado: string;
	abierto: string;
	cerrado: string;
};

export type SaldoInforme = {
	ingreso: string;
	salida: string;
};

export type TipoInforme = {
	id: string;
	titulo: string;
	resumen: string;
	pestana: string;
	documento: boolean;
	campos: Campo[];
	alguno?: string[];
	algunoMensaje?: string;
	modos?: ModoInforme[];
	cierre?: CierreInforme;
	litros?: string;
	saldo?: SaldoInforme;
};

export type AreaInformes = {
	id: string;
	titulo: string;
	tone: "viales" | "alumbrado" | "parques" | "civiles";
	informes: TipoInforme[];
};

export type DatosInforme = {
	informe: string;
	areaId: string;
	area: string;
	titulo: string;
	pestana: string;
	documento: boolean;
	campos: Campo[];
	alguno: string[];
	algunoMensaje: string;
	modos: ModoInforme[];
	cierre: CierreInforme | null;
	litros: string;
	saldo: SaldoInforme | null;
};

const cierreTaller: CierreInforme = {
	estado: "estado",
	abierto: "En ejecución",
	cerrado: "Ejecutado",
};

function fecha(conservar = true): Campo {
	return {
		id: "fecha",
		etiqueta: "Fecha",
		tipo: "fecha",
		requerido: true,
		porDefecto: "hoy",
		conservar,
	};
}

const estado: Campo = {
	id: "estado",
	etiqueta: "Estado",
	tipo: "opciones",
	requerido: true,
	opciones: ["En ejecución", "Ejecutado"],
};

export const areas: AreaInformes[] = [
	{
		id: "obras-viales",
		titulo: "Obras Viales",
		tone: "viales",
		informes: [
			{
				id: "actividades",
				titulo: "Actividades",
				resumen: "Fecha, lugar, tarea y materiales",
				pestana: "Viales · Actividades",
				documento: false,
				campos: [
					fecha(),
					{
						id: "lugar",
						etiqueta: "Lugar",
						tipo: "texto",
						requerido: true,
						conservar: true,
						sugerencias: "lugaresViales",
						recordar: true,
					},
					{
						id: "actividad",
						etiqueta: "Tipo de actividad",
						tipo: "seleccion",
						catalogo: "actividadesViales",
						requerido: true,
						sugiere: { campo: "materiales", propiedad: "materiales" },
					},
					{
						id: "materiales",
						etiqueta: "Materiales",
						tipo: "marcas",
						opciones: materialesViales,
						expandir: true,
					},
					{ id: "otros", etiqueta: "Otros materiales", tipo: "texto", columna: "Otros" },
				],
			},
			{
				id: "taller",
				titulo: "Taller mecánico",
				resumen: "Reparaciones de maquinaria",
				pestana: "Viales · Taller",
				documento: false,
				campos: [
					fecha(),
					{
						id: "taller",
						etiqueta: "Taller",
						tipo: "seleccion",
						catalogo: "talleresViales",
						requerido: true,
					},
					{ id: "actividad", etiqueta: "Tipo de actividad", tipo: "texto", requerido: true },
					{
						id: "personal",
						etiqueta: "Personal",
						tipo: "seleccion",
						catalogo: "personalViales",
						requerido: true,
					},
					{
						id: "maquina",
						etiqueta: "Máquina",
						tipo: "seleccion",
						catalogo: "maquinasViales",
						requerido: true,
					},
					{ id: "repuestos", etiqueta: "Repuestos / materiales", tipo: "texto", columna: "Repuestos" },
				],
			},
		],
	},
	{
		id: "alumbrado-publico",
		titulo: "Alumbrado Público",
		tone: "alumbrado",
		informes: [
			{
				id: "trabajos",
				titulo: "Trabajos",
				resumen: "Lugar y materiales del día",
				pestana: "Alumbrado · Trabajos",
				documento: true,
				campos: [
					fecha(),
					{
						id: "lugar",
						etiqueta: "Lugar",
						tipo: "texto",
						requerido: true,
						recordar: true,
					},
					{
						id: "materiales",
						etiqueta: "Materiales",
						tipo: "cantidades",
						opciones: materialesAlumbrado,
					},
					{
						id: "nota",
						etiqueta: "Nota",
						tipo: "texto",
						atajos: ["Cable cortado", "Positivo cortado"],
						atajo: "reemplazar",
					},
				],
			},
		],
	},
	{
		id: "parques-y-paseos",
		titulo: "Parques y Paseos",
		tone: "parques",
		informes: [
			{
				id: "combustible-deposito",
				titulo: "Combustible del depósito",
				resumen: "Ingresos y salidas del depósito",
				pestana: "Parques · Combustible depósito",
				documento: true,
				modos: [
					{ id: "ingreso", etiqueta: "Ingreso" },
					{ id: "salida", etiqueta: "Salida" },
				],
				saldo: { ingreso: "litros-ingreso", salida: "litros-destino" },
				campos: [
					fecha(),
					{
						id: "proveedor",
						etiqueta: "Proveedor",
						tipo: "seleccion",
						catalogo: "proveedores",
						porDefecto: "YPF",
						modos: ["ingreso"],
					},
					{
						id: "combustible",
						etiqueta: "Tipo de combustible",
						tipo: "seleccion",
						catalogo: "combustibles",
						porDefecto: "Nafta Súper",
						modos: ["ingreso"],
					},
					{
						id: "litros-ingreso",
						etiqueta: "Litros ingresados",
						tipo: "numero",
						requerido: true,
						modos: ["ingreso"],
					},
					{
						id: "destino",
						etiqueta: "Destino",
						tipo: "seleccion",
						catalogo: "destinosDeposito",
						requerido: true,
						modos: ["salida"],
						completa: { acumulado: "acumulado" },
					},
					{
						id: "litros-destino",
						etiqueta: "Litros del destino",
						tipo: "numero",
						requerido: true,
						modos: ["salida"],
					},
					{
						id: "saldo",
						etiqueta: "Saldo en litros",
						tipo: "calculado",
						columna: "Saldo litros",
					},
					{
						id: "acumulado",
						etiqueta: "Ac. agregado",
						tipo: "opciones",
						opciones: ["Sí", "No"],
						porDefecto: "No",
					},
				],
			},
			{
				id: "combustibles",
				titulo: "Combustibles y aceites",
				resumen: "Vehículos y motoguadañas",
				pestana: "Parques · Combustibles",
				documento: true,
				litros: "litros",
				campos: [
					fecha(),
					{
						id: "vehiculo",
						etiqueta: "Vehículo",
						tipo: "seleccion",
						catalogo: "vehiculos",
						requerido: true,
						completa: {
							patente: "patente",
							chofer: "chofer",
							combustible: "combustible",
							litros: "litros",
						},
					},
					{ id: "patente", etiqueta: "Patente", tipo: "texto" },
					{
						id: "combustible",
						etiqueta: "Tipo de combustible",
						tipo: "seleccion",
						catalogo: "combustibles",
						requerido: true,
					},
					{
						id: "litros",
						etiqueta: "Cantidad de litros",
						tipo: "numero",
						requerido: true,
						columna: "Cant. de litros",
					},
					{
						id: "chofer",
						etiqueta: "Chofer",
						tipo: "seleccion",
						catalogo: "operadoresParques",
						requerido: true,
						conservar: true,
					},
				],
			},
			{
				id: "taller-vehiculos",
				titulo: "Taller de vehículos",
				resumen: "Reparaciones del parque automotor",
				pestana: "Parques · Taller vehículos",
				documento: true,
				cierre: cierreTaller,
				campos: [
					fecha(),
					{ id: "actividad", etiqueta: "Actividad", tipo: "texto", requerido: true },
					{
						id: "vehiculo",
						etiqueta: "Vehículo",
						tipo: "seleccion",
						catalogo: "vehiculos",
						requerido: true,
						completa: { operador: "chofer" },
					},
					{
						id: "taller",
						etiqueta: "Taller",
						tipo: "seleccion",
						catalogo: "talleresParques",
						requerido: true,
					},
					{
						id: "operador",
						etiqueta: "Chofer / operador",
						tipo: "seleccion",
						catalogo: "operadoresParques",
					},
					{
						id: "materiales",
						etiqueta: "Materiales",
						tipo: "texto",
						atajos: ["filtro de aire", "bobina", "grasa"],
						atajo: "agregar",
					},
					estado,
				],
			},
			{
				id: "taller-maquinas",
				titulo: "Taller de máquinas y equipos",
				resumen: "Motoguadañas, motosierras y equipos",
				pestana: "Parques · Taller máquinas",
				documento: true,
				cierre: cierreTaller,
				campos: [
					fecha(),
					{
						id: "actividad",
						etiqueta: "Actividad",
						tipo: "texto",
						requerido: true,
						atajos: [
							"Limpieza semanal",
							"Carburación y reajuste",
							"Cambio de filtro de aire",
							"Afilado de cadena y limpieza",
							"Cambio de repuesto",
						],
						atajo: "reemplazar",
					},
					{
						id: "maquina",
						etiqueta: "Máquina / herramienta",
						tipo: "multiple",
						catalogo: "maquinas",
						requerido: true,
					},
					{
						id: "taller",
						etiqueta: "Taller",
						tipo: "seleccion",
						catalogo: "talleresParques",
						requerido: true,
						porDefecto: "Municipal P y P.",
					},
					{
						id: "operador",
						etiqueta: "Chofer / operador",
						tipo: "seleccion",
						catalogo: "operadoresParques",
					},
					{
						id: "materiales",
						etiqueta: "Materiales",
						tipo: "texto",
						atajos: ["grasa", "filtro de aire", "arnés", "piolero de arranque"],
						atajo: "agregar",
					},
					estado,
				],
			},
		],
	},
	{
		id: "obras-civiles",
		titulo: "Obras Civiles",
		tone: "civiles",
		informes: [
			{
				id: "actividades",
				titulo: "Informe de actividades",
				resumen: "Trabajos en edificios, plazas y jardines",
				pestana: "Civiles · Actividades",
				documento: true,
				campos: [
					{
						id: "lugar",
						etiqueta: "Lugar",
						tipo: "seleccion",
						catalogo: "lugaresCiviles",
						requerido: true,
						conservar: true,
					},
					{ id: "actividad", etiqueta: "Actividad", tipo: "texto", requerido: true },
					{ id: "descripcion", etiqueta: "Descripción", tipo: "parrafo", requerido: true },
				],
			},
		],
	},
];

export function claveInforme(areaId: string, informeId: string): string {
	return `${areaId}/${informeId}`;
}

export function nombreColumna(campo: Campo): string {
	return campo.columna ?? campo.etiqueta;
}

export function expandido(campo: Campo): boolean {
	return campo.tipo === "cantidades" || (campo.tipo === "marcas" && campo.expandir === true);
}

export function columnasDe(informe: { campos: Campo[] }): string[] {
	const columnas: string[] = [];
	for (const campo of informe.campos) {
		if (expandido(campo)) columnas.push(...(campo.opciones ?? []));
		else columnas.push(nombreColumna(campo));
	}
	return columnas;
}

export function parseDatos(valor: unknown): DatosInforme {
	if (!valor || typeof valor !== "object") throw new Error("Faltan los datos del informe");
	const data = valor as Partial<DatosInforme>;
	if (typeof data.informe !== "string" || !Array.isArray(data.campos)) {
		throw new Error("Faltan los datos del informe");
	}
	return {
		informe: data.informe,
		areaId: String(data.areaId ?? ""),
		area: String(data.area ?? ""),
		titulo: String(data.titulo ?? ""),
		pestana: String(data.pestana ?? ""),
		documento: Boolean(data.documento),
		campos: data.campos,
		alguno: data.alguno ?? [],
		algunoMensaje: data.algunoMensaje ?? "",
		modos: data.modos ?? [],
		cierre: data.cierre ?? null,
		litros: data.litros ?? "",
		saldo: data.saldo ?? null,
	};
}
