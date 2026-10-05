import type { ObjectSchema } from 'yup';

/** Strips all whitespace (not just leading/trailing) from a number-like input, e.g. a pasted account or ID number. */
export const stripSpaces = (value: string): string => value.replace(/\s+/g, "");

export const getYupDefaults = <Schema extends ObjectSchema<object>>(
  formSchema: Schema,
) => {
  return Object.fromEntries(
    Object.entries(formSchema.fields).map(([key, value]) => [
      key,
      (value as { getDefault?: () => unknown }).getDefault?.(),
    ]),
  );
};
