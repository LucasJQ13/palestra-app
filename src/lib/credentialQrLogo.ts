import { Role } from '../types/auth';

const nationalQrLogo = require('../../assets/qr-logo.png');
const cordobaQrLogo = require('../../assets/qr-cordoba.png');
const jujuyQrLogo = require('../../assets/qr-jujuy.png');
const saltaQrLogo = require('../../assets/qr-salta.png');
const sanLuisQrLogo = require('../../assets/qr-san-luis.png');
const tucumanQrLogo = require('../../assets/qr-tucuman.png');
const catamarcaQrLogo = require('../../assets/logo-provincia-catamarca.png');

const nationalRoles: Role[] = ['vocal_nacional', 'coordinador_nacional', 'administrador'];

function normalizeProvince(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function credentialQrLogoFor(province?: string | null, role?: Role | null) {
  if (role && nationalRoles.includes(role)) {
    return nationalQrLogo;
  }

  switch (normalizeProvince(province)) {
    case 'cordoba':
      return cordobaQrLogo;
    case 'jujuy':
      return jujuyQrLogo;
    case 'salta':
      return saltaQrLogo;
    case 'san luis':
      return sanLuisQrLogo;
    case 'tucuman':
      return tucumanQrLogo;
    case 'catamarca':
      return catamarcaQrLogo;
    default:
      return nationalQrLogo;
  }
}
