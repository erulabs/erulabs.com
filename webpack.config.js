module.exports = {
  entry: getEntrySources(['./index.jsx']),
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  module: {
    preLoaders: [
			{ test: /\.jsx?$/, exclude: /node_modules/, loader: 'source-map' }
    ],
    loaders: [
			{ test: /\.less$/, loader: 'style!css!less' },
			{ test: /\.jade$/, loader: 'jade' },
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
