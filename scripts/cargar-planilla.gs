// Pegar en Extensiones → Apps Script de
// https://docs.google.com/spreadsheets/d/12mkLInxMvEX4KM73d4YQPwNgC1uEkEN5T6xWYrWXgBg/edit
// Zona horaria del proyecto: America/Argentina/Buenos_Aires.
// Implementar → Aplicación web → Ejecutar como: yo → Acceso: cualquier persona.
// Copiar la URL /exec en PUBLIC_PLANILLA_SCRIPT.
// Si ya hay una implementación, publicar una versión nueva: la URL /exec no cambia.
//
// Clave opcional por área (Propiedades del script). Si no está, la planilla acepta cargas.
// PIN_obras-viales, PIN_alumbrado-publico, PIN_parques-y-paseos, PIN_obras-civiles
//
// Menú Informes → Generar documentos del mes. Recargar la planilla para ver el menú.
// Los documentos quedan en la carpeta "Informes de obras" de Drive (se descargan como .docx o PDF).

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

var PESTANAS = {
	"Viales · Actividades": { area: "obras-viales", documento: "" },
	"Viales · Taller": { area: "obras-viales", documento: "" },
	"Alumbrado · Trabajos": { area: "alumbrado-publico", documento: "alumbrado" },
	"Parques · Combustible depósito": { area: "parques-y-paseos", documento: "deposito" },
	"Parques · Combustibles": { area: "parques-y-paseos", documento: "tabla" },
	"Parques · Taller vehículos": { area: "parques-y-paseos", documento: "tabla" },
	"Parques · Taller máquinas": { area: "parques-y-paseos", documento: "tabla" },
	"Civiles · Actividades": { area: "obras-civiles", documento: "civiles" },
};

var SISTEMA = ["Año", "Mes", "Id", "Cierra"];
var DIAS = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

function doGet(e) {
	try {
		var params = (e && e.parameter) || {};
		if (params.accion !== "leer") return json({ ok: true, listo: true });
		var anio = Number(params.anio);
		var mes = Number(params.mes);
		var pestana = String(params.pestana || "");
		var areaId = String(params.areaId || "");
		validarPeriodo(anio, mes);
		validarPestana(pestana, areaId);
		validarPin(areaId, String(params.pin || ""));
		var ss = SpreadsheetApp.getActive();
		var hoja = ss.getSheetByName(pestana);
		if (!hoja) {
			return json({
				ok: true,
				saldoAntes: null,
				filas: [],
				pinRequerido: pinRequerido(areaId),
			});
		}
		var todas = leerHoja(hoja);
		return json({
			ok: true,
			gid: hoja.getSheetId(),
			saldoAntes: saldoAntesDe(todas, anio, mes),
			filas: elegirFilas(todas, anio, mes),
			pinRequerido: pinRequerido(areaId),
		});
	} catch (error) {
		return json({ ok: false, error: codigoError(error) });
	}
}

function doPost(e) {
	var lock = LockService.getScriptLock();
	if (!lock.tryLock(15000)) return json({ ok: false, error: "ocupada" });
	try {
		if (!e || !e.postData || !e.postData.contents) throw new Error("cuerpo");
		var data = JSON.parse(e.postData.contents);
		var anio = Number(data.anio);
		var mes = Number(data.mes);
		var pestana = String(data.pestana || "");
		var areaId = String(data.areaId || "");
		validarPeriodo(anio, mes);
		validarPestana(pestana, areaId);
		validarPin(areaId, String(data.pin || ""));
		if (data.accion === "generar") return json(generarInforme(pestana, anio, mes));
		var hoja = asegurarHoja(SpreadsheetApp.getActive(), pestana, data.columnas || []);
		if (data.accion === "quitar") {
			borrar(hoja, String(data.id || ""));
			return json({ ok: true, gid: hoja.getSheetId() });
		}
		if (data.accion !== "agregar") throw new Error("accion");
		agregar(hoja, data, anio, mes);
		return json({ ok: true, gid: hoja.getSheetId() });
	} catch (error) {
		return json({ ok: false, error: codigoError(error) });
	} finally {
		lock.releaseLock();
	}
}

