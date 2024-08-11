<script setup lang="ts"></script>
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
      <v-row class="align-center justify-center">
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
      </v-row>
    </div>
    <div id="about" class="mt-16">
      <v-row class="align-start justify-start">
        <v-col cols="6">
          <v-chip class="my-4" label> About </v-chip>
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
          <v-img
            aspect-ratio="16/9"
            cover
            src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
          ></v-img>
        </v-col>
      </v-row>
    </div>
    <div id="gallery" class="mt-16">
      <v-row>
        <v-col cols="12">
          <v-chip class="my-4" label> Gallery </v-chip>
          <div class="text-h4 font-weight-bold my-4">
            <span> Explore Our Gallery </span>
          </div>
          <div class="my-4">
            <p>Check out our collection of stunning images created by our customers.</p>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="4">
          <v-img
            aspect-ratio="16/9"
            cover
            src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
          ></v-img>
        </v-col>
        <v-col cols="4">
          <v-img
            aspect-ratio="16/9"
            cover
            src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
          ></v-img>
        </v-col>
        <v-col cols="4">
          <v-img
            aspect-ratio="16/9"
            cover
            src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
          ></v-img>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="4">
          <v-img
            aspect-ratio="16/9"
            cover
            src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
          ></v-img>
        </v-col>
        <v-col cols="4">
          <v-img
            aspect-ratio="16/9"
            cover
            src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
          ></v-img>
        </v-col>
        <v-col cols="4">
          <v-img
            aspect-ratio="16/9"
            cover
            src="https://cdn.vuetifyjs.com/images/parallax/material.jpg"
          ></v-img>
        </v-col>
      </v-row>
    </div>
    <div id="pricing" class="mt-16">
      <v-row>
        <v-col cols="12"> Pricing section </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<!-- <style scoped lang="scss">
</style> -->
