// Pegar en Extensiones → Apps Script de
// https://docs.google.com/spreadsheets/d/12mkLInxMvEX4KM73d4YQPwNgC1uEkEN5T6xWYrWXgBg/edit
// Implementar → Aplicación web → Ejecutar como: yo → Acceso: cualquier persona.
// Copiar la URL /exec en PUBLIC_PLANILLA_SCRIPT.
// Si ya hay una implementación, publicar una versión nueva: la URL /exec no cambia.

var MESES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

function doGet() {
	return json({ ok: true, listo: true });
}

function doPost(e) {
	var lock = LockService.getScriptLock();
	if (!lock.tryLock(15000)) return json({ ok: false, error: "ocupada" });
	try {
		var data = JSON.parse(e.postData.contents);
		var anio = Number(data.anio);
		var mes = Number(data.mes);
		if (anio < 2000 || mes < 1 || mes > 12) throw new Error("Periodo inválido");
		var ss = SpreadsheetApp.getActive();
		var hoja = ss.getSheetByName(String(data.area || ""));
		if (!hoja) throw new Error("No está la pestaña " + data.area);
		if (data.accion === "quitar") {
			borrar(hoja, String(data.id || ""));
			return json({ ok: true });
		}
		agregar(hoja, data, anio, mes);
		return json({ ok: true });
	} catch (error) {
		return json({ ok: false, error: String(error) });
	} finally {
		lock.releaseLock();
	}
}

function encabezados(hoja) {
	var ancho = Math.max(hoja.getLastColumn(), 1);
	var fila = hoja.getRange(1, 1, 1, ancho).getValues()[0];
	var headers = [];
	for (var i = 0; i < fila.length; i++) {
		if (!fila[i]) break;
		headers.push(String(fila[i]));
	}
	if (headers.indexOf("Año") === -1 || headers.indexOf("Informe") === -1) {
		throw new Error("La pestaña no tiene los encabezados");
	}
	if (headers.indexOf("Id") === -1) {
		headers.push("Id");
		hoja.getRange(1, headers.length).setValue("Id").setFontWeight("bold");
		hoja.hideColumns(headers.length);
	}
	if (hoja.getFrozenRows() < 1) hoja.setFrozenRows(1);
	return headers;
}

function buscarId(hoja, headers, id) {
	var columna = headers.indexOf("Id") + 1;
	var ultima = hoja.getLastRow();
	if (ultima < 2) return 0;
	var ids = hoja.getRange(2, columna, ultima - 1, 1).getValues();
	for (var i = 0; i < ids.length; i++) {
		if (String(ids[i][0]) === id) return i + 2;
	}
	return 0;
}

function agregar(hoja, data, anio, mes) {
	var id = String(data.id || "");
	if (!id) throw new Error("Falta el id");
	var headers = encabezados(hoja);
	(data.campos || []).forEach(function (campo) {
		if (!campo || !campo.etiqueta) return;
		var etiqueta = String(campo.etiqueta);
		if (headers.indexOf(etiqueta) !== -1) return;
		headers.push(etiqueta);
		hoja.getRange(1, headers.length).setValue(etiqueta).setFontWeight("bold");
	});
	var fila = buscarId(hoja, headers, id) || Math.max(hoja.getLastRow(), 1) + 1;
	var celdas = [];
	for (var columna = 0; columna < headers.length; columna++) celdas.push("");
	celdas[headers.indexOf("Id")] = id;
	celdas[headers.indexOf("Año")] = String(anio);
	celdas[headers.indexOf("Mes")] = MESES[mes - 1];
	celdas[headers.indexOf("Informe")] = String(data.informe || "");
	(data.campos || []).forEach(function (campo) {
		if (!campo || !campo.etiqueta) return;
		var indice = headers.indexOf(String(campo.etiqueta));
		var valor = campo.valor;
		celdas[indice] =
			typeof valor === "number" && isFinite(valor) ? valor : String(valor == null ? "" : valor);
	});
	hoja.getRange(fila, 1, 1, celdas.length).setValues([celdas]);
	hoja.getRange(fila, headers.indexOf("Año") + 1).setNumberFormat("@").setValue(String(anio));
}

function borrar(hoja, id) {
	if (!id) return;
	var fila = buscarId(hoja, encabezados(hoja), id);
	if (fila) hoja.deleteRow(fila);
}

function json(data) {
	return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
		ContentService.MimeType.JSON,
	);
}
