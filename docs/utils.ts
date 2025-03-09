export const loadFont = (name: string, url?: string, timeout = 30000) => {
  if (url) {
    const font = new FontFace(name, `url(${url})`);
    // @ts-ignore
    document.fonts.add(font);
  }

  const startTime = performance.now();
  let endTime: number;

  return new Promise<void>((resolve, reject) => {
    const load = () => {
      document.fonts
        .load(`16px "${name}"`)
        .then((_font) => {
          if (_font.length) return resolve();

          endTime = performance.now();
          if (endTime - startTime >= timeout) {
            reject(`${timeout}ms timeout exceeded`);
          } else setTimeout(load, 25);
        })
        .catch(reject);
    };
    load();
  });
};
