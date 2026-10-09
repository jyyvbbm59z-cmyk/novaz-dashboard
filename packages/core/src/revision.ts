// Revisión contable: consejos priorizados para quien no sabe contabilidad.
import { euros, eurosInput } from './dinero';

export interface Consejo {
	clave: string;
	nivel: 'urgente' | 'aviso' | 'consejo';
	titulo: string;
	texto: string;
	accion?: { texto: string; href: string };
}

export interface DatosRevision {
	tesoreria: number;
	socio: number;
	ivaPagar: number;
	sinCategoria: number;
	posiblesInmovilizado: { id: number; concepto: string; importe: number }[];
	hayAportacionMensual: boolean;
	gastoMedioMensual: number;
	diasCuadre: number | null;
	sugerencia: { mensual: number; mes: string } | null;
	hayMovimientos: boolean;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function revisionContable(d: DatosRevision): Consejo[] {
	const c: Consejo[] = [];
	if (d.tesoreria < 0)
		c.push({
			clave: 'negativo',
			nivel: 'urgente',
			titulo: 'La caja está en negativo',
			texto: `Faltan ${euros(-d.tesoreria)}: en una empresa real el banco no te dejaría pagar. Mete dinero con una aportación.`,
			accion: { texto: 'Aportar', href: `/contabilidad/nuevo?op=aportacion&importe=${eurosInput(-d.tesoreria)}` }
		});
	if (d.sugerencia)
		c.push({
			clave: 'prevision',
			nivel: 'aviso',
			titulo: `Te faltará dinero en ${MESES[Number(d.sugerencia.mes.slice(5, 7)) - 1]}`,
			texto: `Con lo que gastas normalmente, la caja no llega. Una aportación de ${euros(d.sugerencia.mensual, { redondo: true })} al mes lo cubre.`,
			accion: { texto: 'Programar', href: `/contabilidad/nuevo?op=aportacionMensual&importe=${eurosInput(d.sugerencia.mensual)}` }
		});
	if (d.ivaPagar > 0)
		c.push({
			clave: 'iva',
			nivel: 'aviso',
			titulo: 'IVA pendiente de pagar a Hacienda',
			texto: `De los trimestres ya cerrados debes ${euros(d.ivaPagar)}. Es dinero que cobraste a tus clientes y no es tuyo.`,
			accion: { texto: 'Registrar pago', href: '/contabilidad/diario?plantilla=iva' }
		});
	if (d.socio > 0)
		c.push({
			clave: 'socio',
			nivel: 'consejo',
			titulo: `La empresa te debe ${euros(d.socio)}`,
			texto: 'Es lo que pagaste de tu bolsillo. Cuando haya caja, que la empresa te lo devuelva (o déjalo como financiación tuya).',
			accion: { texto: 'Devolvérmelo', href: `/contabilidad/nuevo?op=reembolso&importe=${eurosInput(d.socio)}` }
		});
	if (d.hayMovimientos && (d.diasCuadre == null || d.diasCuadre > 30))
		c.push({
			clave: 'cuadre',
			nivel: 'consejo',
			titulo: d.diasCuadre == null ? 'Nunca has cuadrado con el banco' : `Hace ${d.diasCuadre} días que no cuadras`,
			texto: 'Compara el saldo de la app con el de tu banco: es la forma de saber que no se te ha olvidado apuntar nada.',
			accion: { texto: 'Cuadrar', href: '/contabilidad/tesoreria' }
		});
	if (!d.hayAportacionMensual && d.gastoMedioMensual > 0)
		c.push({
			clave: 'aportacionMensual',
			nivel: 'consejo',
			titulo: 'Programa una aportación mensual',
			texto: `Gastas de media ${euros(d.gastoMedioMensual, { redondo: true })} al mes. Si aportas algo parecido cada mes, la caja nunca se vaciará.`,
			accion: { texto: 'Programar', href: `/contabilidad/nuevo?op=aportacionMensual&importe=${eurosInput(Math.ceil(d.gastoMedioMensual / 1000) * 1000)}` }
		});
	for (const m of d.posiblesInmovilizado.slice(0, 3))
		c.push({
			clave: `inmov${m.id}`,
			nivel: 'consejo',
			titulo: `¿«${m.concepto}» te durará años?`,
			texto: `Costó ${euros(m.importe)}. Si es una máquina o herramienta duradera, márcala como inmovilizado (en Contabilidad avanzada del movimiento) para repartir el gasto en su vida útil.`,
			accion: { texto: 'Revisar', href: '/contabilidad/movimientos' }
		});
	if (d.sinCategoria)
		c.push({
			clave: 'sinCategoria',
			nivel: 'consejo',
			titulo: `${d.sinCategoria} ${d.sinCategoria === 1 ? 'movimiento' : 'movimientos'} sin categoría`,
			texto: 'Van a «Otros servicios» por defecto. Clasificarlos hace que los informes digan la verdad.',
			accion: { texto: 'Clasificar', href: '/contabilidad/movimientos' }
		});
	return c;
}
