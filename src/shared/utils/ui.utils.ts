import { LegacyUiDefinition, UiDef, UiDefinition } from '../types/ui.types';

export const isLegacyDefinition = (uiDefinition: UiDef): uiDefinition is LegacyUiDefinition => {
  return !(uiDefinition as UiDefinition).version;
};

export const fromBase64 = (data: string): string => {
  return Buffer.from(data, 'base64').toString('utf8');
};

export const toBase64 = (data: string): string => {
  return Buffer.from(data, 'utf8').toString('base64');
};
