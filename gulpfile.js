var gulp = require("gulp"),   
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint'),
    less = require('gulp-less'),
    watch = require("gulp-watch"),
    clean = require('del'),
    csso = require('gulp-csso')
    sprite = require('gulp.spritesmith'),
    rename = require('gulp-rename'), 
    notify = require('gulp-notify');
var plumber = require('gulp-plumber');

gulp.task("clean", function() {
    clean(["web/assets/css/", "web/assets/js/"]);
});

gulp.task("script", function() {
    gulp.src("dev/js/**/*.js")
     .pipe(plumber())
        .pipe(jshint())
        .pipe(concat('main.js'))
        .pipe(gulp.dest('web/assets/js/'))
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(uglify())
        .pipe(gulp.dest('web/assets/js'));
      
});

gulp.task("css", function() {
    gulp.src('dev/less/styles.less')
        .pipe(plumber())
        .pipe(less())
        .pipe(csso())
        .pipe(gulp.dest("web/assets/css"));
});

gulp.task('sprite', function () {
  // Generate our spritesheet
  var spriteData = gulp.src('dev/sprite/*.png').pipe(sprite({
    imgName: 'sprite.png',
    cssName: '_sprite.less',
    imgPath: '../img/sprite.png',
    algorithm: 'binary-tree',
    padding:1,
    cssFormat: 'css',
    cssOpts: {
      cssClass: function (item) {
        return '.sprite-' + item.name;
      }
    }
  }));

  // Pipe image stream through image optimizer and onto disk
  spriteData.img
    .pipe(gulp.dest('web/assets/img/sprites/'));

  // Pipe CSS stream through CSS optimizer and onto disk
  spriteData.css
    .pipe(gulp.dest('dev/less/'));
});

gulp.task('default', ['clean'], function() {
    gulp.start('css', 'script');
});

gulp.task('watch', function(){
    gulp.watch("dev/less/**/*.less", ['css']);
    gulp.watch('dev/js/**/*.js', ['script']);   
});