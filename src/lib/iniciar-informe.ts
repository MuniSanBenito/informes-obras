import { itemDe, nombresDe } from "../data/catalogos";
import type { Campo, DatosInforme } from "../data/informes";
import {
	guardarClave,
	guardarSaldoInicial,
	leerClave,
	leerExtras,
	olvidarClave,
	recordarExtra,
} from "./dispositivo";
import { filasPendientes, guardarFilas, leerFilas, leerPeriodosDe, ordenarFilas, type Fila } from "./filas";
import { clavePeriodo, fechaPorDefecto, nombrePeriodo, leerPeriodo, periodoActual, periodoDeFecha, rangoAnios } from "./periodo";
import { generarInformeMes, PLANILLA_SCRIPT, urlPestana } from "./planilla";
import { recalcularSaldos, redondear, resolverBase, saldoAlCierre } from "./saldo";
import { sincronizarInforme } from "./sincronizar";
import { deltaSaldo, leerCantidades, leerMarcas, numero, presentarCantidades, textoNumero } from "./valores";

const numeroTexto = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
const fechaTexto = new Intl.DateTimeFormat("es-AR");

export function iniciarInforme(section: HTMLElement, datos: DatosInforme) {
	const form = section.querySelector(".carga-form");
	const aviso = section.querySelector(".aviso");
	const vacio = section.querySelector(".vacio");
	const lista = section.querySelector(".filas");
	if (
		!(form instanceof HTMLFormElement) ||
		!(aviso instanceof HTMLElement) ||
		!(vacio instanceof HTMLElement) ||
		!(lista instanceof HTMLElement)
	) {
		throw new Error("Falta el formulario del informe");
	}
	montar(section, datos, form, aviso, vacio, lista);
}

