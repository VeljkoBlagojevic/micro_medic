/**
 * Lets `tsc` accept the `global.css` import in the standalone harness. Webpack turns it into a
 * `<style>` tag via style-loader; to the type system it is a side-effect-only module with no
 * exports.
 */
declare module '*.css' {
    const content: string;
    export default content;
}
