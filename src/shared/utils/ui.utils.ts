import { LegacyUiDefinition, UiDef, UiDefinition, UiElementMetadata } from '../types/ui.types';

const METADATA_DECORATOR_REGEX = /@ElementDefinition\(([\s\S]+)\)(\n|.)*export class/g;

export const isLegacyDefinition = (uiDefinition: UiDef): uiDefinition is LegacyUiDefinition => {
  return !(uiDefinition as UiDefinition).version;
};

export const fromBase64 = (data: string): string => {
  return Buffer.from(data, 'base64').toString('utf8');
};

export const toBase64 = (data: string): string => {
  return Buffer.from(data, 'utf8').toString('base64');
};

export const extractElementMetadata = (script: string): UiElementMetadata => {
  const metadataString = (METADATA_DECORATOR_REGEX.exec(script) ?? [])[1];

  // need to reset regex last index to prevent null result for next execution
  METADATA_DECORATOR_REGEX.lastIndex = 0;

  return eval(`(${metadataString})`) as UiElementMetadata;
};
