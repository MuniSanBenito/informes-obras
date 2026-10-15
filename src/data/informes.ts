export type TipoCampo = "texto" | "parrafo" | "fecha" | "numero" | "opciones" | "marcas";

export type Campo = {
	id: string;
	etiqueta: string;
	tipo: TipoCampo;
	requerido?: boolean;
	opciones?: string[];
};

export type TipoInforme = {
	id: string;
	titulo: string;
	resumen: string;
	campos: Campo[];
	alguno?: string[];
	algunoMensaje?: string;
};

export type AreaInformes = {
	id: string;
	titulo: string;
	tone: "viales" | "alumbrado" | "parques" | "civiles";
	informes: TipoInforme[];
};

const materialesViales: Campo = {
	id: "materiales",
	etiqueta: "Materiales",
	tipo: "marcas",
	opciones: [
		"Brosa calcárea",
		"Ripio arcilloso",
		"Hormigón elaborado",
		"Malla sima",
		"Bolsa de cemento",
		"Varilla de hierro",
		"Mezcla asfáltica",
	],
};

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
				campos: [
					{ id: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
					{ id: "lugar", etiqueta: "Lugar", tipo: "texto", requerido: true },
					{ id: "actividad", etiqueta: "Tipo de actividad", tipo: "texto", requerido: true },
					materialesViales,
					{ id: "otros", etiqueta: "Otros materiales", tipo: "texto" },
				],
			},
			{
				id: "taller",
				titulo: "Taller mecánico",
				resumen: "Reparaciones de maquinaria",
				campos: [
					{ id: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
					{ id: "taller", etiqueta: "Taller", tipo: "texto", requerido: true },
					{ id: "actividad", etiqueta: "Tipo de actividad", tipo: "texto", requerido: true },
					{ id: "personal", etiqueta: "Personal", tipo: "texto", requerido: true },
					{ id: "maquinaria", etiqueta: "Maquinaria", tipo: "texto" },
					{ id: "observaciones", etiqueta: "Observaciones", tipo: "texto" },
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
				resumen: "Lugar, tarea y materiales del día",
				campos: [
					{ id: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
					{ id: "lugar", etiqueta: "Lugar", tipo: "texto", requerido: true },
					{ id: "trabajo", etiqueta: "Trabajo realizado", tipo: "parrafo", requerido: true },
					{ id: "materiales", etiqueta: "Materiales", tipo: "texto" },
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
				alguno: ["litros-ingreso", "destino"],
				algunoMensaje: "Indicá los litros ingresados o el destino del combustible.",
				campos: [
					{ id: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
					{ id: "proveedor", etiqueta: "Proveedor", tipo: "texto" },
					{ id: "combustible", etiqueta: "Tipo de combustible", tipo: "texto" },
					{ id: "litros-ingreso", etiqueta: "Litros ingresados", tipo: "numero" },
					{ id: "destino", etiqueta: "Destino", tipo: "texto" },
					{ id: "litros-destino", etiqueta: "Litros del destino", tipo: "numero" },
					{ id: "saldo", etiqueta: "Saldo en litros", tipo: "numero" },
					{
						id: "acumulado",
						etiqueta: "Acumulado agregado",
						tipo: "opciones",
						opciones: ["Sí", "No"],
					},
				],
			},
			{
				id: "combustibles",
				titulo: "Combustibles y aceites",
				resumen: "Vehículos y motoguadañas",
				campos: [
					{ id: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
					{ id: "vehiculo", etiqueta: "Vehículo", tipo: "texto", requerido: true },
					{ id: "patente", etiqueta: "Patente", tipo: "texto" },
					{ id: "combustible", etiqueta: "Tipo de combustible", tipo: "texto", requerido: true },
					{ id: "litros", etiqueta: "Cantidad de litros", tipo: "numero", requerido: true },
					{ id: "chofer", etiqueta: "Chofer", tipo: "texto", requerido: true },
				],
			},
			{
				id: "taller-vehiculos",
				titulo: "Taller de vehículos",
				resumen: "Reparaciones del parque automotor",
				campos: [
					{ id: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
					{ id: "actividad", etiqueta: "Actividad", tipo: "texto", requerido: true },
					{ id: "vehiculo", etiqueta: "Vehículo", tipo: "texto", requerido: true },
					{ id: "taller", etiqueta: "Taller", tipo: "texto" },
					{ id: "operador", etiqueta: "Chofer / operador", tipo: "texto" },
					{ id: "materiales", etiqueta: "Materiales", tipo: "texto" },
					estado,
				],
			},
			{
				id: "taller-maquinas",
				titulo: "Taller de máquinas y equipos",
				resumen: "Motoguadañas, motosierras y equipos",
				campos: [
					{ id: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
					{ id: "actividad", etiqueta: "Actividad", tipo: "texto", requerido: true },
					{ id: "maquina", etiqueta: "Máquina / herramienta", tipo: "texto", requerido: true },
					{ id: "taller", etiqueta: "Taller", tipo: "texto" },
					{ id: "operador", etiqueta: "Chofer / operador", tipo: "texto" },
					{ id: "materiales", etiqueta: "Materiales", tipo: "texto" },
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
				campos: [
					{ id: "lugar", etiqueta: "Lugar", tipo: "texto", requerido: true },
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
