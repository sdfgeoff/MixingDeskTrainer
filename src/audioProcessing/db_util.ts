export const dbToValue = (db: number): number => {
  return Math.pow(10, db / 20);
};

export const valueToDb = (value: number): number => {
  return 20 * Math.log10(value);
};
