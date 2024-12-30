export const updateDP = () => {
  document.documentElement.style.setProperty(
    '--dp',
    `${window.devicePixelRatio || 1}px`,
  );
};
