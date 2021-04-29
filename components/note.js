import ChiSVG from '../svgs/Japanese_Katakana_kyokashotai_TI.svg';
import ReSVG from '../svgs/Japanese_Katakana_kyokashotai_RE.svg';
import React from 'react';
import RiSVG from '../svgs/Japanese_Katakana_kyokashotai_RI.svg';
import RoSVG from '../svgs/Japanese_Katakana_kyokashotai_RO.svg';
import TsuSVG from '../svgs/Japanese_Katakana_kyokashotai_TU.svg';

import utilStyles from '../styles/utils.module.css';

export default function Note({ noteString }) {
  const pitch = noteString.substring(0, 1);

  switch (pitch) {
    case 'd':
      return (
        <>
          <div>Ro</div>
          <div>ロ</div>
          <div>
            <RoSVG className={utilStyles.letterSVG} />
          </div>
        </>
      );
    case 'f':
      return (
        <>
          <div>Tsu</div>
          <div>ツ</div>
          <div>
            <TsuSVG className={utilStyles.letterSVG} />
          </div>
        </>
      );
    case 'g':
      return (
        <>
          <div>Re</div>
          <div>レ</div>
          <div>
            <ReSVG className={utilStyles.letterSVG} />
          </div>
        </>
      );
    case 'a':
      return (
        <>
          <div>Chi</div>
          <div>チ</div>
          <div>
            <ChiSVG className={utilStyles.letterSVG} />
          </div>
        </>
      );
    case 'c':
      return (
        <>
          <div>Ri</div>
          <div>リ</div>
          <div>
            <RiSVG className={utilStyles.letterSVG} />
          </div>
        </>
      );
  }
  return <div>{pitch}</div>;
}
