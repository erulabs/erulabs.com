import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const postsDirectory = path.join(process.cwd(), 'posts')

// In-memory cache for rendered posts
const postCache = new Map()

// Format date to avoid hydration mismatches
function formatDate(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

// Get all post slugs for static paths
export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory)
  return fileNames
    .filter(fileName => fileName.endsWith('.mdx') || fileName.endsWith('.md'))
    .map(fileName => ({
      params: {
        slug: fileName.replace(/\.mdx?$/, ''),
      },
    }))
}

// Get sorted posts data for listing
export function getSortedPostsData() {
  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.mdx') || fileName.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.mdx?$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const matterResult = matter(fileContents)

      return {
        slug,
        title: matterResult.data.title || slug,
        date: matterResult.data.date || null,
        formattedDate: formatDate(matterResult.data.date),
        description: matterResult.data.description || null,
        ...matterResult.data,
      }
    })

  // Sort by date (newest first)
  return allPostsData.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date < b.date ? 1 : -1
  })
}

// Get post data by slug (with caching)
export async function getPostData(slug) {
  // Check cache first
  if (postCache.has(slug)) {
    return postCache.get(slug)
  }

  // Try .mdx first, then .md
  let fullPath = path.join(postsDirectory, `${slug}.mdx`)
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(postsDirectory, `${slug}.md`)
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const matterResult = matter(fileContents)

  // Use remark to convert markdown to HTML
  const processedContent = await remark().use(html).process(matterResult.content)
  const contentHtml = processedContent.toString()

  const postData = {
    slug,
    contentHtml,
    title: matterResult.data.title || slug,
    date: matterResult.data.date || null,
    formattedDate: formatDate(matterResult.data.date),
    description: matterResult.data.description || null,
    ...matterResult.data,
  }

  // Cache the rendered post
  postCache.set(slug, postData)

  return postData
}