function onOpen() {
	SpreadsheetApp.getUi()
		.createMenu("Informes")
		.addItem("Generar documentos del mes", "pedirDocumentos")
		.addToUi();
}

function pedirDocumentos() {
	var ui = SpreadsheetApp.getUi();
	var hoy = new Date();
	var anioResp = ui.prompt("Informe mensual", "Año. Vacío usa " + hoy.getFullYear() + ".", ui.ButtonSet.OK_CANCEL);
	if (anioResp.getSelectedButton() !== ui.Button.OK) return;
	var mesResp = ui.prompt("Informe mensual", "Mes del 1 al 12. Vacío usa el mes actual.", ui.ButtonSet.OK_CANCEL);
	if (mesResp.getSelectedButton() !== ui.Button.OK) return;
	var anio = Number(anioResp.getResponseText()) || hoy.getFullYear();
	var mes = Number(mesResp.getResponseText()) || hoy.getMonth() + 1;
	if (anio < 2000 || mes < 1 || mes > 12) {
		ui.alert("El período no es válido.");
		return;
	}
	var lineas = [];
	Object.keys(PESTANAS).forEach(function (nombre) {
		if (!PESTANAS[nombre].documento) return;
		try {
			var resultado = generarInforme(nombre, anio, mes);
			lineas.push(resultado.ok && resultado.url ? nombre + "\n" + resultado.url : nombre + ": " + (resultado.error || "sin datos"));
		} catch (error) {
			lineas.push(nombre + ": " + error);
		}
	});
	ui.alert(lineas.join("\n\n") || "No hay informes para generar.");
}

function generarInforme(pestana, anio, mes) {
	var info = PESTANAS[pestana];
	if (!info) return { ok: false, error: "pestana" };
	var ss = SpreadsheetApp.getActive();
	if (!info.documento) {
		var hojaSimple = ss.getSheetByName(pestana);
		var gid = hojaSimple ? hojaSimple.getSheetId() : 0;
		return {
			ok: true,
			url: ss.getUrl() + (gid ? "#gid=" + gid : ""),
			aviso: "Este informe es la pestaña de la planilla.",
		};
	}
	var hoja = ss.getSheetByName(pestana);
	if (!hoja) return { ok: false, error: "Todavía no hay cargas." };
	var filas = leerHoja(hoja).filter(function (fila) {
		return fila.anio === anio && fila.mes === mes;
	});
	filas.forEach(function (fila, indice) {
		fila.orden = indice;
	});
	filas.sort(function (a, b) {
		var fa = String(a.valores.Fecha || "");
		var fb = String(b.valores.Fecha || "");
		if (fa < fb) return -1;
		if (fa > fb) return 1;
		return a.orden - b.orden;
	});
	var titulo = pestana + " — " + MESES[mes - 1] + " " + anio;
	var doc = documentoDe(titulo);
	var body = doc.getBody();
	body.clear();
	body.appendParagraph(titulo).setHeading(DocumentApp.ParagraphHeading.HEADING1);
	var headers = leerHeaders(hoja);
	if (info.documento === "alumbrado") escribirAlumbrado(body, filas, headers);
	else if (info.documento === "civiles") escribirCiviles(body, filas);
	else if (info.documento === "deposito") escribirDeposito(body, filas, headers);
	else escribirTabla(body, filas, headers);
	var url = doc.getUrl();
	doc.saveAndClose();
	return { ok: true, url: url };
}

function pinEsperado(areaId) {
	return PropertiesService.getScriptProperties().getProperty("PIN_" + areaId) || "";
}

function pinRequerido(areaId) {
	return pinEsperado(areaId) !== "";
}

function validarPin(areaId, pin) {
	var esperado = pinEsperado(areaId);
	if (!esperado) return;
	if (String(pin || "") !== esperado) throw new Error("pin");
}

function validarPestana(pestana, areaId) {
	var info = PESTANAS[pestana];
	if (!info || info.area !== areaId) throw new Error("pestana");
}

