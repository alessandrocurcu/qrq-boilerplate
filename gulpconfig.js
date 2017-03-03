module.exports = function() {
    
    var base_dev_dir = "dev/"
    var base_prod_dir = "docs/";

    // Configurazioni esportate
    var config = {

        contentful: {
            space_id    : "xxx",
            access_token: "xxx"
        },

        pug: {
            toCompile: "src/views/!(_base)*.pug",
            dev : {
                watch: ["src/views/**/*.pug"],
                dest: base_dev_dir
            },
            prod: {
                dest: base_prod_dir
            }
        },

        sass: {
            toCompile: "src/sass/*.scss",
            dev: {
                watch: "src/sass/**/*.scss",
                dest : base_dev_dir + "css"
            },
            prod: {
                dest: base_prod_dir + "css",
                uncss : base_prod_dir + "*.html"
            }
        },

        js: {
            toCompile: "src/js/main.js",
            dev: {
                watch: "src/js/**/*.js",
                dest: base_dev_dir + "js"
            },
            prod: {
                dest: base_prod_dir + "js"
            }
        },

        nodemon: {
            ignore: ["./node_modules", "gulpfile.js", "gulpconfig.js", "src/js/**/*.js", base_dev_dir + "js/**/*.js", base_prod_dir + "js/**/*.js"] 
        },

        img: {
            toCompile: "src/img/*.{png,svg,jpg}",
            dev: {
                watch: "src/img/*.{png,svg,jpg}",
                dest: base_dev_dir + "img"
            },
            prod: {
                dest: base_prod_dir + "img"
            }
        },

        useref: {
            htmlToAnalize: base_prod_dir + "index.html",
            dest: base_prod_dir
        },

        clean: {
            html: base_prod_dir + "*.html",
            css : base_prod_dir + "css/*.css",
            js  : base_prod_dir + "js/*.js",
            img : base_prod_dir + "img/*.{svg,png,jpg,jpeg}"
        }
    };

    return config;
};
