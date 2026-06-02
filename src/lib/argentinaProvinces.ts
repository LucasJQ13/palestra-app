export type ArgentinaProvinceDefinition = {
  name: string;
  region: string;
};

export const argentinaProvinceDefinitions: ArgentinaProvinceDefinition[] = [
  { name: 'Buenos Aires', region: 'Centro' },
  { name: 'CABA', region: 'Centro' },
  { name: 'Catamarca', region: 'NOA' },
  { name: 'Chaco', region: 'NEA' },
  { name: 'Chubut', region: 'Patagonia' },
  { name: 'Cordoba', region: 'Centro' },
  { name: 'Corrientes', region: 'NEA' },
  { name: 'Entre Rios', region: 'Centro' },
  { name: 'Formosa', region: 'NEA' },
  { name: 'Jujuy', region: 'NOA' },
  { name: 'La Pampa', region: 'Patagonia' },
  { name: 'La Rioja', region: 'NOA' },
  { name: 'Mendoza', region: 'Cuyo' },
  { name: 'Misiones', region: 'NEA' },
  { name: 'Neuquen', region: 'Patagonia' },
  { name: 'Rio Negro', region: 'Patagonia' },
  { name: 'Salta', region: 'NOA' },
  { name: 'San Juan', region: 'Cuyo' },
  { name: 'San Luis', region: 'Cuyo' },
  { name: 'Santa Cruz', region: 'Patagonia' },
  { name: 'Santa Fe', region: 'Centro' },
  { name: 'Santiago del Estero', region: 'NOA' },
  { name: 'Tierra del Fuego', region: 'Patagonia' },
  { name: 'Tucuman', region: 'NOA' }
];

export function provinceDefinitionFor(name?: string | null) {
  return argentinaProvinceDefinitions.find((item) => item.name === name) ?? null;
}
