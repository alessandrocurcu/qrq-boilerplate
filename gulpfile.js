const gulp = require("gulp");

// Core utilities
const fs = require("fs");
const path = require("path");

// Third parties utilities
const del = require("del");
const util = require("gulp-util");
const plumber = require("gulp-plumber");
const gulprint = require("gulp-print");
const browserSync = require("browser-sync");
const nodemon = require("gulp-nodemon");
const runSequence = require("run-sequence");
const gulpif = require("gulp-if");
const contentful = require("contentful");
const request = require("request");
const useref = require("gulp-useref");
const newer = require('gulp-newer');

// Personal configuration
const config = require("./gulpconfig.js")();

// SASS and CSS
const sourcemaps = require("gulp-sourcemaps");
const moduleImporter = require("sass-module-importer");
const autoprefixer = require("gulp-autoprefixer");
const sass = require("gulp-sass");
const uncss = require("gulp-uncss");
const csso = require("gulp-csso");
const combineMq = require('gulp-combine-mq');
const stripCssComments = require('gulp-strip-css-comments');
const cssbeautify = require('gulp-cssbeautify');

// PUG ans HTML
const pug = require("gulp-pug");

// JS
const browserify = require("gulp-browserify");
const uglify = require("gulp-uglify");
const eslint = require('gulp-eslint');

// Images
const imagemin = require("gulp-imagemin");



/**
 * pug
 * 1. Non ricompila tutti i file ma solo quelli modificati. L'opzione "extra" permette di ricompilare i file pug quando viene modificato un include.
 */
gulp.task("pug", function() {
    log("Compilo pug in html");

    return gulp.src(config.pug.toCompile)
        .pipe(plumber())
        .pipe(pug({
            pretty: true
        }))
        .pipe(util.env.prod ? newer(config.pug.prod.dest) : newer({dest: config.pug.dev.dest, extra: "src/views/**/_*.pug"})) // [1]
        .pipe(gulprint(function(filepath){
            return "File compilato: " + filepath;
        }))
        .pipe(util.env.prod ? gulp.dest(config.pug.prod.dest) : gulp.dest(config.pug.dev.dest))
        .pipe(browserSync.stream());
});

gulp.task("pug:watch", ["pug"], function() {
    log("Osservo i file pug");
    gulp.watch(config.pug.dev.watch, ["pug"]);
});

/* sass */
/**
 * 1. In produzione occorre ritornare lo stream atrimenti Gulp non può sapere quando il task + stato
 *    completato. Ciò è particolarmente utile con gulp-useref, che altrimenti viene eseguito prima
 *    della compilazione dei file SASS.
 * 2. Durante lo sviluppo invece non bisogna ritornare lo stream, altrimenti in caso di errore 
 *    browserysinc non farà il reload del server una volta corretto l'errore.  
 */

gulp.task("sass", function () {
    log("Compilo sass in css");
    if (util.env.prod) { // [1]
        return gulp.src(config.sass.toCompile)
        .pipe(plumber())
        .pipe(gulprint(function(filepath){
            return "File compilato: " + filepath;
        }))
        .pipe(sass({importer: moduleImporter()}))
        .pipe(autoprefixer({
            browsers: ["last 6 versions"]
        }))
        .pipe(uncss({html: [config.sass.prod.uncss]}))
        .pipe(combineMq({
            beautify: false
        }))
        .pipe(gulp.dest(config.sass.prod.dest));
    }
    gulp.src(config.sass.toCompile) // [2]
        .pipe(plumber())
        .pipe(gulprint(function(filepath){
            return "File compilato: " + filepath;
        }))
        .pipe(sourcemaps.init())
        .pipe(sass({importer: moduleImporter()}))
        .pipe(autoprefixer({
            browsers: ["last 6 versions"]
        }))
        .pipe(stripCssComments())
        .pipe(combineMq({
            beautify: false
        }))
        .pipe(cssbeautify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config.sass.dev.dest))
        .pipe(browserSync.stream());
});

gulp.task("sass:watch", ["sass"], function () {
    log("Osservo i file sass");
    gulp.watch(config.sass.dev.watch, ["sass"]);
});

