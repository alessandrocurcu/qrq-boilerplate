var gulp = require("gulp");

// Core utilities
var fs = require("fs");
var path = require("path");

// Third parties utilities
var del = require("del");
var util = require("gulp-util");
var plumber = require("gulp-plumber");
var gulprint = require("gulp-print");
var browserSync = require("browser-sync");
var nodemon = require("gulp-nodemon");
var runSequence = require("run-sequence");
var gulpif = require("gulp-if");
var contentful = require("contentful");
var request = require("request");
var useref = require("gulp-useref");

// Personal configuration
var config = require("./gulpconfig.js")();

// SASS and CSS
var sourcemaps = require("gulp-sourcemaps");
var moduleImporter = require("sass-module-importer");
var autoprefixer = require("gulp-autoprefixer");
var sass = require("gulp-sass");
var uncss = require("gulp-uncss");
var csso = require("gulp-csso");
var combineMq = require('gulp-combine-mq');
var stripCssComments = require('gulp-strip-css-comments');
var cssbeautify = require('gulp-cssbeautify');

// PUG ans HTML
var pug = require("gulp-pug");

// JS
var browserify = require("gulp-browserify");
var uglify = require("gulp-uglify");

// Images
var imagemin = require("gulp-imagemin");



/* pug */
gulp.task("pug", function() {
    log("Compilo pug in html");

    return gulp.src(config.pug.toCompile)
        .pipe(plumber())
        .pipe(gulprint(function(filepath){
            return "File compilato: " + filepath;
        }))
        .pipe(pug({
            pretty: true
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
        .pipe(uncss({html: ["docs/*.html"]}))
        .pipe(combineMq({
            beautify: false
        }))
        .pipe(gulp.dest("docs/css"));
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


/* Images */
gulp.task("image", function(){
    log("Ottimizzo immagini");
    return gulp.src("dev/img/*.{png,svg}")
        .pipe(plumber())
        .pipe(imagemin({
            progressive: true
        }))
        .pipe(gulp.dest(config.img.dest));
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
        ignore: ["./node_modules", "gulpfile.js", "gulpconfig.js", "dev/js/**/.js"]
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
    runSequence("serve", "browser-sync", ["sass:watch", "pug:watch", "js:watch"]);
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
