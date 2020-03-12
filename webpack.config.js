'use strict';
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');
const glob = require('glob');
const HtmlInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = function(env, argv) {
	env = env || {};
	env.production = Boolean(env.production);

	const plugins = [
		new ForkTsCheckerPlugin({
			async: false,
			eslint: true,
			useTypescriptIncrementalApi: true
		}),
		new WriteFilePlugin(),
		new MiniCssExtractPlugin({
			filename: 'main.css'
		}),
		new PurgecssPlugin({
			paths: glob.sync(`${path.join(__dirname, 'src')}/**/*`, { nodir: true }),
			whitelistPatterns: [/is-section--.*/]
		}),
		new HtmlPlugin({
			template: 'src/index.ejs',
			filename: path.resolve(__dirname, 'index.html'),
			inject: true,
			inlineSource: env.production ? '.(js|css)$' : undefined,
			minify: env.production
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
		new HtmlInlineSourcePlugin()
	];

	return {
		entry: ['./src/index.ts', './src/scss/main.scss'],
		mode: env.production ? 'production' : 'development',
		devtool: env.production ? undefined : 'source-map', //'eval-source-map',
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
						compress: env.production,
						mangle: env.production,
						output: {
							beautify: !env.production,
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
								sourceMap: !env.production,
								url: false
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								ident: 'postcss',
								plugins: [require('autoprefixer')()],
								sourceMap: !env.production
							}
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: !env.production
							}
						}
					]
				},
				{
					test: /\.ejs$/,
					loader: 'ejs-loader'
				}
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
