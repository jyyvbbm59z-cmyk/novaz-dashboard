// Catálogo del asistente "¿Qué ha llegado?": cada operación sabe cómo se contabiliza
// para que no haga falta saber contabilidad. Cuenta, IVA y forma de pago son sugerencias editables.
import { CUENTA_APORTACION, desglosarIva } from './contabilidad';
import { euros } from './dinero';
import type { FormaPago, TipoMovimiento } from './schema';

export interface Operacion {
	id: string;
	grupo: string;
	titulo: string;
	icono: string;
	tipo: TipoMovimiento;
	cuenta: string;
	ivaPct: number;
	/** Nombre de la categoría donde se agrupa (si existe). */
	categoria?: string;
	/** Explicación en lenguaje llano. */
	ayuda: string;
	pago?: FormaPago;
	/** Sugerir "se repite cada mes". */
	mensual?: boolean;
	/** Pedir vehículo. */
	vehiculo?: boolean;
	inmovilizado?: { cuenta: string; anios: number };
	ejemplo?: string;
}

export const GRUPOS_OPERACION = [
	{ id: 'facturas', titulo: 'Facturas del taller', descripcion: 'Luz, agua, internet, alquiler…' },
	{ id: 'impuestos', titulo: 'Impuestos y tasas', descripcion: 'IBI, basuras, circulación…' },
	{ id: 'taller', titulo: 'Compras del taller', descripcion: 'Recambios, herramienta, combustible…' },
	{ id: 'ingresos', titulo: 'Entra dinero', descripcion: 'Clientes, YouTube, ventas…' },
	{ id: 'socio', titulo: 'Tú y la empresa', descripcion: 'Aportaciones, reembolsos, préstamos' }
] as const;

