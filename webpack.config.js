// @flow

const fs = require('fs')
const webpack = require('webpack')
const DEV_PORT = parseInt(process.env.DEV_PORT, 10) || 3005

module.exports = {
  entry: getEntrySources(['./src/index.js']),
  plugins: getPlugins(),
  output: {
    path: `${__dirname}/_build`,
    filename: 'index.js',
    sourceMapFilename: 'index.js.map'
  },
  module: {
    loaders: [
      { test: /\.less$/, loader: 'css-loader!less-loader' },
      { test: /\.md$/, loader: 'raw-loader' },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: ['url-loader?limit=8192', 'img-loader']
      }
    ]
  },
  devServer: {
    proxy: {
      '/': {
        // $FlowIssue
        bypass: (req, res, proxyOptions) => {
          if (req.path !== '/' && fs.existsSync(`_build${req.path}`)) {
            return req.path
          } else return '/index.html'
        }
      }
    }
  }
}

function getPlugins () {
  return [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({ compressor: { warnings: false } })
  ]
}

function getEntrySources (sources) {
  if (process.env.NODE_ENV !== 'production') {
    sources.push(`webpack-dev-server/client?http://localhost:${DEV_PORT}`)
    sources.push('webpack/hot/only-dev-server')
  }
  return sources
}
