import mongoose from "mongoose"

const { MONGO_URI } = process.env
mongoose.Promise = global.Promise
// const opts = {
//     useMongoClient: true,
// }

export const connectDB = () => {
    mongoose
        .connect(MONGO_URI as string)
        .then(() => {
            console.log("Successfully connected to Mongo")
            console.log("===========================")
        })
        .catch((error: any) => {
            console.log("database connection failed. exiting now...")
            console.error(error)
            process.exit(1)
        })
}