export const OPERACIONES: Operacion[] = [
	// ─── Facturas
	{ id: 'luz', grupo: 'facturas', titulo: 'Luz', icono: 'zap', tipo: 'gasto', cuenta: '628', ivaPct: 21, categoria: 'Suministros', mensual: true, ejemplo: 'Iberdrola, Endesa…', ayuda: 'Es un gasto de suministros (cuenta 628). El IVA de la factura no es un gasto: lo recuperas en la liquidación trimestral.' },
	{ id: 'agua', grupo: 'facturas', titulo: 'Agua', icono: 'droplets', tipo: 'gasto', cuenta: '628', ivaPct: 10, categoria: 'Suministros', ejemplo: 'Aguas municipales', ayuda: 'Gasto de suministros (628). El agua lleva IVA reducido del 10 %. Si la factura incluye la tasa de alcantarillado o basuras, esa parte va sin IVA.' },
	{ id: 'gas', grupo: 'facturas', titulo: 'Gas', icono: 'flame', tipo: 'gasto', cuenta: '628', ivaPct: 21, categoria: 'Suministros', ayuda: 'Gasto de suministros (628) con IVA del 21 % recuperable.' },
	{ id: 'internet', grupo: 'facturas', titulo: 'Teléfono e internet', icono: 'wifi', tipo: 'gasto', cuenta: '629', ivaPct: 21, categoria: 'Teléfono', mensual: true, ayuda: 'Otros servicios (629). Si la línea es también personal, en una empresa real solo se deduciría la parte del negocio.' },
	{ id: 'alquiler', grupo: 'facturas', titulo: 'Alquiler del local', icono: 'house', tipo: 'gasto', cuenta: '621', ivaPct: 21, categoria: 'Alquiler', mensual: true, ayuda: 'Arrendamientos (621). En la vida real el inquilino retiene un 19 % de IRPF al casero; aquí lo simplificamos y apuntamos el total pagado.' },
	{ id: 'gestoria', grupo: 'facturas', titulo: 'Gestoría o profesional', icono: 'briefcase', tipo: 'gasto', cuenta: '623', ivaPct: 21, categoria: 'Gestoría', ayuda: 'Servicios de profesionales independientes (623): gestor, abogado, diseñador…' },
	{ id: 'publicidad', grupo: 'facturas', titulo: 'Publicidad', icono: 'megaphone', tipo: 'gasto', cuenta: '627', ivaPct: 21, categoria: 'Publicidad', ayuda: 'Publicidad y propaganda (627): anuncios, vinilos, merchandising, promoción del canal.' },
	{ id: 'banco', grupo: 'facturas', titulo: 'Comisión del banco', icono: 'landmark', tipo: 'gasto', cuenta: '626', ivaPct: 0, categoria: 'Comisiones', mensual: true, ayuda: 'Servicios bancarios (626). Las comisiones financieras van sin IVA.' },
	{ id: 'seguro', grupo: 'facturas', titulo: 'Seguro', icono: 'shield-check', tipo: 'gasto', cuenta: '625', ivaPct: 0, categoria: 'Seguros', ayuda: 'Primas de seguros (625). Los seguros no llevan IVA (llevan un impuesto propio ya incluido en el recibo).' },

	// ─── Impuestos y tasas
	{ id: 'ibi', grupo: 'impuestos', titulo: 'IBI', icono: 'landmark', tipo: 'gasto', cuenta: '631', ivaPct: 0, categoria: 'Tributos locales', ayuda: 'Impuesto sobre Bienes Inmuebles del local: es un tributo (631), sin IVA. Es gasto del año aunque lo pagues de una vez.' },
	{ id: 'basuras', grupo: 'impuestos', titulo: 'Tasa de basuras', icono: 'trash', tipo: 'gasto', cuenta: '631', ivaPct: 0, categoria: 'Tributos locales', ayuda: 'Tasa municipal (631), sin IVA.' },
	{ id: 'ivtm', grupo: 'impuestos', titulo: 'Impuesto de circulación', icono: 'car-front', tipo: 'gasto', cuenta: '631', ivaPct: 0, categoria: 'Impuestos', vehiculo: true, ayuda: 'IVTM del vehículo (631), sin IVA. Consejo: regístralo desde Papeles del vehículo y así también vigila el vencimiento.' },
	{ id: 'tasa', grupo: 'impuestos', titulo: 'Otra tasa (DGT, licencia…)', icono: 'file-text', tipo: 'gasto', cuenta: '631', ivaPct: 0, categoria: 'Impuestos', vehiculo: true, ayuda: 'Tasas de la DGT (cambio de nombre, duplicados), licencias municipales…: tributos (631), sin IVA.' },
	{ id: 'multa', grupo: 'impuestos', titulo: 'Multa', icono: 'triangle-alert', tipo: 'gasto', cuenta: '678', ivaPct: 0, vehiculo: true, ayuda: 'Gasto excepcional (678). Ojo: en una empresa real las multas no son deducibles en el impuesto de sociedades.' },

	// ─── Compras del taller
	{ id: 'recambios', grupo: 'taller', titulo: 'Recambios', icono: 'cog', tipo: 'gasto', cuenta: '602', ivaPct: 21, categoria: 'Recambios', vehiculo: true, ayuda: 'Aprovisionamientos (602). Si es para un vehículo concreto, elígelo y sumará a lo que te cuesta.' },
	{ id: 'consumibles', grupo: 'taller', titulo: 'Consumibles', icono: 'spray-can', tipo: 'gasto', cuenta: '602', ivaPct: 21, categoria: 'Consumibles', ayuda: 'Lija, masilla, aceites, guantes, tornillería… Aprovisionamientos (602).' },
	{ id: 'herramienta', grupo: 'taller', titulo: 'Herramienta pequeña', icono: 'wrench', tipo: 'gasto', cuenta: '629', ivaPct: 21, categoria: 'Herramienta', ayuda: 'Herramienta de poco valor (menos de ~300 €) se gasta directamente (629).' },
	{ id: 'maquina', grupo: 'taller', titulo: 'Máquina o herramienta cara', icono: 'drill', tipo: 'gasto', cuenta: '213', ivaPct: 21, categoria: 'Herramienta', inmovilizado: { cuenta: '213', anios: 8 }, ayuda: 'Elevador, compresor, soldadora…: es inmovilizado (213). No es gasto de golpe: se reparte en su vida útil mediante la amortización.' },
	{ id: 'combustible', grupo: 'taller', titulo: 'Combustible', icono: 'fuel', tipo: 'gasto', cuenta: '628', ivaPct: 21, categoria: 'Combustible', vehiculo: true, ayuda: 'Gasolina o gasoil de los vehículos del taller: suministros (628). Si es para un vehículo concreto, elígelo.' },
	{ id: 'subcontrata', grupo: 'taller', titulo: 'Trabajo de otro taller', icono: 'hammer', tipo: 'gasto', cuenta: '607', ivaPct: 21, categoria: 'Servicios externos', vehiculo: true, ayuda: 'Trabajos realizados por otras empresas (607): pintura, rectificado, tapicería que encargas fuera.' },
	{ id: 'envio', grupo: 'taller', titulo: 'Transporte o envío', icono: 'truck', tipo: 'gasto', cuenta: '624', ivaPct: 21, categoria: 'Transporte', ayuda: 'Transportes (624): portes, grúa, mensajería.' },
	{ id: 'compraVehiculo', grupo: 'taller', titulo: 'Comprar un vehículo', icono: 'car', tipo: 'gasto', cuenta: '600', ivaPct: 0, categoria: 'Compra de vehículo', vehiculo: true, ayuda: 'Si es para restaurar y vender, es una compra de mercadería (600). A un particular se compra sin IVA.' },

	// ─── Ingresos
	{ id: 'transferenciaMensual', grupo: 'ingresos', titulo: 'Transferencia mensual (mi aporte)', icono: 'calendar-sync', tipo: 'aportacion', cuenta: CUENTA_APORTACION, ivaPct: 0, pago: 'banco', mensual: true, ejemplo: 'Tu transferencia de cada mes', ayuda: 'El dinero que pasas cada mes de tu cuenta al negocio. Entra en el banco, pero no es un ingreso (no lo ha ganado el taller): es tu aportación como socio (118). Así el beneficio refleja solo lo que el taller gana, y la app la apunta sola cada mes.' },
	{ id: 'cliente', grupo: 'ingresos', titulo: 'Trabajo para un cliente', icono: 'user-check', tipo: 'ingreso', cuenta: '705', ivaPct: 21, categoria: 'Trabajos a terceros', vehiculo: true, ayuda: 'Prestación de servicios (705). El importe que cobras incluye el 21 % de IVA, que no es tuyo: lo ingresas a Hacienda en el trimestre.' },
	{ id: 'youtube', grupo: 'ingresos', titulo: 'YouTube / AdSense', icono: 'play', tipo: 'ingreso', cuenta: '759', ivaPct: 0, categoria: 'YouTube', ayuda: 'Ingresos por servicios diversos (759). Google paga desde Irlanda sin IVA español.' },
	{ id: 'patrocinio', grupo: 'ingresos', titulo: 'Patrocinio o colaboración', icono: 'handshake', tipo: 'ingreso', cuenta: '705', ivaPct: 21, categoria: 'Trabajos a terceros', ayuda: 'Una marca te paga por un vídeo: es prestación de servicios (705) con IVA.' },
	{ id: 'piezas', grupo: 'ingresos', titulo: 'Venta de piezas', icono: 'package', tipo: 'ingreso', cuenta: '700', ivaPct: 21, categoria: 'Venta de piezas', ayuda: 'Venta de mercaderías (700).' },
	{ id: 'ventaVehiculo', grupo: 'ingresos', titulo: 'Vender un vehículo', icono: 'car-front', tipo: 'ingreso', cuenta: '700', ivaPct: 0, categoria: 'Venta de vehículo', vehiculo: true, ayuda: 'Venta de mercaderías (700). Simplificado sin IVA (en la realidad, los usados suelen ir por el régimen especial REBU).' },
	{ id: 'otrosIngresos', grupo: 'ingresos', titulo: 'Otro ingreso', icono: 'sparkles', tipo: 'ingreso', cuenta: '759', ivaPct: 21, categoria: 'Otros ingresos', ayuda: 'Ingresos por servicios diversos (759).' },

	// ─── Socio
	{ id: 'aportacion', grupo: 'socio', titulo: 'Meter dinero (aportación)', icono: 'piggy-bank', tipo: 'aportacion', cuenta: CUENTA_APORTACION, ivaPct: 0, pago: 'banco', ayuda: 'Pones dinero tuyo en la empresa, como un accionista. No es un ingreso (no da beneficio) ni un préstamo: va a "Aportaciones de socios" (118), dentro del patrimonio.' },
	{ id: 'aportacionMensual', grupo: 'socio', titulo: 'Aportación mensual', icono: 'calendar-sync', tipo: 'aportacion', cuenta: CUENTA_APORTACION, ivaPct: 0, pago: 'banco', mensual: true, ayuda: 'Lo mismo, pero cada mes: la app la apunta sola el día que elijas, y la usa para prever tu caja.' },
	{ id: 'reembolso', grupo: 'socio', titulo: 'Devolverme lo que adelanté', icono: 'hand-coins', tipo: 'retirada', cuenta: '551', ivaPct: 0, pago: 'banco', ayuda: 'Cuando pagas algo de tu bolsillo, la empresa te lo debe (551). Con esto la empresa te lo devuelve.' },
	{ id: 'retirada', grupo: 'socio', titulo: 'Sacar dinero para mí', icono: 'wallet', tipo: 'retirada', cuenta: CUENTA_APORTACION, ivaPct: 0, pago: 'banco', ayuda: 'Te devuelves parte de lo que aportaste (118). No es un gasto de la empresa.' },
	{ id: 'prestamo', grupo: 'socio', titulo: 'Préstamo recibido', icono: 'banknote', tipo: 'aportacion', cuenta: '170', ivaPct: 0, pago: 'banco', ayuda: 'Un banco (o alguien) presta dinero: entra en caja y queda una deuda a largo plazo (170).' },
	{ id: 'cuotaPrestamo', grupo: 'socio', titulo: 'Devolver préstamo', icono: 'banknote', tipo: 'retirada', cuenta: '170', ivaPct: 0, pago: 'banco', mensual: true, ayuda: 'Devuelves capital del préstamo (170). Si la cuota lleva intereses, regístralos aparte como gasto financiero.' },
	{ id: 'traspaso', grupo: 'socio', titulo: 'Sacar efectivo a caja', icono: 'arrow-left-right', tipo: 'retirada', cuenta: '570', ivaPct: 0, pago: 'banco', ayuda: 'Pasas dinero del banco a la caja del taller: no cambia lo que tiene la empresa, solo dónde está.' }
];

