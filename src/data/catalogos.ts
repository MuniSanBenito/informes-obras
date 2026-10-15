// Listas que casi no cambian, tomadas de las planillas de agosto 2026
// y del reporte de Obras Viales. Para sumar un camión o una máquina,
// se edita este archivo y se vuelve a publicar la app.

export type ItemCatalogo = {
	nombre: string;
} & Record<string, string>;

export const materialesViales = [
	"Brosa calcárea",
	"Ripio arcilloso",
	"Hormigón elaborado",
	"Malla sima",
	"Bolsa de cemento",
	"Varilla de hierro",
	"Mezcla asfáltica",
];

export const materialesAlumbrado = [
	"Lámpara LED 50W",
	"Plancha LED 100W",
	"Plancha LED 150W",
	"Equipo 70W",
	"Equipo LED 100W",
	"Fotocélula",
	"Fusible 10 A",
	"Jabalina",
	"Morseto neutro",
	"Morseto positivo",
	"Morseto negativo",
	"Tensor plástico",
	"Adaptador E27",
	"Zócalo",
	"Cabezal",
	"Portalámparas",
	"Cable TPR (m)",
	"Cable antihurto (m)",
];

export const combustibles: ItemCatalogo[] = [
	{ nombre: "Nafta Súper" },
	{ nombre: "Nafta Infinia" },
	{ nombre: "Diesel Premium" },
	{ nombre: "Diesel 500 común" },
	{ nombre: "Diesel común" },
	{ nombre: "Líquido hidráulico" },
	{ nombre: "Aceite 15w40" },
];

export const proveedores: ItemCatalogo[] = [{ nombre: "YPF" }];

export const destinosDeposito: ItemCatalogo[] = [
	{ nombre: "Desmalezado", acumulado: "Sí" },
	{ nombre: "Poda", acumulado: "Sí" },
	{ nombre: "Pintura", acumulado: "No" },
	{ nombre: "Pintura en juegos", acumulado: "No" },
];

// Patente, chofer, combustible y litros habituales. El que carga puede cambiarlos.
export const vehiculos: ItemCatalogo[] = [
	{
		nombre: "Camioneta Ford F-100",
		patente: "VUL 338",
		chofer: "Romero, Martin",
		combustible: "Nafta Súper",
		litros: "40",
	},
	{
		nombre: "Renault Kangoo",
		patente: "PPF 937",
		chofer: "Espinosa, Mauricio",
		combustible: "Nafta Infinia",
		litros: "30",
	},
	{
		nombre: "Fiat Iveco",
		patente: "NTX 884",
		chofer: "Duro, Claudio",
		combustible: "Diesel Premium",
		litros: "180",
	},
	{
		nombre: "Fiat Strada",
		patente: "NQF 395",
		chofer: "Heizenreder, Mario",
		combustible: "Nafta Infinia",
		litros: "30",
	},
	{
		nombre: "Tractor Massey Ferguson",
		patente: "CUM 09",
		chofer: "Russian, Raúl",
		combustible: "Diesel Premium",
		litros: "50",
	},
	{
		nombre: "Mercedes Benz 1620",
		patente: "AET 946",
		chofer: "Villagra, Pablo",
		combustible: "Diesel 500 común",
		litros: "180",
	},
	{
		nombre: "Mercedes Benz 1114",
		patente: "THG 789",
		chofer: "Reggio, Joel",
		combustible: "Diesel común",
		litros: "60",
	},
	{
		nombre: "Poulan Pro",
		patente: "",
		chofer: "Romero, Martin",
		combustible: "Nafta Súper",
		litros: "40",
	},
	{
		nombre: "Tractor Poulan Pro",
		patente: "",
		chofer: "Giménez, Ignacio",
		combustible: "Nafta Súper",
		litros: "",
	},
	{
		nombre: "Depósito Motoguadañas",
		patente: "",
		chofer: "Romero, Martin",
		combustible: "Nafta Súper",
		litros: "200",
	},
];

const operadoresMaquinas = [
	"Arigos, Ángel",
	"Flores, Sebastián",
	"Vargas, Héctor",
	"Palacios, Mateo",
	"Barcos, Ariel",
	"Pereyra, Sergio",
	"Zaragoza, Gabriel",
	"Suarez, Sebastián",
	"López, Juan Cruz",
	"Petersen, Matías",
	"Santa María, Pablo",
	"Villagra, Kevin",
	"Giménez, Ignacio",
];

export const operadoresParques: ItemCatalogo[] = unicos([
	...vehiculos.map((vehiculo) => vehiculo.chofer ?? ""),
	...operadoresMaquinas,
]);

