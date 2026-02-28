import Head from 'next/head'
import { Lato, Spectral } from 'next/font/google'
import SiteHeader from '../../components/SiteHeader'
import { getAllPostSlugs, getPostData } from '../../lib/posts'

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

export async function getStaticPaths() {
  const paths = getAllPostSlugs()
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.slug)
  return {
    props: {
      postData,
    },
  }
}

export default function Post({ postData }) {
  return (
    <>
      <Head>
        <title>{postData.title} | Seandon Mooy</title>
        {postData.description && <meta name="description" content={postData.description} />}
      </Head>
      <main>
        <SiteHeader alwaysCollapsed />

        {/* Main content - pushed down for collapsed header */}
        <div style={{ paddingTop: 100, overflowX: 'hidden', minHeight: '100vh' }}>
          <article
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
            <header style={{ marginBottom: '3rem' }}>
              <h1
                style={{
                  textAlign: 'center',
                  fontSize: '2.2rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                }}
              >
                {postData.title}
              </h1>
              {postData.formattedDate && (
                <time
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '0.9rem',
                  }}
                >
                  {postData.formattedDate}
                </time>
              )}
            </header>
            <div
              className={`post-content ${spectral.className}`}
              dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
            />
          </article>
        </div>
      </main>
      <style jsx global>{`
        .post-content p {
          text-indent: 2em;
          margin-bottom: 1.5rem;
        }
        .post-content p:first-child {
          text-indent: 0;
        }
        .post-content h2 {
          font-family: ${lato.style.fontFamily};
          font-size: 1.5rem;
          font-weight: 700;
          margin: 2.5rem 0 1rem;
          letter-spacing: -0.01em;
        }
        .post-content h3 {
          font-family: ${lato.style.fontFamily};
          font-size: 1.25rem;
          font-weight: 700;
          margin: 2rem 0 0.75rem;
        }
        .post-content code {
          background: #f4f4f4;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
        }
        .post-content pre {
          background: #1a1a1a;
          color: #f0f0f0;
          padding: 1.5rem;
          border-radius: 4px;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .post-content pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        .post-content blockquote {
          border-left: 3px solid #ddd;
          margin: 1.5rem 0;
          padding-left: 1.5rem;
          color: #555;
          font-style: italic;
        }
        .post-content ul,
        .post-content ol {
          margin: 1.5rem 0;
          padding-left: 2rem;
        }
        .post-content li {
          margin-bottom: 0.5rem;
        }
        .post-content a {
          color: #0066cc;
          text-decoration: underline;
        }
        .post-content a:hover {
          color: #004499;
        }
        .post-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5rem 0;
        }
        .post-content hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 2.5rem 0;
        }
      `}</style>
    </>
  )
}
