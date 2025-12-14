const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: {
            background: './src/background/index.ts',
            popup: './src/popup/index.ts',
            manager: './src/pages/manager/index.ts',
            'content-scroll': './src/content/scroll-capture.ts',
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            clean: true,
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, 'css-loader'],
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@services': path.resolve(__dirname, 'src/services'),
                '@models': path.resolve(__dirname, 'src/models'),
                '@utils': path.resolve(__dirname, 'src/utils'),
                '@types': path.resolve(__dirname, 'src/types'),
            },
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].css',
            }),
            new HtmlWebpackPlugin({
                template: './src/popup/index.html',
                filename: 'popup.html',
                chunks: ['popup'],
            }),
            new HtmlWebpackPlugin({
                template: './src/pages/manager/index.html',
                filename: 'manager.html',
                chunks: ['manager'],
            }),
            new CopyPlugin({
                patterns: [
                    { from: 'src/manifest.json', to: 'manifest.json' },
                    { from: 'public/icons', to: 'icons', noErrorOnMissing: true },
                ],
            }),
        ],
        devtool: isProduction ? false : 'inline-source-map',
        optimization: {
            minimize: isProduction,
        },
    };
};
