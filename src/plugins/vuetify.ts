/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */
// Styles
import '@fortawesome/fontawesome-free/css/all.css'
// import '@mdi/font/css/materialdesignicons.css'
// Composables
import { IconAliases, createVuetify } from 'vuetify'
// Ensure your project is capable of handling css files
import { aliases as defaultAliases, fa } from 'vuetify/iconsets/fa'
import { mdi } from 'vuetify/iconsets/mdi-svg'
import 'vuetify/styles'

import customAliases from '@/components/icons'

const aliases: IconAliases = {
  ...defaultAliases,
  ...customAliases
}

const light = {
  dark: false,
  colors: {
    background: '#f1f5f9',
    headerBg: '#edf2ef',
    heading: 'hsl(272, 20%, 40%)',
    cardTitle: '#888',
    cardTextBG: '#fff',
    btnBg: '#3f51b5',
    btnText: '#fff',
    asideBg: '#fff'
  }
}
const dark = {
  dark: true,
  colors: {
    background: '#000',
    headerBg: '#1A171C',
    heading: '#fff',
    cardTitle: '#647692',
    cardTextBG: '#ebebeb',
    btnBg: '#3f51b5',
    btnText: '#fff',
    asideBg: '#1A171C'
  }
}

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      light,
      dark
    }
  },
  icons: {
    defaultSet: 'fa',
    aliases,
    sets: {
      mdi,
      fa
    }
  }
})
