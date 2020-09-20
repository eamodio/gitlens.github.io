'use strict';
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const glob = require('glob');
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

class InlineChunkHtmlPlugin {
	constructor(htmlPlugin, patterns) {
		this.htmlPlugin = htmlPlugin;
		this.patterns = patterns;
	}

	getInlinedTag(publicPath, assets, tag) {
		if (
			(tag.tagName !== 'script' || !(tag.attributes && tag.attributes.src)) &&
			(tag.tagName !== 'link' || !(tag.attributes && tag.attributes.href))
		) {
			return tag;
		}

		let chunkName = tag.tagName === 'link' ? tag.attributes.href : tag.attributes.src;
		if (publicPath) {
			chunkName = chunkName.replace(publicPath, '');
		}
		if (!this.patterns.some(pattern => chunkName.match(pattern))) {
			return tag;
		}

		const asset = assets[chunkName];
		if (asset == null) {
			return tag;
		}

		return { tagName: tag.tagName === 'link' ? 'style' : tag.tagName, innerHTML: asset.source(), closeTag: true };
	}

	apply(compiler) {
		let publicPath = compiler.options.output.publicPath || '';
		if (publicPath && !publicPath.endsWith('/')) {
			publicPath += '/';
		}

		compiler.hooks.compilation.tap('InlineChunkHtmlPlugin', compilation => {
			const getInlinedTagFn = tag => this.getInlinedTag(publicPath, compilation.assets, tag);

			this.htmlPlugin.getHooks(compilation).alterAssetTagGroups.tap('InlineChunkHtmlPlugin', assets => {
				assets.headTags = assets.headTags.map(getInlinedTagFn);
				assets.bodyTags = assets.bodyTags.map(getInlinedTagFn);
			});
		});
	}
}

module.exports = function(esnv, argv) {
	const mode = argv.mode || 'none';

	const plugins = [
		new ForkTsCheckerPlugin({
			async: false,
			eslint: { enabled: true, files: 'src/**/*.ts', options: { cache: true } },
			formatter: 'basic',
		}),
		new WriteFilePlugin(),
		new MiniCssExtractPlugin({
			filename: 'main.css'
		}),
		new PurgecssPlugin({
			paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`, { nodir: true }),
			whitelistPatterns: [/is-section--.*/, /iframe/]
		}),
		new HtmlPlugin({
			template: 'src/index.html',
			excludeAssets: [/.+-styles\.js/],
			filename: path.resolve(__dirname, 'index.html'),
			inject: true,
			inlineSource: mode === 'production' ? '.(js|css)$' : undefined,
			minify:
				mode === 'production'
					? {
							removeComments: true,
							collapseWhitespace: true,
							removeRedundantAttributes: false,
							useShortDoctype: true,
							removeEmptyAttributes: true,
							removeStyleLinkTypeAttributes: true,
							keepClosingSlash: true,
							minifyCSS: true,
							minifyJS: true
					  }
					: false
		}),
		new InlineChunkHtmlPlugin(HtmlPlugin, mode === 'production' ? ['\\.(js|css)$'] : []),
	];

	return {
		entry: ['./src/index.ts', './src/scss/main.scss'],
		mode: mode === 'production' ? 'production' : 'development',
		devtool: mode === 'production' ? undefined : 'source-map', //'eval-source-map',
		output: {
			filename: '[name].js',
			path: path.resolve(__dirname, 'dist'),
			publicPath: '/dist/'
		},
		optimization: {
			minimizer: [
				new TerserPlugin({
					cache: true,
					parallel: true,
					sourceMap: true,
					terserOptions: {
						ecma: 6,
						compress: mode === 'production',
						mangle: mode === 'production',
						output: {
							beautify: mode !== 'production',
							comments: false,
							ecma: 6
						}
					}
				})
			],
			splitChunks: {
				cacheGroups: {
					styles: {
						name: 'styles',
						test: /\.css$/,
						chunks: 'all',
						enforce: true
					}
				}
			}
		},
		module: {
			rules: [
				{
					exclude: /node_modules|\.d\.ts$/,
					test: /\.tsx?$/,
					use: {
						loader: 'ts-loader',
						options: {
							experimentalWatchApi: true,
							transpileOnly: true
						}
					}
				},
				{
					exclude: /node_modules/,
					test: /\.scss$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader
						},
						{
							loader: 'css-loader',
							options: {
								sourceMap: mode !== 'production',
								url: false
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									plugins: [['autoprefixer', { }]],
								},
								sourceMap: mode !== 'production'
							}
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: mode !== 'production'
							}
						}
					]
				}
				// {
				// 	test: /\.ejs$/,
				// 	loader: 'ejs-loader'
				// }
			]
		},
		resolve: {
			extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
			modules: [path.resolve(__dirname, 'src'), 'node_modules']
		},
		plugins: plugins,
		stats: {
			all: false,
			assets: true,
			builtAt: true,
			env: true,
			errors: true,
			timings: true,
			warnings: true
		}
	};
};
