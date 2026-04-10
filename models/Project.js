import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['app', 'website', 'webapp'],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    default: '/folder.png',
  },
  logoBase64: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
  },
  links: {
    playStore: String,
    appStore: String,
    website: String,
  },
  designSections: [{
    title: String,
    items: [{
      title: String,
      imageBase64: String,
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Avoid re-declaring the model if it already exists
export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
