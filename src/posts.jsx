// A static index of posts!
// Ordered newest-first, the format is:
// [ short title, date, filename ]
// (hence the constants)
// The short title is used by the sidebar and for URLs,
// The date is just a string and if set to '' will hide date row
// the filename is the name of the Markdown file in public/posts
export const TITLE = 0
export const DATE = 1
export const FILENAME = 2
export const CONTENT = 3
export const PAGENOTFOUND = [ null, null, null, '# 404\nPage not found! :(' ]
export const POSTS = [
  [ 'Hello_World', '3/11/16', 'Hello_World.md' ]
]
