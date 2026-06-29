import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional if using Google SSO
  googleId: { type: String }  // Holds google sub id
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
