<script setup lang="ts"></script>
<template>
  <div id="about" class="mt-16">
    <v-row class="align-start justify-start">
      <v-col cols="12" sm="6">
        <div class="d-flex justify-center align-center justify-sm-start align-sm-start">
          <v-chip class="my-4" color="purple-lighten-2" label> About </v-chip>
        </div>
        <div class="text-h4 font-weight-bold my-4">
          <span> Unleash the Power of AI Image Generation </span>
        </div>
        <div class="my-4">
          <p>
            Our AI-powered image generator uses advanced deep learning models to transform your text
            into stunning, high-quality visuals. By leveraging the latest advancements in natural
            language processing and computer vision, we're able to create unique and captivating
            images that bring your ideas to life.
          </p>
        </div>
      </v-col>
      <v-col cols="12" sm="6">
        <v-img aspect-ratio="1/1" cover src="/src/assets/about.jpg"></v-img>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped></style>
