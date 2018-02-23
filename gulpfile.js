const gulp = require('gulp');
const plumber = require('gulp-plumber');
const gulpFilter = require('gulp-filter');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer')
const browserSync = require('browser-sync');
const gulpSync = require('gulp-sync')(gulp);
const clean = require('gulp-clean');
const htmlmin = require('gulp-htmlmin');
const rename = require('gulp-rename');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const iife = require("gulp-iife");
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const connect = require('gulp-connect-php');
const jshint = require('gulp-jshint');
const sassLint = require('gulp-sass-lint');
const gutil = require('gulp-util');
const CacheBuster = require('gulp-cachebust');

const cachebust = new CacheBuster(
  {
    pathFormatter: function (dirname, basename, extname, checksum) {
      return require('path').join(dirname, basename + '.' + checksum + extname);
    }
  }
);

let defaultTasks = ['build', 'watch', 'serve'];

gulp.task('clean', function () {
  return gulp.src('build', { read: false })
    .pipe(clean())
})

  gulp.task('clean:production', function() {
    return gulp.src('dist', { read: false })
      .pipe(clean())
  })

gulp.task('css', function () {
  return gulp.src('src/css/**/*.sass')
    .pipe(plumber({
      errorHandler: error => {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(sassLint({ configFile: 'sass-lint.yml' }))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(autoprefixer(['last 2 versions', 'ie 8', 'ie 9', '> 1%']))
    .pipe(sourcemaps.write('.', {
      mapFile: mapFilePath => mapFilePath.replace('.js.map', '.map')
    }))
    .pipe(gulp.dest('build/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
})

gulp.task('libs', function() {

  const stylesPaths = [
    'node_modules/normalize.css/normalize.css',
    'node_modules/bulma/css/bulma.css',
    'node_modules/font-awesome/css/font-awesome.min.css',
    'node_modules/sweetalert2/dist/sweetalert2.min.css'
  ]

  const scriptsPaths = [
    'node_modules/jquery/dist/jquery.min.js',
    'node_modules/sweetalert2/dist/sweetalert2.min.js',
    'node_modules/jquery-color-animation/jquery.animate-colors-min.js'
  ]

  const fontsPaths = [
    'node_modules/font-awesome/fonts/*.*'
  ]

  const fontsExtensions = ['**/*.eot', '**/*.woff', '**/*.woff2', '**/*.svg', '**/*.ttf'];

  const libraryPaths = stylesPaths.concat(scriptsPaths, fontsPaths)
  const jsFilter = gulpFilter('**/*.js', { restore: true });
  const cssFilter = gulpFilter('**/*.css', { restore: true });
  const fontFilter = gulpFilter(fontsExtensions, { restore: true });

  return gulp.src(libraryPaths)

    .pipe(plumber({
      errorHandler: error => {
        console.log(error.message);
        this.emit('end');
      }
    }))

    // JS
    .pipe(jsFilter)
    .pipe(concat('libs.js'))
    .pipe(rename({ suffix: ".min" }))
    .pipe(uglify())
    .pipe(gulp.dest('build/js'))
    .pipe(jsFilter.restore)

    // CSS
    .pipe(cssFilter)
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(concat('libs.min.css'))
    .pipe(gulp.dest('build/css'))
    .pipe(cssFilter.restore)

    // Fonts
    .pipe(fontFilter)
    .pipe(gulp.dest('build/fonts'));
})

gulp.task('js', function () {
  return gulp.src('src/js/*.js')
    .pipe(plumber({
      errorHandler: error => {
        console.log(error.message);
        this.emit('end');
      }
    }))
    .pipe(jshint({
      maxerr: 50,
      jquery: '$',
      esversion: 6
    }))
    .pipe(jshint.reporter('default'))
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(iife())
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('.', {
      mapFile: mapFilePath => mapFilePath.replace('.js.map', '.map')
    }))
    .pipe(gulp.dest('build/js'))
    .pipe(browserSync.reload({ stream: true }))
});

gulp.task('copy:all', function() {
  return gulp.src('src/**/*.*')
    .pipe(gulp.dest('build'))
    .pipe(browserSync.reload({
      stream: true
    }))
})

  gulp.task('copy:sass:dev', function() {
    return gulp.src('src/css/**/*.sass')
      .pipe(gulp.dest('build/css'))
  })

  gulp.task('copy:html:dev', function () {
    return gulp.src('src/*.html')
      .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(gulp.dest('build'));
  });

  gulp.task('copy:php:dev', function () {
    return gulp.src('src/**/*.php')
      .pipe(gulp.dest('build'))
  })

  gulp.task('copy:fonts:production', function () {
    return gulp.src('build/fonts/*.*')
      .pipe(gulp.dest('dist/fonts'))
  })

  gulp.task('copy:css:production', function () {
    return gulp.src('build/css/*.min.css')
      .pipe(gulp.dest('dist/css'))
  })

  gulp.task('copy:js:production', function () {
    return gulp.src('build/js/*.min.js')
      .pipe(gulp.dest('dist/js'))
  })

  gulp.task('copy:pages:production', function () {
    return gulp.src([
      'build/**/*.php',
      'build/**/*.html'
    ])
      .pipe(gulp.dest('dist'))
  })

gulp.task('serve', function () {
  browserSync.init({
    server: "build"
  });
})

  gulp.task('serve:php', function () {
    const proxy = 'localhost:3838';
    const serverConfig = {
      base: 'build',
      port: 3838,
      livereload: true
    };

    connect.server(serverConfig, function() { 
      browserSync({
        proxy: proxy,
        port: 3000
      })
    });
  });

gulp.task('build:production:rmcache-css', function () {
  return gulp.src('dist/css/*.css')
    .pipe(cachebust.resources())
    .pipe(gulp.dest('dist/css'));
});

gulp.task('build:production:rmcache-js', function () {
  return gulp.src('dist/js/*.js')
    .pipe(cachebust.resources())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('build:production:rmcache', ['build:production:rmcache-css', 'build:production:rmcache-js'], function () {
  return gulp.src([
    'build/**/*.php',
    'build/**/*.html'
  ])
    .pipe(cachebust.references())
    .pipe(gulp.dest('dist'));
});


gulp.task('watch', function () {
  gulp.watch("src/**/*.js", ['js']);
  gulp.watch("src/**/*.sass", ['css']);
  gulp.watch("src/**/*.html", ['copy:html:dev']).on('change', browserSync.reload);
  gulp.watch("src/**/*.php", ['copy:php:dev']).on('change', browserSync.reload);
})

gulp.task('build', gulpSync.sync(['clean', 'copy:all', 'css', 'js', 'libs']));

gulp.task('build:production', ['copy:fonts:production', 'copy:css:production', 'copy:js:production', 'copy:pages:production'])

gulp.task('dist', gulpSync.sync(['build', 'clean:production', 'build:production', 'build:production:rmcache']))

gulp.task('default', gulpSync.sync(defaultTasks));

