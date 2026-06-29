import Head from 'next/head';
import CreateGroupForm from '../../components/groups/CreateGroupForm';

export default function NewGroup() {
  return (
    <>
      <Head>
        <title>New Group | SettliX</title>
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <CreateGroupForm />
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  // Read cookies manually to verify authentication
  const cookieStr = req.headers.cookie;
  let user = null;

  if (cookieStr) {
    const cookies = Object.fromEntries(
      cookieStr.split(';').map(c => {
        const parts = c.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
    );

    if (cookies.session) {
      const { decryptSession } = require('../../lib/auth');
      user = decryptSession(cookies.session);
    }
  }

  if (!user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {}
  };
}
