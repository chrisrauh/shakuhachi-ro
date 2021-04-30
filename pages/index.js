import { getSortedPostsData } from '../lib/posts';
import ChiSVG from '../svgs/Japanese_Katakana_kyokashotai_TI.svg';
import Date from '../components/date';
import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import Link from 'next/link';
import ReSVG from '../svgs/Japanese_Katakana_kyokashotai_RE.svg';
import RiSVG from '../svgs/Japanese_Katakana_kyokashotai_RI.svg';
import RoSVG from '../svgs/Japanese_Katakana_kyokashotai_RO.svg';
import TsuSVG from '../svgs/Japanese_Katakana_kyokashotai_TU.svg';
import utilStyles from '../styles/utils.module.css';

export async function getStaticProps() {
  const allPostsData = getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
}

export default function Home({ allPostsData }) {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <h2 className={utilStyles.headingLg}>
          What are the correct characters for the notes?
        </h2>
        <div className={utilStyles.letterGrid}>
          <div>Ro</div>
          <div>ロ</div>
          <div>
            <RoSVG className={utilStyles.letterSVG} />
          </div>
          <div>Tsu</div>
          <div>ツ</div>
          <div>
            <TsuSVG className={utilStyles.letterSVG} />
          </div>
          <div>Re</div>
          <div>レ</div>
          <div>
            <ReSVG className={utilStyles.letterSVG} />
          </div>
          <div>Chi</div>
          <div>チ</div>
          <div>
            <ChiSVG className={utilStyles.letterSVG} />
          </div>
          <div>Ri</div>
          <div>リ</div>
          <div>
            <RiSVG className={utilStyles.letterSVG} />
          </div>
        </div>
      </section>

      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Pieces</h2>
        <ul className={utilStyles.list}>
          {allPostsData.map(({ id, date, title }) => (
            <li className={utilStyles.listItem} key={id}>
              <Link href={`/posts/${id}`}>
                <a>{title}</a>
              </Link>
              <br />
              <small className={utilStyles.lightText}>
                <Date dateString={date} />
              </small>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
