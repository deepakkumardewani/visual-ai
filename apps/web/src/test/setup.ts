import { config } from '@vue/test-utils';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBolt,
  faCircleInfo,
  faCopy,
  faDice,
  faExpand,
  faFile,
  faHeart,
  faImages,
  faMinus,
  faPlus,
  faTag,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(
  faBolt,
  faCircleInfo,
  faCopy,
  faDice,
  faExpand,
  faFile,
  faHeart,
  faImages,
  faMinus,
  faPlus,
  faTag,
  faWandMagicSparkles,
  faXmark,
);

config.global.components = {
  'font-awesome-icon': FontAwesomeIcon,
};
