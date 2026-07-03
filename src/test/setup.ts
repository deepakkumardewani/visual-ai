import { config } from "@vue/test-utils";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleInfo,
  faHeart,
  faMinus,
  faPlus,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faMinus, faPlus, faWandMagicSparkles, faCircleInfo, faHeart, faXmark);

config.global.components = {
  "font-awesome-icon": FontAwesomeIcon,
};
