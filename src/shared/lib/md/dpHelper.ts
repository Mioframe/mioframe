export const updateDP = () => {
  document.documentElement.style.setProperty('--one-dp', `1px`);
};

export const updatePT = () => {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.width = '1pt';
  div.style.height = '0';
  div.style.visibility = 'hidden';
  document.body.appendChild(div);
  const px = div.getBoundingClientRect().width;
  document.body.removeChild(div);

  document.documentElement.style.setProperty('--one-pt', `${px || 1.325}px`);
};
