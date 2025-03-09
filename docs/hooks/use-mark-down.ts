import { useCallback, useEffect, useState } from 'react';

const useMarkDown = (path: string) => {
  const [content, setContent] = useState<string>('');

  const loadFile = useCallback(() => {
    fetch(path)
      .then((response) => response.text())
      .then((text) => {
        setContent(text);
      });
  }, []);

  useEffect(loadFile, []);

  return [content, setContent] as const;
};

export default useMarkDown;
