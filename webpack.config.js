'use strict';
const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = function(env, argv) {
    if (env === undefined) {
        env = {};
    }

    const minify = !!env.production;
    const prefixCss = true;
    const sourceMaps = !env.production;

    const plugins = [
        new WriteFilePlugin(),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new ExtractTextPlugin({
            filename: 'main.css'
        }),
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            filename: path.resolve(__dirname, 'index.html'),
            inject: true,
            inlineSource: env.production ? '.(js|css)$' : undefined,
            minify: minify
                ? {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true
                }
                : false
        }),
        new HtmlWebpackInlineSourcePlugin(),
        new UglifyJsPlugin({
            parallel: true,
            sourceMap: sourceMaps,
            uglifyOptions: {
                ecma: 5,
                compress: minify,
                mangle: minify,
                output: {
                    beautify: !minify,
                    comments: false,
                    ecma: 5
                },
                sourceMap: sourceMaps,
            }
        })
    ];

    return {
        entry: [ './src/index.ts', './src/scss/main.scss' ],
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/dist/'
        },
        resolve: {
            extensions: ['.ts', '.js'],
            modules: [path.resolve(__dirname, 'src'), 'node_modules']
        },
        externals: {
            'typed.js': 'Typed'
        },
        devtool: sourceMaps ? 'inline-source-map' : false,
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.scss$/,
                    use: ExtractTextPlugin.extract({
                        fallback: 'style-loader',
                        use: [
                            {
                                loader: 'css-loader',
                                options: {
                                    minimize: minify,
                                    sourceMap: sourceMaps,
                                    url: false
                                }
                            },
                            {
                                loader: 'postcss-loader',
                                options: {
                                    ident: 'postcss',
                                    plugins: prefixCss
                                        ? [ require('autoprefixer')({ browsers: ['last 2 versions'] }) ]
                                        : [],
                                    sourceMap: sourceMaps
                                }
                            },
                            {
                                loader: 'sass-loader',
                                options: {
                                    sourceMap: sourceMaps
                                }
                            }
                        ]
                    }),
                    exclude: /node_modules/
                }
            ]
        },
        plugins: plugins
    };
};