function validarPeriodo(anio, mes) {
	if (anio < 2000 || anio > 2100 || mes < 1 || mes > 12) throw new Error("periodo");
}

function codigoError(error) {
	var texto = String(error && error.message ? error.message : error);
	if (texto === "pin" || texto === "pestana" || texto === "periodo" || texto === "accion") return texto;
	return texto;
}

function asegurarHoja(ss, nombre, columnas) {
	var hoja = ss.getSheetByName(nombre);
	if (!hoja) hoja = ss.insertSheet(nombre);
	var headers = asegurarEncabezados(hoja, columnas);
	ocultarSistema(hoja, headers);
	if (hoja.getFrozenRows() < 1) hoja.setFrozenRows(1);
	return hoja;
}

function asegurarEncabezados(hoja, columnas) {
	var actuales = leerHeaders(hoja);
	var pedidos = columnasLimpios(columnas).concat(SISTEMA);
	if (actuales.length === 0) {
		if (pedidos.length === 0) throw new Error("columnas");
		hoja.getRange(1, 1, 1, pedidos.length).setValues([pedidos]).setFontWeight("bold");
		return pedidos;
	}
	var lista = actuales.slice();
	pedidos.forEach(function (nombre) {
		if (lista.indexOf(nombre) !== -1) return;
		lista.push(nombre);
		hoja.getRange(1, lista.length).setValue(nombre).setFontWeight("bold");
	});
	return lista;
}

function columnasLimpios(columnas) {
	var vistos = {};
	var lista = [];
	(columnas || []).forEach(function (columna) {
		var nombre = String(columna || "").trim();
		if (!nombre || nombre.length > 80 || vistos[nombre] || SISTEMA.indexOf(nombre) !== -1) return;
		vistos[nombre] = true;
		if (lista.length >= 60) return;
		lista.push(nombre);
	});
	return lista;
}

function leerHeaders(hoja) {
	if (hoja.getLastRow() < 1) return [];
	var ancho = Math.max(hoja.getLastColumn(), 1);
	var fila = hoja.getRange(1, 1, 1, ancho).getValues()[0];
	var headers = [];
	for (var i = 0; i < fila.length; i++) {
		if (!fila[i]) break;
		headers.push(String(fila[i]));
	}
	return headers;
}

function ocultarSistema(hoja, headers) {
	["Id", "Cierra"].forEach(function (nombre) {
		var indice = headers.indexOf(nombre);
		if (indice !== -1) hoja.hideColumns(indice + 1);
	});
}

function agregar(hoja, data, anio, mes) {
	var id = String(data.id || "");
	if (!id) throw new Error("id");
	var headers = leerHeaders(hoja);
	var fila = buscarId(hoja, headers, id) || Math.max(hoja.getLastRow(), 1) + 1;
	var mapa = {};
	(data.campos || []).forEach(function (campo) {
		if (!campo || !campo.etiqueta) return;
		mapa[String(campo.etiqueta)] = campo;
	});
	var celdas = [];
	for (var c = 0; c < headers.length; c++) {
		var header = headers[c];
		if (header === "Id") {
			celdas.push(id);
			continue;
		}
		if (header === "Año") {
			celdas.push(String(anio));
			continue;
		}
		if (header === "Mes") {
			celdas.push(MESES[mes - 1]);
			continue;
		}
		if (header === "Cierra") {
			celdas.push(mapa.Cierra ? String(mapa.Cierra.valor || "") : "");
			continue;
		}
		celdas.push(mapa[header] ? valorCelda(mapa[header]) : "");
	}
	hoja.getRange(fila, 1, 1, celdas.length).setValues([celdas]);
	var colAnio = headers.indexOf("Año");
	if (colAnio !== -1) hoja.getRange(fila, colAnio + 1).setNumberFormat("@").setValue(String(anio));
	var colFecha = headers.indexOf("Fecha");
	if (colFecha !== -1 && mapa.Fecha && mapa.Fecha.tipo === "fecha") {
		hoja.getRange(fila, colFecha + 1).setNumberFormat("dd/MM/yyyy");
	}
}

