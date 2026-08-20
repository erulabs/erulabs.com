import Head from 'next/head'
import Image from 'next/image'
import { Lato } from 'next/font/google'
import SiteHeader from '../components/SiteHeader'
import avatar from '../public/avatar.jpg'

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
})

const ACCENT = '#647aa3'

function SectionLabel({ children, style = {} }) {
  return (
    <div
      style={{
        fontSize: '0.6rem',
        fontWeight: 400,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: '#aaa',
        borderBottom: '1px solid #eee',
        paddingBottom: '0.4rem',
        marginBottom: '1rem',
        marginTop: '2rem',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function RightSectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: ACCENT,
        marginBottom: '0.6rem',
        marginTop: '1.75rem',
      }}
    >
      {children}
    </div>
  )
}

function Job({ title, company, dateRange, location, children }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</div>
      <div style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>{company}</div>
      <div className="job-meta" style={{ fontSize: '0.72rem', color: ACCENT, marginBottom: '0.6rem' }}>
        <span className="job-date">{dateRange}</span>
        <span className="job-sep">&nbsp;&nbsp;·&nbsp;&nbsp;</span>
        <span className="job-location">{location}</span>
      </div>
      <p style={{ fontSize: '0.88rem', color: '#333', lineHeight: 1.65, margin: 0 }}>{children}</p>
    </div>
  )
}

