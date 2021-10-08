'use strict';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const glob = require('glob');
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (env, argv) {
	const mode = argv.mode || 'none';

	const plugins = [
		new ForkTsCheckerPlugin({
			async: false,
			eslint: { enabled: true, files: 'src/**/*.ts', options: { cache: true } },
			formatter: 'basic',
		}),
		new MiniCssExtractPlugin({
			filename: 'main.css',
		}),
		new PurgecssPlugin({
			paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`, { nodir: true }),
			safelist: {
				standard: [/iframe/],
				greedy: [/is-section--.*/, /data-version/],
			},
		}),
		new HtmlPlugin({
			template: 'src/index.html',
			chucks: ['site'],
			excludeAssets: [/css\.js/],
			filename: path.resolve(__dirname, 'index.html'),
			inject: true,
			scriptLoading: mode === 'production' ? 'blocking' : 'defer',
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
							minifyJS: true,
					  }
					: false,
		}),
		new InlineChunkHtmlPlugin(HtmlPlugin, mode === 'production' ? ['\\.(js|css)$'] : []),
	];

	return {
		entry: {
			main: './src/index.ts',
			css: './src/scss/main.scss',
		},
		mode: mode,
		devServer: {
			hot: false,
			// client: {
			// 	webSocketURL: 'https://strange-eagle-13.loca.lt/',
			// },
			devMiddleware: {
				writeToDisk: (filePath) => !/css\.js/.test(filePath),
			},
			liveReload: true,
			port: 8090,
			static: {
				directory: __dirname,
				watch: true,
			},
		},
		devtool: 'source-map',
		output: {
			filename: '[name].js',
			path: path.resolve(__dirname, 'dist'),
			publicPath: '/dist/',
		},
		optimization: {
			minimizer: [
				new TerserPlugin({
					parallel: true,
					terserOptions: {
						ecma: 6,
						compress: mode === 'production',
						mangle: mode === 'production',
						output: {
							beautify: mode !== 'production',
							comments: false,
							ecma: 6,
						},
					},
				}),
			],
			splitChunks: {
				cacheGroups: {
					styles: {
						name: 'styles',
						test: /\.css$/,
						chunks: 'all',
						enforce: true,
					},
				},
			},
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: {
						loader: 'ts-loader',
						options: {
							experimentalWatchApi: true,
							transpileOnly: true,
						},
					},
					exclude: /\.d\.ts$/,
				},
				{
					test: /\.scss$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader,
						},
						{
							loader: 'css-loader',
							options: {
								sourceMap: true,
								url: false,
							},
						},
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									plugins: [['autoprefixer', {}]],
								},
								sourceMap: true,
							},
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true,
							},
						},
					],
					exclude: /node_modules/,
				},
				{
					test: /\.(png|jpg|svg)$/,
					loader: 'url-loader',
				},
			],
		},
		resolve: {
			extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
			modules: [path.resolve(__dirname, 'src'), 'node_modules'],
		},
		plugins: plugins,
		stats: {
			preset: 'errors-warnings',
			assets: true,
			colors: true,
			env: true,
			errorsCount: true,
			warningsCount: true,
			timings: true,
		},
	};
};

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
		if (!this.patterns.some((pattern) => chunkName.match(pattern))) {
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

		compiler.hooks.compilation.tap('InlineChunkHtmlPlugin', (compilation) => {
			const getInlinedTagFn = (tag) => this.getInlinedTag(publicPath, compilation.assets, tag);

			this.htmlPlugin.getHooks(compilation).alterAssetTagGroups.tap('InlineChunkHtmlPlugin', (assets) => {
				assets.headTags = assets.headTags.map(getInlinedTagFn);
				assets.bodyTags = assets.bodyTags.map(getInlinedTagFn);
			});
		});
	}
}