function valorCelda(campo) {
	var tipo = String(campo.tipo || "texto");
	if (tipo === "numero") {
		var n = Number(campo.valor);
		return isFinite(n) ? n : "";
	}
	if (tipo === "fecha") return fechaDeIso(campo.valor);
	var texto = String(campo.valor == null ? "" : campo.valor);
	if (/^[=+\-@]/.test(texto)) return "'" + texto;
	return texto;
}

function fechaDeIso(valor) {
	var partes = String(valor || "").split("-");
	if (partes.length !== 3) return String(valor || "");
	var anio = Number(partes[0]);
	var mes = Number(partes[1]);
	var dia = Number(partes[2]);
	if (!anio || !mes || !dia) return String(valor || "");
	return new Date(anio, mes - 1, dia);
}

function buscarId(hoja, headers, id) {
	var columna = headers.indexOf("Id") + 1;
	var ultima = hoja.getLastRow();
	if (!columna || ultima < 2) return 0;
	var ids = hoja.getRange(2, columna, ultima - 1, 1).getValues();
	for (var i = 0; i < ids.length; i++) {
		if (String(ids[i][0]) === id) return i + 2;
	}
	return 0;
}

function borrar(hoja, id) {
	if (!id) return;
	var fila = buscarId(hoja, leerHeaders(hoja), id);
	if (fila) hoja.deleteRow(fila);
}

function leerHoja(hoja) {
	var headers = leerHeaders(hoja);
	var ultima = hoja.getLastRow();
	var filas = [];
	if (ultima < 2 || headers.length === 0) return filas;
	var valores = hoja.getRange(2, 1, ultima - 1, headers.length).getValues();
	for (var i = 0; i < valores.length; i++) {
		var mapa = {};
		for (var c = 0; c < headers.length; c++) mapa[headers[c]] = valores[i][c];
		var id = String(mapa.Id || "").trim();
		if (!id) continue;
		var limpio = {};
		headers.forEach(function (header) {
			if (header === "Id" || header === "Año" || header === "Mes" || header === "Cierra") return;
			var texto = celdaTexto(header, mapa[header]);
			if (texto) limpio[header] = texto;
		});
		filas.push({
			id: id,
			anio: Number(mapa["Año"]),
			mes: mesNumero(mapa["Mes"]),
			cierra: String(mapa.Cierra || "").trim(),
			valores: limpio,
		});
	}
	return filas;
}

function celdaTexto(header, valor) {
	if (valor === "" || valor === null || valor === undefined) return "";
	if (Object.prototype.toString.call(valor) === "[object Date]" && !isNaN(valor.getTime())) {
		return Utilities.formatDate(valor, zona(), "yyyy-MM-dd");
	}
	if (typeof valor === "number" && isFinite(valor)) return String(valor);
	var texto = String(valor).trim();
	if (header !== "Fecha") return texto;
	var partes = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (!partes) return texto;
	return partes[3] + "-" + pad(partes[2]) + "-" + pad(partes[1]);
}

function pad(valor) {
	return (valor.length < 2 ? "0" : "") + valor;
}

function zona() {
	return SpreadsheetApp.getActive().getSpreadsheetTimeZone() || Session.getScriptTimeZone();
}

function mesNumero(valor) {
	if (typeof valor === "number" && valor >= 1 && valor <= 12) return valor;
	var texto = String(valor || "").trim();
	var indice = MESES.indexOf(texto);
	if (indice !== -1) return indice + 1;
	var n = Number(texto);
	return n >= 1 && n <= 12 ? n : 0;
}

function elegirFilas(filas, anio, mes) {
	var abiertas = {};
	filas.forEach(function (fila) {
		if (String(fila.valores["Estado"] || "") === "En ejecución") abiertas[fila.id] = true;
	});
	var porId = {};
	filas.forEach(function (fila) {
		var delMes = fila.anio === anio && fila.mes === mes;
		var esAbierta = abiertas[fila.id];
		var cierreDeAbierta = fila.cierra && abiertas[fila.cierra];
		if (delMes || esAbierta || cierreDeAbierta) porId[fila.id] = fila;
	});
	return Object.keys(porId).map(function (id) {
		return porId[id];
	});
}

