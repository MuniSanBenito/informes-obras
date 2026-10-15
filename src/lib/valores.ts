import { expandido, nombreColumna, type Campo, type SaldoInforme } from "../data/informes";

export function numero(valor: string | undefined): number {
	if (!valor) return 0;
	const n = Number(String(valor).trim().replace(",", "."));
	return Number.isFinite(n) ? n : 0;
}

export function textoNumero(valor: number): string {
	if (!Number.isFinite(valor)) return "";
	const redondo = Math.round(valor * 1000) / 1000;
	return String(redondo);
}

export function leerMarcas(valor: string | undefined): string[] {
	if (!valor) return [];
	return valor
		.split(",")
		.map((parte) => parte.trim())
		.filter(Boolean);
}

export function leerCantidades(valor: string | undefined): Record<string, number> {
	const mapa: Record<string, number> = {};
	if (!valor) return mapa;
	for (const parte of valor.split(";")) {
		const corte = parte.lastIndexOf(":");
		if (corte === -1) continue;
		const nombre = parte.slice(0, corte).trim();
		const cantidad = numero(parte.slice(corte + 1));
		if (nombre && cantidad > 0) mapa[nombre] = cantidad;
	}
	return mapa;
}

export function escribirCantidades(mapa: Record<string, number>): string {
	return Object.entries(mapa)
		.filter(([, cantidad]) => cantidad > 0)
		.map(([nombre, cantidad]) => `${nombre}: ${textoNumero(cantidad)}`)
		.join("; ");
}

export type CampoEnvio = {
	etiqueta: string;
	valor: string | number;
	tipo?: "fecha" | "numero" | "texto";
};

export function camposEnvio(campos: Campo[], valores: Record<string, string>): CampoEnvio[] {
	const envio: CampoEnvio[] = [];
	for (const campo of campos) {
		if (expandido(campo)) {
			const marcas = new Set(campo.tipo === "marcas" ? leerMarcas(valores[campo.id]) : []);
			const cantidades = campo.tipo === "cantidades" ? leerCantidades(valores[campo.id]) : null;
			for (const opcion of campo.opciones ?? []) {
				if (cantidades) {
					const cantidad = cantidades[opcion] ?? 0;
					if (cantidad > 0) envio.push({ etiqueta: opcion, valor: cantidad, tipo: "numero" });
				} else if (marcas.has(opcion)) {
					envio.push({ etiqueta: opcion, valor: "x" });
				}
			}
			continue;
		}
		const valor = valores[campo.id];
		if (!valor) continue;
		if (campo.tipo === "numero" || campo.tipo === "calculado") {
			envio.push({ etiqueta: nombreColumna(campo), valor: numero(valor), tipo: "numero" });
		} else if (campo.tipo === "fecha") {
			envio.push({ etiqueta: nombreColumna(campo), valor, tipo: "fecha" });
		} else {
			envio.push({ etiqueta: nombreColumna(campo), valor });
		}
	}
	if (valores.cierra) envio.push({ etiqueta: "Cierra", valor: valores.cierra });
	return envio;
}

export function valoresDesdeColumnas(
	campos: Campo[],
	celdas: Record<string, string>,
	cierra: string,
): Record<string, string> {
	const valores: Record<string, string> = {};
	for (const campo of campos) {
		if (campo.tipo === "marcas" && campo.expandir) {
			const marcados = (campo.opciones ?? []).filter((opcion) => {
				const celda = celdas[opcion]?.trim().toLowerCase();
				return celda === "x";
			});
			if (marcados.length > 0) valores[campo.id] = marcados.join(", ");
			continue;
		}
		if (campo.tipo === "cantidades") {
			const mapa: Record<string, number> = {};
			for (const opcion of campo.opciones ?? []) {
				const cantidad = numero(celdas[opcion]);
				if (cantidad > 0) mapa[opcion] = cantidad;
			}
			const texto = escribirCantidades(mapa);
			if (texto) valores[campo.id] = texto;
			continue;
		}
		const celda = celdas[nombreColumna(campo)];
		if (!celda?.trim()) continue;
		valores[campo.id] = campo.tipo === "fecha" ? normalizarFecha(celda) : celda.trim();
	}
	if (cierra) valores.cierra = cierra;
	return valores;
}

export function normalizarFecha(valor: string): string {
	const texto = valor.trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
	const barra = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (!barra) return texto;
	const dia = barra[1] ?? "";
	const mes = barra[2] ?? "";
	const anio = barra[3] ?? "";
	return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

export function presentarCantidades(valor: string): string {
	return Object.entries(leerCantidades(valor))
		.map(([nombre, cantidad]) => `${textoNumero(cantidad)} × ${nombre}`)
		.join(", ");
}

export function deltaSaldo(valores: Record<string, string>, saldo: SaldoInforme): number {
	return numero(valores[saldo.ingreso]) - numero(valores[saldo.salida]);
}
