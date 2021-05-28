import { RadioGroup } from '@headlessui/react';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RoSVG from '../svgs/Japanese_Katakana_kyokashotai_RO.svg';

import styles from './layout.module.css';
import utilStyles from '../styles/utils.module.css';

const name = 'Shakuhachi.ro';
export const siteTitle = 'Next.js Sample Website';

function MyRadioGroup() {
  const [plan, setPlan] = useState('Font');

  return (
    <RadioGroup
      value={plan}
      onChange={setPlan}
      className={styles.rowButtonGroup}
    >
      <RadioGroup.Label>Note Style</RadioGroup.Label>
      <RadioGroup.Option value="font">
        {({ checked }) => (
          <div className={checked ? styles.rowButtonChecked : styles.rowButton}>
            ロ
          </div>
        )}
      </RadioGroup.Option>
      <RadioGroup.Option value="hand">
        {({ checked }) => (
          <div className={checked ? styles.rowButtonChecked : styles.rowButton}>
            <RoSVG className={styles.rowButtonletterSVG} />
          </div>
        )}
      </RadioGroup.Option>
      <RadioGroup.Option value="name" styles="align-self: flex-end" >
        {({ checked }) => (
          <div className={checked ? styles.rowButtonChecked : styles.rowButton}>
            Ro
          </div>
        )}
      </RadioGroup.Option>
    </RadioGroup>
  );
}

export default function Layout({ children, home }) {
  return (
    <div className={styles.container}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Learn how to build a personal website using Next.js"
        />
        <meta
          property="og:image"
          content={`https://og-image.vercel.app/${encodeURI(
            siteTitle
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <header className={styles.header}>
        {home ? (
          <h1 className={utilStyles.heading2Xl}>{name}</h1>
        ) : (
          <>
            <h2 className={utilStyles.headingLg}>
              <Link href="/">
                <a className={utilStyles.colorInherit}>{name}</a>
              </Link>
            </h2>
            <div>
              <MyRadioGroup />
            </div>
          </>
        )}
      </header>
      <main>{children}</main>
      {!home && (
        <div className={styles.backToHome}>
          <Link href="/">
            <a>← Back</a>
          </Link>
        </div>
      )}
    </div>
  );
}