function saldoAntesDe(filas, anio, mes) {
	var limite = new Date(anio, mes - 1, 1).getTime();
	var mejorTiempo = -1;
	var mejor = null;
	filas.forEach(function (fila) {
		var saldo = fila.valores["Saldo litros"];
		if (saldo === undefined || saldo === "") return;
		var tiempo = tiempoFila(fila);
		if (tiempo === null || tiempo >= limite) return;
		if (tiempo < mejorTiempo) return;
		var n = Number(String(saldo).replace(",", "."));
		if (!isFinite(n)) return;
		mejorTiempo = tiempo;
		mejor = n;
	});
	return mejor;
}

function tiempoFila(fila) {
	var partes = String(fila.valores.Fecha || "").split("-");
	if (partes.length === 3) {
		var fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
		if (!isNaN(fecha.getTime())) return fecha.getTime();
	}
	if (fila.anio && fila.mes) return new Date(fila.anio, fila.mes - 1, 1).getTime();
	return null;
}

function documentoDe(titulo) {
	var carpeta = carpetaInformes();
	var archivos = carpeta.getFilesByName(titulo);
	if (archivos.hasNext()) return DocumentApp.openById(archivos.next().getId());
	var doc = DocumentApp.create(titulo);
	DriveApp.getFileById(doc.getId()).moveTo(carpeta);
	return doc;
}

function carpetaInformes() {
	var nombre = "Informes de obras";
	var carpetas = DriveApp.getFoldersByName(nombre);
	if (carpetas.hasNext()) return carpetas.next();
	return DriveApp.createFolder(nombre);
}

function headersVisibles(headers) {
	return headers.filter(function (header) {
		return header !== "Id" && header !== "Cierra" && header !== "Año" && header !== "Mes";
	});
}

function escribirTabla(body, filas, headers) {
	var visibles = headersVisibles(headers);
	if (filas.length === 0) {
		body.appendParagraph("Sin cargas en este mes.");
		return;
	}
	var datos = [visibles];
	filas.forEach(function (fila) {
		datos.push(
			visibles.map(function (header) {
				return textoDoc(header, fila.valores[header]);
			}),
		);
	});
	var tabla = body.appendTable(datos);
	pintarCabecera(tabla);
	escribirTotales(body, filas, visibles);
}

function escribirDeposito(body, filas, headers) {
	escribirTabla(body, filas, headers);
	var saldo = saldoFinalDe(filas);
	if (saldo !== "") body.appendParagraph("Saldo final: " + formatoNumero(saldo) + " L");
}

function saldoFinalDe(filas) {
	if (!filas.length || filas[0].valores["Saldo litros"] === undefined) return "";
	var primero = filas[0];
	var saldo = Number(String(primero.valores["Saldo litros"]).replace(",", "."));
	if (!isFinite(saldo)) return "";
	var inicial =
		saldo - Number(primero.valores["Litros ingresados"] || 0) + Number(primero.valores["Litros del destino"] || 0);
	var neto = inicial;
	filas.forEach(function (fila) {
		neto += Number(fila.valores["Litros ingresados"] || 0);
		neto -= Number(fila.valores["Litros del destino"] || 0);
	});
	return String(Math.round(neto * 1000) / 1000);
}

function escribirAlumbrado(body, filas, headers) {
	if (filas.length === 0) {
		body.appendParagraph("Sin cargas en este mes.");
		return;
	}
	var materiales = headersVisibles(headers).filter(function (header) {
		return header !== "Fecha" && header !== "Lugar" && header !== "Nota";
	});
	var diaActual = "";
	filas.forEach(function (fila) {
		var iso = String(fila.valores.Fecha || "");
		if (iso !== diaActual) {
			diaActual = iso;
			body.appendParagraph(tituloDia(iso)).setHeading(DocumentApp.ParagraphHeading.HEADING2);
		}
		var frase = fraseMateriales(fila.valores, materiales);
		var linea = String(fila.valores.Lugar || "Sin lugar");
		if (frase) linea += " (" + frase + ")";
		if (fila.valores.Nota) linea += ". " + fila.valores.Nota;
		body.appendParagraph(linea);
	});
}