export const personalViales: ItemCatalogo[] = [
	{ nombre: "Pablo Holman" },
	{ nombre: "Santillan, Jose Maria" },
	{ nombre: "Strack, Lautaro" },
	{ nombre: "Garcilazo, Carlos" },
	{ nombre: "Nicolas, Emilio" },
	{ nombre: "Santillan, Alexis" },
	{ nombre: "Molina, Jonathan" },
];

export const talleresParques: ItemCatalogo[] = [
	{ nombre: "Taller Novello" },
	{ nombre: "Taller Ruhl" },
	{ nombre: "Municipal P y P." },
];

export const talleresViales: ItemCatalogo[] = [
	{ nombre: "Municipal" },
	{ nombre: "Ruhl" },
	{ nombre: "Werly" },
];

export const maquinasViales: ItemCatalogo[] = [
	{ nombre: "Retroexcavadora JCB 3C Plus" },
	{ nombre: "Retroexcavadora JCB 3CX" },
	{ nombre: "Cargadora frontal CDM835" },
	{ nombre: "Minicargadora CDM 307" },
	{ nombre: "Ford 14000" },
	{ nombre: "Dodge 800" },
	{ nombre: "Mercedes Benz 1114" },
	{ nombre: "Motoniveladora New Holland" },
	{ nombre: "Scania 111" },
];

// 01 a 37 cubre el parque aunque algunas todavía no hayan entrado al taller.
export const maquinas: ItemCatalogo[] = [
	...Array.from({ length: 37 }, (_, indice) => ({
		nombre: `Máquina N.° ${String(indice + 1).padStart(2, "0")}`,
	})),
	{ nombre: "Motosierra CS-303ES" },
	{ nombre: "Motosierra CS-5100" },
	{ nombre: "Podadora de altura Echo PAS-266" },
];

export const actividadesViales: ItemCatalogo[] = [
	{ nombre: "Limpieza", materiales: "" },
	{ nombre: "Limpieza y relleno sanitario", materiales: "" },
	{ nombre: "Limpieza de alcantarillas", materiales: "" },
	{ nombre: "Limpieza de cordones", materiales: "" },
	{ nombre: "Limpieza de cordones y badenes", materiales: "" },
	{ nombre: "Enripiado", materiales: "Ripio arcilloso" },
	{ nombre: "Reposición de ripio", materiales: "Ripio arcilloso" },
	{ nombre: "Embrozado", materiales: "Brosa calcárea" },
	{ nombre: "Bacheo", materiales: "Mezcla asfáltica" },
	{ nombre: "Reparación de baches", materiales: "Mezcla asfáltica" },
	{ nombre: "Arreglo de calle", materiales: "" },
	{ nombre: "Arreglo de boca de calle", materiales: "Ripio arcilloso" },
	{ nombre: "Corte de talud", materiales: "" },
	{ nombre: "Nivelación de calle", materiales: "" },
	{ nombre: "Recolección de ramas", materiales: "" },
	{ nombre: "Mantenimiento de vehículos", materiales: "" },
	{ nombre: "Trabajos de arenado", materiales: "" },
	{ nombre: "Riego", materiales: "" },
];

export const lugaresViales: ItemCatalogo[] = [
	{ nombre: "Parque Ambiental" },
	{ nombre: "Parque de la Vida" },
	{ nombre: "Parque Lineal Sur" },
	{ nombre: "Barrio Casino" },
	{ nombre: "Basural Municipal" },
	{ nombre: "Corralón Municipal" },
	{ nombre: "Lugares varios" },
];

export const lugaresCiviles: ItemCatalogo[] = [
	{ nombre: "Jardín Maripositas 1" },
	{ nombre: "Jardín Maripositas 4" },
	{ nombre: "Plaza Botegal" },
	{ nombre: "Comedor San Pedro" },
	{ nombre: "Baños Polideportivo Vieytes" },
	{ nombre: "Parque Vieytes" },
];

export const catalogos: Record<string, ItemCatalogo[]> = {
	combustibles,
	proveedores,
	destinosDeposito,
	vehiculos,
	operadoresParques,
	personalViales,
	talleresParques,
	talleresViales,
	maquinasViales,
	maquinas,
	actividadesViales,
	lugaresViales,
	lugaresCiviles,
};

export function nombresDe(catalogo: string): string[] {
	return (catalogos[catalogo] ?? []).map((item) => item.nombre);
}

export function itemDe(catalogo: string, nombre: string): ItemCatalogo | undefined {
	return catalogos[catalogo]?.find((item) => item.nombre === nombre);
}

function unicos(nombres: string[]): ItemCatalogo[] {
	const vistos = new Set<string>();
	const items: ItemCatalogo[] = [];
	for (const nombre of nombres) {
		const limpio = nombre.trim();
		if (!limpio || vistos.has(limpio)) continue;
		vistos.add(limpio);
		items.push({ nombre: limpio });
	}
	return items;
}
