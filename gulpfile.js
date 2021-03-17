let project_folder = require("path").basename(__dirname);
let source_folder = "#src";
let fs = require("fs");
let path = {
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/",
  },
  src: {
    html: [
      source_folder + "/*.html",
      "!" + source_folder + "/_*.html",
    ],
    css: source_folder + "/scss/style.scss",
    js: source_folder + "/js/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,webp,gif.ico}",
    fonts: source_folder + "/fonts/*.ttf",
  },
  watch: {
    html: source_folder + "/**/*.html",
    css: source_folder + "/scss/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,webp,gif.ico}",
  },
  clean: "./" + project_folder + "/",
};

let { src, dest } = require("gulp"),
  gulp = require("gulp"),
  browsersync = require("browser-sync").create(),
  fileinclude = require("gulp-file-include"),
  del = require("del"),
  scss = require("gulp-sass"),
  imagemin = require("gulp-imagemin"),
  ttf2woff = require("gulp-ttf2woff"),
  ttf2woff2 = require("gulp-ttf2woff2"),
  uglify = require("gulp-uglify"),
  autoprefixer = require("gulp-autoprefixer"),
  cssbeautify = require("gulp-cssbeautify"),
  remove = require("gulp-strip-css-comments"),
  cssnano = require("gulp-cssnano"),
  rename = require("gulp-rename");

function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: "./" + project_folder + "/",
    },
    port: 3000,
    notify: false,
  });
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function css() {
  return src([path.src.css,
    // 'node_modules/slick-carousel/slick/slick.css',
    // 'node_modules/fullpage.js/dist/fullpage.css'
      // 'node_modules/magnific-popup/dist/magnific-popup.css'

  ])
    .pipe(
      scss({
        outputStyle: "expanded",
      })
    )
    .pipe(autoprefixer({
      cascade: true
    }))
    .pipe(cssbeautify())
    .pipe(dest(path.build.css))
    .pipe(cssnano({
      zindex: false,
      discardComments: {
        removeAll: true
      }
    }))
    .pipe(remove())
    .pipe(rename({
      suffix:".min",
      extname:".css"
    }))
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function js() {
  return src([path.src.js,
  // 'node_modules/slick-carousel/slick/slick.js',
  // 'node_modules/fullpage.js/dist/fullpage.js'
  // 'node_modules/magnific-popup/dist/jquery.magnific-popup.min.js'
])
    .pipe(fileinclude())
    .pipe(uglify())
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.img)
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        optimizationlevel: 3,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}

function fonts(params) {
  src(path.src.fonts).pipe(ttf2woff())
  .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
}

function woff(params){
  return src(source_folder + "/fonts/*.{woff,woff2}")
  .pipe(dest(project_folder + "/fonts/"));
}

async function fontsStyle(params) {
  let file_content = fs.readFileSync(
    source_folder + "/scss/fonts.scss"
  );
  if (file_content == "") {
    fs.writeFile(source_folder + "/scss/fonts.scss", "", cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(
              source_folder + "/scss/fonts.scss",
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            );
          }
          c_fontname = fontname;
        }
      }
    });
  }
}

function cb() {}

function watchFiles(params) {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
}

function clean(params) {
  return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts, woff),fontsStyle);
let watch = gulp.parallel(watchFiles, build, browserSync);

exports.clean = clean;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.build = build;
exports.html = html;
exports.watch = watch;
exports.default = watch;
