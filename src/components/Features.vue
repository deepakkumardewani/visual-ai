<script setup lang="ts">
const features = ref<string[]>([
  'Visual quality',
  'Image detail',
  'Output diversity',
  'Multipe aspect-ratios',
  'Cutting-edge output quality',
  'competitive prompt following'
])
</script>
<template>
  <div id="features" class="mt-16">
    <v-row class="align-start justify-start">
      <v-col cols="12">
        <div class="d-flex justify-center align-center justify-sm-start align-sm-start">
          <v-chip class="my-4" color="purple-lighten-2" label> Features </v-chip>
        </div>
        <div class="text-h4 font-weight-bold my-4">
          <span> What we offer </span>
        </div>
        <div class="my-2">
          <p>
            State-of-the-art image generation with top of the line prompt following, visual quality,
            image detail and output diversity. A 12 billion parameter rectified flow transformer
            capable of generating images from text descriptions.
          </p>
        </div>
        <!-- <div class="d-flex justify-center align-center text-body-2">It's</div> -->
        <v-row class="text-center my-4">
          <v-col cols="12" sm="4">
            <div class="text-h2 text-md-h2 text-lg-h1 font-weight-bold">FAST</div>
            <div class="my-4">
              <v-chip class="mr-4 mb-2" size="large"> State-of-the-art Image Generation</v-chip>
            </div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-h2 text-xs-h5 text-md-h2 text-lg-h1 font-weight-bold">SIMPLE</div>
            <div class="my-4">
              <v-chip class="mr-4 mb-2" size="large"> Top of the line prompt following</v-chip>
            </div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-h2 text-xs-h5 text-md-h2 text-lg-h1 font-weight-bold">HUGE</div>
            <div class="my-4">
              <v-chip class="mr-4 mb-2" size="large"> 12 Billion parameters</v-chip>
            </div>
          </v-col>
        </v-row>
        <div class="my-4 text-center">
          <v-chip
            class="mr-4 mb-2"
            size="x-large"
            v-for="(feature, index) in features"
            :index="index"
            >{{ feature }}</v-chip
          >
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped></style>
