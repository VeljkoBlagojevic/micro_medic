const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

module.exports = {
    entry: "./src/index.ts",
    cache: false,

    mode: "development",
    devtool: "source-map",

    optimization: {
        minimize: false,
    },

    output: {
        publicPath: "http://localhost:3005/",
    },

    devServer: {
        port: 3005,
        historyApiFallback: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
        },
    },

    resolve: {
        extensions: [".ts", ".js", ".json"],
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                exclude: /node_modules/,
                options: {
                    transpileOnly: true,
                },
            },
        ],
    },

    plugins: [
        new ModuleFederationPlugin({
            name: "shared_store",
            library: { type: "var", name: "shared_store" },
            filename: "remoteEntry.js",
            remotes: {},
            exposes: {
                "./store": "./src/index",
            },
            shared: {
                '@micro-medic/api-client': {
                    singleton: true,
                    requiredVersion: '1.0.0',
                },
                '@micro-medic/shared-types': {
                    singleton: true,
                    requiredVersion: '1.0.0',
                },
                axios: {
                    singleton: true,
                },
            },
        }),
        new HtmlWebpackPlugin({
            template: "./public/index.html",
        })
    ],
};