import { config } from '@vue/test-utils';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBolt,
  faCircleInfo,
  faExpand,
  faFile,
  faHeart,
  faImages,
  faMinus,
  faPlus,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(
  faBolt,
  faCircleInfo,
  faExpand,
  faFile,
  faHeart,
  faImages,
  faMinus,
  faPlus,
  faWandMagicSparkles,
  faXmark,
);

config.global.components = {
  'font-awesome-icon': FontAwesomeIcon,
};
