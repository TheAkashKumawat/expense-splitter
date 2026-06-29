import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Split bills, track group expenses and settle instantly via UPI. Built for friends, trips and flatmates." />
        <meta property="og:title" content="SettliX — Smart Expense Splitter with UPI" />
        <meta property="og:description" content="Split bills, track group expenses and settle instantly via UPI. Built for friends, trips and flatmates." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
