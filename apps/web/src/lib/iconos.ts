// Catálogo de iconos elegibles desde Ajustes (tipos de vehículo, vencimientos…).
import {
	ArrowLeftRight, Banknote, Briefcase, CalendarSync, Droplets, HandCoins, Handshake, House, Megaphone, Package, PiggyBank, Play,
	SprayCan, Trash, TriangleAlert, UserCheck, Wallet, Wifi,
	Anchor, Bike, Bus, CalendarClock, Car, CarFront, Caravan, ClipboardCheck, Cog, Drill, FileText, Flame,
	Forklift, Fuel, Gauge, Hammer, KeyRound, Landmark, Motorbike, Plane, Receipt, Rocket, Sailboat, Scooter,
	ShieldCheck, Ship, Sparkles, Tractor, TramFront, Truck, Wrench, Zap
} from '@lucide/svelte';
import type { Component } from 'svelte';

export const ICONOS: Record<string, Component> = {
	'car-front': CarFront,
	car: Car,
	motorbike: Motorbike,
	scooter: Scooter,
	bike: Bike,
	truck: Truck,
	bus: Bus,
	caravan: Caravan,
	tractor: Tractor,
	forklift: Forklift,
	sailboat: Sailboat,
	ship: Ship,
	anchor: Anchor,
	plane: Plane,
	'tram-front': TramFront,
	rocket: Rocket,
	cog: Cog,
	wrench: Wrench,
	hammer: Hammer,
	drill: Drill,
	gauge: Gauge,
	fuel: Fuel,
	zap: Zap,
	flame: Flame,
	sparkles: Sparkles,
	'clipboard-check': ClipboardCheck,
	'shield-check': ShieldCheck,
	landmark: Landmark,
	'calendar-clock': CalendarClock,
	'key-round': KeyRound,
	'file-text': FileText,
	receipt: Receipt,
	droplets: Droplets,
	wifi: Wifi,
	house: House,
	briefcase: Briefcase,
	megaphone: Megaphone,
	trash: Trash,
	'triangle-alert': TriangleAlert,
	'spray-can': SprayCan,
	'user-check': UserCheck,
	play: Play,
	handshake: Handshake,
	package: Package,
	'piggy-bank': PiggyBank,
	'calendar-sync': CalendarSync,
	'hand-coins': HandCoins,
	wallet: Wallet,
	banknote: Banknote,
	'arrow-left-right': ArrowLeftRight
};

export function icono(nombre: string | null | undefined): Component {
	return (nombre && ICONOS[nombre]) || Cog;
}
