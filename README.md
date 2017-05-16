# README

Boilerplate.

## Librerie esterne
### SASS
* Modular Scale
* Typi
* Susy

## Comandi
* `gulp dev`: esegue ambiente di sviluppo con browser-sync. Compila e controlla (watch) file `.pug`,`.scss` e `.js`.
* `gulp build --prod`: comando per la build.

## Sviluppo
### CSS
* Autoprefixer
* Strip comments
* Combine media queries
* Beautify CSS

## Produzione
### CSS
* Autoprefixer
* Uncss
* Combine media queries
* Useref (con CSSO)

### JS
* Useref (con Uglify)

### Immagini
* Imagemin

## JS Bundler
* Browserify

## Utilities
* [Image-size](https://github.com/image-size/image-size) per ottenere semplicemente le dimensioni di un'immagine.
* [Imagesloaded](http://imagesloaded.desandro.com/): gestisce il caricamento delle immagini

## Hosting
### Netlify
* Deve avere `gulp` installato come dependency.
* Hai bisogno di un file .nvmrc nella root del progetto per dire a Netlify quale versione di NodeJS usare: `node -v  > .nvmrc`

## ToDo
* Autoprefixer: definisci nel task i browser da supportare.
* Aggiorna a Gulp 4.
* Definisci ESLint.