function escribirCiviles(body, filas) {
	if (filas.length === 0) {
		body.appendParagraph("Sin cargas en este mes.");
		return;
	}
	var orden = [];
	var grupos = {};
	filas.forEach(function (fila) {
		var lugar = String(fila.valores.Lugar || "Sin lugar");
		if (!grupos[lugar]) {
			grupos[lugar] = [];
			orden.push(lugar);
		}
		grupos[lugar].push(fila);
	});
	orden.forEach(function (lugar) {
		body.appendParagraph(lugar).setHeading(DocumentApp.ParagraphHeading.HEADING2);
		grupos[lugar].forEach(function (fila) {
			body.appendParagraph(String(fila.valores.Actividad || "")).editAsText().setBold(true);
			if (fila.valores["Descripción"]) body.appendParagraph(String(fila.valores["Descripción"]));
		});
	});
}

function escribirTotales(body, filas, headers) {
	var columnas = headers.filter(esColumnaLitros);
	if (columnas.length === 0) return;
	body.appendParagraph("Totales").setHeading(DocumentApp.ParagraphHeading.HEADING2);
	var hayVehiculo = headers.indexOf("Vehículo") !== -1;
	columnas.forEach(function (columna) {
		if (hayVehiculo && columna === "Cant. de litros") {
			var grupos = {};
			var orden = [];
			filas.forEach(function (fila) {
				var nombre = String(fila.valores["Vehículo"] || "Sin vehículo");
				if (grupos[nombre] === undefined) {
					grupos[nombre] = 0;
					orden.push(nombre);
				}
				grupos[nombre] += Number(fila.valores[columna] || 0);
			});
			orden.forEach(function (nombre) {
				body.appendParagraph(nombre + ": " + formatoNumero(grupos[nombre]) + " L");
			});
		}
		var total = 0;
		filas.forEach(function (fila) {
			total += Number(fila.valores[columna] || 0);
		});
		body.appendParagraph("Total " + columna + ": " + formatoNumero(total) + " L").editAsText().setBold(true);
	});
}

function pintarCabecera(tabla) {
	var cabecera = tabla.getRow(0);
	for (var i = 0; i < cabecera.getNumCells(); i++) cabecera.getCell(i).editAsText().setBold(true);
}

function textoDoc(header, valor) {
	if (valor === undefined || valor === null || valor === "") return "";
	if (header === "Fecha") return fechaDoc(String(valor));
	if (esColumnaLitros(header) || header === "Saldo litros") return formatoNumero(valor);
	return String(valor);
}

function fechaDoc(iso) {
	var partes = iso.split("-");
	if (partes.length !== 3) return iso;
	return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function tituloDia(iso) {
	var partes = iso.split("-");
	if (partes.length !== 3) return iso;
	var fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
	var dia = DIAS[fecha.getDay()] || "";
	return dia + " " + Number(partes[2]) + "/" + Number(partes[1]) + "/" + partes[0];
}

function fraseMateriales(valores, materiales) {
	var partes = [];
	materiales.forEach(function (nombre) {
		var n = Number(valores[nombre] || 0);
		if (!n) return;
		partes.push(formatoNumero(n) + " " + nombre);
	});
	if (!partes.length) return "";
	return "se ocupó " + partes.join(", ");
}

function esColumnaLitros(header) {
	var texto = String(header).toLowerCase();
	return texto.indexOf("litro") !== -1 && texto.indexOf("saldo") === -1;
}

function formatoNumero(valor) {
	var n = Number(String(valor).replace(",", "."));
	if (!isFinite(n)) return String(valor);
	return String(Math.round(n * 1000) / 1000).replace(".", ",");
}

function json(data) {
	return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
