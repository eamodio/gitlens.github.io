'use strict';
const path = require('path');
const HtmlInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = function(env, argv) {
    env = env || {};
    env.production = !!env.production;
    env.prefixCss = true;

    const plugins = [
        new WriteFilePlugin(),
        new MiniCssExtractPlugin({
            filename: 'main.css'
        }),
        new HtmlPlugin({
            template: 'src/index.html',
            filename: path.resolve(__dirname, 'index.html'),
            inject: true,
            inlineSource: env.production ? '.(js|css)$' : undefined,
            minify: env.production
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
        new HtmlInlineSourcePlugin()
    ];

    return {
        entry: ['./src/index.ts', './src/scss/main.scss'],
        mode: env.production ? 'production' : 'development',
        devtool: !env.production ? 'eval-source-map' : undefined,
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/dist/'
        },
        optimization: {
            minimizer: [
                new UglifyJsPlugin({
                    parallel: true,
                    sourceMap: !env.production,
                    uglifyOptions: {
                        ecma: 5,
                        compress: env.production,
                        mangle: env.production,
                        output: {
                            beautify: !env.production,
                            comments: false,
                            ecma: 5
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
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            modules: [path.resolve(__dirname, 'src'), 'node_modules']
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    enforce: 'pre',
                    use: 'tslint-loader'
                },
                {
                    test: /\.tsx?$/,
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
                                minimize: env.production,
                                sourceMap: !env.production,
                                url: false
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: env.prefixCss
                                    ? [require('autoprefixer')({ browsers: ['last 2 versions'] })]
                                    : [],
                                sourceMap: !env.production
                            }
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: !env.production
                            }
                        }
                    ],
                    exclude: /node_modules/
                }
            ]
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
