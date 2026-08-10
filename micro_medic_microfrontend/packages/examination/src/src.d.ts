/**
 * Lets `tsc` accept `import './styles.css'`. Webpack turns that into a `<style>` tag via
 * style-loader; TypeScript has no idea what a stylesheet is and rejects the specifier (TS2882)
 * without this declaration. Mirrors `auth/src/css.d.ts`.
 */
declare module '*.css' {
    const content: string;
    export default content;
}
