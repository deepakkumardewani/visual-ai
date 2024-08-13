<script setup lang="ts">
import PricingCard from '@/components/PricingCard.vue'

const examples = [
  {
    prompt: 'POV someone holding their hand up, stunning black forest mountains',
    url: '/src/assets/1.jpg'
  },
  {
    prompt:
      '3 magical wizards stand on a yellow table. On the left, a wizard in black robes holds a sign that says ‘AI’. In the middle, a witch in red robes holds a sign that says ‘is’ and on the right, a wizard in blue robes holds a sign that says ‘cool’. Behind them a purple dragon',
    url: '/src/assets/2.jpg'
  },
  {
    prompt: 'a tiny astronaut hatching from an egg on the moon',
    url: '/src/assets/3.jpg'
  },
  {
    prompt: 'Baby hedgehog wearing a flower crown in a garden',
    url: '/src/assets/4.jpg'
  },
  {
    prompt:
      'a man and woman are standing together against a backdrop, the backdrop is divided equally in half down the middle, left side is red, right side is gold, the woman is wearing a t-shirt with a yoda motif, she has a long skirt with birds on it, the man is wearing a three piece purple suit, he has spiky blue hair',
    url: '/src/assets/5.jpg'
  },
  {
    prompt:
      'black forest gateau cake spelling out the words "FLUX SCHNELL", tasty, food photography, dynamic shot',
    url: '/src/assets/6.jpg'
  }
]

const starterPlan = {
  title: 'Starter',
  price: '0',
  features: ['5 credits/day', 'Standard quality images', 'Only Webp format']
}

const proPlan = {
  title: 'Pro',
  price: '4.99',
  features: ['300 credits/month', 'High quality images', 'Webp, PNG & JPG formats']
}
</script>
<template>
  <v-container>
    <div id="hero">
      <v-row class="align-center justify-center">
        <v-col cols="12">
          <div class="text-h2 font-weight-bold text-center">
            <span> Turn Your Text Into Stunning Images </span>
          </div>
        </v-col>
      </v-row>
      <v-row class="align-center justify-center">
        <v-col cols="8">
          <div class="text-h4 text-center">
            <p class="text-center">
              Our AI-powered image generator allows you to create unique, high-quality images from
              your text in just a few clicks.
            </p>
          </div>
        </v-col>
      </v-row>
      <!-- <v-row class="align-center justify-center">
        <v-col cols="6">
          <v-text-field
            variant="outlined"
            rounded="2"
            placeholder="Enter your text"
            hide-details
            density="compact"
          ></v-text-field>
        </v-col>
        <v-col cols="2">
          <v-btn dark>Generate Image</v-btn>
        </v-col>
      </v-row> -->
    </div>
    <div id="about" class="mt-16">
      <v-row class="align-start justify-start">
        <v-col cols="6">
          <v-chip class="my-4" color="purple-lighten-2" label> About </v-chip>
          <div class="text-h4 font-weight-bold my-4">
            <span> Unleash the Power of AI Image Generation </span>
          </div>
          <div class="my-4">
            <p>
              Our AI-powered image generator uses advanced deep learning models to transform your
              text into stunning, high-quality visuals. By leveraging the latest advancements in
              natural language processing and computer vision, we're able to create unique and
              captivating images that bring your ideas to life.
            </p>
          </div>
        </v-col>
        <v-col cols="6">
          <v-img aspect-ratio="1/1" cover src="/src/assets/about.jpg"></v-img>
        </v-col>
      </v-row>
    </div>
    <div id="gallery" class="mt-16">
      <v-row>
        <v-col cols="12">
          <v-chip class="my-4" color="purple-lighten-2" label> Gallery </v-chip>
          <div class="text-h4 font-weight-bold my-4">
            <span> Explore Our Gallery </span>
          </div>
          <div class="my-4">
            <p>Check out our collection of stunning images created by our customers.</p>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <div class="grid-container">
          <div v-for="(img, index) in examples" :key="index" class="grid-item">
            <v-hover v-slot="{ isHovering, props }">
              <v-card class="mx-auto" color="grey-lighten-4" max-width="600" v-bind="props">
                <v-img :aspect-ratio="1 / 1" :src="img.url" cover>
                  <v-expand-transition>
                    <div
                      v-if="isHovering"
                      class="d-flex pa-4 opacity-80 transition-fast-in-fast-out bg-purple-lighten-2 v-card--reveal text-h5"
                      style="height: 100%"
                    >
                      {{ img.prompt }}
                    </div>
                  </v-expand-transition>
                </v-img>
              </v-card>
            </v-hover>
          </div>
        </div>
      </v-row>
    </div>
    <div id="pricing" class="mt-16">
      <v-row>
        <v-col cols="12">
          <v-chip class="my-4" color="purple-lighten-2" label> Pricing </v-chip>
          <div class="text-h4 font-weight-bold my-4">
            <span> Compare the prices </span>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="6">
          <PricingCard :plan="starterPlan" />
        </v-col>
        <v-col cols="6">
          <PricingCard :plan="proPlan" />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style scoped lang="scss">
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0px;
  width: 100%;
}
.grid-item {
  border-width: 0.5px;
  padding: 15px 10px;
}
</style>
