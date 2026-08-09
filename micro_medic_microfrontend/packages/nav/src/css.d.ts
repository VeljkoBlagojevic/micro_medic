/**
 * Lets `tsc` accept `import './styles.css'`. Webpack turns that into a `<style>` tag via
 * style-loader; to the type system it is a side-effect-only module with no exports.
 */
declare module '*.css' {
    const content: string;
    export default content;
}