function montar(
	section: HTMLElement,
	datos: DatosInforme,
	form: HTMLFormElement,
	aviso: HTMLElement,
	vacio: HTMLElement,
	lista: HTMLElement,
) {
	const tieneFecha = datos.campos.some((campo) => campo.id === "fecha");
	let periodo = tieneFecha ? periodoActual() : leerPeriodo();
	let filas = leerFilas(periodo, datos.informe);
	let saldoAntesRemoto: number | null = null;
	let rellenando = false;
	let avisarLocal = false;
	let ultimoEnvio = 0;
	let cola: Promise<void> = Promise.resolve();

	function mostrar(texto: string) {
		aviso.hidden = !texto;
		aviso.textContent = texto;
	}

	function mostrarClave(visible: boolean) {
		const clave = section.querySelector(".clave");
		if (clave instanceof HTMLElement) clave.hidden = !visible;
	}

	function baseActual(): number {
		return resolverBase(periodo, datos.informe, saldoAntesRemoto, true) ?? 0;
	}

	function modoActual(): string {
		const elegido = form.querySelector('input[name="__modo"]:checked');
		if (elegido instanceof HTMLInputElement) return elegido.value;
		return datos.modos[0]?.id ?? "";
	}

	function campoVisible(campo: Campo): boolean {
		if (!campo.modos || campo.modos.length === 0) return true;
		return campo.modos.includes(modoActual());
	}

	function otroDe(id: string): HTMLInputElement | null {
		const nodo = section.querySelector(`[data-otro="${id}"]`);
		return nodo instanceof HTMLInputElement ? nodo : null;
	}

	function toggleOtro(select: HTMLSelectElement) {
		const otro = otroDe(select.name);
		if (!otro) return;
		const caja = select.closest(".campo");
		const oculto = caja instanceof HTMLElement && Boolean(caja.hidden);
		const activo = select.value === "__otro__";
		const campo = datos.campos.find((item) => item.id === select.name);
		otro.hidden = !activo;
		otro.disabled = !activo || oculto;
		otro.required = activo && !oculto && campo?.requerido === true;
	}

	function asignar(campo: Campo, valor: string) {
		const control = form.elements.namedItem(campo.id);
		if (control instanceof HTMLSelectElement) {
			const existe = [...control.options].some((opcion) => opcion.value === valor);
			if (valor && !existe) {
				control.value = "__otro__";
				const otro = otroDe(campo.id);
				if (otro) otro.value = valor;
			} else {
				control.value = valor;
			}
			toggleOtro(control);
			return;
		}
		if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
			control.value = valor;
		}
	}

	function aplicarFechas() {
		const rango = rangoAnios();
		for (const campo of datos.campos) {
			if (campo.tipo !== "fecha") continue;
			const input = form.elements.namedItem(campo.id);
			if (!(input instanceof HTMLInputElement)) continue;
			input.min = rango.min;
			input.max = rango.max;
		}
	}

	function adoptarMes(iso: string, sincronizar: boolean) {
		const destino = periodoDeFecha(iso);
		if (!destino || (destino.anio === periodo.anio && destino.mes === periodo.mes)) return;
		periodo = destino;
		filas = leerFilas(periodo, datos.informe);
		saldoAntesRemoto = null;
		if (!sincronizar) return;
		mostrar("");
		render();
		encolarSync();
	}

	function aplicarDefectos() {
		for (const campo of datos.campos) {
			if (!campo.porDefecto || !campoVisible(campo)) continue;
			const control = form.elements.namedItem(campo.id);
			const actual =
				control instanceof HTMLInputElement ||
				control instanceof HTMLTextAreaElement ||
				control instanceof HTMLSelectElement
					? control.value.trim()
					: "";
			if (actual) continue;
			asignar(campo, campo.porDefecto === "hoy" ? fechaPorDefecto(periodo) : campo.porDefecto);
		}
	}

	function aplicarModo(modo: string, conDefecto: boolean) {
		const radio = form.querySelector(`input[name="__modo"][value="${CSS.escape(modo)}"]`);
		if (radio instanceof HTMLInputElement) radio.checked = true;
		for (const campo of datos.campos) {
			const caja = section.querySelector(`[data-campo="${campo.id}"]`);
			if (!(caja instanceof HTMLElement)) continue;
			const visible = !campo.modos || campo.modos.length === 0 || campo.modos.includes(modo);
			caja.hidden = !visible;
			caja.querySelectorAll("input, select, textarea").forEach((control) => {
				if (
					!(
						control instanceof HTMLInputElement ||
						control instanceof HTMLSelectElement ||
						control instanceof HTMLTextAreaElement
					)
				) {
					return;
				}
				if (control.classList.contains("filtro")) {
					control.disabled = !visible;
					return;
				}
				if (control instanceof HTMLInputElement && control.dataset.otro !== undefined) return;
				control.disabled = !visible;
				if (control instanceof HTMLInputElement && control.type === "checkbox") return;
				const soloLectura = control instanceof HTMLSelectElement ? false : control.readOnly;
				control.required = visible && caja.dataset.requerido === "si" && !soloLectura;
			});
		}
		if (conDefecto && modo === "ingreso") {
			const acumulado = datos.campos.find((campo) => campo.id === "acumulado");
			if (acumulado) asignar(acumulado, "No");
		}
		if (conDefecto && modo === "salida") {
			const destino = form.elements.namedItem("destino");
			if (destino instanceof HTMLSelectElement && destino.value) completar(destino);
		}
		if (conDefecto) aplicarDefectos();
		form.querySelectorAll("select").forEach((select) => {
			if (select instanceof HTMLSelectElement) toggleOtro(select);
		});
	}

	function valorSeleccionado(select: HTMLSelectElement): string {
		if (select.value !== "__otro__") return select.value;
		return otroDe(select.name)?.value.trim() ?? "";
	}

	function completar(select: HTMLSelectElement) {
		if (!select.dataset.completa || !select.dataset.catalogo) return;
		const mapa = JSON.parse(select.dataset.completa) as Record<string, string>;
		const item = itemDe(select.dataset.catalogo, valorSeleccionado(select));
		for (const [campoId, propiedad] of Object.entries(mapa)) {
			const campo = datos.campos.find((itemCampo) => itemCampo.id === campoId);
			if (!campo) continue;
			asignar(campo, item?.[propiedad] ?? "");
		}
	}

	function sugerir(select: HTMLSelectElement) {
		if (!select.dataset.sugiere || !select.dataset.catalogo) return;
		const sugiere = JSON.parse(select.dataset.sugiere) as { campo: string; propiedad: string };
		const item = itemDe(select.dataset.catalogo, valorSeleccionado(select));
		const nombres = (item?.[sugiere.propiedad] ?? "")
			.split("|")
			.map((parte) => parte.trim())
			.filter(Boolean);
		const caja = section.querySelector(`[data-campo="${sugiere.campo}"]`);
		caja?.querySelectorAll('input[type="checkbox"]').forEach((input) => {
			if (input instanceof HTMLInputElement) input.checked = nombres.includes(input.value);
		});
	}

	function leerValores(): Record<string, string> {
		const data = new FormData(form);
		const valores: Record<string, string> = {};
		for (const campo of datos.campos) {
			if (!campoVisible(campo) || campo.tipo === "calculado") continue;
			if (campo.tipo === "marcas" || campo.tipo === "multiple") {
				const marcados = data
					.getAll(campo.id)
					.map(String)
					.filter((valor) => valor && valor !== "on");
				if (marcados.length > 0) valores[campo.id] = marcados.join(", ");
				continue;
			}
			if (campo.tipo === "cantidades") {
				const mapa: Record<string, number> = {};
				section.querySelectorAll(`[data-campo="${campo.id}"] input[data-opcion]`).forEach((input) => {
					if (!(input instanceof HTMLInputElement) || !input.dataset.opcion) return;
					const cantidad = numero(input.value);
					if (cantidad > 0) mapa[input.dataset.opcion] = cantidad;
				});
				const texto = Object.entries(mapa)
					.map(([nombre, cantidad]) => `${nombre}: ${textoNumero(cantidad)}`)
					.join("; ");
				if (texto) valores[campo.id] = texto;
				continue;
			}
			let valor = String(data.get(campo.id) ?? "").trim();
			if (campo.tipo === "seleccion" && valor === "__otro__") {
				valor = String(data.get(`${campo.id}__otro`) ?? "").trim();
			}
			if (valor) valores[campo.id] = valor;
		}
		return valores;
	}

	function llenar(valores: Record<string, string>, reemplazar: boolean) {
		rellenando = true;
		try {
			const modo = modoDe(valores);
			if (reemplazar && modo) aplicarModo(modo, false);
			for (const campo of datos.campos) {
				if (!reemplazar && valores[campo.id] === undefined) continue;
				const valor = valores[campo.id] ?? "";
				if (campo.tipo === "marcas" || campo.tipo === "multiple") {
					const marcados = new Set(leerMarcas(valor));
					section.querySelectorAll(`[data-campo="${campo.id}"] input[type="checkbox"]`).forEach((input) => {
						if (input instanceof HTMLInputElement) input.checked = marcados.has(input.value);
					});
					continue;
				}
				if (campo.tipo === "cantidades") {
					const mapa = leerCantidades(valor);
					section.querySelectorAll(`[data-campo="${campo.id}"] input[data-opcion]`).forEach((input) => {
						if (!(input instanceof HTMLInputElement) || !input.dataset.opcion) return;
						input.value = textoNumero(mapa[input.dataset.opcion] ?? 0);
						marcarCantidad(input);
					});
					continue;
				}
				asignar(campo, valor);
			}
		} finally {
			rellenando = false;
		}
	}

	function modoDe(valores: Record<string, string>): string {
		for (const modo of datos.modos) {
			const coincide = datos.campos.some((campo) => campo.modos?.includes(modo.id) && valores[campo.id]);
			if (coincide) return modo.id;
		}
		return datos.modos[0]?.id ?? "";
	}

	function marcarCantidad(input: HTMLInputElement) {
		const caja = input.closest(".cantidad");
		if (caja instanceof HTMLElement) caja.classList.toggle("con-valor", numero(input.value) > 0);
	}

	function actualizarSaldoPreview() {
		if (!datos.saldo) return;
		const input = form.querySelector("[data-calculado]");
		if (!(input instanceof HTMLInputElement)) return;
		const saldo = datos.saldo;
		const ficticia: Fila = {
			id: "borrador",
			valores: leerValores(),
			estado: "pendiente",
			visto: false,
		};
		const orden = ordenarFilas([...filas.filter((fila) => fila.estado !== "quitando"), ficticia]);
		let actual = baseActual();
		let delBorrador = actual;
		for (const fila of orden) {
			actual = redondear(actual + deltaSaldo(fila.valores, saldo));
			if (fila.id === "borrador") delBorrador = actual;
		}
		input.value = textoNumero(delBorrador);
	}

	function presentar(campo: Campo, valor: string): string {
		if (campo.tipo === "fecha") {
			const [anio, mes, dia] = valor.split("-").map(Number);
			if (!anio || !mes || !dia) return valor;
			return fechaTexto.format(new Date(anio, mes - 1, dia));
		}
		if (campo.tipo === "numero" || campo.tipo === "calculado") return numeroTexto.format(numero(valor));
		if (campo.tipo === "cantidades") return presentarCantidades(valor);
		return valor;
	}

	function actualizarSugerencias() {
		for (const campo of datos.campos) {
			if (campo.tipo !== "texto") continue;
			const listaDatos = section.querySelector(`#lista-${campo.id}`);
			if (!(listaDatos instanceof HTMLDataListElement)) continue;
			const valores = new Set<string>();
			if (campo.sugerencias) {
				for (const nombre of nombresDe(campo.sugerencias)) valores.add(nombre);
				for (const extra of leerExtras(campo.sugerencias)) valores.add(extra);
			}
			if (campo.recordar) {
				for (const fila of filas) {
					if (fila.estado === "quitando") continue;
					const valor = fila.valores[campo.id];
					if (valor) valores.add(valor);
				}
			}
			listaDatos.replaceChildren();
			for (const valor of valores) {
				const opcion = document.createElement("option");
				opcion.value = valor;
				listaDatos.append(opcion);
			}
		}
	}

	function agregarExtras() {
		for (const campo of datos.campos) {
			if (campo.tipo !== "seleccion" || !campo.catalogo) continue;
			const select = form.elements.namedItem(campo.id);
			if (!(select instanceof HTMLSelectElement)) continue;
			const otro = [...select.options].find((opcion) => opcion.value === "__otro__");
			for (const extra of leerExtras(campo.catalogo)) {
				if ([...select.options].some((opcion) => opcion.value === extra)) continue;
				const opcion = document.createElement("option");
				opcion.value = extra;
				opcion.textContent = extra;
				if (otro) select.insertBefore(opcion, otro);
				else select.append(opcion);
			}
		}
	}

	function gruposActuales(): Fila[][] {
		const clave = clavePeriodo(periodo);
		let incluido = false;
		const grupos = leerPeriodosDe(datos.informe).map((grupo) => {
			if (clavePeriodo(grupo.periodo) !== clave) return grupo.filas;
			incluido = true;
			return filas;
		});
		if (!incluido) grupos.push(filas);
		return grupos;
	}

	function render() {
		const visibles = ordenarFilas(filas.filter((fila) => fila.estado !== "quitando"));
		lista.replaceChildren();
		vacio.hidden = visibles.length > 0;
		vacio.textContent = `Todavía no hay cargas de ${nombrePeriodo(periodo)}.`;
		for (const fila of visibles) {
			lista.append(crearFila(fila));
		}
		renderPendientes();
		renderResumen(visibles);
		actualizarSugerencias();
		actualizarSaldoPreview();
		refrescarSaldoInicial();
	}

	function crearFila(fila: Fila): HTMLLIElement {
		const item = document.createElement("li");
		item.className = "fila";
		const detalle = document.createElement("dl");
		for (const campo of datos.campos) {
			const valor = fila.valores[campo.id];
			if (!valor) continue;
			const grupo = document.createElement("div");
			const titulo = document.createElement("dt");
			titulo.textContent = campo.etiqueta;
			const dato = document.createElement("dd");
			dato.textContent = presentar(campo, valor);
			grupo.append(titulo, dato);
			detalle.append(grupo);
		}
		const estado = document.createElement("p");
		if (PLANILLA_SCRIPT) {
			estado.className = `estado ${fila.estado}`;
			estado.textContent = fila.estado === "pendiente" ? "Pendiente" : "En la planilla";
		}
		const acciones = document.createElement("div");
		acciones.className = "acciones";
		const repetir = document.createElement("button");
		repetir.type = "button";
		repetir.className = "repetir";
		repetir.textContent = "Repetir";
		repetir.addEventListener("click", () => repetirFila(fila));
		const quitar = document.createElement("button");
		quitar.type = "button";
		quitar.className = "quitar";
		quitar.textContent = "Quitar";
		quitar.addEventListener("click", () => quitarFila(fila));
		acciones.append(repetir, quitar);
		item.append(detalle);
		if (PLANILLA_SCRIPT) item.append(estado);
		item.append(acciones);
		return item;
	}

	function renderPendientes() {
		const pendientes = section.querySelector(".pendientes");
		const titulo = section.querySelector(".pendientes-titulo");
		if (!(pendientes instanceof HTMLElement) || !(titulo instanceof HTMLElement) || !datos.cierre) return;
		const abiertas = filasPendientes(gruposActuales(), datos.cierre);
		titulo.hidden = abiertas.length === 0;
		pendientes.hidden = abiertas.length === 0;
		pendientes.replaceChildren();
		for (const fila of abiertas) {
			const item = document.createElement("li");
			item.className = "fila";
			const texto = document.createElement("p");
			texto.textContent = resumenPendiente(fila);
			const cerrar = document.createElement("button");
			cerrar.type = "button";
			cerrar.className = "repetir";
			cerrar.textContent = "Marcar ejecutado";
			cerrar.addEventListener("click", () => marcarEjecutado(fila));
			item.append(texto, cerrar);
			pendientes.append(item);
		}
	}

	function resumenPendiente(fila: Fila): string {
		const partes: string[] = [];
		const fecha = datos.campos.find((campo) => campo.id === "fecha");
		if (fecha && fila.valores.fecha) partes.push(presentar(fecha, fila.valores.fecha));
		for (const campo of datos.campos) {
			if (campo.tipo === "fecha" || campo.id === datos.cierre?.estado) continue;
			const valor = fila.valores[campo.id];
			if (!valor) continue;
			partes.push(presentar(campo, valor));
			if (partes.length >= 4) break;
		}
		return partes.join(" · ");
	}

	function renderResumen(visibles: Fila[]) {
		const nodo = section.querySelector(".resumen-mes");
		if (!(nodo instanceof HTMLElement)) return;
		if (!datos.litros) {
			nodo.hidden = true;
			return;
		}
		const total = visibles.reduce((suma, fila) => suma + numero(fila.valores[datos.litros]), 0);
		nodo.hidden = false;
		nodo.textContent = `Litros del mes: ${numeroTexto.format(total)}`;
	}

	function refrescarSaldoInicial() {
		if (!datos.saldo) return;
		const input = section.querySelector(".saldo-inicial input");
		if (!(input instanceof HTMLInputElement) || document.activeElement === input) return;
		input.value = textoNumero(baseActual());
	}

	function enfocar() {
		const candidato = [...form.querySelectorAll("input, select, textarea")].find((control) => {
			if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) {
				return false;
			}
			const soloLectura = control instanceof HTMLSelectElement ? false : control.readOnly;
			if (control.disabled || soloLectura || control.hidden || control.classList.contains("filtro")) return false;
			if (control.closest("[hidden]")) return false;
			const campo = datos.campos.find((item) => item.id === control.name);
			return !campo?.conservar && campo?.tipo !== "fecha";
		});
		if (candidato instanceof HTMLElement) candidato.focus();
	}

	function limpiarFormulario(conservados: Record<string, string>) {
		form.reset();
		section.querySelectorAll(".cantidad").forEach((caja) => caja.classList.remove("con-valor"));
		const modo = datos.modos[0]?.id ?? "";
		if (modo) aplicarModo(modo, true);
		else aplicarDefectos();
		if (Object.keys(conservados).length > 0) llenar(conservados, false);
		aplicarFechas();
		const fecha = form.elements.namedItem("fecha");
		if (fecha instanceof HTMLInputElement && !fecha.value) aplicarDefectos();
		actualizarSaldoPreview();
		enfocar();
	}

	function conservarDe(valores: Record<string, string>): Record<string, string> {
		const guardados: Record<string, string> = {};
		for (const campo of datos.campos) {
			if (campo.conservar && valores[campo.id]) guardados[campo.id] = valores[campo.id];
		}
		return guardados;
	}

	function recordarOtros(valores: Record<string, string>) {
		for (const campo of datos.campos) {
			if (campo.tipo !== "seleccion" || !campo.catalogo) continue;
			const valor = valores[campo.id];
			if (!valor || nombresDe(campo.catalogo).includes(valor)) continue;
			recordarExtra(campo.catalogo, valor);
		}
		agregarExtras();
	}

	function guardarActual() {
		if (datos.saldo) filas = recalcularSaldos(filas, datos.saldo, baseActual());
		filas = ordenarFilas(filas);
		guardarFilas(periodo, datos.informe, filas);
	}

	function agregarFila(valores: Record<string, string>) {
		if (datos.saldo) {
			const cierre = saldoAlCierre(filas, datos.saldo, baseActual());
			valores.saldo = textoNumero(redondear(cierre + deltaSaldo(valores, datos.saldo)));
		}
		filas = [...filas, { id: crypto.randomUUID(), valores, estado: "pendiente", visto: false }];
		guardarActual();
		render();
		encolarSync();
	}

	function repetirFila(fila: Fila) {
		limpiarFormulario({});
		llenar(fila.valores, true);
		actualizarSaldoPreview();
		form.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function quitarFila(fila: Fila) {
		filas = filas.map((item) => (item.id === fila.id ? { ...item, estado: "quitando" } : item));
		guardarActual();
		if (!PLANILLA_SCRIPT) avisarLocal = true;
		render();
		encolarSync();
	}

	function marcarEjecutado(fila: Fila) {
		if (!datos.cierre) return;
		const valores = { ...fila.valores };
		delete valores.cierra;
		valores[datos.cierre.estado] = datos.cierre.cerrado;
		valores.cierra = fila.id;
		if (datos.campos.some((campo) => campo.id === "fecha")) valores.fecha = fechaPorDefecto(periodo);
		agregarFila(valores);
	}

	function validar(valores: Record<string, string>): string {
		if (tieneFecha && valores.fecha && !periodoDeFecha(valores.fecha)) return "La fecha está fuera de 2024 a 2026.";
		if (datos.alguno.length > 0 && !datos.alguno.some((id) => valores[id])) return datos.algunoMensaje;
		for (const campo of datos.campos) {
			if (!campo.requerido || !campoVisible(campo)) continue;
			if ((campo.tipo === "multiple" || campo.tipo === "marcas") && !valores[campo.id]) {
				return `Elegí ${campo.etiqueta.toLowerCase()}.`;
			}
			if (campo.tipo === "numero" && numero(valores[campo.id]) <= 0) {
				return `Indicá ${campo.etiqueta.toLowerCase()}.`;
			}
		}
		return "";
	}

	function encolarSync() {
		cola = cola.then(
			() => sincronizarAhora(),
			() => sincronizarAhora(),
		);
	}

	async function sincronizarAhora() {
		const mes = periodo;
		const habiaPendientes = leerFilas(mes, datos.informe).some(
			(fila) => fila.estado === "pendiente" || fila.estado === "quitando",
		);
		if (PLANILLA_SCRIPT && habiaPendientes) mostrar("Guardando en la planilla…");
		const resultado = await sincronizarInforme(datos, mes, leerClave(datos.areaId));
		if (mes.anio !== periodo.anio || mes.mes !== periodo.mes) return;
		filas = resultado.filas;
		if (resultado.saldoAntes !== null) saldoAntesRemoto = resultado.saldoAntes;
		if (resultado.gid !== undefined) {
			const link = section.querySelector(".planilla");
			if (link instanceof HTMLAnchorElement) link.href = urlPestana(resultado.gid);
		}
		if (resultado.pinInvalida) {
			olvidarClave(datos.areaId);
			mostrarClave(true);
			mostrar("La clave del área no es válida.");
		} else if (resultado.sinScript && avisarLocal) {
			mostrar("Quedó en este dispositivo. Falta conectar la planilla.");
			avisarLocal = false;
		} else if (resultado.error) {
			mostrar("No se pudo guardar en la planilla. Quedó en este dispositivo.");
		} else if (resultado.enviados > 0 && resultado.quitados > 0) {
			mostrar("Planilla actualizada.");
		} else if (resultado.enviados > 0) {
			mostrar(`Guardada en la pestaña ${datos.pestana}.`);
		} else if (resultado.quitados > 0) {
			mostrar(`Se quitó de la pestaña ${datos.pestana}.`);
		}
		render();
	}

	function aplicarAtajo(boton: HTMLButtonElement) {
		const id = boton.dataset.para ?? "";
		const control = form.elements.namedItem(id);
		if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
		const texto = boton.textContent?.trim() ?? "";
		if (!texto) return;
		if (boton.dataset.modo === "agregar") {
			const partes = control.value
				.split(",")
				.map((parte) => parte.trim())
				.filter(Boolean);
			if (!partes.includes(texto)) partes.push(texto);
			control.value = partes.join(", ");
		} else {
			control.value = texto;
		}
		control.focus();
	}

	agregarExtras();
	aplicarFechas();
	const modoInicial = datos.modos[0]?.id ?? "";
	if (modoInicial) aplicarModo(modoInicial, true);
	else aplicarDefectos();
	aplicarFechas();
	render();
	encolarSync();

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		if (Date.now() - ultimoEnvio < 400) return;
		if (!form.reportValidity()) return;
		const valores = leerValores();
		const error = validar(valores);
		if (error) {
			mostrar(error);
			return;
		}
		ultimoEnvio = Date.now();
		mostrar("");
		recordarOtros(valores);
		const conservados = conservarDe(valores);
		if (!PLANILLA_SCRIPT) avisarLocal = true;
		if (valores.fecha) adoptarMes(valores.fecha, false);
		agregarFila(valores);
		limpiarFormulario(conservados);
	});

	form.addEventListener("change", (event) => {
		if (rellenando) return;
		const target = event.target;
		if (target instanceof HTMLInputElement && target.name === "__modo") {
			aplicarModo(target.value, true);
			actualizarSaldoPreview();
			return;
		}
		if (target instanceof HTMLInputElement && target.name === "fecha") {
			adoptarMes(target.value, true);
			actualizarSaldoPreview();
			return;
		}
		if (target instanceof HTMLSelectElement && target.name !== "__modo") {
			toggleOtro(target);
			completar(target);
			sugerir(target);
		}
		actualizarSaldoPreview();
	});

	form.addEventListener("input", (event) => {
		const target = event.target;
		if (target instanceof HTMLInputElement && target.dataset.opcion) marcarCantidad(target);
		if (target instanceof HTMLInputElement && target.classList.contains("filtro")) {
			const consulta = target.value.trim().toLowerCase();
			target.closest("fieldset")?.querySelectorAll(".marca").forEach((marca) => {
				if (!(marca instanceof HTMLElement)) return;
				const texto = marca.dataset.texto ?? "";
				marca.hidden = consulta.length > 0 && !texto.includes(consulta);
			});
		}
		actualizarSaldoPreview();
	});

	form.addEventListener("keydown", (event) => {
		if (event.key !== "Enter") return;
		if (event.target instanceof HTMLInputElement && event.target.classList.contains("filtro")) {
			event.preventDefault();
		}
	});

	section.querySelectorAll(".atajo").forEach((boton) => {
		boton.addEventListener("click", () => {
			if (boton instanceof HTMLButtonElement) aplicarAtajo(boton);
		});
	});

	section.querySelectorAll("[data-delta]").forEach((boton) => {
		boton.addEventListener("click", () => {
			if (!(boton instanceof HTMLButtonElement)) return;
			const input = boton.closest(".cantidad")?.querySelector("input");
			if (!(input instanceof HTMLInputElement)) return;
			const siguiente = Math.max(0, numero(input.value) + Number(boton.dataset.delta ?? 0));
			input.value = textoNumero(siguiente);
			marcarCantidad(input);
		});
	});

	const clave = section.querySelector(".clave");
	if (clave instanceof HTMLFormElement) {
		clave.addEventListener("submit", (event) => {
			event.preventDefault();
			const input = clave.elements.namedItem("pin");
			if (!(input instanceof HTMLInputElement)) return;
			const pin = input.value.trim();
			if (pin.length < 4) {
				mostrar("La clave tiene al menos 4 caracteres.");
				return;
			}
			guardarClave(datos.areaId, pin);
			input.value = "";
			mostrarClave(false);
			mostrar("");
			encolarSync();
		});
	}

	const saldoInicial = section.querySelector(".saldo-inicial input");
	if (saldoInicial instanceof HTMLInputElement && datos.saldo) {
		saldoInicial.addEventListener("change", () => {
			const saldo = datos.saldo;
			if (!saldo) return;
			const valor = numero(saldoInicial.value);
			guardarSaldoInicial(periodo, datos.informe, valor);
			filas = recalcularSaldos(filas, saldo, valor);
			guardarFilas(periodo, datos.informe, filas);
			render();
			encolarSync();
		});
	}

	const generar = section.querySelector(".generar");
	if (generar instanceof HTMLButtonElement) {
		generar.addEventListener("click", () => {
			void pedirInforme(generar);
		});
	}

	async function pedirInforme(boton: HTMLButtonElement) {
		boton.disabled = true;
		const texto = boton.textContent;
		boton.textContent = "Generando…";
		const resultado = await generarInformeMes({
			anio: periodo.anio,
			mes: periodo.mes,
			areaId: datos.areaId,
			area: datos.area,
			informe: datos.titulo,
			pestana: datos.pestana,
			pin: leerClave(datos.areaId),
		});
		boton.disabled = false;
		boton.textContent = texto;
		if (!resultado.ok) {
			if (resultado.error === "pin") {
				olvidarClave(datos.areaId);
				mostrarClave(true);
				mostrar("La clave del área no es válida.");
			} else if (resultado.error === "sin-script") {
				mostrar("Falta conectar la planilla.");
			} else {
				mostrar("No se pudo generar el informe.");
			}
			return;
		}
		if (resultado.aviso) mostrar(resultado.aviso);
		if (!resultado.url) return;
		const abierta = window.open(resultado.url, "_blank", "noopener,noreferrer");
		if (!abierta) mostrar(resultado.url);
	}

	window.addEventListener("informe-periodo", () => {
		if (tieneFecha) return;
		periodo = leerPeriodo();
		filas = leerFilas(periodo, datos.informe);
		saldoAntesRemoto = null;
		mostrar("");
		render();
		encolarSync();
	});

	window.addEventListener("online", () => encolarSync());
}
