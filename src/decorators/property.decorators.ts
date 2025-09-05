import type { ApiPropertyOptions } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';

import { getVariableName } from '../common/utils';

export function ApiBooleanProperty(options: Omit<ApiPropertyOptions, 'type'> = {}): PropertyDecorator {
  return ApiProperty({ type: Boolean, ...(options as any) } as any);
}

export function ApiBooleanPropertyOptional(
  options: Omit<ApiPropertyOptions, 'type' | 'required'> = {},
): PropertyDecorator {
  return ApiBooleanProperty({ required: false, ...options });
}

export function ApiUUIDProperty(
  options: Omit<ApiPropertyOptions, 'type' | 'format'> & Partial<{ each: boolean }> = {},
): PropertyDecorator {
  return ApiProperty({
    type: (options.each ? [String] : String) as any,
    format: 'uuid',
    isArray: options.each,
    ...(options as any),
  } as any);
}

export function ApiUUIDPropertyOptional(
  options: Omit<ApiPropertyOptions, 'type' | 'format' | 'required'> & Partial<{ each: boolean }> = {},
): PropertyDecorator {
  return ApiUUIDProperty({ required: false, ...options });
}

export function ApiEnumProperty<TEnum>(
  getEnum: () => TEnum,
  options: Omit<ApiPropertyOptions, 'type'> & { each?: boolean } = {},
): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const enumValue = getEnum() as any;

  return ApiProperty({
    // Swagger v11 type unions can be strict; cast to any to avoid over-constraining
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    enum: enumValue,
    enumName: getVariableName(getEnum)!,
    ...(options as any),
  } as any);
}

export function ApiEnumPropertyOptional<TEnum>(
  getEnum: () => TEnum,
  options: Omit<ApiPropertyOptions, 'type' | 'required'> & {
    each?: boolean;
  } = {},
): PropertyDecorator {
  return ApiEnumProperty(getEnum, { required: false, ...options });
}
