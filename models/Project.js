import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/600x400',
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Avoid re-declaring the model if it already exists
export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
