export const USE_MOCKS =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCKS
    ? process.env.NEXT_PUBLIC_USE_MOCKS !== 'false'
    : true;
