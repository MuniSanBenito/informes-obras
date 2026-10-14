// Pegar en Extensiones → Apps Script de la planilla de metas.
// Implementar → Aplicación web → Ejecutar como: yo → Acceso: cualquier persona.
// Copiar la URL /exec en PUBLIC_PLANILLA_SCRIPT.

var PLANILLA = {
	"OC-1": { anios: { 2024: 18, 2025: 34, 2026: 50 }, filas: [6, 33] },
	"OC-2": { anios: { 2024: 18, 2025: 34 }, filas: [6, 40] },
	"OC-3": { anios: { 2024: 20, 2025: 36 }, filas: [7, 21] },
};

function doPost(e) {
	var lock = LockService.getScriptLock();
	if (!lock.tryLock(15000)) return json({ ok: false, error: "ocupada" });
	try {
		var data = JSON.parse(e.postData.contents);
		var anio = Number(data.anio);
		var mes = Number(data.mes);
		if (mes < 1 || mes > 12) throw new Error("Mes inválido");
		var ss = SpreadsheetApp.getActive();
		var escritas = 0;
		(data.filas || []).forEach(function (item) {
			var hoja = PLANILLA[item.hoja];
			var fila = Number(item.fila);
			var valor = Number(item.valor);
			if (!hoja || !hoja.anios[anio]) return;
			if (fila < hoja.filas[0] || fila > hoja.filas[1]) return;
			if (!isFinite(valor) || valor < 0) return;
			var columna = hoja.anios[anio] + mes - 1;
			ss.getSheetByName(item.hoja).getRange(fila, columna).setValue(valor);
			escritas++;
		});
		return json({ ok: true, escritas: escritas });
	} catch (error) {
		return json({ ok: false, error: String(error) });
	} finally {
		lock.releaseLock();
	}
}

function json(data) {
	return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
		ContentService.MimeType.JSON,
	);
}
