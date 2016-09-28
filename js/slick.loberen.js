/**
 * @file
 * Slick slideshow handler.
 */

(function ($) {
  'use strict';

  var options;
  var previousState;
  var currentState;
  var sliderSettings = {
    arrows: false,
    dots: false,
    lazyLoad: 'ondemand',
    slidesToShow: 1,
    slidesToScroll: 1,
    speed: 200
  };

  function getSelector(component, state, isLarge) {
    var selector = options.elementSelector;

    if (isLarge) {
      selector += '-large';
    }

    selector += '__' + component;

    if (state) {
      selector += '--' + state;
    }

    return selector;
  }

  function markInSiblings($el, className) {
    $el.siblings().removeClass(className);
    $el.addClass(className);
  }

  function markCurrentThumb(e, slider, i, j) {
    var currentClass = getSelector(
      options.thumbnailComponent,
      options.stateCurrent
    ).replace('.', '');

    markInSiblings(slider.$thumbnailContainer.children().eq(j), currentClass);
  }

  function createLargeSliderContainer($thumbnailContainer, $slideContainer) {
    var $container;
    var $newSlideContainer;
    var $newThumbnailContainer;

    $container = $('<div class="product-gallery-large"><div class="product-gallery-large__close-trigger"></div></div>');
    $newSlideContainer = $('<div class="product-gallery-large__slides"></div>');
    $newThumbnailContainer = $('<div class="product-gallery-large__thumbs"></div>');
    $thumbnailContainer.children().each(function () {
      $newThumbnailContainer.append('<a class="product-gallery-large__thumb" href="' + $(this).attr('href') + '" target="_blank">' + $(this).html() + '</a>');
    });
    $slideContainer.children().each(function () {
      $newSlideContainer.append('<a class="product-gallery-large__slide"><img data-lazy="' + $(this).attr('href') + '" alt="' + $(this).find('img').attr('alt') + '"></a>');
    });
    $container.append($newSlideContainer);
    $container.append($newThumbnailContainer);
    $('body').append($container);

    return {
      $container: $container,
      $slideContainer: $newSlideContainer,
      $thumbnailContainer: $newThumbnailContainer
    };
  }

  function openLarge(e) {
    if (
      (currentState === 'mobile') ||
      (currentState === 'tablet')
    ) {
      return void 0;
    }

    var $slider = $('.product-gallery-large__slides');
    var speed = $slider.slick('slickGetOption', 'speed');

    $('html').addClass('productGalleryIsOpen');

    $slider.slick('slickSetOption', 'speed', 0);

    $slider
      .slick(
        'slickGoTo',
        $(this).parents(getSelector(options.slidesComponent))
          .slick('slickCurrentSlide'),
        false
      );

    $slider.slick('slickSetOption', 'speed', speed);

    e.preventDefault();
  }

  function closeLarge(e) {
    var $slider = $(getSelector(options.slidesComponent));
    var speed = $slider.slick('slickGetOption', 'speed');

    $('html').removeClass('productGalleryIsOpen');

    $slider.slick('slickSetOption', 'speed', 0);

    $slider
      .slick(
        'slickGoTo',
        $('.product-gallery-large__slides').slick('slickCurrentSlide'),
        false
      );

    $slider.slick('slickSetOption', 'speed', speed);
  }

  function handleThumbClick(e) {
    $(this).parent()[0].$slideContainer
      .slick('slickGoTo', $(this).index());

    e.preventDefault();
  }

  function handleViewportResize(e, data) {
    var $container;
    var $slideContainer;
    var slidesContainerSelector;

    // If state did not change -- return.
    if (data.state === previousState) {
      return void 0;
    }

    $container = $(this);
    slidesContainerSelector = getSelector(options.slidesComponent);
    $slideContainer = $container.find(slidesContainerSelector);

    currentState = data.state;

    if (data.state === 'desktop') {
      $slideContainer.slick('slickSetOption', 'arrows', false, true);
      $slideContainer.slick('slickSetOption', 'dots', false, true);
    }

    else if (!previousState || previousState === 'desktop') {
      $slideContainer.slick('slickSetOption', 'arrows', true, true);
      $slideContainer.slick('slickSetOption', 'dots', true, true);
    }
  }

  function init($container) {
    var selector = options.elementSelector;
    var slidesContainerSelector = getSelector(options.slidesComponent);
    var thumbsContainerSelector = getSelector(options.thumbnailsComponent);

    var $slideContainer = $container.find(slidesContainerSelector);
    var $thumbnailContainer = $container.find(thumbsContainerSelector);

    var currentClass = getSelector(options.thumbnailComponent, options.stateCurrent).replace('.', '');
    var baseSelectorId = selector.replace('.', '');
    var initedClassName = 'js-' + baseSelectorId + '--inited';
    var large;

    // Return if already inited.
    if (!$container.length || $container.hasClass(initedClassName)) {
      return void 0;
    }

    // Create slider container.
    large = createLargeSliderContainer($thumbnailContainer, $slideContainer);

    // Init sliders.
    $slideContainer.slick(sliderSettings);
    large.$slideContainer.slick(sliderSettings);

    // Save reference to thumbnail container on slide containers.
    $slideContainer.slick('getSlick').$thumbnailContainer = $thumbnailContainer;
    large.$slideContainer.slick('getSlick').$thumbnailContainer = large.$thumbnailContainer;

    // Save reference to slide container on thumbnail containers.
    $thumbnailContainer[0].$slideContainer = $slideContainer;
    large.$thumbnailContainer[0].$slideContainer = large.$slideContainer;

    // Mark thumbnail as current when slide changes.
    $slideContainer.on('beforeChange', markCurrentThumb);
    large.$slideContainer.on('beforeChange', markCurrentThumb);

    // Handle large container open/click triggers.
    $slideContainer.on('click.slick', getSelector(options.slideComponent), openLarge);
    large.$container.on('click.slick', '.product-gallery-large__close-trigger', closeLarge);

    $(document).on('keydown', function (e) {
      if (e.which === 27) {
        // ESC.
        closeLarge();
      }
    });

    // Sync thumbnail containers with slide containers.
    large.$thumbnailContainer.on('click.slick', 'a', handleThumbClick);
    $thumbnailContainer.on('click.slick', getSelector(options.thumbnailComponent), handleThumbClick);

    // Mark first thumbnail as current.
    markInSiblings($thumbnailContainer.children().eq(0), currentClass);

    // Mark as inited.
    $container.addClass(initedClassName);

    // Handle viewport resizes.
    $.subscribe('viewport.resize', handleViewportResize.bind($container[0]));
  }

  Drupal.behaviors.slickLoberen = {
    attach: function attachSlickLoberen(context, settings) {
      settings.slickLoberen = {
        elementSelector: '.product-gallery',
        slidesComponent: 'slides',
        slideComponent: 'slide',
        thumbnailsComponent: 'thumbs',
        thumbnailComponent: 'thumb',
        stateCurrent: 'current'
      };
      var $container;

      options = settings.slickLoberen;

      $container = $(context).find(options.elementSelector);
      init($container);
    }
  };
})(jQuery);
