import React, { useCallback, useMemo, useState } from 'react';
import NotePaper from './components/note-paper';
import WarpedCanvas from './components/warped-canvas';
import Icon from './components/icon';
import styles from './style.less';

const Docs = () => {
  const examples = useMemo(
    () => [
      './codes/00-installation-and-tips.md',
      './codes/01-initial-warpvas.md',
      './codes/02-update-vertex-coord.md',
      './codes/03-update-boundary-coords.md',
      './codes/04-add-split-point.md',
      './codes/05-remove-region.md',
      './codes/06-set-configuration.md',
      './codes/07-set-split-unit.md',
      './codes/08-set-strategy.md',
      './codes/09-set-Input-limit-size.md',
      './codes/10-set-output-limit-size.md',
      './codes/11-set-rendering-context.md',
      './codes/12-render-with-worker.md',
    ],
    [],
  );

  const [indexs, setIndexs] = useState(examples.map((_, index, arr) => arr.length - index));

  const step = useMemo(() => {
    let index = 0;
    let max = indexs[0];
    for (let i = 1; i < indexs.length; i++) {
      if (indexs[i] > max) {
        max = indexs[i];
        index = i;
      }
    }
    return index;
  }, [indexs]);

  const handleTopDemo = useCallback((index: number) => {
    setIndexs((list) => {
      const newList = [...list];
      newList[index] = Math.max(...list) + 1;
      return newList;
    });
  }, []);

  const handleTopPreDemo = useCallback(() => {
    setIndexs((list) => {
      const newList = [...list];
      newList[step - 1] = newList[step] + 1;
      return newList;
    });
  }, [step]);

  const handleTopNextDemo = useCallback(() => {
    setIndexs((list) => {
      const newList = [...list];
      newList[step + 1] = newList[step] + 1;
      return newList;
    });
  }, [step]);

  return (
    <div className={styles.docs}>
      {/* <header>
        <h1>Warpvas</h1>
        <p>A JavaScript Library for Rapid Canvas Distortion</p>
      </header> */}
      <WarpedCanvas className={styles.logo} step={step} />
      <div className={styles.examples}>
        {examples.map((link, index) => {
          return (
            <NotePaper
              key={index}
              active={step === index}
              style={{ zIndex: indexs[index] }}
              paperLink={link}
              onMouseDown={() => handleTopDemo(index)}
            />
          );
        })}
      </div>
      <div className={styles.buttons}>
        <button type="button" disabled={step === 0} onClick={handleTopPreDemo}>
          &lt;&nbsp;pre
        </button>
        <button type="button" disabled={step === examples.length - 1} onClick={handleTopNextDemo}>
          next&nbsp;&gt;
        </button>
      </div>
      <div
        className={styles.github}
        onClick={() => {
          window.open('https://github.com/huanjinliu/warpvas.git', '__target');
        }}
      >
        <Icon name="github" size={24} />
        <span className={styles.githubLabel}>GitHub</span>
      </div>
    </div>
  );
};

export default Docs;
