import Head from 'next/head'
import Image from 'next/image'
import { Rubik_Mono_One } from 'next/font/google'
import Animation from '../components/Animation'
import avatar from '../public/avatar.jpg'

const rubikMono = Rubik_Mono_One({ subsets: ['latin'], weight: '400' })

export default function Home() {
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
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <Animation />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            textAlign: 'center',
            marginTop: 190,
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <Image
              src={avatar}
              title="A picture of the author, Seandon!"
              alt="A picture of the author, Seandon!"
              height={110}
              width={110}
              style={{ borderRadius: '100px' }}
            />
          </div>
          <div
            style={{
              ...rubikMono.style,
              display: 'flex',
              justifyContent: 'space-between',
              maxWidth: '600px',
              margin: '0 auto',
              flexDirection: 'column',
            }}
          >
            <a href="#words" title="Read some of my words">
              Words
            </a>
            {/* <a>Tools</a> */}
            <a
              href={`https://github.com/erulabs`}
              rel="noreferrer nofollow"
              target="_blank"
              title="Checkout some of my code"
            >
              Github
            </a>
            <a href={`https://twitter.com/erulabs`} rel="noreferrer nofollow" target="_blank" title="I do the bird-app">
              Tweeter
            </a>
            <a
              href={`https://www.linkedin.com/in/seandonmooy/`}
              rel="noreferrer nofollow"
              target="_blank"
              title="super srs now"
            >
              Linkedin
            </a>
            <a href={`https://kubesail.com`} rel="noreferrer nofollow" target="_blank" title="My startup!">
              KubeSail
            </a>
            <a
              href={`https://classdojo.com`}
              rel="noreferrer nofollow"
              target="_blank"
              title="I am the devops man at an awesome company"
            >
              work
            </a>
            <a
              href={`mailto:seandon.mooy@gmail.com`}
              rel="noreferrer nofollow"
              target="_blank"
              title="Send an email to Seandon"
            >
              e-mail
            </a>
          </div>
          <div id="words" style={{ ...rubikMono.style, marginTop: '10vh' }}>
            Words coming soon
          </div>
          {/* <div style={{ ...rubikMono.style, marginTop: "10vh" }}>2. Tools</div> */}
          <div style={{ marginTop: '50vh', fontSize: '2rem' }}>🍄</div>
        </div>
      </main>
    </>
  )
}
