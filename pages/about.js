import Head from 'next/head';
import Layout from '../components/layout';
import Link from 'next/link';
import React from 'react';

export default function FirstPost() {
  return (
    <Layout>
      <Head>
        <title>About</title>
      </Head>
      <h1>First Post</h1>
      <h2>
        <Link href="/">
          <a>Back to home</a>
        </Link>
      </h2>
    </Layout>
  );
}
