'use strict';
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = function(env, argv) {
    if (env === undefined) {
        env = {};
    }

    const production = !!env.production;

    const minify = production;
    const prefixCss = true;
    const sourceMaps = !production;

    const plugins = [
        new WriteFilePlugin(),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new MiniCssExtractPlugin({
            filename: 'main.css'
        }),
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            filename: path.resolve(__dirname, 'index.html'),
            inject: true,
            inlineSource: production ? '.(js|css)$' : undefined,
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
                }
            }
        })
    ];

    return {
        entry: [ './src/index.ts', './src/scss/main.scss' ],
        mode: production ? 'production' : 'development',
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/dist/'
        },
        optimization: {
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
        resolve: {
            extensions: ['.ts', '.js'],
            modules: [path.resolve(__dirname, 'src'), 'node_modules']
        },
        devtool: sourceMaps ? 'eval-source-map' : false,
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader
                        },
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
                    ],
                    exclude: /node_modules/
                }
            ]
        },
        plugins: plugins
    };
};