export default function Resume() {
  return (
    <>
      <Head>
        <title>Resume | Seandon Mooy</title>
        <meta name="description" content="Resume of Seandon Mooy — Founder & Senior Platform Engineer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="color-scheme" content="light" />
      </Head>

      <main>
        <SiteHeader alwaysCollapsed staticFlower />

        <div className="resume-wrapper" style={{ paddingTop: 100, minHeight: '100vh' }}>
          <div
            className={`${lato.className} resume-content`}
            style={{
              maxWidth: 880,
              margin: '0 auto',
              padding: '2rem 2rem 4rem',
              color: '#111',
            }}
          >
            <div
              className="resume-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 260px',
                gap: '3rem',
                alignItems: 'start',
              }}
            >
              {/* ── Left column ── */}
              <div>
                <h1
                  style={{
                    fontSize: '2.4rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  Seandon Mooy
                </h1>
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 300,
                    color: '#444',
                    marginTop: '0.3rem',
                    marginBottom: 0,
                  }}
                >
                  Founder &amp; Senior Platform Engineer
                </h2>

                {/* Contact strip — mobile only, sits right under the title */}
                <div className="resume-contact-mobile">
                  <span>seandon.mooy@gmail.com</span>
                  <span className="resume-contact-sep">·</span>
                  <span>(805) 729-7655</span>
                  <span className="resume-contact-sep">·</span>
                  <span>Goleta, CA</span>
                </div>

                <SectionLabel style={{ marginTop: '1.5rem' }}>About Me</SectionLabel>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#333', margin: 0 }}>
                  My mission is to accumulate maximum responsibility. Father of 3, keys to the datacenter, admin of your
                  Okta org, etc. Sysadmin with a smile for over 20 years. I pride myself on putting pragmatism before
                  idealism, but sometimes trying something new is pragmatic, too.
                </p>

                <SectionLabel>Experience</SectionLabel>

                <Job
                  title="Engineering Manager"
                  company="ClassDojo"
                  dateRange="Nov 2022 – Present"
                  location="Remote from Santa Barbara, CA"
                >
                  Joined as first platform engineer, built a great team. Migrated infrastructure from bespoke to AWS
                  EKS. Reduced downtime and increased deployment speed dramatically. Cut costs aggressively. Worked
                  across teams to improve performance and drive velocity. Implemented an operational excellence program.
                </Job>

                <Job
                  title="Founder / CTO"
                  company="KubeSail"
                  dateRange="Jul 2019 – Jan 2024"
                  location="Palo Alto / Pasadena, CA"
                >
                  Founded a startup that makes self-hosting easy. Built and designed the company: hardware, frontend,
                  backend, infrastructure, marketing, sales, community management, factory assembly, taxes, etc!
                  Launched $200k Kickstarter. Funded by YCombinator in S19.
                </Job>

                <Job
                  title="Lead DevOps Engineer"
                  company="RunKit (acquired by Stripe)"
                  dateRange="Jul 2017 – Jul 2019"
                  location="San Francisco, CA"
                >
                  Transformed RunKit&apos;s reliability engineering from prototype to enterprise-ready. Built a
                  &ldquo;remote-code-execution-as-a-service&rdquo; platform secure enough for Stripe. Sat on the TC39
                  ECMAScript advisory board.
                </Job>

                <Job
                  title="Lead DevOps Engineer"
                  company="Imgur"
                  dateRange="Feb 2016 – Jul 2017"
                  location="San Francisco, CA"
                >
                  Part of a very small team with extremely high traffic (top-10 site, 3-person SRE team).
                  Rearchitected several internet-facing apps to improve reliability and performance. Reduced p99 latency
                  by a factor of 10. Dramatic optimization, upgrade, and migration of extremely busy MySQL datastores
                  with no downtime.
                </Job>

                <Job
                  title="Senior DevOps Engineer"
                  company="TigerText"
                  dateRange="Sep 2014 – Feb 2016"
                  location="Santa Monica, CA"
                >
                  On-call for messaging systems used by large healthcare providers and hospitals. The product&apos;s
                  reliability was mission critical. Chef, Erlang, AWS, and an extremely robust CI/CD chain.
                </Job>

                <p style={{ fontSize: '0.8rem', color: ACCENT, fontStyle: 'italic', marginTop: '0.5rem' }}>
                  There&apos;s a lot more — ask me about what I did before TigerText!
                </p>

                {/* Social — mobile only, sits at the bottom of the content column */}
                <div className="resume-social-mobile">
                  <SectionLabel>Social</SectionLabel>
                  <div style={{ fontSize: '0.82rem', color: '#444', lineHeight: 2.1 }}>
                    <div>
                      <a target="_blank" rel="noreferrer" href="https://twitter.com/erulabs">
                        twitter.com/erulabs
                      </a>
                    </div>
                    <div>
                      <a target="_blank" rel="noreferrer" href="https://github.com/erulabs">
                        github.com/erulabs
                      </a>
                    </div>
                    <div>
                      <a target="_blank" rel="noreferrer" href="https://linkedin.com/in/seandonmooy">
                        linkedin.com/in/seandonmooy
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right column ── */}
              <div className="resume-right" style={{ textAlign: 'right' }}>
                {/* Avatar */}
                <div
                  className="resume-avatar"
                  style={{ display: 'flex', justifyContent: 'right', marginBottom: '1.25rem' }}
                >
                  <Image
                    src={avatar}
                    alt="Seandon Mooy"
                    width={120}
                    height={120}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>

                {/* Contact */}
                <div style={{ fontSize: '0.82rem', color: '#444', lineHeight: 2 }}>
                  <div>seandon.mooy@gmail.com</div>
                  <div>(805) 729-7655</div>
                  <div>Goleta, CA</div>
                </div>

                <div className="resume-hide-mobile">
                  <RightSectionLabel>Strong Suits</RightSectionLabel>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      fontSize: '0.82rem',
                      color: '#444',
                      lineHeight: 2.1,
                    }}
                  >
                    {[
                      'Architecture',
                      'Reliability',
                      'Platform Engineering',
                      'Team Leadership',
                      'Full-stack (HTML to datacenter)',
                    ].map(skill => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>

                  <RightSectionLabel>Some favorite niches</RightSectionLabel>
                  <p style={{ fontSize: '0.82rem', color: '#444', lineHeight: 1.8, margin: 0 }}>
                    Kubernetes, TypeScript, Pulumi, Argo, ScyllaDB, Vitess, Varnish, Mastra
                  </p>
                </div>

                <div className="resume-social-desktop">
                  <RightSectionLabel>On the web</RightSectionLabel>
                  <div style={{ fontSize: '0.82rem', color: '#444', lineHeight: 2.1 }}>
                    <div>
                      <a target="_blank" rel="noreferrer" href="https://twitter.com/erulabs">
                        twitter.com/erulabs
                      </a>
                    </div>
                    <div>
                      <a target="_blank" rel="noreferrer" href="https://github.com/erulabs">
                        github.com/erulabs
                      </a>
                    </div>
                    <div>
                      <a target="_blank" rel="noreferrer" href="https://linkedin.com/in/seandonmooy">
                        linkedin.com/in/seandonmooy
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        html,
        body {
          color-scheme: light;
          background-color: #fff;
          color: #111;
        }

        .resume-social-mobile {
          display: none;
        }
        .resume-contact-mobile {
          display: none;
        }

        @media (max-width: 600px) {
          .resume-wrapper {
            padding-top: 70px !important;
          }
          .resume-content {
            padding: 1.25rem 1rem 3rem !important;
          }
          .resume-grid {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
          .resume-right {
            display: none !important;
          }
          .resume-hide-mobile {
            display: none !important;
          }
          .resume-social-desktop {
            display: none !important;
          }
          .resume-social-mobile {
            display: block;
          }
          .resume-contact-mobile {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.78rem;
            color: #555;
            margin-top: 0.5rem;
            margin-bottom: 0;
          }
          .resume-contact-sep {
            color: #bbb;
          }
          .job-sep {
            display: none;
          }
          .job-meta {
            display: flex;
            flex-direction: column;
            gap: 0.1rem;
          }
        }

        @media print {
          canvas {
            display: none !important;
          }
          header {
            display: none !important;
          }
          .resume-wrapper {
            padding-top: 0 !important;
          }
          .resume-content {
            padding: 1rem !important;
            max-width: 100% !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  )
}