export const operacion = (id: string) => OPERACIONES.find((o) => o.id === id);

/** Explicación en lenguaje llano de lo que se va a apuntar. */
export function explicarOperacion(o: Pick<Operacion, 'tipo' | 'cuenta'>, importe: number, ivaPct: number, pago: FormaPago, nombreCuenta: string): string[] {
	const { base, cuota } = desglosarIva(importe, ivaPct);
	const donde = pago === 'socio' ? 'de tu bolsillo' : pago === 'caja' ? 'de la caja' : 'del banco';
	const adonde = pago === 'caja' ? 'a la caja' : 'al banco';
	switch (o.tipo) {
		case 'gasto':
			return [
				`Salen ${euros(importe)} ${donde}${pago === 'socio' ? ': la empresa te los deberá' : ''}.`,
				cuota ? `${euros(base)} son gasto de «${nombreCuenta}» y ${euros(cuota)} de IVA que recuperas en el trimestre.` : `Todo es gasto de «${nombreCuenta}».`
			];
		case 'ingreso':
			return [
				`Entran ${euros(importe)} ${adonde}.`,
				cuota ? `${euros(base)} son ingreso de «${nombreCuenta}» y ${euros(cuota)} de IVA que tendrás que ingresar a Hacienda.` : `Todo es ingreso de «${nombreCuenta}».`
			];
		case 'aportacion':
			return [`Entran ${euros(importe)} ${adonde}.`, `No es un ingreso: aumenta «${nombreCuenta}», no el beneficio.`];
		case 'retirada':
			return [`Salen ${euros(importe)} ${pago === 'caja' ? 'de la caja' : 'del banco'}.`, `No es un gasto: reduce «${nombreCuenta}».`];
	}
}


