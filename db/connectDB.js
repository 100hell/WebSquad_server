import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://sohelkhan:txpLyATKJfR30PKg@cluster0.rrqrvxk.mongodb.net/web-squad?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Mongoose connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("error ", error.message);
    process.exit(1);
  }
};

export default connectDB;
