module.exports = {
  entry: getEntrySources(['./src/index.jsx']),
  output: {
    path: `${__dirname}/build`,
    filename: 'bundle.js',
    sourceMapFilename: 'bundle.js.map'
  },
  module: {
    preLoaders: [
			{ test: /\.jsx?$/, exclude: /node_modules/, loader: 'source-map' }
    ],
    loaders: [
			{ test: /\.less$/, loader: 'style!css!less' },
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.md$/, loader: 'html!markdown?gfm=false' },
			{ test: /\.(jpe?g|png|gif|svg)$/i, loaders: [ 'url?limit=8192', 'img' ] },
			{ test: /\.jsx$/, exclude: /node_modules/,
				loaders: [ 'react-hot', 'babel?presets[]=stage-0,presets[]=react,presets[]=es2015' ] }
    ]
  }
}

function getEntrySources (sources) {
  if (process.env.NODE_ENV !== 'production') {
    sources.push('webpack-dev-server/client?http://localhost:8080')
    sources.push('webpack/hot/only-dev-server')
  }
  return sources
}
