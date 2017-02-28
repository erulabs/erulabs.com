
require('file-loader?name=posts/[name].[ext]!./posts/test.md')

export default [
  {
    title: 'Title1',
    date: 'somedate',
    body: '# foobar',
    file: 'test.md'
  },
  {
    title: 'Title1',
    date: 'somedate',
    body: '# foobar',
    file: 'test.md'
  },
  {
    title: 'Title1',
    date: 'somedate',
    body: '# foobar',
    file: 'test.md'
  }
]
