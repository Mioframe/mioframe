if (process.env.NODE_ENV === 'production' || process.env.CI || process.env.HUSKY === '0') {
  process.exit(0);
}

try {
  const husky = (await import('husky')).default;

  console.log(husky());
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'ERR_MODULE_NOT_FOUND') {
    process.exit(0);
  }

  throw error;
}
