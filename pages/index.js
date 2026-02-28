import Head from 'next/head'
import Link from 'next/link'
import { Lato, Spectral } from 'next/font/google'
import SiteHeader from '../components/SiteHeader'
import { getSortedPostsData } from '../lib/posts'

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
})

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
})

export async function getStaticProps() {
  const allPostsData = getSortedPostsData()
  return {
    props: {
      allPostsData,
    },
  }
}

export default function Home({ allPostsData }) {
  return (
    <>
      <Head>
        <title>Seandon Mooy's website</title>
        <meta
          name="description"
          content="Some words. Maybe even some pictures. If you've ever heard me talk and thought, 'I'd like to hear more of that', well then a) seek help and b) this is the site for you."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <SiteHeader />

        {/* Main content - pushed down to make room for hero */}
        {/* <div style={{ paddingTop: 450, overflowX: 'hidden', backgroundColor: '#fff', minHeight: '150vh' }}>
          <div
            className={lato.className}
            style={{
              maxWidth: 650,
              margin: '0 auto',
              padding: '2rem',
              color: '#111',
              lineHeight: 1.8,
              fontSize: '1.1rem',
            }}
          >
            <h1
              style={{
                textAlign: 'center',
                fontSize: '2rem',
                fontWeight: 700,
                marginBottom: '3rem',
                letterSpacing: '-0.02em',
              }}
            >
              Posts
            </h1>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {allPostsData.map(({ slug, title, formattedDate, description }) => (
                <li
                  key={slug}
                  style={{
                    marginBottom: '2.5rem',
                    paddingBottom: '2.5rem',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <Link href={`/posts/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {formattedDate && (
                      <time
                        style={{
                          display: 'block',
                          color: '#aaa',
                          fontSize: '0.6rem',
                          textAlign: 'right',
                          marginBottom: '-0.75rem',
                        }}
                      >
                        {formattedDate}
                      </time>
                    )}
                    <h2
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {title}
                    </h2>
                    {description && (
                      <p style={{ color: '#444', margin: 0 }} className={spectral.className}>
                        {description}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div> */}
      </main>
    </>
  )
}
