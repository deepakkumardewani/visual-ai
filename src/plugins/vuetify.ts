import { IconAliases, createVuetify } from 'vuetify'
import { fa, aliases as faAliases } from 'vuetify/iconsets/fa-svg'
import 'vuetify/styles'

import customAliases from '@/components/icons'

const aliases: IconAliases = {
  ...faAliases,
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
      fa
    }
  }
})