gulp.task("browser-sync", function() {
    browserSync.init({
        proxy: "http://localhost:3000",
        //browser: "firefoxdeveloperedition",
        browser: "google chrome canary",
        port: 7000
    });
});

/* script */
gulp.task("js", function() {
    log("Incorporo insieme gli script");
    return gulp.src(config.js.toCompile)
        .pipe(plumber())
        .pipe(gulprint(function(filepath){
            return "File compilato: " + filepath;
        }))
        .pipe(browserify())
        .pipe(util.env.prod ? gulp.dest(config.js.prod.dest) : gulp.dest(config.js.dev.dest))
        .pipe(browserSync.stream());
});

gulp.task("js:watch", ["js"], function () {
    log("Osservo i file js");
    gulp.watch(config.js.dev.watch, ["js"]);
});


/**
 * Le regole del linting mettile nella root directory in .eslintrc. Usa .eslintignore per ignorare specifiche cartelle.
 */

gulp.task('lint', function() {
  return gulp.src('lib/**').pipe(eslint({
    'rules':{
        'quotes': [1, 'single'],
        'semi': [1, 'always']
    }
  }))
  .pipe(eslint.format())
  // Brick on failure to be super strict
  .pipe(eslint.failOnError());
});


/* Images */
gulp.task("image", function(){
    log("Ottimizzo immagini");
    return gulp.src(config.img.toCompile)
        .pipe(plumber())
        .pipe(imagemin({
            progressive: true
        }))
        .pipe(gulprint(function(filepath){
            return "Immagine ottimizzata: " + filepath;
        }))
        .pipe(util.env.prod ? newer(config.img.prod.dest) : newer(config.img.dev.dest))
        .pipe(util.env.prod ? gulp.dest(config.img.prod.dest) : gulp.dest(config.img.dev.dest));
});

gulp.task("image:watch", ["image"], function () {
    log("Osservo le immagini");
    gulp.watch(config.img.dev.watch, ["image"]);
});

/* Data */
gulp.task("contentful", function(cb) {
    var client = contentful.createClient({
        space: config.contentful.space_id,
        accessToken: config.contentful.access_token
    });

    client.getEntry("1uJ62y9eBasywgGuwk4A0q").then(function(entry){
        var testo = entry.fields;
        fs.writeFileSync("src/testo/testo.json", JSON.stringify(testo));
        cb();
    }); 
});

/* Development */
gulp.task("serve", function () {
    var isDev = true;
    var options = {
        script: "app.js",
        delayTime: 1,
        env: {
            "PORT": 3000,
            "NODE_ENV": isDev ? "dev" : "prod"
        },
        ignore: [config.nodemon.ignore]
    };

    return nodemon(options)
        .on("start", function() {
            log("Ascolto sulla porta 7000 (proxy sulla 3000)");
        })
        .on("restart", function(){
            log("Restart server");
        })
        .on("exit", function(){
            log("Chiudo il server");
        })
        .on("crash", function () {
            log("Lo script è crashato per qualche ragione");
        });
});

gulp.task("dev", function() {
    runSequence("serve", "browser-sync", ["sass:watch", "pug:watch", "js:watch", "image:watch"]);
});


/* Production */
gulp.task("useref", function () {
    log("Sostituisco i file css e js nell'html e li minifico");
    return gulp.src(config.useref.htmlToAnalize)
        .pipe(plumber())
        .pipe(useref())
        .pipe(gulpif("*.js", uglify()))
        .pipe(gulpif("*.css", csso()))
        .pipe(gulp.dest(config.useref.dest));
});

/**
 * Questo task deve usare la flag --prod (gulp build --prod)
 */
gulp.task("build", function(cb) {
    runSequence("clean", "pug", "sass", "js", "image", "useref");

});

gulp.task("clean", function() {
    clean(config.clean.html, "html");
    clean(config.clean.css, "css");
    clean(config.clean.js, "js");
    clean(config.clean.img, "immagini");
});


/* Utilities */
function log(msg) {
    util.log(util.colors.blue(msg));
}

function clean(path, file_type) {
    log("Pulisco " + file_type);
    return del(path);
}
