<?php
/**
 * @file
 * Contains Drupal\src\Plugin/Field\FieldFormatter\SlickSlideshow.php
 */
namespace Drupal\slick_slideshow\Plugin\Field\FieldFormatter;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Link;
use Drupal\Core\Url;
use Drupal\image\Entity\ImageStyle;
use Drupal\image\Plugin\Field\FieldFormatter\ImageFormatter;

/**
 * Plugin implementation of the 'slick_slideshow' formatter.
 *
 * @FieldFormatter(
 *   id = "slick_slideshow",
 *   label = @Translation("Display an images slideshow using Slick."),
 *   field_types = {
 *     "image"
 *   }
 * )
 */
class SlickSlideshow extends ImageFormatter {

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    return array(
      'big_slick_style' => '',
      'medium_slick_style' => '',
      'small_slick_style' => '',
    ) + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $image_styles = image_style_options(FALSE);
    $description_link = Link::fromTextAndUrl(
      $this->t('Configure Image Styles'),
      Url::fromRoute('entity.image_style.collection')
    );
    $element['big_slick_style'] = [
      '#title' => t('Big image style'),
      '#type' => 'select',
      '#default_value' => $this->getSetting('big_slick_style'),
      '#empty_option' => t('None (original image)'),
      '#options' => $image_styles,
      '#description' => $description_link->toRenderable() + [
          '#access' => $this->currentUser->hasPermission('administer image styles')
        ],
    ];
    $element['medium_slick_style'] = [
      '#title' => t('Medium image style'),
      '#type' => 'select',
      '#default_value' => $this->getSetting('medium_slick_style'),
      '#empty_option' => t('None (original image)'),
      '#options' => $image_styles,
      '#description' => $description_link->toRenderable() + [
          '#access' => $this->currentUser->hasPermission('administer image styles')
        ],
    ];
    $element['small_slick_style'] = [
      '#title' => t('Small image style'),
      '#type' => 'select',
      '#default_value' => $this->getSetting('small_slick_style'),
      '#empty_option' => t('None (original image)'),
      '#options' => $image_styles,
      '#description' => $description_link->toRenderable() + [
          '#access' => $this->currentUser->hasPermission('administer image styles')
        ],
    ];

    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $elements = array();
    $files = $this->getEntitiesToView($items, $langcode);

    // Early opt-out if the field is empty.
    if (empty($files)) {
      return $elements;
    }

    $cache_tags = array();
    $mage_styles = array(
      'big_slick_style' => $this->getSetting('big_slick_style'),
      'medium_slick_style' => $this->getSetting('medium_slick_style'),
      'small_slick_style' => $this->getSetting('small_slick_style'),
    );
    $images = array();
    foreach ($files as $delta => $file) {
      $cache_contexts = array();
      $image_uri = $file->getFileUri();
      $cache_contexts[] = 'url.site';
      $images[$delta]['metadata'] = array(
        'alt' => $file->alt,
        'title' => $file->title,
      );
      foreach ($mage_styles as $image_style_setting => $image_style_name) {
        if ($image_style_name) {
          $image_style = $this->imageStyleStorage->load($image_style_name);
          if ($image_style) {
            $cache_tags = Cache::mergeTags($cache_tags, $image_style->getCacheTags());
          }
          $image_url = ImageStyle::load($image_style_name)
            ->buildUrl($image_uri);
        }
        else {
          $image_url = $file->url();
        }
        $images[$delta]['images'][$image_style_setting] = $image_url;
      }
      $cache_tags = Cache::mergeTags($cache_tags, $file->getCacheTags());
    }
    $elements[0] = array(
      '#theme' => 'slick_slideshow_formatter',
      '#images' => $images,
      '#attached' => array('library' => array('slick_slideshow/slick')),
      '#cache' => array(
        'tags' => $cache_tags,
        'contexts' => $cache_contexts,
      ),
    );
    return $elements;
  }
}