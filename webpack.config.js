var path = require('path');
var webpack = require('webpack');
var OpenBrowserPlugin = require('open-browser-webpack-plugin');
var HtmlWebpackPlugin = require("html-webpack-plugin");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
// const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
var autoprefixer = require("autoprefixer");
const cssnext = require('postcss-cssnext');
const impy = require('postcss-import');
const glob = require('glob');
const debug = process.env.NODE_ENV !== 'production';
function getEntry(patterns, pathDir) {
    var files = glob.sync(patterns);
    var entries = {},
        entry,
        dirname,
        basename,
        pathname,
        extname;

    for (var i = 0; i < files.length; i++) {
        entry = files[i];
        dirname = path.dirname(entry);
        extname = path.extname(entry);
        basename = path.basename(entry, extname);
        pathname = path.join(dirname, basename);
        pathname = pathDir
            ? pathname.replace(new RegExp('^' + pathDir), '')
            : pathname;
        entries[pathname] = ['./' + entry];
    }
    return entries;
}
var entries = getEntry('app/js/*.js', 'app/js/');
console.log('webpack entry==>', JSON.stringify(entries));
var chunks = Object.keys(entries);
var baseConfig = {
    target: "web",
    cache: true,
    devtool: 'cheap-source-map',
    context: __dirname,
    entry: entries,
    output: {
        path: path.join(__dirname, 'build'),
        publicPath: '/build/',
        filename: 'js/[name].js',
        chunkFilename: 'js/[id].chunk.js?[chunkhash]'
    },
    module: {
        loaders: [
            {
                test: /\.js[x]?$/,
                exclude: /(node_modules|bower_components)/,
                loaders: ['babel?cacheDirectory=true']
            }, {
                test: /\.css$/,
                // include: path.resolve(__dirname, 'public'),
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
            }, {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('css!less')
            }, {
                test: /\.html$/,
                loader: "html?-minimize" //避免压缩html,https://github.com/webpack/html-loader/issues/50
            }, {
                test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader?name=[path][name].[ext]?[hash:8]'
            }, {
                test: /\.(png|jpe?g|gif)$/,
                loader: 'url-loader?limit=8192&name=img/[name]-[hash].[ext]'
            }, {
                test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
                loader: 'url-loader',
                query: {
                    name: '[path][name].[ext]?[hash:8]',
                    limit: 10000
                }
            }, {
                test: /\.json?$/,
                loader: 'json'
            }
        ]
    },
    resolve: {
        alias: {},
        extensions: [
            '', '.js', '.jsx', '.json'
        ],
        modulesDirectories: ['node_modules', 'bower_components', 'dist']
    },
    plugins: [
        // new webpack.ProvidePlugin({ //加载jq     $: 'jquery' }),
        new webpack
            .optimize
            .CommonsChunkPlugin({
                name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
                chunks: chunks,
                minChunks: 2 //chunks.length // 提取所有entry共同依赖的模块
            }),
        new webpack.NoErrorsPlugin(),
        new ExtractTextPlugin('css/[name].css'), //单独使用link标签加载css并设置路径，相对于output配置中的publickPath
        debug
            ? function () {}
            : new UglifyJsPlugin({ //压缩代码
                compress: {
                    warnings: false
                },
                except: ['$super', '$', 'exports', 'require'] //排除关键字
            }),
        // new FaviconsWebpackPlugin(path.resolve(__dirname, 'app/img/favicon.ico'))
    ],
    postcss: function () {
        return {
            defaults: [
                impy, autoprefixer, cssnext
            ],
            cleaner: [autoprefixer({browsers: ['last 2 version']})]
        };
    }
}
function ConfigHtmlWebpackPlugin(webpackConfig) {
    var config = webpackConfig;
    var htmls = getEntry('app/views/**/*.html', 'app/views/');
    var pages = Object.keys(htmls);
    pages.forEach(function (pathname) {
        var conf = {
            filename: 'views/' + pathname + '.html', //生成的html存放路径，相对于path
            template: 'app/views/' + pathname + '.html', //html模板路径
            inject: false, //js插入的位置，true/'head'/'body'/false
        };

        if (pathname in config.entry) {
            conf.favicon = path.resolve(__dirname, 'app/img/favicon.ico');
            conf.inject = 'body';
            //conf.chunks = ['vendors', pathname];
            conf.hash = true;
        }
        console.log('config HtmlWebpackPlugin-->', JSON.stringify(conf));
        config
            .plugins
            .push(new HtmlWebpackPlugin(conf));
    });
}

ConfigHtmlWebpackPlugin(baseConfig);
baseConfig.plugins = baseConfig
    .plugins
    .concat([
        //new webpack.optimize.DedupePlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV) || 'development'
            }
        }),
        new OpenBrowserPlugin({url: 'http://localhost:8080/build/views/index.html', delay: 500, ignoreErrors: true})
    ]);


baseConfig.devServer = {
    contentBase: './build',
    host: 'localhost',
    port: 8080, //默认8080
    inline: true, //可以监控js变化
    hot: true, //热启动
};

module.exports = baseConfig;