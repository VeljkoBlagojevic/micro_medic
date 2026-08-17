/**
 * Lets `tsc` accept `import '@micro-medic/design-system/src/global.css'`. Webpack turns it into a
 * `<style>` tag via style-loader; to the type system it is a side-effect-only module.
 *
 * The shell is the only package that imports the *document-wide* theme, which is why it is the only
 * one with CSS loaders in its webpack config. A remote importing `tokens.css` or `global.css` would be
 * the classic micro-frontend collision — two resets in one document, and whichever loads second wins.
 */
declare module '*.css' {
    const content: string;
    export default content;
}
