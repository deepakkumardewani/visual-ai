<template>
  <div id="about" class="mt-16">
    <v-row class="tw-justify-center">
      <v-col cols="8">
        <div class="tw-flex tw-flex-col tw-justify-center tw-items-center">
          <v-chip class="my-2" color="purple-lighten-2" label> About </v-chip>
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
        </div>
        <div
          class="tw-flex tw-rounded-lg tw-justify-center tw-items-center tw-h-[500px]"
          v-motion
          :initial="{
            perspective: 800,
            opacity: 0,
            rotateX: 14
          }"
          :visible="{
            opacity: 1,
            rotateX: 0
          }"
          :duration="1000"
          :delay="200"
        >
          <v-parallax src="/src/assets/about.jpg"></v-parallax>

          <!-- <v-img class="tw-rounded-lg" aspect-ratio="1/1" cover src="/src/assets/about.jpg"></v-img> -->
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped></style>
