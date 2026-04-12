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
  slug: {
    type: String,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate slug from name if not present
ProjectSchema.pre('save', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Avoid re-declaring the model if it already exists
export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
